import mongoose from 'mongoose';

const userRevenuePeriodSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    revenuePeriod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RevenuePeriod',
        required: true,
        immutable: true
    },
    userIncome: {
        type: Number,
        default: 0,
        required: true,
        immutable: true
    },
    referrerIncome: {
        type: Number,
        default: 0,
        required: true,
        immutable: true
    }
})

export default mongoose.model('UserRevenuePeriod', userRevenuePeriodSchema);