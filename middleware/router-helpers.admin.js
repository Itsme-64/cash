import Payout from '../models/payouts.js'
import PayoutMethod from '../models/payout-method.js';
import RevenuePeriod from '../models/revenue-period.js';

export async function getDoneDates() {
    const periods = await RevenuePeriod.find();
    const dates = [];

    periods.forEach(period => {
        const fromDate = period.fromDate;
        const toDate = period.toDate;

        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);

        while (fromDate <= toDate) {
            dates.push(new Date(fromDate));
            fromDate.setDate(fromDate.getDate() + 1);
        }
    });

    return dates;
}

export async function getPeriodData() {
    const period = await RevenuePeriod.findOne().sort({ toDate: -1 })

    return { period }
}

export async function getPayoutData() {
    const payouts = await Payout
        .find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .select('amount payoutID payoutMethod')

    for (const payout of payouts) {
        const method = PayoutMethod.findById(payout.payoutMethod)
        if (!method) {
            const err = new Error()
            err.status = 500
            return next(err)
        }

        method.type == 'paypal' ? payout.method = method.details?.email : payout.method = method.details?.btcAddress
    }

    return payouts
}