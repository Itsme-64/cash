function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('./login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/operator')
    }
    next()
}

function requireAdmin(req, res, next) {
    const ADMIN_EMAILS = process.env.ADMIN_EMAILS.split(',');

    if (!req.user || !ADMIN_EMAILS.includes(req.user.email)) {
        return res.status(403).send('Forbidden');
    }
    next();
}

export { checkAuthenticated, checkNotAuthenticated, requireAdmin };