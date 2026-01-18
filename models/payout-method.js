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
        immutable: true,
        required: true,
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
});

export default mongoose.model('PayoutMethod', payoutMethodSchema);