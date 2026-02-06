import express from 'express';
import Payout from './models/payouts.js'
import RevenuePeriod from './models/revenue-period.js';
import { getDoneDates, getPeriodData, getPayoutData } from './middleware/router-helpers.admin.js';
import { checkAuthenticated, requireAdmin } from './middleware/auth.js';
import { createRevenuePeriodValidation } from './middleware/validation.admin.js';
import { applyRevenuePeriod } from './services/apply-revenue-period.js';

const adminRouter = express.Router();

adminRouter.use(checkAuthenticated);
adminRouter.use(requireAdmin);

adminRouter.get('/', async (req, res, next) => {
    try {
        const doneDates = await getDoneDates()
        const { period } = await getPeriodData()
        const payouts = await getPayoutData()

        res.render('admin/admin', { doneDates, period, payouts })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

adminRouter.post('/createRevenuePeriod', createRevenuePeriodValidation, async (req, res, next) => {
    try {
        const dates = req.body.dateSelection.split(' - ')
        const fromDateParts = dates[0].split('.')
        const toDateParts = dates[1].split('.')

        const period = await RevenuePeriod.create({
            amount: req.body.amount,
            fromDate: new Date(fromDateParts[2], fromDateParts[1] - 1, fromDateParts[0]),
            toDate: new Date(toDateParts[2], toDateParts[1] - 1, toDateParts[0])
        })

        await applyRevenuePeriod(period._id)

        res.redirect('/')
    } catch (err) {
        console.err(err)
        err.status = 500
        next(err)
    }
});

adminRouter.post('/:payout/complete', async (req, res, next) => {
    try {
        const payout = await Payout.findOne({ payoutID: req.params.payout })
        payout.status = 'completed'
        await payout.save()

        res.redirect('/')
    } catch (err) {
        console.err(err)
        err.status = 500
        next(err)
    }
});

adminRouter.post('/:payout/reject', async (req, res, next) => {
    try {
        const payout = await Payout.findOne({ payoutID: req.params.payout })
        payout.status = 'rejected'
        await payout.save()

        res.redirect('/')
    } catch (err) {
        console.err(err)
        err.status = 500
        next(err)
    }
});

export default adminRouter;