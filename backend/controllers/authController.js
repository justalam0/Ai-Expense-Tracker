const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTP } = require('../utils/mailer');

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    
    // Generate a 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ error: 'User already exists and is verified' });
      }
      // If user exists but not verified, update OTP and send again
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.name = name;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpires,
        isVerified: false
      });
    }

    try {
      await sendOTP(email, otp);
      res.status(200).json({ message: 'OTP sent to email. Please verify.', email: user.email });
    } catch (mailError) {
      console.error(mailError);
      res.status(500).json({ error: 'Failed to send OTP email' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    if (user.isVerified) return res.status(400).json({ error: 'User already verified' });

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '12h',
    });

    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email first', notVerified: true });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '12h',
    });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
