import RevenuePeriod from '../models/revenue-period.js';

export async function getDoneDates() {
    const periods = RevenuePeriod.find();
    const dates = [];

    await periods.forEach(period => {
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