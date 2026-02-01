import User from '../models/users.js';
import Link from '../models/links.js';
import Payout from '../models/payouts.js';
import UserInfo from '../models/users-info.js';
import ClickEvent from '../models/click-event.js';
import PayoutMethod from '../models/payout-method.js';
import RevenuePeriod from '../models/revenue-period.js';
import UserRevenuePeriod from '../models/user-revenue-period.js';

export async function getReferralData(user) {
    const referredAccounts = (await User.find({ referrer: user.PID })).map(u => u._id);
    const referralData = [];

    if (referredAccounts.length === 0) return [];

    let periodReferralAmount = 0;
    const periods = await RevenuePeriod.find().sort({ fromDate: 1 });

    for (const period of periods) {
        const periodReferredAccounts = await UserRevenuePeriod.find({ user: { $in: referredAccounts }, period: period._id });

        if (!periodReferredAccounts) continue;

        const periodData = {
            fromDate: period.fromDate,
            toDate: period.toDate,
            amount: periodReferredAccounts.length,
            difference: (periodReferredAccounts.length - periodReferralAmount),
            income: periodReferredAccounts.reduce((sum, p) => sum + (p.referrerIncome || 0), 0)
        };

        referralData.push(periodData);

        periodReferralAmount = periodReferredAccounts.length;
    }

    return referralData;
}

export async function getPayoutsEnabledData(user) {
    const payouts = await Payout.find({ user: user._id })
    const userInfoThis = await UserInfo.findOne({ user: user._id })
    const payoutMethod = await PayoutMethod.findOne({ user })

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

export async function getLinkData(req) {
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 16;
    const skip = (currentPage - 1) * limit;

    const totalLinks = await Link.countDocuments({ user: req.user._id });
    const links = await Link.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPages = Math.ceil(totalLinks / limit);  

    await Promise.all(
        links.map(async (link) => {
            link.clicks = await ClickEvent.countDocuments({ link: link._id, valid: true });
        })
    );

    if (req.xhr) {
        return res.render('ledger/userLinks', { links }, (err, html) => {
            res.send(html);
        });
    }

    return { totalPages, links, currentPage }
}

export async function monthlyMonetization(req) {
    const links = await Link.find({ user: req.user._id });
    let count = 0;

    const currentDate = new Date();
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    for (const link of links) {
        const linkDate = new Date(link.createdAt);
        if (!link.monetization && linkDate.getMonth() == month && linkDate.getFullYear() == year) {
            ++count;
            if (count >= 5) break;
        }
    }

    return { maxLinksReached: count >= 5, count }
}

export async function getPayoutMethod(req) {
    const user = req.user;

    return await PayoutMethod
        .findOne({ user })
        .sort({ createdAt: -1 }) || 'none';
}