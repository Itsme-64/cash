import schedule from 'node-schedule';
import { automaticPayouts } from './automatic-payouts.job.js';

export function registerJobs() {
    automaticPayoutsJob()
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