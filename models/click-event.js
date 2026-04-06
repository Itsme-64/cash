import mongoose from 'mongoose';

const clickEventSchema = new mongoose.Schema({
    link: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Link',
        required: true,
        immutable: true
    },
    ip: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: false
    },
    language: {
        type: String,
        required: false
    },
    browser: {
        type: String,
        required: false
    },
    os: {
        type: String,
        required: false
    },
    valid: {
        type: Boolean,
        required: true,
        default: false
    }
}, { timestamps: true });

clickEventSchema.index(
    { createdAt: 1 }
);

clickEventSchema.index(
    { link: 1 },
    { createdAt: 1 }
);

export default mongoose.model('ClickEvent', clickEventSchema);