import express from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import geoip from 'geoip-lite'
import mongoose from 'mongoose';
import Link from './models/links.js';
import User from './models/users.js';
import Token from './models/tokens.js';
import Payout from './models/payouts.js';
import Ticket from './models/tickets.js';
import Campaign from './models/campaigns.js';
import UserInfo from './models/users-info.js';
import ClickEvent from './models/click-event.js';
import PayoutMethod from './models/payout-method.js';
import LinkStatsDaily from './models/link-stats-daily.js';
import { validationResult } from 'express-validator';
import { transporter, getPasswordMailOptions, getVerifyMailOptions, getPasswordChangedMailOptions, getDeletedMailOptions } from './services/email.js';
import { shortIdValidation } from './middleware/shortId-config.js';
import { checkAuthenticated, checkNotAuthenticated, forceLogoutAll } from './middleware/auth.js';
import { 
      getAdvertingData, getPayoutsData, getReferralData, getLinkData, monthlyMonetization, getPayoutMethod, getDashboardData,  getAnalyticsData,  getUA 
    } from './middleware/router-helpers.js';
import { 
      newLinkValidation, payoutValidation, ticketValidation, ticketMessageValidation, loginValidation, registerValidation, ticketSendValidation, 
      accountUpdateValidation, accountPayoutValidation, accountPasswordValidation,passwordForgottenValidation,passwordResetValidation,
      userVerificationValidation, tokenRateLimitVerification, campaignValidation, campaignUpdateValidation
    } from './middleware/validation.js';

const router = express.Router();

