import { body } from 'express-validator';
import { getDoneDates } from './router-helpers.admin.js';

export const createRevenuePeriodValidation = [
    body('amount')
        .notEmpty().withMessage('You must choose an amount to pay')
        .isInt({ min: 1 }).withMessage('Payout amount must be a number greater than 0'),
    body('dateSelection')
        .notEmpty().withMessage('You must provide a date range')
        .custom(async ({ req }) => {
            const dates = req.body.dateSelection.split(' - ');
            const fromDateParts = dates[0].split('.');
            const toDateParts = dates[1].split('.');
            const fromDate = new Date(fromDateParts[2], fromDateParts[1] - 1, fromDateParts[0]);
            const toDate = new Date(toDateParts[2], toDateParts[1] - 1, toDateParts[0]);

            if (fromDate > toDate || toDate >= new Date()) {
                throw new Error( 'Invalid date selection' );
            }

            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(0, 0, 0, 0);

            const doneDates = await getDoneDates();

            if (doneDates.includes(fromDate) || doneDates.includes(toDate)) {
                throw new Error( '(A selection of) your date range has already been paid!' );
            }

            return true;
        })
];