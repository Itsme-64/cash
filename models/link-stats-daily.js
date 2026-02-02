import mongoose from 'mongoose';

const linkStatsDailySchema = new mongoose.Schema({
    link: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Link',
        required: true,
        immutable: true
    },
    date: {
        type: Date,
        required: true,
        immutable: true
    },
    clicks: {
        type: Number,
        default: 0,
        required: true
    },
    clickWeight: {
        type: Number,
        default: 0,
        required: true
    }
});

export default mongoose.model('LinkStatsDaily', linkStatsDailySchema);