// Get Pages
router.get('/', checkNotAuthenticated, (req, res) => {
    const ref = req.query.ref

    if (ref && !req.cookies.referral) {
        res.cookie('referral', {
            referrer: ref,
            clickedAt: Date.now()
        }, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
    }

    return res.status(200).render('index')
});

router.get('/advertise', async (req, res, next) => {
    try {
        const data = await getAdvertiseData(req)

        return res.status(200).render('advertise', { ...data })
    } catch(err) {
        err.status = 500
        next(err)
    }
});
async function getAdvertiseData(req) {
    const isAuthenticated = req.isAuthenticated()

    let campaigns = {}
    let data = {}

    if (isAuthenticated) {
        campaigns = await Campaign.find({ user: req.user._id })
        data = await getAdvertingData()
    }

    return { isAuthenticated, campaigns, ...data }
}

router.get('/analytics', checkAuthenticated, async (req, res, next) => {
    try {
        const data = await getAnalyticsData(req.user)

        return res.status(200).render('analytics', { ...data })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.get('/faq', (req, res) => {
    const isAuthenticated = req.isAuthenticated()

    res.render('frequentlyAskedQuestions', { isAuthenticated })
});

router.get('/new', checkAuthenticated, async (req, res, next) => {
    try {
        const data = await getNewData(req)
        return res.status(200).render('createNewLink', { ...data })
    } catch (err) {
        err.status = 500
        next(err)
    }
});
async function getNewData(req) {
    const linkData = await getLinkData(req, 'new');
    const monetizationData = await monthlyMonetization(req.user._id);
    return { ...linkData, ...monetizationData };
}

router.get('/operator', checkAuthenticated, async (req, res, next) => {
    try {
        const linkData = await getLinkData(req, 'operator')
        const dashboardData = await getDashboardData(req.user)

        return res.status(200).render('dashboard', { ...linkData, ...dashboardData })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.get('/payout', checkAuthenticated, async (req, res, next) => {
    try {
        const data = await getPayoutsData(req.user)

        return res.status(200).render('payouts', { ...data, })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.get('/referral', checkAuthenticated, async (req, res, next) => {
    try {
        const data = await getReferralData(req.user)

       return res.status(200).render('referrals', { ...data })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.get('/ticket', async (req, res, next) => {
    if (req.isAuthenticated()) {
        try {
            const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 })

            return res.status(200).render('tickets', { tickets })
        } catch (err) {
            err.status = 500
            next(err)
        }
    } else {
        return res.status(308).render('ticketsUnauth')
    }
});

router.get('/you', checkAuthenticated, async (req, res) => {
    try {
        const data = await getYouData(req)

        return res.status(200).render('account', { ...data })
    } catch(err) {
        err.status = 500
        next(err)
    }
});
async function getYouData(req) {
    const userId = req.user._id;
    const userInfo = await UserInfo.findOne({ user: userId })
    const payoutMethod = await getPayoutMethod(userId)
    return { userInfo, payoutMethod };
}

// Dynamic
router.get('/tickets/:link', checkAuthenticated, async (req, res, next) => {
    try {
        const userId = req.user._id
        const ticket = await Ticket.findOne({ short: req.params.link })

        if (ticket === null) {
            const err = new Error()
            err.status = 404
            return next(err)
        }
        if (String(ticket.user) !== String(userId)) {
            const err = new Error()
            err.status = 403
            return next(err)
        }

        return res.status(200).render('ticket', { ticket })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.get('/advertise/apply', checkAuthenticated, async (req, res) => {
    try {
        const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 })

        const data = {}
        data.ticketTitle = `Advertiser Application: ${req.user.username} (${req.user.PID})`
        data.ticketBody = "<-- FOR A VALUD APPLICATION A USER MUST INCLUDE: --> \n" + 
            "1. Data about the body you are wishing to advertise for (company/individual, company information or individual activities you perform):\n" +
            "2. A short description about the specific avertisements you would like to display on 159.cash:\n" +
            "3. Any questions? Feel free to ask them here, thank you!"

        return res.status(200).render('tickets', { tickets, data })
    } catch (err) {
        err.status = 500
        next(err) 
    }
});

router.get('/campaigns/:link', checkAuthenticated, async (req, res, next) => {
    try {
        const userId = req.user._id
        const campaign = await Campaign.findOne({ short: req.params.link })

        if (campaign === null) {
            const err = new Error()
            err.status = 404
            return next(err)
        }
        if (String(campaign.user) !== String(userId)) {
            const err = new Error()
            err.status = 403
            return next(err)
        }

        return res.status(200).render('campaign', { campaign })
    } catch (err) {
        err.status = 500
        next(err)
    } 
});

// User
router.get('/login', checkNotAuthenticated, (req, res) => {
    return res.status(200).render('user/login', { errorMessages: req.flash('error') })
});

router.get('/register', checkNotAuthenticated, (req, res) => {
    return res.status(200).render('user/register', { errorMessages: req.flash('error'), ref: req.query.ref || '' })
});

router.get('/tos', (req, res) => {
    return res.status(200).render('user/termsOfService')
});

router.get('/privacy', (req, res) => {
    return res.status(200).render('user/privacyPolicy')
});

router.get('/logout', checkAuthenticated, async (req, res, next) => {
    try {
        await new Promise((resolve, reject) => { req.logout(err => (err ? reject(err) : resolve())) });
        return res.status(200).redirect('/login')
    } catch (err) {
        next(err);
    }
});

router.get('/report', async (req, res) => {
    const url = await Link.findOne({ short: req.query.advertisement })
    let redirect = ''
    url ? redirect = `destination:${url.full}` : redirect = 'previous'

    const message = "Thank you for your report, it has been submitted and will be handled shortly. "
                  + "We appreciate your efforts to help make 159.cash a better place!"

    return res.status(202).render('user/error', { number: 'Rep.', redirect , message })
});

router.get('/you/verify', (req, res) => {
    return res.status(200).render('user/verify', { query: req.query })
})

router.get('/password/forgot', checkNotAuthenticated, (req, res) => {
    return res.status(200).render('user/passwordForgotten')
});

router.get('/password/reset', checkNotAuthenticated, (req, res) => {
    return res.status(200).render('user/passwordReset', { query: req.query })
});

// Redirect
router.get('/discord', (req, res) => {
    res.redirect('https://discord.gg/dhUzNMmVpb')
});

// Post
router.post('/new', checkAuthenticated, newLinkValidation, async (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const data = await getNewData(req)
            return res.status(400).render('createNewLink', { ...data, errors: errors.array(), data: req.body })
        } catch (err) {
            err.status = 500
            next(err)
        }
    }

    try {
        const user = req.user

        if (req.body.bulkToggle) {
            const bulkLinks = req.body.bulkLinks;

            for (const fullLink of bulkLinks) {
                await shortIdValidation({
                    user: user._id,
                    full: fullLink,
                    monetization: req.body.monetization,
                    duration: req.body.monetizationDuration,
                    redirectInstantly: req.body.redirectInstantly
                });
            }
        } else {
            await Link.create({
                user: user._id,
                full: req.body.singleLink,
                monetization: req.body.monetization,
                duration: req.body.monetizationDuration,
                redirectInstantly: req.body.redirectInstantly
            })
        }

        return res.status(201).redirect('/new')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/link/status', checkAuthenticated, async (req, res, next) => {
    try {
        const user = req.user
        const shortLink = await Link.findOne({ short: req.query.link })

        if (!shortLink) {
            const err = new Error()
            err.status = 404
            return next(err)
        }
        if (String(shortLink.user) != user._id) {
            const err = new Error()
            err.status = 403
            return next(err)
        }

        const source = req.query.source

        shortLink.status = !shortLink.status
        await shortLink.save()

        return source === 'operator' ? res.status(200).redirect('/operator') : res.status(200).redirect('/new')
    } catch (err) {
        err.status = 500
        next(err)
    }
})

router.post('/click/validate', async (req, res, next) => {
    try {
        const click = await ClickEvent.findById(req.query.clickid)
        if (!click) return res.sendStatus(404)

        const link = await Link.findById(click.link)
        if (!link) return res.sendStatus(404)

        const elapsed = Date.now() - new Date(click.createdAt).getTime()
        if (elapsed < (link.duration - 1000)) return res.sendStatus(403)

        const ip = req.ip || 'not available';
        const country = geoip.lookup(ip)?.country || 'not available';
        const lang = req.get('Accept-Language')?.split(',')[0] || 'not available';

        const ua = req.get('User-Agent');
        const { os, browser } = getUA(ua);

        click.ip = ip
        click.country = country
        click.language = lang
        click.os = os
        click.browser = browser

        click.valid = true

        await click.save()

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const linkStats = await LinkStatsDaily.findOne({ link: link._id, date: today })

        if (linkStats) {
            linkStats.clicks += 1
            await linkStats.save()
        } else {
            await LinkStatsDaily.create({
                link: link._id,
                date: today,
                clicks: 1
            })
        }

        return res.sendStatus(200)
    } catch (err) {
        err.status = 500
        next(err)
    }
})

router.post('/payout', checkAuthenticated, payoutValidation, async (req, res, next) => {
    
    const user = req.user;

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const data = await getPayoutsData(user)
            return res.status(400).render('payouts', { ...data, errors: errors.array(), payoutData: req.body })
        } catch (err) {
            err.status = 500
            next(err)
        }
    }

    const session = await mongoose.startSession();
    
    try {
        session.startTransaction()

        const payoutMethod = await getPayoutMethod(user._id)
        const amount = req.body.amount

        user.balance = user.balance - (amount * 10000)
        await user.save({ session })

        const userPayout = new Payout({
            user: user._id,
            amount: amount,
            payoutMethod: payoutMethod
        })
        await userPayout.save({ session });

        await session.commitTransaction();
        return res.status(201).redirect('/payout')
    } catch (err) {
        await session.abortTransaction()
        err.status = 500
        next(err)
    } finally {
        session.endSession()
    }
});

router.post('/ticket', checkAuthenticated, ticketValidation, async (req, res, next) => {

    const userId = req.user._id;

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const tickets = await Ticket.find({ user: userId }).sort({ createdAt: -1 })
            return res.render('tickets', { tickets, errors: errors.array(), data: req.body })
        } catch (err) {
            err.status = 500
            next(err)
        }
    }

    try {
        await Ticket.create({
            user: userId,
            title: req.body.ticketTitle,
            body: req.body.ticketBody
        })

        return res.status(201).redirect('/ticket')
    } catch (err) {
        if (!err.status) err.status = 500
        next(err)
    }
});

router.post('/tickets/:link', checkAuthenticated, ticketMessageValidation, async (req, res, next) => {
    
    const userId = req.user._id
    const ticket = await Ticket.findOne({ short: req.params.link })
    
    if (ticket === null) {
        const err = new Error()
        err.status = 404
        return next(err)
    }
    if (String(ticket.user) !== String(userId)) {
        const err = new Error()
        err.status = 403
        return next(err)
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('ticket', { ticket, errors: errors.array(), data: req.body })
    }
    
    try {
        ticket.messageHistory.push({
            message: req.body.messageBody,
            from: "user"
        })

        await ticket.save()

        return res.status(200).redirect(`/tickets/${ticket.short}`)
    } catch (err) {
        if (!err.status) err.status = 500
        next(err)
    }
});

router.post('/advertise', checkAuthenticated, campaignValidation, async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const data = await getAdvertiseData(req)
            return res.render('tickets', { ...data, errors: errors.array(), data: req.body })
        } catch (err) {
            err.status = 500
            next(err)
        }
    }

    try {
        const campaign = await Campaign.create({
            user: req.user._id,
            title: req.body.title,
            head: req.body.header,
            endpoint: req.body.endpoint,
            business: req.body.business ? true : false
        })

        return res.status(201).redirect(`/campaigns/${campaign.short}`)
    } catch (err) {
        if (!err.status) err.status = 500
        next(err)
    }
});

router.post('/campaign/update', checkAuthenticated, campaignUpdateValidation, async (req, res, next) => { // create campaignUpdateValidation
    const userId = req.user._id
    const campaign = await Campaign.findOne({ short: req.query.campaign })
    
    if (campaign === null) {
        const err = new Error()
        err.status = 404
        return next(err)
    }
    if (String(campaign.user) !== String(userId)) {
        const err = new Error()
        err.status = 403
        return next(err)
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('ticket', { campaign, errors: errors.array(), data: req.body })
    }
    
    try {
        // TODO

        return res.status(200).redirect(`/campaigns/${campaign.short}`)
    } catch (err) {
        if (!err.status) err.status = 500
        next(err)
    }
});

router.post('/campaign/deactivate', checkAuthenticated, async (req, res, next) => {
    try {
        const userId = req.user._id
        const campaign = await Campaign.findOne({ short: req.query.campaign })
        
        if (campaign === null) {
            const err = new Error()
            err.status = 404
            return next(err)
        }
        if (String(campaign.user) !== String(userId)) {
            const err = new Error()
            err.status = 403
            return next(err)
        }
        if (campaign.status != 'active') {
            const err = new Error()
            err.status = 400
            return next(err)
        }

        campaign.status = 'deactivated'
        await campaign.save();

        return res.status(200)
    } catch (err) {
        if (!err.status) err.status = 500
        next(err)
    }
});

// More campaign methods too

router.post('/login', checkNotAuthenticated, loginValidation, async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('user/login', { errors: errors.array(), data: req.body })
    }

    passport.authenticate('local', {
        successRedirect: '/operator',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next)
});

router.post('/register', checkNotAuthenticated, registerValidation, async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('user/register', { errors: errors.array(), data: req.body })
    }

    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();

        const referralCookie = req.cookies.referral
        let referrer = null

        if (referralCookie && Date.now() - referralCookie.clickedAt <= 7 * 24 * 60 * 60 * 1000) {
            referrer = referralCookie.referrer
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            referrer
        })
        await newUser.save({ session })

        const newUserInfo = new UserInfo({
            user: newUser._id,
            name: req.body.name,
            address: {
                line1: req.body.line1,
                line2: req.body.line2,
                city: req.body.city,
                zip: req.body.zip,
                country: req.body.country
            }
        })
        await newUserInfo.save({ session })

        const newPayoutMethod = new PayoutMethod({
            user: newUser._id
        })
        await newPayoutMethod.save({ session })

        await session.commitTransaction();

        const token = await Token.create({
            user: newUser._id,
            type: 'verify'
        })

        const mailOptions = getVerifyMailOptions(newUser, token)

        transporter.sendMail(mailOptions, (error) => {
            if (error) console.error(error)
        })

        return res.status(201).redirect('/login')
    } catch (err) {
        await session.abortTransaction();
        console.error(err)
        res.status(400).redirect('/register')
    } finally {
        session.endSession()
    }
});

