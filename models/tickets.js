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
        default: shortId.generate,
        required: true,
        immutable: true,
        unique: true
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

// unique: true | On shortID automatically creates an index for it.
ticketSchema.index(
    { user: 1 }
);

export default mongoose.model('Ticket', ticketSchema);