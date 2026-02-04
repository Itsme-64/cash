import User from '../models/users.js';
import Link from '../models/links.js';
import Payout from '../models/payouts.js';
import Ticket from '../models/tickets.js';
import UserInfo from '../models/users-info.js';
import PayoutMethod from '../models/payout-method.js';
import RevenuePeriod from '../models/revenue-period.js';
import LinkStatsDaily from '../models/link-stats-daily.js';
import LinkStatsMonthly from '../models/link-stats-monthly.js';
import UserRevenuePeriod from '../models/user-revenue-period.js';

export async function getReferralData(user) {
    const referredUserIds = await User
        .find({ referrer: user.PID })
        .distinct("_id");

    if (referredUserIds.length === 0) return [];

    const referralAgg = await UserRevenuePeriod.aggregate([
        { $match: { user: { $in: referredUserIds } } },
        { $group: { _id: "$period", amount: { $sum: 1 }, income: { $sum: { $ifNull: ["$referrerIncome", 0] } } } }
    ]);

    const periodIds = referralAgg.map(p => p._id);

    const periods = await RevenuePeriod
        .find({ _id: { $in: periodIds } })
        .sort({ fromDate: 1 })
        .lean();

    let prevAmount = 0;

    const result = periods.map(period => {
        const agg = referralAgg.find(a => String(a._id) === String(period._id));

        const amount = agg?.amount || 0;
        const income = agg?.income || 0;

        const diff = amount - prevAmount;
        prevAmount = amount;

        return { fromDate: period.fromDate, toDate: period.toDate, amount, difference: diff, income };
    });

    return result;
}

export async function getPayoutsEnabledData(user) {
    const payouts = await Payout.find({ user: user._id });
    const userInfoThis = await UserInfo.findOne({ user: user._id });
    const payoutMethod = await getPayoutMethod(user._id);

    const payoutsEnabled =
        payoutMethod &&
        user.verified &&
        userInfoThis.name &&
        userInfoThis.address &&
        userInfoThis.address.line1 &&
        userInfoThis.address.city &&
        userInfoThis.address.zip &&
        userInfoThis.address.country &&
        user.balance >= 10;

    return { payouts, payoutsEnabled, payoutMethod }
}

export function getTicketValidation(user, ticket) {
    if (ticket === null) {
        const err = new Error()
        err.status = 404
        return next(err)
    }
    if (ticket.user !== user._id) {
        const err = new Error()
        err.status = 403
        return next(err)
    }
}

export async function getLinkData(req, page) {
    // Pagination
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 16;
    const skip = (currentPage - 1) * limit;

    const totalLinks = await Link.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(totalLinks / limit);  

    // Link Data
    const links = await Link.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const linkIds = links.map(l => l._id);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const dailyAgg = await LinkStatsDaily.aggregate([
        { $match: { link: { $in: linkIds }, date: { $gte: startOfMonth } } },
        { $group: { _id: "$link", clicks: { $sum: "$clicks" } } }
    ]);

    const monthlyAgg = await LinkStatsMonthly.aggregate([
        { $match: { link: { $in: linkIds } } },
        { $group: { _id: "$link", clicks: { $sum: "$clicks" } } }
    ]);

    const dailyMap = Object.fromEntries(dailyAgg.map(d => [String(d._id), d.clicks]));
    const monthlyMap = Object.fromEntries(monthlyAgg.map(m => [String(m._id), m.clicks]));

    let pendingMap = {};

    if (page == 'new') {
        const period = await RevenuePeriod
            .findOne({ applied: true })
            .sort({ toDate: -1 })
            .select('toDate');

        const toDate = period?.toDate || null;

        if (toDate) {
            const pendingAgg = await LinkStatsDaily.aggregate([
                { $match: { link: { $in: linkIds }, date: { $gt: toDate } } },
                { $group: { 
                    _id: "$link", 
                    pending: { $sum: { $multiply: [ { $divide: [{ $ifNull: ["$clickWeight", 0] }, 85] }, { $ifNull: ["$clicks", 0] } ] } } 
                } }
            ]);

            pendingMap = Object.fromEntries(pendingAgg.map(p => [String(p._id), p.pending]));
        }
    }

    for (const link of links) {
        const id = String(link._id);

        link.clicks = (monthlyMap[id] || 0) + (dailyMap[id] || 0);
        link.pending = (pendingMap[id] || 0);
    }

    if (req.xhr) {
        return res.render('ledger/userLinks', { links }, (err, html) => {
            res.send(html);
        });
    }

    return { totalPages, links, currentPage }
}

export async function monthlyMonetization(userId) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const count = await Link.countDocuments({ user: userId, monetization: false, createdAt: { $gte: startOfMonth } });

    return { maxLinksReached: count >= 5, count };
}

export async function getPayoutMethod(userId) {
    return await PayoutMethod
        .findOne({ user: userId })
        .sort({ createdAt: -1 }) || 'none';
}

