import express from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import geoip from 'geoip-lite'
import Link from './models/links.js';
import User from './models/users.js';
import Payout from './models/payouts.js';
import Ticket from './models/tickets.js';
import UserInfo from './models/users-info.js';
import ClickEvent from './models/click-event.js';
import PayoutMethod from './models/payout-method.js';
import LinkStatsDaily from './models/link-stats-daily.js';
import { validationResult } from 'express-validator';
import { shortIdValidation } from './middleware/shortId-config.js';
import { checkAuthenticated, checkNotAuthenticated } from './middleware/auth.js';
import { getPayoutsEnabledData,
         getReferralData,
         getLinkData,
         monthlyMonetization,
         getPayoutMethod,
         getDashboardData, 
         getAnalyticsData } from './middleware/router-helpers.js';
import { newLinkValidation, 
         payoutValidation, 
         ticketValidation, 
         ticketMessageValidation, 
         loginValidation, 
         registerValidation, 
         sendEmailValidation, 
         updateAccountValidation, 
         updatePayoutInformationValidation, 
         updatePasswordValidation } from './middleware/validation.js';

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

    res.render('index')
});

router.get('/advertise', checkAuthenticated, (req, res, next) => {
    const err = new Error()
    err.status = 501
    return next(err)

    //res.render('advertise')
});

