import bcrypt from 'bcrypt';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/users.js';

function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
        const user = await User.findOne({ email })
        if (user == null) {
            return done(null, false, { message: "No user with that email"})
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: "Password incorrect"})
            }
        } catch(err) {
            return done(err)
        }
    }
    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => done(null, user._id))
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id)
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}

export default initialize;