export async function getDashboardData(user) {
    const links = await Link.find({ user: user._id });
    const linkIds = links.map(l => l._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1)

    const now = new Date();
    const todayProgress = Number((now - today) / (24 * 60 * 60 * 1000)).toFixed(4);

    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() - 14);

    const fourWeeks = new Date(today);
    fourWeeks.setDate(fourWeeks.getDate() - 28);
    
    // Top cards 
    const todayAgg = await LinkStatsDaily.aggregate([
        { $match: { link: { $in: linkIds }, date: today } },
        { $group: { 
            _id: null, 
            clicksToday: { $sum: { $ifNull: ["$clicks", 0] } },
            pendingToday: { $sum: { $multiply: [ { $divide: [{ $ifNull: ["$clickWeight", 0] }, 85] }, { $ifNull: ["$clicks", 0] } ] } }
        } }
    ]);

    const yesterdayAgg = await LinkStatsDaily.aggregate([
        { $match: { link: { $in: linkIds }, date: yesterday } },
        { $group: { 
            _id: null, 
            clicksYesterday: { $sum: { $ifNull: ["$clicks", 0] } },
            pendingYesterday: { $sum: { $multiply: [ { $divide: [{ $ifNull: ["$clickWeight", 0] }, 85] }, { $ifNull: ["$clicks", 0] } ] } }
        } }
    ]);

    const clicksToday = todayAgg[0]?.clicksToday || 0;
    const pendingToday = todayAgg[0]?.pendingToday || 0;

    const clicksTodayChange = percentChange(yesterdayAgg[0]?.clicksYesterday || 0, clicksToday, todayProgress);
    const pendingTodayChange = percentChange(yesterdayAgg[0]?.pendingYesterday || 0, pendingToday, todayProgress);

    const twoWeeksAgg = await LinkStatsDaily.aggregate([
        { $match: { link: { $in: linkIds }, date: { $gte: twoWeeks, $lt: today } } },
        { $group: { _id: null, clicksTwoWeeks: { $sum: { $ifNull: ["$clicks", 0] } } } }
    ]);

    const fourWeeksAgg = await LinkStatsDaily.aggregate([
        { $match: { link: { $in: linkIds }, date: { $gte: fourWeeks, $lt: twoWeeks } } },
        { $group: { _id: null, clicksFourWeeks: { $sum: { $ifNull: ["$clicks", 0] } } } }
    ]);

    const clicksTwoWeeks = twoWeeksAgg[0]?.clicksTwoWeeks || 0;
    const clicksTwoWeeksChange = percentChange(fourWeeksAgg[0]?.clicksFourWeeks || 0, clicksTwoWeeks, 1);

    // Left chart 
    const period = await RevenuePeriod.findOne({ applied: true }).sort({ toDate: -1 })

    const fromDate = period?.fromDate || user.createdAt;
    const toDate = period?.toDate || new Date(0);

    const pendingAgg = await LinkStatsDaily.aggregate([
        { $match: { link: { $in: linkIds }, date: { $gt: toDate, $lt: today } } },
        { $group: { 
            _id: null, 
            totalPending: { $sum: { $multiply: [ { $divide: [{ $ifNull: ["$clickWeight", 0] }, 85] }, { $ifNull: ["$clicks", 0] } ] } } 
        } }
    ]);

    const totalPending = (pendingAgg[0]?.totalPending || 0) + pendingToday;

    let ppReferralIncome = 0;
    let ppUserIncome = 0;

    if (period) {
        const referredUserIds = await User.find({ referrer: user.PID }).distinct("_id");

        const referralAgg = await UserRevenuePeriod.aggregate([
            { $match: { user: { $in: referredUserIds }, period: period._id } },
            { $group: { _id: null, referrerIncome: { $sum: { $ifNull: ["$referrerIncome", 0] } } } }
        ]);

        const incomeAgg = await UserRevenuePeriod.findOne({ user: user._id, period: period._id }).select('userIncome');

        ppReferralIncome = referralAgg[0]?.referrerIncome || 0;
        ppUserIncome = incomeAgg?.userIncome || 0;
    }

    // General Info Card
    const mostRecentPayoutRequest = await Payout
        .findOne({ user: user._id })
        .sort({ createdAt: -1 })
        .select('payoutId status createdAt');

    const mostRecentTicket = await Ticket
        .findOne({ user: user._id })
        .sort({ createdAt: -1 })
        .select('shortID title status');

    return { 
        clicksToday, clicksTodayChange, pendingToday, pendingTodayChange, clicksTwoWeeks, clicksTwoWeeksChange,
        totalPending, ppUserIncome, ppReferralIncome, fromDate,
        mostRecentPayoutRequest, mostRecentTicket
    };

    function percentChange(oldValue, newValue, multiplier) {
        if (oldValue === 0) return 0;
        return Number(((newValue - oldValue) / oldValue) * 100 * multiplier).toPrecision(2);
    }
}