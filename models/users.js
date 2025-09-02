import mongoose from 'mongoose';
import crypto from 'crypto';
import Link from './links.js';
import Payment from './payments.js';

const userSchema = new mongoose.Schema({
    PID: {
        type: String,
        required: true,
        default: crypto.randomBytes(12).toString('hex'),
        immutable: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        immutable: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        immutable: true
    },
    verified: {
        type: Boolean,
        required: true,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: false
    },
    address: {
        line1: String,
        line2: String,
        city: String,
        zip: String,
        country: String
    },
    tel: {
        type: String,
        required: false
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    earnings: {
        type: Number,
        required: false,
        default: 0
    },
    balance: {
        type: Number,
        required: false,
        default: 0,
        min: 0
    },
    clicks: {
        type: Number,
        required: false,
        default: 0,
        min: 0
    },
    premium: {
        type: Boolean,
        default: false
    },
    autoPayouts: {
        type: Boolean,
        default: false
    },
    links: {
        type: [String],
        default: []
    },
    tickets: {
        type: [String],
        default: []
    },
    paymentHistory: {
        type: [String],
        default: []
    },
    payoutMethod: {
        type: String,
        enum: ['PayPal', 'none'],
        default: 'none'
    },
    paymentMethod: {
        type: String,
        enum: ['balance', 'PayPal', 'none'],
        default: 'none'
    },
    paypalEmail: {
        type: String,
        required: false,
        lowercase: true
    },
    referrals: {
        type: [String],
        default: []
    },
    referrer: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

userSchema.methods.updateEarningsBalance = async function () {
    const links = await Link.find({ user: this._id })
    const payments = await Payment.find({ user: this._id })
    let earnings = 0
    let paid = 0

    for (let i = 0; i < links.length; i++) {
        earnings += links[i].earnings || 0
    }
    for (let i = 0; i < payments.length; i++) {
        paid += payments[i].amount || 0
    }

    this.earnings = earnings
    this.balance = earnings - paid
    await this.save()
}

export default mongoose.model('User', userSchema);