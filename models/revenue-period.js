import mongoose from 'mongoose';

const revenuePeriodSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        immutable: true
    },
    fromDate: {
        type: Date,
        required: true,
        immutable: true
    },
    toDate: {
        type: Date,
        required: true,
        immutable: true
    }
}, { timestamps: true });

export default mongoose.model('RevenuePeriod', revenuePeriodSchema);