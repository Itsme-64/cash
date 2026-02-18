import mongoose from 'mongoose';

const payoutMethodSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    type: {
        type: String,
        enum: ["paypal", "btc"],
    },
    details: {
        email: {
            type: String,
            immutable: true
        },
        btcAddress: {
            type: String,
            immutable: true
        },
    },
}, { timestamps: true });

payoutMethodSchema.index(
    { user: 1 }
);

export default mongoose.model('PayoutMethod', payoutMethodSchema);