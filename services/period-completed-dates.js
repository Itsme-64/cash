import RevenuePeriod from "../models/revenue-period.js";

export async function periodCompletedDates() {
    const periods = await RevenuePeriod.find();
    const dates = [];

    periods.forEach(period => {
        const fromDate = period.fromDate;
        const toDate = period.toDate;

        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);

        toDate.setDate(toDate.getDate() - 1);

        while (fromDate <= toDate) {
            dates.push(new Date(fromDate));
            fromDate.setDate(fromDate.getDate() + 1);
        }
    });

    return dates;
}