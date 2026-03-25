import mongoose from 'mongoose';

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.status(401).redirect('./login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.status(308).redirect('/operator')
    }
    next()
}

function requireAdmin(req, res, next) {
    const ADMIN_EMAILS = process.env.ADMIN_EMAIL.split(',');
    const ADMIN_USERS = process.env.ADMIN_USER.toLowerCase().split(',');

    if (!req.user || !ADMIN_EMAILS.includes(req.user.email) || !ADMIN_USERS.includes(req.user.username.toLowerCase())) {
        const err = new Error()
        err.status = 403
        return next(err)
    }
    next()
}

async function forceLogoutAll(req, res, userId) {
    const db = mongoose.connection.db

    await db.collection('sessions').deleteMany({
        "session.passport.user": userId.toString()
    })

    req.logout(() => {})
    req.session.destroy(() => {
        res.clearCookie('connect.sid')
        res.redirect('/login')
    })
}

export { checkAuthenticated, checkNotAuthenticated, requireAdmin, forceLogoutAll };