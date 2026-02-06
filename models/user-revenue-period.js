import mongoose from 'mongoose';

const userRevenuePeriodSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    period: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RevenuePeriod',
        required: true,
        immutable: true
    },
    userIncome: {
        type: Number,
        default: 0,
        required: true,
        immutable: true
    },
});

userRevenuePeriodSchema.virtual('referrerIncome').get(() => {
    Math.round(this.userIncome * 0.10)   
});

userRevenuePeriodSchema.index(
    { user: 1 }
);

userRevenuePeriodSchema.index(
    { period: 1 }
);


export default mongoose.model('UserRevenuePeriod', userRevenuePeriodSchema);