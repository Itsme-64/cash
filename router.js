import express from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import fileUpload from 'express-fileupload';
import Link from './models/links.js';
import User from './models/users.js';
import Payout from './models/payouts.js';
import Ticket from './models/tickets.js';
import UserInfo from './models/users-info.js';
import ClickEvent from './models/click-event.js';
import PayoutMethod from './models/payout-method.js';
import { validationResult } from 'express-validator';
import { processUserImage } from './middleware/image-config.js';
import { shortIdValidation } from './middleware/shortId-config.js';
import { processTicketFiles } from './middleware/ticket-files-config.js';
import { checkAuthenticated, checkNotAuthenticated } from './middleware/auth.js';
import { getPayoutsEnabledData, getReferralData, getTicketValidation, getLinkData, monthlyMonetization, getPayoutMethod } from './middleware/router-helpers.js';
import { newLinkValidation, 
         paymentValidation, 
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
    res.render('index')
});

router.get('/advertise', checkAuthenticated, (req, res) => {
    res.render('advertise')
});

router.get('/analytics', checkAuthenticated, (req, res) => {
    res.render('analytics')
});

router.get('/faq', (req, res) => {
    const isAuthenticatedFAQ = req.isAuthenticated()

    res.render('frequentlyAskedQuestions', { isAuthenticatedFAQ })
});