router.get('/analytics', checkAuthenticated, async (req, res, next) => {
    try {
        const data = await getAnalyticsData(req.user)

        res.render('analytics', { ...data })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.get('/faq', (req, res) => {
    const isAuthenticatedFAQ = req.isAuthenticated()

    res.render('frequentlyAskedQuestions', { isAuthenticatedFAQ })
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

        res.render('dashboard', { ...linkData, ...dashboardData })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.get('/payout', checkAuthenticated, async (req, res, next) => {
    try {
        const data = await getPayoutsEnabledData(req.user)

        return res.status(200).render('payouts', { ...data, })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.get('/referral', checkAuthenticated, async (req, res, next) => {
    try {
        const user = req.user
        const referralData = await getReferralData(user)

        res.render('referrals', { referralData })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.get('/ticket', async (req, res, next) => {
    if (req.isAuthenticated()) {
        try {
            const tickets = await Ticket.find({ user: req.user._id })

            res.render('tickets', { tickets })
        } catch (err) {
            err.status = 500
            next(err)
        }
    } else {
        res.render('ticketsUnauth')
    }
});

router.get('/you', checkAuthenticated, async (req, res) => {
    try {
        const data = await getYouData(req)

        res.render('account', { ...data })
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

// Tickets
router.get('/tickets/:link', checkAuthenticated, async (req, res, next) => {
    try {
        const userId = req.user._id
        const ticket = await Ticket.findOne({ shortID: req.params.link })

        if (ticket === null) {
            const err = new Error()
            err.status = 404
            return next(err)
        }
        if (ticket.user !== userId) {
            const err = new Error()
            err.status = 403
            return next(err)
        }

        res.render('ticket', { ticket })
    } catch (err) {
        err.status = 500
        next(err)
    }
});

// Validation
router.get("/checkUsername", checkNotAuthenticated, async (req, res) => {
    const { username } = req.query;
    if (!username) {
        return res.json({ available: false, message: "Please enter a username" });
    }

    const exists = await User.findOne({ username });

    if (exists) {
        res.json({ available: false, message: "Username already taken" });
    } else {
        res.json({ available: true, message: "Username is available" });
    }
});

// User
router.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('user/login', { errorMessages: req.flash('error') })
});

router.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('user/register', { errorMessages: req.flash('error'), ref: req.query.ref || '' })
});

router.get('/tos', (req, res) => {
    res.render('user/termsOfService')
});

router.get('/privacy', (req, res) => {
    res.render('user/privacyPolicy')
});

router.get('/reportAdvertisement', async (req, res) => {
    const url = await Link.findOne({ short: req.query.link })
    let redirect = ''
    url ? redirect = `destination:${url.full}` : redirect = 'previous'

    const message = "Thank you for your report, it has been submitted and will be handled shortly. "
                  + "We appreciate your efforts to help make 159.cash a better place!"

    res.render('user/error', { number: 'Rep.', redirect , message })
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

        res.redirect('/new')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/:link/status', checkAuthenticated, async (req, res, next) => {
    try {
        const user = req.user
        const shortLink = await Link.findOne({ short: req.params.link })

        if (shortLink === null) {
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

        return source === 'operator' ? res.redirect('/operator') : res.redirect('/new')
    } catch (err) {
        err.status = 500
        next(err)
    }
})

router.post('/:clickId/validate', async (req, res, next) => {
    try {
        const click = await ClickEvent.findById(req.params.clickId)
        if (!click) return res.sendStatus(404)

        const link = await Link.findById(click.link)
        if (!link) return res.sendStatus(404)

        const elapsed = Date.now() - new Date(click.createdAt).getTime()
        if ((elapsed < link.duration * 1000) - 1000) return res.sendStatus(403)

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
            const data = await getPayoutsEnabledData(user)
            return res.status(400).render('payouts', { ...data, errors: errors.array(), payoutData: req.body })
        } catch (err) {
            err.status = 500
            next(err)
        }
    }
    
    try {
        const payoutMethod = await getPayoutMethod(user._id)

        await Payout.create({
            user: user._id,
            amount: req.body.amount,
            payoutMethod: payoutMethod
        })

        res.redirect('/payout')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/ticket', checkAuthenticated, ticketValidation, async (req, res, next) => {

    const userId = req.user._id;

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const tickets = await Ticket.find({ user: userId })
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

        res.redirect('/ticket')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/tickets/:link', checkAuthenticated, ticketMessageValidation, async (req, res, next) => {
    
    const user = await User.findById(req.user._id)
    const ticket = await Ticket.findOne({ shortID: req.params.link })
    
    if (ticket === null) {
        const err = new Error()
        err.status = 404
        return next(err)
    }
    if (ticket.user !== user._id) {
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

        res.redirect(`/tickets/${ticket.shortID}`)
    } catch (err) {
        err.status = 500
        next(err)
    }
});

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
    
    try {
        const referralCookie = req.cookies.referral
        let referrer = null

        if (referralCookie && Date.now() - referralCookie.clickedAt <= 7 * 24 * 60 * 60 * 1000) {
            referrer = referralCookie.referrer
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const newUser = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            referrer: referrer
        })

        await UserInfo.create({
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

        await PayoutMethod.create({
            user: newUser._id
        })

        res.redirect('/login')
    } catch {
        console.error(err)
        res.redirect('/register')
    }
});

router.post('/sendEmail', checkNotAuthenticated, sendEmailValidation, async (req, res) => {
    const err = new Error()
    err.status = 501
    return next(err)

    //const {name, email, subject, message} = req.body
});

router.post('/updateAccountInformation', updateAccountValidation, async (req, res, next) => {
    // use fileUpload() middleware
  
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const data = await getYouData(req)
            return res.render('account', { ...data, errors: errors.array(), data: req.body, form: 'updateAccountInformation' })
        } catch (err) {
            err.status = 500
            next(err)
        }
    }

    const userInfoThis = await UserInfo.findOne({ user: user._id })

    try {
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

    res.redirect('/you')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/updatePayoutInformation', checkAuthenticated, updatePayoutInformationValidation, async (req, res, next) => {
    
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const data = await getYouData(req)
            return res.render('account', { ...data, errors: errors.array(), data: req.body, form: 'updatePayoutInformation' })
        } catch (err) {
            err.status = 500
            next(err)
        }
    }
    
    try {
        const userPayoutMethod = PayoutMethod.findOne({ user: user._id })

        if (userPayoutMethod.details !== 'undefined') {
            await PayoutMethod.create({
                user: user._id,
                type: req.body.payoutMethod,
                details:
                    req.body.payoutMethod === "paypal"
                    ? { email: req.body.paypalEmail }
                    : { btcAddress: req.body.btcAddress }
            })
        } else {
            userPayoutMethod.type = req.body.payoutMethod
            req.body.payoutMethod === "paypal"
                    ? userPayoutMethod.details.email = req.body.paypalEmail
                    : userPayoutMethod.details.email = req.body.btcAddress

            await userPayoutMethod.save()
        }

        res.redirect('/you')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/updatePassword', checkAuthenticated, updatePasswordValidation, async (req, res, next) => {
    
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        try {
            const data = await getYouData(req)
            return res.render('account', { ...data, errors: errors.array(), data: req.body, form: 'updatePassword' })
        } catch (err) {
            err.status = 500
            next(err)
        }
    }
    
    try {
        const isMatch = await bcrypt.compare(req.body.password, user.password)

        if (isMatch && req.body.newPassword === req.body.newPasswordVerification) {
            const newHashedPassword = await bcrypt.hash(req.body.newPassword, 10)
            user.password = newHashedPassword

            await user.save()
        } else {
            const err = new Error()
            err.status = 403
            return next(err)
        }

        res.redirect('/you')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/updateAutomaticPayouts', checkAuthenticated, async (req, res, next) => {
    
    const user = req.user
    
    try {
        user.autoPayouts = req.body.autoPayouts ? true : false;

        await user.save()

        res.redirect('/you')
    } catch (err) {
        err.status = 500
        next(err)
    }
});

router.post('/subscribeToPremium', checkAuthenticated, async (req, res) => {
    const err = new Error()
    err.status = 501
    return next(err)
});

// Ads
router.get('/example', (req, res) => {
    const url = { full: '/', short: 'example', redirectInstantly: false, duration: 10000 }
    
    res.render('ads/adPage', { url, clickId: 0 });
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

        const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'not available'

        await ClickEvent.create({
            link: url._id,
            ip: ip,
            country: req.headers['cf-ipcountry'] || geoip.lookup(ip).country || 'not available',
            userAgent: req.headers['user-agent']
        }).catch(console.error);    

        url.monetization ? res.render('ads/adPage', { url, clickId: click._id }) : res.redirect(url.full)
    } catch (err) {
        err.status = 500
        next(err)
    }
});

// Delete
router.delete('/logout', checkAuthenticated, async (req, res, next) => {
    try {
        await new Promise((resolve, reject) => {
            req.logout(err => (err ? reject(err) : resolve()))
        });
        res.redirect('/login')
    } catch (err) {
        next(err);
    }
});

export default router;