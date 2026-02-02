import schedule from 'node-schedule';
import { deleteInvalidClickEvents } from './delete-invalid-click-events.job.js';
import { linkWeightsDaily } from './link-weights-daily.job.js';
import { automaticPayouts } from './automatic-payouts.job.js';
import { linksStatsMonthly } from './link-stats-monthly.job.js';

export function registerJobs() {
    deleteInvalidClickEventsJob()
    linkWeightsDailyJob()
    automaticPayoutsJob()
    linksStatsMonthlyJob()
}

function deleteInvalidClickEventsJob() {
    schedule.scheduleJob('0 0 * * * *', async () => {
        try {
            await deleteInvalidClickEvents();
        } catch (err) {
            console.error('Delete invalid check events job failed:', err);
        }
    });
}

function linkWeightsDailyJob() {
    schedule.scheduleJob('0 5 0 * * *', async () => {
        try {
            await linkWeightsDaily();
        } catch (err) {
            console.error('Link weights daily job failed:', err);
        }
    });
}

function automaticPayoutsJob() {
    schedule.scheduleJob('0 0 0 1 * *', async () => {
        try {
            await automaticPayouts();
        } catch (err) {
            console.error('Automatic payouts job failed:', err);
        }
    });
}

function linksStatsMonthlyJob() {
    schedule.scheduleJob('0 5 0 1 * *', async () => {
        try {
            await linksStatsMonthly();
        } catch (err) {
            console.error('Link stats monthly job failed:', err);
        }
    });
}