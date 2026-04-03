import { body, query } from 'express-validator';
import { validate as validateBtc, getAddressInfo } from 'bitcoin-address-validation';
import User from '../models/users.js';
import Token from '../models/tokens.js'
import UserInfo from '../models/users-info.js';

export const newLinkValidation = [
    body('singleLink')
        .optional({ checkFalsy: true })
        .isURL().withMessage('Your link must be a valid URL type')
        .trim(),
        body('bulkLinks')
        .optional({ checkFalsy: true })
        .customSanitizer(value => {
            if (!value) return [];
            return value
            .split(/\r?\n/)
            .map(link => link.trim())
            .filter(link => link.length > 0);
        })
        .custom(links => {
            if (!Array.isArray(links)) {
                throw new Error("Invalid link data");
            }
            for (let link of links) {
                try {
                    new URL(link);
                } catch {
                    throw new Error(`Invalid URL: ${link}`);
                }
            }
            return true;
        }),
    body('monetization').toBoolean().optional({ checkFalsy: true }),
    body('monetizationDuration')
        .notEmpty().withMessage('Ad duration cannot be empty')
        .isInt({ min: 5000, max: 15000 }).withMessage('Ad duration must be a number between 5000 and 15000'),
    body('redirectInstantly').toBoolean().optional({ checkFalsy: true})
];

export const payoutValidation = [
    body('amount')
        .custom(async (value, { req }) => {
            const user = req.user;
            const userInfoThis = await UserInfo.findOne({ user: user._id });

            if (!user || !user.verified || !userInfoThis || !userInfoThis.name || !userInfoThis.address.line1 || !userInfoThis.address.city ||
                !userInfoThis.address.zip || !userInfoThis.address.country || user.balance < 10) {
                throw new Error('You do not meet all requirements to request payout');
            }
            
            return true
        })
        .notEmpty().withMessage('Payout amount must be a number between 10 and 1000')
        .isInt({ min: 10, max: 1000 }).withMessage('Payout amount must be a number between 10 and 1000')
];

export const ticketValidation = [
    body('ticketTitle').notEmpty().withMessage('Ticket title cannot be empty').escape(),
    body('ticketBody').notEmpty().withMessage('Ticket body cannot be empty').escape(),
    body("documents")
        .optional({ checkFalsy: true })
        .custom((value, { req }) => {
            const files = req.files?.documents;
            if (!files) {
                throw new Error("No files uploaded");
            }
            const fileArray = Array.isArray(files) ? files : [files];
            if (fileArray.length > 6) {
                throw new Error("Too many files (max 6)");
            }
            for (const file of fileArray) {
                if (file.size > 12 * 1024 * 1024) {
                    throw new Error(`${file.name} is too large (max 12MB)`);
                }
                if (
                    !["image/jpeg", "image/png", "application/pdf"].includes(file.mimetype)
                ) {
                    throw new Error(
                        `${file.name} has invalid type (must be JPG, PNG, or PDF)`
                    );
                }
            }
            return true;
        })
];

export const ticketMessageValidation = [
    body('messageBody').notEmpty().withMessage('Ticket message cannot be empty').escape()
];

export const loginValidation = [
    body('email')
        .notEmpty().withMessage('Email cannot be empty')
        .isEmail().withMessage('Email address is invalid')
        .normalizeEmail(),
    body('password').notEmpty().withMessage('Password cannot be empty')
];

export const registerValidation = [
    body('username')
        .notEmpty().withMessage('Username cannot be empty')
        .escape()
        .isLength({ min: 4 }).withMessage('Username must be at least 4 characters')
        .custom(async (username) => {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                throw new Error('Username is already in use');
            }
            return true;
        }),
    body('email')
        .notEmpty().withMessage('Email cannot be empty')
        .isEmail().withMessage('Email address is invalid')
        .normalizeEmail()
        .custom(async (email) => {
            const existingUser = await User.findOne({ email: email, status: true });
            if (existingUser) {
                throw new Error('Email is already in use');
            }
            return true;
        }),
    body('password')
        .notEmpty().withMessage('Password cannot be empty')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').optional({ checkFalsy: true }).escape(),
    body('address.line1').optional({ checkFalsy: true }).escape(),
    body('address.line2').optional({ checkFalsy: true }).escape(),
    body('city').optional({ checkFalsy: true }).escape(),
    body('zip').optional({ checkFalsy: true }).escape(),
    body('country').optional({ checkFalsy: true }).escape()
];

export const ticketSendValidation = [
    body('name').notEmpty().escape().withMessage('Name cannot be empty'),
    body('email')
        .notEmpty().withMessage('Email cannot be empty')
        .isEmail().withMessage('Email address is invalid')
        .normalizeEmail(),
    body('subject').notEmpty().escape().withMessage('Subject cannot be empty'),
    body('message').notEmpty().escape().withMessage('Message cannot be empty')
];

