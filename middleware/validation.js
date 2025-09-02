import { body, query } from 'express-validator';
import User from '../models/users.js';

export const newLinkValidation = [
    body('singleLink')
        .notEmpty().withMessage('Your input URL cannot be empty')
        .isURL().withMessage('Your link must be a valid URL type')
        .trim(),
    body('monetization').toBoolean().optional({ checkFalsy: true }),
    body('duration')
        .notEmpty().withMessage('Ad duration cannot be empty')
        .isInt({ min: 5000, max: 15000 }).withMessage('Ad duration must be a number between 5000 and 15000')
];

export const paymentValidation = body('amount')
                                     .notEmpty().withMessage('Payment amount must be a number between 10 and 1000')
                                     .isInt({ min: 10, max: 1000 }).withMessage('Payment amount must be a number between 10 and 1000');

export const ticketValidation = [
    body('ticketTitle').notEmpty().withMessage('Ticket title cannot be empty').escape(),
    body('ticketBody').notEmpty().withMessage('Ticket body cannot be empty').escape()
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
    body('tel').optional({ checkFalsy: true }).isMobilePhone()
]