import User from '../models/users.js';
import Link from '../models/links.js';
import ClickEvent from '../models/click-event.js';
import RevenuePeriod from '../models/revenue-period.js';

export async function applyRevenuePeriod(periodID) {
    const period = await RevenuePeriod.findOne({ _id: periodID });
    const amount = period.amount * 100000000 // 100.000.000

    let paidAmount = 0;
    let referrerAmount = 0;

    const weightValue = await calculateWeightValue(amount, period.fromDate, period.toDate);
    const users = await User.find();

    for (const user of users) {
        const userIncome = await calculateUserIncome(user, weightValue, fromDate, toDate)

        user.balance += userIncome;
        paidAmount += userIncome;
        await user.save();

        // User revenue period model

        if (user.referrer) {
            const referrer = User.findOne({ PID: referrer });
            const referrerIncome = Math.round(userIncome * 0.10);

            referrerAmount += referrerIncome;
            referrer.balance += referrerIncome;
            await referrer.save();
        }
    }

    period.paidAmount = paidAmount;
    period.referralAmount = referrerAmount;
    period.adminAmount = period.amount - (paidAmount + referrerAmount);
    period.weightAmount = weightValue;
    await period.save();
}

async function calculateWeightValue(amount, fromDate, toDate) {
    const links = await Link.find();

    const weights = await Promise.all(
        links.map(link => calculateLinkTotalWeight(link, fromDate, toDate))
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    if (totalWeight === 0) return 0;
    return Math.round(amount / totalWeight);
}

async function calculateUserIncome(user, weightValue, fromDate, toDate) {
    const links = await Link.find({ user: user._id });
    let userIncome = 0;

    for (const link of links) {
        const linkWeight = calculateLinkTotalWeight(link, fromDate, toDate);
        const linkIncome = Math.round(weightValue * linkWeight) / 1000000; // 1.000.000 (in cents)

        userIncome += linkIncome;
        link.earned += linkIncome;
        await link.save();
    }

    return userIncome;
}

async function calculateLinkTotalWeight(link, fromDate, toDate) {
    const clickEvents = await ClickEvent.find({ link: link._id, createdAt: { $gte: fromDate, $lte: toDate }, valid: true });
    const baseWeight = link.weight;
    let linkWeight = 0;

    const ips = [] 
    clickEvents.forEach(clickEvent => { ips.push(clickEvent.ip) });
    const ipRatio = new Set(ips).size / (ips.length + 1);

    clickEvents.forEach(clickEvent => {
        linkWeight += baseWeight * Math.pow(ipRatio, 0.25) * calculateCountryMultiplier(clickEvent.country);
    });

    return Math.round(linkWeight);
}

function calculateCountryMultiplier(country) {
    country = country.toLowerCase();

    const multipliers = {
        us: 1.75,
        gb: 1.4,
        au: 1.4,
        ca: 1.4,
        at: 1,
        ch: 1,
        de: 1,
        dk: 1,
        es: 1,
        fi: 1,
        ie: 1,
        is: 1,
        nl: 1,
        no: 1,
        nz: 1,
        se: 1,
        ae: 0.8,
        fr: 0.8,
        gr: 0.8,
        hr: 0.8,
        it: 0.8,
        jp: 0.8,
        mx: 0.8,
        si: 0.8,
        sk: 0.8,
        za: 0.8,
        in: 0.1,
    }

    return multipliers[country] ?? 0.4;
}