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
        required: false,
        immutable: true
    },
    country: {
        type: String,
        required: false,
        immutable: true
    },
    userAgent: {
        type: String,
        required: false,
        immutable: true
    },
    valid: {
        type: Boolean,
        required: true,
        default: false
    }
}, { timestamps: true });

export default mongoose.model('ClickEvent', clickEventSchema);