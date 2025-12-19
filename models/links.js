import mongoose from 'mongoose';
import shortId from 'shortid';

const linkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        immutable: true
    },
    full: {
        type: String,
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
    clicks: {
        type: Number,
        required: true,
        default: 0,
        min: 0
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
    earnings: {
        type: Number,
        required: false,
        default: 0,
        min: 0
    }
}, { timestamps: true });



export default mongoose.model('Link', linkSchema);