import { body } from 'express-validator';

export const createRevenuePeriodValidation = [
    body('amount')
        .notEmpty().withMessage('You must choose an amount to pay')
        .isInt({ min: 0 }).withMessage('Payout amount must be a number greater than 0'),
    body('dateSelection')
        .notEmpty().withMessage('You must provide a date range')
        .custom(({ req }) => {
            const dates = req.body.dateSelection.split(' - ')
            const fromDateParts = dates[0].split('.')
            const toDateParts = dates[1].split('.')
            const fromDate = new Date(fromDateParts[2], fromDateParts[1] - 1, fromDateParts[0])
            const toDate = new Date(toDateParts[2], toDateParts[1] - 1, toDateParts[0])

            if (fromDate > toDate || toDate >= new Date()) {
                throw new Error( 'Invalid date selection' );
            }

            //implement checking for dates that are already paid
        })
];