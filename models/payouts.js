import mongoose from 'mongoose';
import shortId from 'shortid';

const payoutSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        immutable: true
    },
    payoutID: {
        type: String,
        required: true,
        default: shortId.generate(),
        unique: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: true,
        immutable: true,
        min: 1000,
        max: 100000
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