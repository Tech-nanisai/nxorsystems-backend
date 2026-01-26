const nodemailer = require('nodemailer');
require('dotenv').config();

const sendForgotPasswordEmail = async (email, resetToken, fullName) => {
    try {
        // OPTION 1: GMAIL (Legacy/Backup - Commented Out)
        /*
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS, // App Password
            },
        });
        */

        // OPTION 2: BREVO / GENERIC SMTP (Startup Recommended)
        console.log(`Attempting email via Brevo. User: ${process.env.MAIL_USER}`);

        const transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false, // Must be false for 587
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            tls: {
                ciphers: 'SSLv3', // Help with some network restrictions
                rejectUnauthorized: false
            }
        });

        const resetLink = `http://localhost:5173/client/reset-password/${resetToken}`;

        const mailOptions = {
            from: `"NXOR Systems" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #2563eb;">NXOR Systems</h2>
            </div>
            <p>Hi ${fullName},</p>
            <p>We received a request to reset the password for your account.</p>
            <p>Please click the button below to secure and reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>This link is valid for <strong>15 minutes</strong>.</p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} NXOR Systems. All rights reserved.</p>
        </div>
        `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Forgot Password Email sent: " + info.response);
        return true;

    } catch (error) {
        console.error("Error sending forgot password email:", error);
        return false;
    }
};

module.exports = sendForgotPasswordEmail;
