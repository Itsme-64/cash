import Ticket from '../models/tickets.js';
import Payout from '../models/payouts.js';
import PayoutMethod from '../models/payout-method.js';
import RevenuePeriod from '../models/revenue-period.js';
import { periodCompletedDates } from '../services/period-completed-dates.js';

export async function getDoneDates() {
    return await periodCompletedDates();
}

export async function getPeriodData() {
    const period = await RevenuePeriod.findOne().sort({ toDate: -1 });

    return { period };
}

export async function getPayoutData() {
    const payouts = await Payout
        .find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .select('amount payoutID payoutMethod');

    for (const payout of payouts) {
        const method = PayoutMethod.findById(payout.payoutMethod);
        if (!method) {
            const err = new Error();
            err.status = 500;
            return next(err);
        }

        method.type == 'paypal' ? payout.method = method.details?.email : payout.method = method.details?.btcAddress;
    }

    return payouts;
}

export async function getTicketData() {
    const statuses = ['open', 'in progress'];

    const tickets = await Ticket
        .find({ status: { $in: statuses } })
        .sort({ updatedAt: -1 });

    return tickets;
}