import { body, query } from 'express-validator';
import { validate as validateBtc, getAddressInfo } from 'bitcoin-address-validation';
import User from '../models/users.js';

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

export const paymentValidation = [
    body('amount')
        .custom(async (value, { req }) => {
            const user = req.user;
            if (!user || !user.verified || !user.name || !user.address.line1 || !user.address.city || !user.address.zip || !user.address.country || user.balance < 10) {
                throw new Error('You do not meet all requirements to request payment');
            }
            return true
        })
        .notEmpty().withMessage('Payment amount must be a number between 10 and 1000')
        .isInt({ min: 10, max: 1000 }).withMessage('Payment amount must be a number between 10 and 1000')
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
            const existingUser = await User.findOne({ email });
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

export const sendEmailValidation = [
    body('name').notEmpty().escape().withMessage('Name cannot be empty'),
    body('email')
        .notEmpty().withMessage('Email cannot be empty')
        .isEmail().withMessage('Email address is invalid')
        .normalizeEmail(),
    body('subject').notEmpty().escape().withMessage('Subject cannot be empty'),
    body('message').notEmpty().escape().withMessage('Message cannot be empty')
];

export const updateAccountValidation = [
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

export const updatePaymentInformationValidation = [
    body('payoutMethod')
        .custom((payoutMethod) => {
            if (payoutMethod != "PayPal" && payoutMethod != "Bitcoin") {
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

export const updatePasswordValidation = [
    body('newPassword')
        .notEmpty().withMessage('New password cannot be empty')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('newPasswordVerification')
        .notEmpty().withMessage('Password verification cannot be empty')
        .isLength({ min: 8 }).withMessage('Password verification must be at least 8 characters')
];