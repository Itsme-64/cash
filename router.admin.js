import express from 'express';
import RevenuePeriod from './models/revenue-period.js';
import { getDoneDates } from './middleware/router-helpers.admin.js';
import { checkAuthenticated, requireAdmin } from './middleware/auth.js';
import { createRevenuePeriodValidation } from './middleware/validation.admin.js';
import { applyRevenuePeriod } from './services/apply-revenue-period.js';

const adminRouter = express.Router();

adminRouter.use(checkAuthenticated);
adminRouter.use(requireAdmin);

adminRouter.get('/', async (req, res, next) => {
    try {
        const doneDates = await getDoneDates(req)
        // const period = await RevenuePeriod.findOne().sort({ toDate: -1 })

        const period = {}

        period.fromDate = new Date(0)
        period.toDate = new Date(0)

        res.render('admin/admin', { doneDates, period })
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

export default adminRouter;