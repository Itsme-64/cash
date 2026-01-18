import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    PID: {
        type: String,
        required: true,
        default: crypto.randomBytes(6).toString('hex'), 
        immutable: true,
        unique: true
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
    password: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        required: true,
        default: false
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    balancePending: {
        type: Number,
        required: false,
        default: 0,
        min: 0
    },
    balance: {
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
    referrer: {
        type: String,
        required: false
    },
}, { timestamps: true });

export default mongoose.model('User', userSchema);