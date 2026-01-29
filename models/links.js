import mongoose from 'mongoose';
import shortId from 'shortid';

const linkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        immutable: true
    },
    short: {
        type: String,
        required: true,
        default: shortId.generate(),
        unique: true,
        immutable: true
    },
    full: {
        type: String,
        required: true,
        immutable: true
    },
    monetization: {
        type: Boolean,
        required: true,
        immutable: true
    },
    duration: {
        type: Number,
        required: false,
        default: 10000,
        immutable: true,
        min: 5000,
        max: 15000
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    redirectInstantly: {
        type: Boolean,
        required: true,
        default: false
    },
    earned: {
        type: Number,
        default: 0
    }
}, { timestamps: true,
     toJSON: { virtuals: true },
     toObject: { virtuals: true } });

linkSchema.virtual('weight').get(() => {
    if (this.monetization == false) return 0;

    let weight = 1000 * Math.pow((this.duration / 10000), 0.25);
    if (!this.redirectInstantly) weight = weight * 1.25;

    return Math.round(weight);
})

export default mongoose.model('Link', linkSchema);