router.get('/new', checkAuthenticated, async (req, res) => {
    try {
        const linkData = await getLinkData(req)
        const monetizationData = await monthlyMonetization(req)
        
        res.render('createNewLink', { ...linkData, ...monetizationData, data: {} })
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.get('/operator', checkAuthenticated, async (req, res) => {
    try {
        const linkData = await getLinkData(req)

        res.render('dashboard', { ...linkData })
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.get('/payment', checkAuthenticated, async (req, res) => {
    try {
        const user = req.user
        const data = await getPayoutsEnabledData(user)

        res.render('payments', { ...data, paymentData: {} })
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.get('/referral', checkAuthenticated, async (req, res) => {
    try {
        const user = req.user
        const referralData = await getReferralData(user)

        res.render('referrals', { ...referralData })
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.get('/ticket', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const user = req.user;
            const tickets = await Ticket.find({ user: user._id })

        res.render('tickets', { tickets, data: {} })
        } catch (err) {
            console.error(err)
            res.status(500).send('Server error')
        }
    } else {
        res.render('ticketsUnauth')
    }
});

router.get('/you', checkAuthenticated, async (req, res) => {
    const user = req.user;
    const userInfo = await UserInfo.findOne({ user: user._id })
    const payoutMethod = getPayoutMethod(req)

    res.render('account', { data: {}, form: 'none', userInfo, payoutMethod })
});

//Validation
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

//User
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
    url ? redirect = `destination:${url.full}`  : redirect = 'previous'

    const message = "Thank you for your report, it has been submitted and will be handled shortly. "
                  + "We appreciate your efforts to help make 159.cash a better place!"

    res.render('user/error', { number: 'Rep.', redirect , message })
});

// Redirect
router.get('/discord', (req, res) => {
    res.redirect('https://discord.gg/dhUzNMmVpb')
});

// Post
router.post('/new', checkAuthenticated, newLinkValidation, async (req, res) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const linkData = await getLinkData(req)
        return res.render('createNewLink', { ...linkData, errors: errors.array(), data: req.body })
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
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.post('/:link/status', checkAuthenticated, async (req, res) => {
    try {
        const user = req.user
        const shortLink = await Link.findOne({ short: req.params.link })
        const source = req.query.source

        if (shortLink && user.links.includes(shortLink._id)) {
            shortLink.status = !shortLink.status
        }

        await shortLink.save()

        return source === 'operator' ? res.redirect('/operator') : res.redirect('/new')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
})

router.post('/payment', checkAuthenticated, paymentValidation, async (req, res) => {
    
    const user = req.user;

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const payoutsEnabledData = await getPayoutsEnabledData(user)
        return res.render('payments', { ...payoutsEnabledData, errors: errors.array(), data: req.body })
    }
    
    try {
        const payoutMethod = getPayoutMethod(req)

        await Payout.create({
            user: user._id,
            amount: req.body.amount,
            payoutMethod: payoutMethod
        })

        res.redirect('/payment')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.post('/ticket', checkAuthenticated, ticketValidation, fileUpload(), async (req, res) => {

    const user = req.user;
    const tickets = await Ticket.find({ user: user._id })

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('tickets', { tickets, errors: errors.array(), data: req.body })
    }

    try {
        const ticket = await Ticket.create({
            user: user._id,
            title: req.body.ticketTitle,
            body: req.body.ticketBody
        })

        if (req.files) {
            const files = await processTicketFiles(req.files.ticketFiles, ticket.shortID)
            ticket.files = files
            await ticket.save()
        }

        user.tickets.push(ticket._id)
        await user.save()


        res.redirect('/ticket')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.post('/tickets/:link', checkAuthenticated, ticketMessageValidation, async (req, res) => {
    
    const ticket = await Ticket.findOne({ shortID: req.params.link })
    const user = await User.findById(req.user._id)
    getTicketValidation(user, ticket)

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
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.post('/login', checkNotAuthenticated, loginValidation, async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('user/login', { errors: errors.array() })
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
        return res.render('user/register', { errors: errors.array() })
    }
    
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const newUser = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
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

        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
});

router.post('/sendEmail', checkNotAuthenticated, sendEmailValidation, async (req, res) => {
    const {name, email, subject, message} = req.body
});

router.post('/updateAccountInformation', updateAccountValidation, fileUpload(), async (req, res) => {
  
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('account', { errors: errors.array(), data: req.body, form: 'updateAccountInformation' })
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

        if (req.files) {
            const userIcon = req.files.userIcon
            await processUserImage(userIcon, user.PID)
            userInfoThis.hasProfile = true
        }

        await userInfoThis.save()

    res.redirect('/you')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.post('/updatePayoutInformation', checkAuthenticated, updatePayoutInformationValidation, async (req, res) => {
    
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('account', { errors: errors.array(), data: req.body, form: 'updatePayoutInformation' })
    }
    
    try {
        await PayoutMethod.create({
            user: user._id,
            type: req.body.payoutMethod,
            details:
                req.body.payoutMethod === "paypal"
                ? { email: req.body.paypalEmail }
                : { btcAddress: req.body.btcAddress }
        })

        res.redirect('/you')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')  
    }
});

router.post('/updatePassword', checkAuthenticated, updatePasswordValidation, async (req, res) => {
    
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('account', { errors: errors.array(), data: req.body, form: 'updatePassword' })
    }
    
    try {
        const isMatch = await bcrypt.compare(req.body.password, user.password)
        if (isMatch && req.body.newPassword === req.body.newPasswordVerification) {
            const newHashedPassword = await bcrypt.hash(req.body.newPassword, 10)
            user.password = newHashedPassword

            await user.save()
        } else {
            return res.status(400).send('Password was incorrect or new passwords do not match')
        }

        res.redirect('/you')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')  
    }
});

router.post('/updateAutomaticPayouts', checkAuthenticated, async (req, res) => {
    
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('account', { errors: errors.array(), data: req.body, form: 'updateAutomaticPayouts' })
    } 
    
    try {
        user.autoPayouts = req.body.autoPayouts ? true : false;

        await user.save()

        res.redirect('/you')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')  
    }
});

// Tickets
router.get('/tickets/:link', checkAuthenticated, async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ shortID: req.params.link })
        const user = await User.findById(req.user._id)
        getTicketValidation(user, ticket)

        res.render('ticket', { ticket, data: {} })
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')  
    }
});

// Ads
router.get('/example', (req, res) => {
    const url = { full: '/', short: 'example', redirectInstantly: false, duration: 5000 }
    
    res.render('ads/adPage', { url })
});

router.get('/:link', async (req, res) => {
    try {
        const url = await Link.findOne({ short: req.params.link })
        if (url === null || !url.status) {
            return res.status(404).render('error/404')
        }

        ClickEvent.create({
            link: url._id,
            ip: req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'not available',
            country: req.headers['cf-ipcountry'] || 'not available',
            userAgent: req.headers['user-agent']
        }).catch(console.error);

        url.monetization ? res.render('ads/adPage', { url }) : res.redirect(url.full)
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')  
    }
});

// Delete
router.delete('/logout', checkAuthenticated, async (req, res, next) => {
    try {
        await new Promise((resolve, reject) => {
            req.logout(err => (err ? reject(err) : resolve()));
        });
        res.redirect('/login');
    } catch (err) {
        next(err);
    }
});

export default router;

// Errors
router.use((req, res) => {
    const message = "The page you're looking for was not found."
    res.status(404).render('user/error', { number: 404, redirect: "previous", message })
});

// router.use((req, res) => {
//     const message = "Your browser sent a request this server could not understand"
//     res.status(400).render('user/error', { number: 400, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Authentication required!";
//     res.status(401).render('user/error', { number: 401, redirect: "home", message })
// });

// router.use((req, res) => {
//     const message = "A payment is required to proceed";
//     res.status(402).render('user/error', { number: 402, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "You do not have permission to access this page"
//     res.status(403).render('user/error', { number: 403, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "The page you're looking for was not found."
//     res.status(404).render('user/error', { number: 404, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Method not allowed!";
//     res.status(405).render('user/error', { number: 405, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Content not acceptable!";
//     res.status(406).render('user/error', { number: 406, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Request timeout!";
//     res.status(408).render('user/error', { number: 408, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Resource conflict!";
//     res.status(409).render('user/error', { number: 409, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Resource no longer available!";
//     res.status(410).render('user/error', { number: 410, redirect: "home", message })
// });

// router.use((req, res) => {
//     const message = "File too large!";
//     res.status(413).render('user/error', { number: 413, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "URL too long!";
//     res.status(414).render('user/error', { number: 414, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Unsupported file type!";
//     res.status(415).render('user/error', { number: 415, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "I'm a teapot!";
//     res.status(418).render('user/error', { number: 418, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Unprocessable request!";
//     res.status(422).render('user/error', { number: 422, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Too many requests!";
//     res.status(429).render('user/error', { number: 429, redirect: "home", message })
// });

// router.use((req, res,) => {
//     const message = "Internal server error!";
//     res.status(500).render('user/error', { number: 500, redirect: "home", message })
// });

// router.use((req, res) => {
//     const message = "Feature not implemented!";
//     res.status(501).render('user/error', { number: 501, redirect: "home", message })
// });

// router.use((req, res) => {
//     const message = "Bad gateway!";
//     res.status(502).render('user/error', { number: 502, redirect: "home", message })
// });

// router.use((req, res) => {
//     const message = "Service unavailable!";
//     res.status(503).render('user/error', { number: 503, redirect: "home", message })
// });

// router.use((req, res) => {
//     const message = "Gateway timeout!";
//     res.status(504).render('user/error', { number: 504, redirect: "home", message })
// });

// router.use((req, res) => {
//     const message = "Infinite loop detected!";
//     res.status(508).render('user/error', { number: 508, redirect: "home", message })
// });