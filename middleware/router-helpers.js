import User from '../models/users.js';
import Link from '../models/links.js';
import Payment from '../models/payments.js';

export async function getReferralData(user) {
    const referralAccounts = await User.find({ _id: { $in: user.referrals } });

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

export async function getPaymentData(user) {
    const payments = await Payment.find({ user: user._id })

    const paymentsEnabled =
        user.verified &&
        user.name &&
        user.address &&
        user.address.line1 &&
        user.address.city &&
        user.address.zip &&
        user.address.country &&
        user.balance >= 10;

    return { payments, paymentsEnabled }
}

export function getTicketValidation(user, ticket) {
    if (ticket === null) {
        return res.status(404).render('error/404')
    }
    if (!user.tickets.includes(ticket._id.toString())) {
        return res.status(403).render('error/403')
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