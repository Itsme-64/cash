import mongoose from 'mongoose';

const userInfoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: false
    },
    address: {
        line1: String,
        line2: String,
        city: String,
        zip: String,
        country: String
    },
    tel: {
        type: String,
        required: false
    },
    hasProfile: {
        type: Boolean,
        required: true,
        default: false
    }
});

export default mongoose.model('UserInfo', userInfoSchema);