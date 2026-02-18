import express from 'express';
import Ticket from './models/tickets.js';
import Payout from './models/payouts.js'
import RevenuePeriod from './models/revenue-period.js';
import { getDoneDates, getPeriodData, getPayoutData, getTicketData } from './middleware/router-helpers.admin.js';
import { checkAuthenticated, requireAdmin } from './middleware/auth.js';
import { createRevenuePeriodValidation } from './middleware/validation.admin.js';
import { applyRevenuePeriod } from './services/apply-revenue-period.js';

const adminRouter = express.Router();

adminRouter.use(checkAuthenticated);
adminRouter.use(requireAdmin);

// Get
adminRouter.get('/', async (req, res, next) => {
    try {
        const doneDates = await getDoneDates()
        const { period } = await getPeriodData()
        const payouts = await getPayoutData()
        const tickets = await getTicketData()

        res.render('admin/admin', { doneDates, period, payouts, tickets })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

adminRouter.get('/tickets/:ticket', async (req, res, next) => {
    try {
        const ticket = await Ticket.findOne({ shortID: req.params.ticket })

        if (ticket === null) {
            const err = new Error()
            err.status = 404
            return next(err)
        }

        res.render('admin/ticket', { ticket, data: {} })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

// Post
adminRouter.post('/period/create', createRevenuePeriodValidation, async (req, res, next) => {
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

        res.redirect('/admin/')
    } catch (err) {
        console.error(err)
        err.status = 500
        next(err)
    }
});

adminRouter.post('/:payout/complete', async (req, res, next) => {
    try {
        const payout = await Payout.findOne({ payoutID: req.params.payout })

        if (!payout) {
            const err = new Error()
            err.status = 404
            return next(err)
        }

        payout.status = 'completed'
        await payout.save()

        res.redirect('/admin/')
    } catch (err) {
        console.err(err)
        err.status = 500
        next(err)
    }
});

adminRouter.post('/:payout/reject', async (req, res, next) => {
    try {
        const payout = await Payout.findOne({ payoutID: req.params.payout })

        if (!payout) {
            const err = new Error()
            err.status = 404
            return next(err)
        }

        payout.status = 'rejected'
        await payout.save()

        res.redirect('/admin/')
    } catch (err) {
        console.err(err)
        err.status = 500
        next(err)
    }
});

adminRouter.post('/tickets/:ticket', async (req, res, next) => {
    try {
        const ticket = await Ticket.findOne({ shortID: req.params.ticket })

        if (!ticket) {
            const err = new Error()
            err.status = 404
            return next(err)
        }

        ticket.messageHistory.push({
            message: req.body.messageBody,
            from: 'admin'
        })

        await ticket.save()

        res.redirect(`/admin/tickets/${ticket.shortID}`)
    } catch (err) {
        console.err(err)
        err.status = 500
        next(err)
    }
});

adminRouter.post('/:ticket/resolve', async (req, res, next) => {
    try {
        const ticket = await Ticket.findOne({ shortID: req.params.ticket })

        if (!ticket) {
            const err = new Error()
            err.status = 404
            return next(err)
        }

        ticket.status = 'resolved'
        await ticket.save()

        res.redirect('/admin/')
    } catch (err) {
        console.err(err)
        err.status = 500
        next(err)
    }
});

adminRouter.post('/:ticket/close', async (req, res, next) => {
    try {
        const ticket = await Ticket.findOne({ shortID: req.params.ticket })

        if (!ticket) {
            const err = new Error()
            err.status = 404
            return next(err)
        }

        ticket.status = 'closed'
        await ticket.save()

        res.redirect('/admin/')
    } catch (err) {
        console.err(err)
        err.status = 500
        next(err)
    }
});

export default adminRouter;