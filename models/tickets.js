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
        immutable: true
    },
    title: {
        type: String,
        required: true,
        immutable: true
    },
    body: {
        type: String,
        required: true,
        immutable: true
    },
    messageHistory: {
        type: [
            {
                message: {
                    type: String,
                    required: true
                },
                date: { 
                    type: Date, 
                    required: true,
                    default: Date.now 
                },
                from: {
                    type: String,
                    enum: ['admin', 'user'],
                    required: true
                }
            }
        ],
        default: []
    },
    status: {
        type: String,
        enum: ['open', 'in progress', 'resolved', 'closed'],
        required: true,
        default: 'open'
    },
    files: {
        type: [String],
        default: []
    }
}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);