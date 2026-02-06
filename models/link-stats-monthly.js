import mongoose from 'mongoose';

const linkStatsMonthlySchema = new mongoose.Schema({
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
    }
});

linkStatsMonthlySchema.index(
    { link: 1 }
);

export default mongoose.model('LinkStatsMonthly', linkStatsMonthlySchema);