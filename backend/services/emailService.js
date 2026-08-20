const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

/**
 * Sends a simple text email.
 */
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: `"AI Expense Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("Email sending failed:", err.message);
  }
}

module.exports = { sendEmail };