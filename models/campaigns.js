import mongoose from 'mongoose';
import shortId from 'shortid';

const campaignSchema = new mongoose.Schema({
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
        unique: true,
        immutable: true
    },
    title: {
        type: String,
        required: true,
        immutable: true
    },
    head: {
        type: String,
        required: true
    },
    endpoint: {
        type: String,
        required: true,
        immutable: true
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'active', 'deactivated', 'removed'],
        required: true,
        default: 'draft'
    },
    business: {
        type: Boolean,
        required: true,
        immutable: true
    },
    type: {
        type: String,
        enum: ['recurring', 'one-time', 'personal'],
        required: true,
        default: 'personal'
    },
    specifications: {
        countries: {
            type: String,
            enum: [],
            default: 'all'
        },
        languages: {
            type: String,
            enum: [],
            default: 'all'
        },
        categories: {
            type: String,
            enum: [],
            default: 'all'
        },
        browser: {
            type: String,
            enum: [],
            default: 'all'
        },
        oss: {
            type: String,
            enum: [],
            default: 'all'
        },
        returning: {
            type: Number,
            default: -1,
        }
    },
    budget: {
        active: {
            type: Number,
            default: 0
        },
        dates: {
            type: String,
            default: new Date
        },
        times: {
            type: String,
            default: "all day"
        },
        daily: {
            type: Number,
            default: 0,
        },
        targetCpm: {
            type: Number,
            default: 1,
        }
    }
}, { timestamps: true });

export default mongoose.model('Campaign', campaignSchema);