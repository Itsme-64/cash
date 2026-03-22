import mongoose from 'mongoose';
import crypto from 'crypto';

const tokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        default: () => crypto.randomBytes(32).toString('hex'),
        immutable: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['verify', 'password']
    }
}, { timestamps: true });

tokenSchema.index(
    { type: 1, createdAt: 1 }
);

export default mongoose.model('Token', tokenSchema);