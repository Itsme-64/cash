export function requireAdmin(req, res, next) {
    const ADMIN_EMAILS = process.env.ADMIN_EMAILS.split(',');

    if (!req.user || !ADMIN_EMAILS.includes(req.user.email)) {
        return res.status(403).send('Forbidden');
    }
    next();
}