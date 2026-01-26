function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
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
    const ADMIN_EMAILS = process.env.ADMIN_EMAILS.split(',');

    if (!req.user || !ADMIN_EMAILS.includes(req.user.email)) {
        const err = new Error()
        err.status = 403
        return next(err)
    }
    next();
}

export { checkAuthenticated, checkNotAuthenticated, requireAdmin };