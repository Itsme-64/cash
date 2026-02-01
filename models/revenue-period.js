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
    },
    applied: {
        type: Boolean,
        default: false,
        required: true
    }, // Below is all calculated during *apply-revenue-period* and only used for analytics
    paidAmount: {
        type: Number
    },
    referralAmount: {
        type: Number
    },
    adminAmount: {
        type: Number
    },
    weightAmount: {
        type: Number
    }
}, { timestamps: true,
     toJSON: { virtuals: true },
     toObject: { virtuals: true } });

revenuePeriodSchema.virtual('payableAmount').get(() => {
    return Math.round(this.amount * 0.80);
});

export default mongoose.model('RevenuePeriod', revenuePeriodSchema);