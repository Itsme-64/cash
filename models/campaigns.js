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
    name: {
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
        default: false
    },
    business: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['recurring', 'one-time'],
        required: true,
    },
    specifications: { // Geolocation, language, categories, device, operating system, time scheduling, returning users value (<- enums) 
        
    },
    budget: { // Active balance (ready to spend), set balance (target amount (per ?week, ?month, etc)), timespan (set of dates), target cpm / cost per click, 

    }
}, { timestamps: true });

export default mongoose.model('Campaign', campaignSchema);