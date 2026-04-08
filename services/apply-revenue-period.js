import mongoose from 'mongoose';
import User from '../models/users.js';
import Link from '../models/links.js';
import ClickEvent from '../models/click-event.js';
import RevenuePeriod from '../models/revenue-period.js';
import UserRevenuePeriod from '../models/user-revenue-period.js';

export async function applyRevenuePeriod(periodID) {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const period = await RevenuePeriod.findById(periodID).session(session);

        if (!period) throw new Error('Invalid revenue period');
        if (period.applied) throw new Error('Already applied');

        // All calculations in hundredths of cents
        const amount = period.payableAmount * 100;

        let paidAmount = 0;
        let referrerAmount = 0;

        // Weight value scaled 100 x
        const weightValue = await calculateWeightValue(session, amount, period.fromDate, period.toDate);
        const users = await User.find().session(session);

        for (const user of users) {
            const userIncome = await calculateUserIncome(session, user, weightValue, period.fromDate, period.toDate);

            user.balance += userIncome;
            paidAmount += userIncome;
            await user.save({ session });

            let referrerIncome = Math.round(userIncome * 0.10);

            if (user.referrer) {
                const referrer = await User.findOne({ PID: user.referrer }).session(session);
                if (referrer) {
                    referrer.balance += referrerIncome;
                    referrerAmount += referrerIncome;
                    await referrer.save({ session });
                }
            }

            const newPeriod = new UserRevenuePeriod({
                user: user._id,
                period: period._id,
                userIncome: userIncome,
            });
            await newPeriod.save({ session })
        }

        period.paidAmount = paidAmount;
        period.referralAmount = referrerAmount;
        period.adminAmount = (period.amount * 100) - (paidAmount + referrerAmount);
        period.weightAmount = (weightValue / 100);

        period.applied = true;

        await period.save({ session });

        await session.commitTransaction();
    } catch (err) {
        console.error(err);
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
}

async function calculateWeightValue(session, amount, fromDate, toDate) {
    const links = await Link.find().session(session);

    const weights = await Promise.all(
        links.map(link => calculateLinkTotalWeight(session, link, fromDate, toDate)),
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    if (totalWeight === 0) return 0;
    return Math.round((amount * 100) / totalWeight);
}

async function calculateUserIncome(session, user, weightValue, fromDate, toDate) {
    const links = await Link.find({ user: user._id }).session(session);
    let userIncome = 0;

    for (const link of links) {
        const linkWeight = await calculateLinkTotalWeight(session, link, fromDate, toDate);
        const linkIncome = Math.round((weightValue / 100) * linkWeight); // Normalize the weight value

        userIncome += linkIncome;
        link.earned += linkIncome;
        await link.save({ session });
    }

    return userIncome;
}

async function calculateLinkTotalWeight(session, link, fromDate, toDate) {
    const baseWeight = link.weight;
    if (baseWeight === 0) return 0;
    
    const stats = await ClickEvent.aggregate([
        { $match: { link: link._id, valid: true, createdAt: { $gte: fromDate, $lt: toDate } } },
        { $group: { _id: "$country", clicks: { $sum: 1 }, ips: { $addToSet: "$ip" } } }
    ]).session(session);

    if (stats.length === 0) return 0;

    const totalClicks = stats.reduce((s, c) => s + c.clicks, 0);
    const uniqueIps = new Set(stats.flatMap(c => c.ips)).size;
    const ipRatio = uniqueIps / (totalClicks + 1);

    let linkWeight = 0;

    for (const row of stats) {
        const multiplier = calculateCountryMultiplier(row._id);
        linkWeight += row.clicks * baseWeight * multiplier * Math.pow(ipRatio, 0.25);
    }

    return Math.round(linkWeight);
}

export function calculateCountryMultiplier(country) {
    if (!country) return 0.4;
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