export const accountUpdateValidation = [
    body('name').optional({ checkFalsy: true }).escape(),
    body('address.line1').optional({ checkFalsy: true }).escape(),
    body('address.line2').optional({ checkFalsy: true }).escape(),
    body('city').optional({ checkFalsy: true }).escape(),
    body('zip').optional({ checkFalsy: true }).escape(),
    body('country').optional({ checkFalsy: true }).escape(),
    body('tel').optional({ checkFalsy: true }).isMobilePhone(),
    body("userIcon")
        .optional({ checkFalsy: true })
        .custom((value, { req }) => {
            const file = req.files?.userIcon;
            if (!file) {
                    throw new Error("No file uploaded");
                }
                if (file.size > 8 * 1024 * 1024) {
                    throw new Error("File too large (max 8MB)");
                }
                if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
                    throw new Error("Invalid file type (must be JPG, PNG, or WEBP)");
                }
                return true;
            }),
];

export const accountPayoutValidation = [
    body('payoutMethod')
        .custom((payoutMethod) => {
            if (payoutMethod.toLowerCase() != "paypal" && payoutMethod.toLowerCase() != "btc") {
                throw new Error('Payout method is invalid');
            } else {
                return true;
            }
        }),
    body('paypalEmail')
        .optional({ checkFalsy: true })
        .isEmail().withMessage('Email address is invalid')
        .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
    body('btcAddress')
        .optional({ checkFalsy: true })
        .custom((value) => {
            if (!validateBtc(value)) {
                throw new Error('Bitcoin address format invalid');
            }
            return true;
        })
        .custom((value, { req }) => {
            const info = getAddressInfo(value);
            if (info.network !== 'mainnet') {
                throw new Error('Bitcoin address must be a mainnet address');
            }
            return true;
        })
];

export const accountPasswordValidation = [
    body('newPassword')
        .notEmpty().withMessage('New password cannot be empty')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('newPasswordVerification')
        .notEmpty().withMessage('Password verification cannot be empty')
        .isLength({ min: 8 }).withMessage('Password verification must be at least 8 characters')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) throw new Error('Passwords do not match')
            return true;
        })
];

export const passwordForgottenValidation = [
    body('email')
        .notEmpty().withMessage('Email cannot be empty')
        .isEmail().withMessage('Email address is invalid')
        .normalizeEmail()
        .custom(async (email) => {
            const existingUser = await User.findOne({ email: email, status: true });
            if (!existingUser) {
                throw new Error('Email is not in use');
            }
            return true;
        })
];

export const passwordResetValidation = [
    body('newPassword')
        .notEmpty().withMessage('New password cannot be empty')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('newPasswordVerification')
        .notEmpty().withMessage('Password verification cannot be empty')
        .isLength({ min: 8 }).withMessage('Password verification must be at least 8 characters')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) throw new Error('Passwords do not match')
            return true;
        }),
    query('token')
        .notEmpty().withMessage('No valid token, make sure you copy the link from your password reset email correctly')
        .custom(async (value) => {
            const token = await Token.findOne({ token: value })
                
            let expirationDate = new Date()
            expirationDate = expirationDate.setMinutes(expirationDate.getMinutes() - 15)

            if (!token) throw new Error('Your token is not valid or may be outdated')
            if (token.type !== 'password') throw new Error('This token was not made for resetting your password, silly!')
            if (token.createdAt < expirationDate) throw new Error('Your token has expired, request a new one and make sure to complete within 15 minutes')

            return true;
        })
];

export const userVerificationValidation = [
    query('user')
        .notEmpty().withMessage('No valid user, make sure you copy the link from your password reset email correctly'),
    query('token')
        .notEmpty().withMessage('No valid token, make sure you copy the link from your password reset email correctly')
        .custom(async (value, { req }) => {
            const token = await Token.findOne({ token: value })
                
            let expirationDate = new Date()
            expirationDate = expirationDate.setHours(expirationDate.getHours() - 2)

            if (!token) throw new Error('Your token is not valid or may be outdated')
            if (token.type !== 'verify') throw new Error('This token was not made for account verification, silly!')
            if (token.createdAt < expirationDate) throw new Error('Your token has expired, request a new one and make sure to complete within 15 minutes')

            const tokenUser = await User.findById(token.user)
            if (!tokenUser) throw new Error('Token is not linked to a valid user account')
            if (req.query.user.toLowerCase() != tokenUser.username.toLowerCase()) throw new Error('Token is not linked to this account')

            return true;
        })
];

export const tokenRateLimitVerification = [
    body()
        .custom(async (value, { req }) => {
            const email = req.body.email

            const user = email ? await User.findOne({ email: email }) : req.user
            if (!user) throw new Error('No valid user to submit request')

            let limitDate = new Date()
            limitDate = limitDate.setMinutes(limitDate.getMinutes() - 15)

            const tokens = await Token.find({ user: user._id, createdAt: { $gt: limitDate } })

            if (tokens.length > 0) throw new Error(
                'Please wait up to 15 minutes in between sending requests, if you have not recieved an email make sure to check your SPAM folder'
            )

            return true
        })
];

export const campaignValidation = [
    body('title').notEmpty().escape().withMessage('Campaign title cannot be empty'),
    body('header').notEmpty().escape().withMessage('Campaign header cannot be empty'),
    body('endpoint')
        .notEmpty().withMessage('Campaign endpoint cannot be empty')
        .isURL().withMessage('Campaign endpoint must be a valid URL')
        .trim()
];

export const campaignUpdateValidation = [

];