import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
dotenv.config();

const URI = process.env.URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

function setupSession(app) {
    app.use(session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: URI,
            collectionName: 'sessions'
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            secure: false // must be false for localhost/HTTP
        }
    }));
}

export default setupSession;