router.post('/ticket/send', checkNotAuthenticated, ticketSendValidation, async (req, res) => {
    const err = new Error()
    err.status = 501
    return next(err)

    //const {name, email, subject, message} = req.body
});

router.post('/you/update', accountUpdateValidation, async (req, res, next) => {
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const data = await getYouData(req)
            return res.render('account', { ...data, errors: errors.array(), data: req.body, form: 'update' })
        } catch (err) {
            err.status = 500
            next(err)
        }
    }

    try {
        const userInfoThis = await UserInfo.findOne({ user: user._id })

        userInfoThis.name = req.body.name
        userInfoThis.address = {
            line1: req.body.line1,
            city: req.body.city,
            zip: req.body.zip,
            country: req.body.country
        },
        userInfoThis.tel = req.body.tel

        // if (req.files) {
        //     const userIcon = req.files.userIcon
        //     await processUserImage(userIcon, user.PID)
        //     userInfoThis.hasProfile = true
        // }

        await userInfoThis.save()

    return res.status(200).redirect('/you')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/you/payout', checkAuthenticated, accountPayoutValidation, async (req, res, next) => {
    
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const data = await getYouData(req)
            return res.render('account', { ...data, errors: errors.array(), data: req.body, form: 'payout' })
        } catch (err) {
            err.status = 500
            next(err)
        }
    }
    
    try {
        const method = req.body.payoutMethod.toLowerCase()

        await PayoutMethod.create({
            user: user._id,
            type: method,
            details:
                method === "paypal"
                ? { email: req.body.paypalEmail }
                : { btcAddress: req.body.btcAddress }
        })

        return res.status(201).redirect('/you')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/you/password', checkAuthenticated, accountPasswordValidation, async (req, res, next) => {
    
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const data = await getYouData(req)
            return res.render('account', { ...data, errors: errors.array(), data: req.body, form: 'password' })
        } catch (err) {
            err.status = 500
            next(err)
        }
    }
    
    try {
        const isMatch = await bcrypt.compare(req.body.password, user.password)

        if (!isMatch || req.body.newPassword !== req.body.newPasswordVerification) {
            const err = new Error()
            err.status = 403
            return next(err)
        }

        const newHashedPassword = await bcrypt.hash(req.body.newPassword, 10)
        user.password = newHashedPassword

        await user.save()
        await forceLogoutAll(req, res, user._id)

        const mailOptions = getPasswordChangedMailOptions(user)

        transporter.sendMail(mailOptions, (error) => {
            if (error) console.error(error)
        })

        return res.status(200).redirect('/login')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/you/payouts/automatic', checkAuthenticated, async (req, res, next) => {
    
    const user = req.user
    
    try {
        user.autoPayouts = req.body.autoPayouts ? true : false;

        await user.save()

        return res.status(200).redirect('/you')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/you/delete', checkAuthenticated, async (req, res, next) => {
    const user = req.user
    const deleteUsername = req.body.deleteusername

    if (user.username != deleteUsername) {
        const err = new Error()
        err.status = 400
        return next(err)
    }

    try {
        const mailOptions = getDeletedMailOptions(user)

        transporter.sendMail(mailOptions, (error) => {
            if (error) console.error(error)
        })

        user.status = false

        user.username = user.PID
        user.email = '__deleted__user__' + user.email + '__deleted__user__'
        user.password = ''

        user.verified = false
        user.premium = false
        user.advertiser = false
        
        await UserInfo.deleteOne({ user: user._id })

        await user.save()
        await forceLogoutAll(req, res, user._id)

        return res.status(200).redirect('/logout')
    } catch (err) {
        if (!err.status) err.status = 500
        return next(err)
    }
});

