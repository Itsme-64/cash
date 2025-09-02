import mongoose from 'mongoose';
import shortId from 'shortid';

const paymentSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        immutable: true
    },
    paymentID: {
        type: String,
        required: true,
        default: shortId.generate(),
        immutable: true
    },
    amount: {
        type: Number,
        required: true,
        immutable: true,
        min: 10,
        max: 1000
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'rejected'],
        required: true,
        default: 'pending'
    },
    payoutMethod: {
        type: String,
        enum: ['PayPal', 'none'],
        default: 'none',
        required: true,
        immutable: true
    },
    paypalEmail: {
        type: String,
        required: false,
        immutable: true
    },
    completionDate: Date
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);