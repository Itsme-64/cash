import express from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import Link from './models/links.js';
import User from './models/users.js';
import Payment from './models/payments.js';
import Ticket from './models/tickets.js';
import { validationResult } from 'express-validator';
import { processUserImage } from './middleware/image-config.js';
import { shortIdValidation } from './middleware/shortId-config.js';
import { processTicketFiles } from './middleware/ticket-files-config.js';
import { checkAuthenticated, checkNotAuthenticated } from './middleware/auth.js';
import { getPaymentData, getReferralData, getTicketValidation, getLinkData, monthlyMonetization } from './middleware/router-helpers.js';
import { newLinkValidation, 
         paymentValidation, 
         ticketValidation, 
         ticketMessageValidation, 
         loginValidation, 
         registerValidation, 
         sendEmailValidation, 
         updateAccountValidation, 
         updatePaymentInformationValidation, 
         updatePasswordValidation } from './middleware/validation.js';

const router = express.Router();

//Pages
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
        const data = await getPaymentData(user)

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

router.get('/you', checkAuthenticated, (req, res) => {
    res.render('account', { data: {}, form: 'none' })
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

// Redirect
router.get('/discord', (req, res) => {
    res.redirect('https://discord.gg/dhUzNMmVpb')
});

// Errors
// router.use((req, res) => {
//     res.status(400).render('error/400')
// });

// router.use((req, res) => {
//     res.status(403).render('error/403')
// });

// router.use((req, res) => {
//     res.status(404).render('error/404')
// });

// router.use((err, req, res, next) => {
//     res.status(500).render('error/500')
// });

//Post
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

            const createdLinks = [];
            for (const fullLink of bulkLinks) {
                const link = await shortIdValidation({
                    user: user._id,
                    full: fullLink,
                    monetization: req.body.monetization,
                    duration: req.body.monetizationDuration
                });

                createdLinks.push(link);
            }

            user.links.push(...createdLinks.map(l => l._id));
        } else {
            const link = await Link.create({
                user: user._id,
                full: req.body.singleLink,
                monetization: req.body.monetization,
                duration: req.body.monetizationDuration
            })

            user.links.push(link._id);
        }

        await user.save();

        res.redirect('/new')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.post('/:link/status', checkAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        const shortLink = await Link.findOne({ short: req.params.link })

        if (shortLink && user.links.includes(shortLink._id)) {
            shortLink.status = !shortLink.status
        }

        await shortLink.save()

        res.redirect('/new')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
})

router.post('/payment', checkAuthenticated, paymentValidation, async (req, res) => {
    
    const user = req.user;
    const paymentData = await getPaymentData(user)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('payments', { ...paymentData, errors: errors.array(), data: req.body })
    }
    
    try {
        const payment = await Payment.create({
            user: user._id,
            amount: req.body.amount,
            payoutMethod: user.payoutMethod,
            paypalEmail: user.paypalEmail
        })

        user.paymentHistory.push(payment._id);
        await user.save();

        res.redirect('/payment')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.post('/ticket', checkAuthenticated, ticketValidation, async (req, res) => {

    const user = req.user;
    const tickets = await Ticket.find({ user: user._id })

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('payments', { tickets, errors: errors.array(), data: req.body })
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
            name: req.body.name,
            address: {
                line1: req.body.line1,
                line2: req.body.line2,
                city: req.body.city,
                zip: req.body.zip,
                country: req.body.country
            },
            referrer: req.body.ref
        })

        const ref = req.body.ref
        if (ref) {
            const referrer = await User.findOne({ PID: ref })
            referrer.referrals.push(newUser._id)
            referrer.save()
        }

        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
});

router.post('/sendEmail', checkNotAuthenticated, sendEmailValidation, async (req, res) => { //email sending logic (this is ticketUnauth submit)
    const {name, email, subject, message} = req.body
});

router.post('/updateAccountInformation', updateAccountValidation, async (req, res) => {
  
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('account', { errors: errors.array(), data: req.body, form: 'updateAccountInformation' })
    }

    try {
        user.name = req.body.name
        user.address = {
        line1: req.body.line1,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country
        },
        user.tel = req.body.tel

        if (req.files) {
            const userIcon = req.files.userIcon
            await processUserImage(userIcon, user.PID)
            user.hasProfile = true
        }

        await user.save()

    res.redirect('/you')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.post('/updatePaymentInformation', checkAuthenticated, updatePaymentInformationValidation, async (req, res) => {
    
    const user = req.user

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('account', { errors: errors.array(), data: req.body, form: 'updatePaymentInformation' })
    }
    
    try {
        user.payoutMethod = req.body.payoutMethod
        user.paypalEmail = req.body.paypalEmail || null
        user.btcAddress = req.body.btcAddress || null

        await user.save()

        res.redirect('/you')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')  
    }
});

router.post('/updatePassword', checkAuthenticated, updatePasswordValidation, async (req, res) => { //email the user here
    
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

//Short Links
router.get('/:link', async (req, res) => { //complete this
    try {
        const url = await Link.findOne({ short: req.params.link })
        if (url === null) {
            return res.status(404).render('error/404')
        }

        url.clicks++
        url.save()

        res.render('adPage', { url })
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')  
    }
});

router.get('/example', (req, res) => { //set up; redirect to an ad link that redirects to website home page.
    res.render('...')
});

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

//Delete
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