router.post('/you/verify', userVerificationValidation, async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            return res.render('user/verify', { errors: errors.array(), query: req.query })
        } catch (err) {
            if (!err.status) err.status = 500
            return next(err)
        }
    }

    try {
        const user = await User.findOne({ username: req.query.user })
        await Token.deleteOne({ token: req.query.token })

        if (!user || !user.status) {
            const err = new Error()
            err.status = 400
            return next(err)
        }

        user.verified = true
        await user.save()

        return res.status(200).redirect('/you')
    } catch (err) {
        if (!err.status) err.status = 500
        return next(err)
    }
});

router.post('/you/verify/resend', checkAuthenticated, tokenRateLimitVerification, async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const data = await getYouData(req)
            return res.render('account', { ...data, errors: errors.array(), form: 'resend' })
        } catch (err) {
            if (!err.status) err.status = 500
            return next(err)
        }
    }

    const user = req.user

    try {
        const token = await Token.create({
            user: user._id,
            type: 'verify'
        })

        const mailOptions = getVerifyMailOptions(user, token)

        transporter.sendMail(mailOptions, (error) => {
            if (error) console.error(error)
        })

        return res.status(200).redirect('/you')
    } catch (err) {
        if (!err.status) err.status = 500
        return next(err)
    }
})

router.post('/premium/subscribe', checkAuthenticated, async (req, res, next) => {
    const err = new Error()
    err.status = 501
    return next(err)
});

