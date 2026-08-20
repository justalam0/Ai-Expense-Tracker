const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const sendOTP = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'FinTrack - Your OTP Verification Code',
    text: `Your OTP for FinTrack registration is: ${otp}. It is valid for 10 minutes.`,
    html: `<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <h2>Welcome to FinTrack</h2>
      <p>Your OTP verification code is:</p>
      <h1 style="color: #4338ca; letter-spacing: 5px;">${otp}</h1>
      <p>This code is valid for 10 minutes. Do not share it with anyone.</p>
    </div>`
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP };
