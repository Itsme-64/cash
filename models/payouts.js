import mongoose from 'mongoose';
import shortId from 'shortid';

const payoutSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        immutable: true
    },
    short: {
        type: String,
        default: shortId.generate,
        required: true,
        immutable: true,
        unique: true
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayoutMethod',
        required: true,
        immutable: true
    }
}, { timestamps: true });

payoutSchema.index(
    { user: 1 }
);

export default mongoose.model('Payout', payoutSchema);