router.post('/password/forgot', checkNotAuthenticated, tokenRateLimitVerification, passwordForgottenValidation, async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            return res.render('user/passwordForgotten', { errors: errors.array() })
        } catch (err) {
            if (!err.status) err.status = 500
            return next(err)
        }
    }

    try {
        const email = req.body.email;
        const user = await User.findOne({ email })

        if (!user || !user.status) {
            const err = new Error()
            err.status = 400
            return next(err)
        }

        const token = await Token.create({
            user: user._id,
            type: 'password'
        })

        const mailOptions = getPasswordMailOptions(user, token)

        transporter.sendMail(mailOptions, (error) => {
            if (error) console.error(error)
        })

        return res.status(201).render('user/passwordForgotten', { success: 'recovery email sent successfully' })
    } catch (err) {
        if (!err.status) err.status = 500
        return next(err)
    }
});

router.post('/password/reset', checkNotAuthenticated, passwordResetValidation, async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            return res.render('user/passwordReset', { errors: errors.array(), query: req.query })
        } catch (err) {
            if (!err.status) err.status = 500
            return next(err)
        }
    }

    try {
        const token = await Token.findOne({ token: req.query.token })

        if (!token) {
            const err = new Error()
            err.status = 400
            return next(err) 
        }

        const user = await User.findById(token.user)
        await Token.findByIdAndDelete(token._id);

        if (!user.status) {
            const err = new Error()
            err.status = 403
            return next(err)      
        }

        const newHashedPassword = await bcrypt.hash(req.body.newPassword, 10)
        user.password = newHashedPassword

        await user.save()
        await forceLogoutAll(req, res, user._id)

        const mailOptions = getPasswordChangedMailOptions(user)

        transporter.sendMail(mailOptions, (error) => {
            if (error) console.error(error)
        })

        return res.status(200).redirect('/login')
    } catch (err) {
        if (!err.status) err.status = 500
        return next(err)
    }
});

