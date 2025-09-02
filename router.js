import express from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import Link from './models/links.js';
import User from './models/users.js';
import Payment from './models/payments.js';
import Ticket from './models/tickets.js';
import { validationResult } from 'express-validator';
import { checkAuthenticated, checkNotAuthenticated } from './middleware/auth.js';
import { newLinkValidation, paymentValidation, ticketValidation, loginValidation, registerValidation, sendEmailValidation, updateAccountValidation } from './middleware/validation.js';
const router = express.Router(); // validate post requests, add minimum character visualization

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
        const user = req.user;
        const links = await Link.find({ user: user._id })
        
        res.render('createNewLink', { links })
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.get('/operator', checkAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const links = await Link.find({ user: user._id })

        res.render('dashboard', { links })
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.get('/payment', checkAuthenticated, async (req, res) => {
    try {
        const user = req.user
        const payments = await Payment.find({ user: user._id })

        const paymentsEnabled =
            user.verified &&
            user.name &&
            user.address &&
            user.address.line1 &&
            user.address.city &&
            user.address.zip &&
            user.address.country &&
            user.balance >= 10;

        res.render('payments', { payments, paymentsEnabled })
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.get('/referral', checkAuthenticated, async (req, res) => {
    try {
        const user = req.user
        const referralAccounts = await User.find({ _id: { $in: user.referrals } })

        const referralAmount = referralAccounts.length;

        let totalReferralClicks = referralAccounts.reduce((sum, account) => {
            return sum + (account.clicks || 0)
        }, 0)

        let totalReferralEarnings = referralAccounts.reduce((sum, account) => {
            return sum + (account.earnings || 0)
        }, 0)

        totalReferralEarnings = (totalReferralEarnings / 10).toFixed(2)

        let referralDifference = referralAccounts.forEach((referralAccount) => {
            if(referralAccount.createdAt + 2629800000 >= Date.now()) {
                referralDifference++
            }
        })

        res.render('referrals', { referrals: referralAccounts, referralAmount, totalReferralClicks, totalReferralEarnings, referralDifference })
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

        res.render('tickets', { tickets })
        } catch (err) {
            console.error(err)
            res.status(500).send('Server error')
        }
    } else {
        res.render('ticketsUnauth')
    }
});

router.get('/you', checkAuthenticated, (req, res) => {
    res.render('account')
});

//User
router.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('user/login')
});

router.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('user/register')
});

router.get('/tos', (req, res) => {
    res.render('user/termsOfService')
});

router.get('/privacy', (req, res) => {
    res.render('user/privacyPolicy')
});

//Errors
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
router.post('/createNew', checkAuthenticated, newLinkValidation, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        const link = await Link.create({
            user: user._id,
            full: req.body.singleLink,
            monetization: req.body.monetization,
            duration: req.body.monetizationDuration
        })

        user.links.push(link._id);
        await user.save();

        res.redirect('/new')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
});

router.post('/payment', checkAuthenticated, paymentValidation, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        
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
    try {
        const user = await User.findById(req.user._id)

        const ticket = await Ticket.create({
            user: user._id,
            title: req.body.ticketTitle,
            body: req.body.ticketBody
        })

        user.tickets.push(ticket._id);
        await user.save();

        res.redirect('/ticket')
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
        await User.create({
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
        })
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
});

router.post('/sendEmail', checkNotAuthenticated, sendEmailValidation, async (req, res) => { //email sending logic
    const {name, email, subject, message} = req.body
});

router.post('/updateAccountInformation', checkAuthenticated, updateAccountValidation, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    user.name = req.body.name,
    user.address = {
      line1: req.body.line1,
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
    },
    user.tel = req.body.tel

    await user.save()

    res.redirect('/account')
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
});

router.post('/updatePaymentInformation', checkAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        user.payoutMethod = req.body.payoutMethod,
        user.paypalEmail = req.body.paypalEmail,

        await user.save()

        res.redirect('/account')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')  
    }
});

router.post('/updatePassword', checkAuthenticated, async (req, res) => { //email the user here
    try {
        const user = await User.findById(req.user._id)

        const isMatch = await bcrypt.compare(req.body.password, user.password)
        if (isMatch && req.body.newPassword === req.body.newPasswordVerification) {
            const newHashedPassword = await bcrypt.hash(req.body.newPassword, 10)
            user.password = newHashedPassword

            await user.save()
        } else {
            return res.status(400).send('Password was incorrect or new passwords do not match')
        }

        res.redirect('/account')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')  
    }
});

router.post('updateAutomaticPayouts', checkAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        user.autoPayouts = req.body.autoPayouts ? true : false;

        await user.save()

        res.redirect('/account')
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

router.get('/example', (req, res) => { //set up
    res.render('adPage')
});

router.get('/tickets/:link', checkAuthenticated, async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ shortID: req.params.link })
        const user = await User.findById(req.user._id)

        if (ticket === null) {
            return res.status(404).render('error/404')
        }
        if (!user.tickets.includes(ticket._id.toString())) {
            return res.status(403).render('error/403')
        }

        res.render('ticket', { ticket })
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