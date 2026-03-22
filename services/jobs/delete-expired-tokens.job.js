import Token from '../../models/tokens.js';

export async function deleteExpiredTokens() {
    const now = new Date()

    const verifyDate = now.setHours(now.getHours() - 2)
    const passwordDate = now.setMinutes(now.getMinutes() - 15)

    Token.deleteMany({ type: 'verify', createdAt: { $lt: verifyDate } })
    Token.deleteMany({ type: 'password', createdAt: { $lt: passwordDate } })
}