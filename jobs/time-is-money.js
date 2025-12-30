import schedule from 'node-schedule';
import { automaticPayouts } from './automatic-payouts.job.js';

export function registerJobs() {
    automaticPayoutsJob()
}

const automaticPayoutsJob = schedule.scheduleJob('0 0 0 1 * *', () => {
    automaticPayouts
});