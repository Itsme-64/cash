import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const BREVO_USER = process.env.BREVO_USER
const BREVO_PASS = process.env.BREVO_PASS

export const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 2525,
    secure: false,
    auth: {
        user: BREVO_USER,
        pass: BREVO_PASS
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

export function getDeletedMailOptions(user) {
    return {
        from: '159.cash <noreply@159.cash>',
        to: user.email,
        subject: 'Account Deleted Successfully | 159.cash',
        html: `Dear ${user.username},<br><br>` +
              'Your account on <strong>159.cash</strong> has been successfully deleted, we are sorry to see you go, yet thankful you chose to work with us in the past.<br>' +
              'If you did not intend to delete your account or these actions were not performed by yourself, <strong>please contact support</strong>.<br><br>' +
              'Do not forget that we are happy to welcome your back to our platform if you ever should want to return :)<br>' +
              'Sincerely,<br>159.cash Team<br><a href="https://159.cash/" target="_blank">https://159.cash</a>'
    }
}

export function getPasswordChangedMailOptions(user) {
    return {
        from: '159.cash <noreply@159.cash>',
        to: user.email,
        subject: 'Password Changed Successfully | 159.cash',
        html: `Dear ${user.username},<br><br>` +
              'Your password on <strong>159.cash</strong> has been successfully changed, thanks for helping us keep your account secure!<br>' +
              'If you did not intend to change your password or these actions were not performed by yourself, <strong>please contact support</strong>.<br>' +
              `For your information the time of password change: ${new Date()}<br><br>` +
              'Sincerely,<br>159.cash Team<br><a href="https://159.cash/" target="_blank">https://159.cash</a>'
    }
}