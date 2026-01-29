import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import passport from 'passport';
import flash from 'express-flash';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import pages from './router.js';
import adminPages from './router.admin.js';
import { registerJobs } from './jobs/time-is-money.js';
import initializePassport from './middleware/passport-config.js';
import setupSession from './middleware/session.js';
import { errorHandler, notFound } from './middleware/error.js';
import User from './models/users.js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT;
const URI = process.env.URI;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

setupSession(app);

mongoose.connect(URI)
  .then(() => {
    console.log('MongoDB connected');

    initializePassport(
      passport,
      email => User.findOne({ email }),
      id => User.findOne({ _id: id })
    );
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.set('views', 'overviews');
app.set('trust proxy', true);

app.use('/src', express.static(path.join(__dirname, 'assets', 'src')));
app.use('/public', express.static(path.join(__dirname, 'node_modules')));
app.locals.ejs = { root: path.join(__dirname, 'overviews') };

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(cookieParser());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use('/admin/', adminPages);
app.use('/', pages);
app.use(errorHandler);
app.use(notFound);

app.listen(PORT, () => console.log(`Server Running on port ${PORT}`));

registerJobs();