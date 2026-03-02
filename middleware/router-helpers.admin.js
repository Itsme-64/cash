import Ticket from '../models/tickets.js';
import Payout from '../models/payouts.js';
import Campaign from '../models/campaigns.js'
import RevenuePeriod from '../models/revenue-period.js';
import { periodCompletedDates } from '../services/period-completed-dates.js';

export async function getDoneDates() {
    return await periodCompletedDates();
}

export async function getPeriodData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startYear = new Date(today);
    startYear.setDate(1);
    startYear.setMonth(0);

    const endYear = new Date(startYear);
    endYear.setFullYear(endYear.getFullYear() + 1);

    const periods = await RevenuePeriod.find({ fromDate: { $gte: startYear }, toDate: { $lte: endYear } }).sort({ toDate: -1 });
    const mostRecentPeriod = await RevenuePeriod.findOne().sort({ toDate: -1 });

    const weightValues = periods.map(period => period.weightAmount).slice(0, 14).reverse();
    const weightDates = periods.map(period => period.fromDate.toLocaleDateString('en-GB', { day: "numeric", month: "short" })).reverse();

    return { periods, mostRecentPeriod, weightValues, weightDates };
}

export async function getPayoutData() {
    const payouts = await Payout
        .find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .populate('payoutMethod')
        .select('amount payoutID payoutMethod');

    return payouts;
}

export async function getTicketData() {
    const tickets = await Ticket
        .find({ status: { $in: ['open', 'in progress'] } })
        .sort({ updatedAt: -1 });

    return tickets;
}

export async function getCampaignData() {
    return Campaign.find({ status: { $in: ['pending', 'active', 'deactivated'] } }).sort({ createdAt: -1 });
}