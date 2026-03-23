import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const BREVO_USER = process.env.ADMIN_EMAIL
const SMTP_KEY = process.env.BREVO_SMTP
const API_KEY = process.env.BREVO_API

export const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: "a5a682001@smtp-brevo.com",
        pass: "jyPTL16tD2Z80mMY"
    }
});

export function getPasswordMailOptions(user, token) {
    return {
        from: '159.cash <noreply@159.cash>',
        to: user.email,
        subject: 'Password Reset Request | 159.cash',
        html: `Dear ${user.username},<br><br>` +
              `You have submitted a request to reset your password on 159.cash.<br>` +
              `<a href="https://159.cash/password/reset?token=${token.token}" target="_blank">Click here</a> to configure a new password for your account. ` + 
              `This link is valid for 15 minutes<br><br>` +
              `For your information:<br>Username: ${user.username}<br>Time of request: ${new Date()}<br><br>` +
              'If this was not you, please consider changing your password using your existing one <strong>immediately</strong> and contact support.<br><br>' +
              'Sincerely,<br>159.cash Team<br><a href="https://159.cash/" target="_blank">https://159.cash</a>'
    }
}

export function getVerifyMailOptions(user, token) {
    return {
        from: '159.cash <noreply@159.cash>',
        to: user.email,
        subject: 'Verify Your Account | 159.cash',
        html: `Dear ${user.username},<br><br>` +
              `You have recently signed up to 159.cash, please enter the link below to verify your legitimate ownership of this email address.<br>` +
              `<a href="https://159.cash/you/verify?user=${user.username}&token=${token.token}" target="_blank">` +
              `https://159.cash/you/verify?user=${user.username}&token=${token.token}</a><br><br>` +
              'If the link above is not clickable please copy it in whole and paste it into your browser. This link is valid for up to two hours<br>' +
              `For your information:<br>Username: ${user.username}<br>Time of request: ${new Date()}<br><br>` +
              'If this message was not meant for you or you did not request verification, you can safely ignore this email, however please do NOT verify the account.<br><br>' +
              'Sincerely,<br>159.cash Team<br><a href="https://159.cash/" target="_blank">https://159.cash</a>'
    }
}