// Ads
router.get('/example', (req, res) => {
    const url = { full: '/', short: 'example', redirectInstantly: false, duration: 10000 }
    
    res.status(200).render('ads/adPage', { url, clickId: 0, target: '/' });
});

router.get('/:link', async (req, res, next) => {
    try {
        const url = await Link.findOne({ short: req.params.link })

        if (url === null) {
            const err = new Error()
            err.status = 404
            return next(err)
        }
        if (!url.status) {
            const err = new Error()
            err.status = 403
            return next(err)
        }

        let qry = req.query.qry ?? "";
        let dat = req.query.dat ?? "";
        if (dat && !qry) qry = "dat";

        let target = new URL(url.full);
        if (dat) target.searchParams.set(qry, dat);
        target = target.toString()

        const click = await ClickEvent.create({
            link: url._id,
        });
        
        return url.monetization ? res.status(200).render('ads/adPage', { url, target, clickId: click._id }) : res.redirect(target)
    } catch (err) {
        if (!err.status) err.status = 500;
        next(err)
    }
});

// Delete
router.delete('/logout', checkAuthenticated, async (req, res, next) => {
    try {
        await new Promise((resolve, reject) => {
            req.logout(err => (err ? reject(err) : resolve()))
        });
        return res.status(200).redirect('/login')
    } catch (err) {
        next(err);
    }
});

export default router;