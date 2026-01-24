import User from '../models/users.js';
import Link from '../models/links.js';
import Payout from '../models/payouts.js';
import UserInfo from '../models/users-info.js';
import ClickEvent from '../models/click-event.js';
import PayoutMethod from '../models/payout-method.js';
import clickEvent from '../models/click-event.js';

export async function getReferralData(user) {
    const referralAccounts = await User.find({ referrer: user.PID });
    const referralAmount = referralAccounts.length;

    const totalReferralClicks = referralAccounts.reduce((sum, account) => sum + (account.clicks || 0), 0);

    let totalReferralEarnings = referralAccounts.reduce((sum, account) => sum + (account.earnings || 0), 0);
    totalReferralEarnings = (totalReferralEarnings / 10).toFixed(2);

    let referralDifference = 0;
    for (const referralAccountId of referralAccounts) {
        const referralAccount = await User.findById(referralAccountId);
        if (referralAccount && referralAccount.createdAt.getTime() + 2629800000 >= Date.now()) {
            referralDifference++;
        }
    }

    return { referralAccounts, referralAmount, totalReferralClicks, totalReferralEarnings, referralDifference };
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