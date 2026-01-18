import mongoose from 'mongoose';
import shortId from 'shortid';

const ticketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        immutable: true
    },
    shortID: {
        type: String,
        required: true,
        default: shortId.generate(),
        unique: true,
        immutable: true
    },
    title: {
        type: String,
        required: true,
        immutable: true
    },
    status: {
        type: String,
        enum: ['open', 'in progress', 'resolved', 'closed'],
        required: true,
        default: 'open'
    },
    body: {
        type: String,
        required: true,
        immutable: true
    },
    files: {
        type: Number,
        default: 0,
        min: 0,
        max: 6
    },
    messageHistory: {
        type: [
            {
                message: {
                    type: String,
                    required: true
                },
                from: {
                    type: String,
                    enum: ['admin', 'user'],
                    required: true
                },
                date: { 
                    type: Date, 
                    required: true,
                    default: Date.now 
                }
            }
        ],
        default: []
    }
}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);