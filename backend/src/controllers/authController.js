const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/database');
const { generateOTP, hashOTP, verifyOTP } = require('../utils/otpGenerator');
const { sendOTPSMS } = require('../utils/smsService');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setCookies,
  clearCookies,
} = require('../utils/jwtHelper');

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 3;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000;
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const issueTokens = async (res, user) => {
  const payload = { userId: user.id, phone: user.phone, role: user.role || 'user' };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await query('DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()', [user.id]);
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, hashToken(refreshToken), new Date(Date.now() + REFRESH_EXPIRY_MS)]
  );

  setCookies(res, accessToken, refreshToken);
  return { id: user.id, phone: user.phone, fullName: user.full_name, email: user.email, role: user.role || 'user' };
};

const sendRegistrationOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const existing = await query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    await query(
      "UPDATE otps SET is_used = TRUE WHERE phone = $1 AND purpose = 'register' AND is_used = FALSE",
      [phone]
    );

    const otp = generateOTP();
    await query(
      'INSERT INTO otps (phone, otp_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [phone, await hashOTP(otp), 'register', new Date(Date.now() + OTP_EXPIRY_MS)]
    );

    await sendOTPSMS(phone, otp);
    res.json({ success: true, message: 'OTP sent successfully. Valid for 5 minutes.' });
  } catch (err) {
    console.error('sendRegistrationOTP:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

const register = async (req, res) => {
  try {
    const { phone, password, fullName, email, otp } = req.body;

    const otpRow = await query(
      "SELECT * FROM otps WHERE phone=$1 AND purpose='register' AND is_used=FALSE AND expires_at>NOW() ORDER BY created_at DESC LIMIT 1",
      [phone]
    );

    if (!otpRow.rows.length) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested. Please resend.' });
    }

    const record = otpRow.rows[0];
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await query('UPDATE otps SET is_used=TRUE WHERE id=$1', [record.id]);
      return res.status(400).json({ success: false, message: 'Too many OTP attempts. Please request a new OTP.' });
    }

    if (!(await verifyOTP(otp, record.otp_hash))) {
      await query('UPDATE otps SET attempts=attempts+1 WHERE id=$1', [record.id]);
      const left = MAX_OTP_ATTEMPTS - record.attempts - 1;
      return res.status(400).json({ success: false, message: `Invalid OTP. ${left} attempt(s) remaining.` });
    }

    await query('UPDATE otps SET is_used=TRUE WHERE id=$1', [record.id]);

    const result = await query(
      'INSERT INTO users (phone, password_hash, full_name, email, is_phone_verified) VALUES ($1,$2,$3,$4,TRUE) RETURNING *',
      [phone, await bcrypt.hash(password, 12), fullName, email || null]
    );

    const userData = await issueTokens(res, result.rows[0]);
    res.status(201).json({ success: true, message: 'Registration successful', user: userData });
  } catch (err) {
    console.error('register:', err);
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Phone or email already exists' });
    }
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const result = await query('SELECT * FROM users WHERE phone=$1 AND is_active=TRUE', [phone]);
    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid phone or password' });
    }

    const user = result.rows[0];

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(user.locked_until) - Date.now()) / 60000);
      return res.status(423).json({ success: false, message: `Account locked. Try again in ${mins} minute(s).` });
    }

    if (!(await bcrypt.compare(password, user.password_hash))) {
      const attempts = user.failed_login_attempts + 1;
      const isLocked = attempts >= MAX_LOGIN_ATTEMPTS;
      await query(
        'UPDATE users SET failed_login_attempts=$1, locked_until=$2 WHERE id=$3',
        [attempts, isLocked ? new Date(Date.now() + LOCK_DURATION_MS) : null, user.id]
      );
      const msg = isLocked
        ? 'Account locked for 30 minutes due to repeated failed attempts.'
        : `Invalid phone or password. ${MAX_LOGIN_ATTEMPTS - attempts} attempt(s) remaining.`;
      return res.status(isLocked ? 423 : 401).json({ success: false, message: msg });
    }

    await query(
      'UPDATE users SET failed_login_attempts=0, locked_until=NULL, updated_at=NOW() WHERE id=$1',
      [user.id]
    );

    const userData = await issueTokens(res, user);
    res.json({ success: true, message: 'Login successful', user: userData });
  } catch (err) {
    console.error('login:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const userResult = await query('SELECT id FROM users WHERE phone=$1 AND is_active=TRUE', [phone]);

    if (userResult.rows.length > 0) {
      await query(
        "UPDATE otps SET is_used=TRUE WHERE phone=$1 AND purpose='forgot_password' AND is_used=FALSE",
        [phone]
      );
      const otp = generateOTP();
      await query(
        'INSERT INTO otps (phone, otp_hash, purpose, expires_at) VALUES ($1,$2,$3,$4)',
        [phone, await hashOTP(otp), 'forgot_password', new Date(Date.now() + OTP_EXPIRY_MS)]
      );
      await sendOTPSMS(phone, otp);
    }

    res.json({ success: true, message: 'If this number is registered, an OTP has been sent.' });
  } catch (err) {
    console.error('sendForgotPasswordOTP:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    const otpRow = await query(
      "SELECT * FROM otps WHERE phone=$1 AND purpose='forgot_password' AND is_used=FALSE AND expires_at>NOW() ORDER BY created_at DESC LIMIT 1",
      [phone]
    );

    if (!otpRow.rows.length) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested.' });
    }

    const record = otpRow.rows[0];
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await query('UPDATE otps SET is_used=TRUE WHERE id=$1', [record.id]);
      return res.status(400).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
    }

    if (!(await verifyOTP(otp, record.otp_hash))) {
      await query('UPDATE otps SET attempts=attempts+1 WHERE id=$1', [record.id]);
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    await query('UPDATE otps SET is_used=TRUE WHERE id=$1', [record.id]);

    const userResult = await query('SELECT id FROM users WHERE phone=$1', [phone]);
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userId = userResult.rows[0].id;
    await query(
      'UPDATE users SET password_hash=$1, failed_login_attempts=0, locked_until=NULL, updated_at=NOW() WHERE id=$2',
      [await bcrypt.hash(newPassword, 12), userId]
    );
    await query('DELETE FROM refresh_tokens WHERE user_id=$1', [userId]);

    clearCookies(res);
    res.json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (err) {
    console.error('resetPassword:', err);
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refresh_token;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token required' });

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      clearCookies(res);
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const stored = await query(
      'SELECT * FROM refresh_tokens WHERE user_id=$1 AND token_hash=$2 AND expires_at>NOW()',
      [decoded.userId, hashToken(token)]
    );

    if (!stored.rows.length) {
      clearCookies(res);
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const userResult = await query('SELECT * FROM users WHERE id=$1 AND is_active=TRUE', [decoded.userId]);
    if (!userResult.rows.length) return res.status(401).json({ success: false, message: 'User not found' });

    await query('DELETE FROM refresh_tokens WHERE id=$1', [stored.rows[0].id]);
    const userData = await issueTokens(res, userResult.rows[0]);
    res.json({ success: true, user: userData });
  } catch (err) {
    console.error('refreshToken:', err);
    clearCookies(res);
    res.status(401).json({ success: false, message: 'Session expired' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refresh_token;
    if (token) {
      await query('DELETE FROM refresh_tokens WHERE token_hash=$1', [hashToken(token)]);
    }
  } finally {
    clearCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, phone, full_name, email, role, is_phone_verified, created_at FROM users WHERE id=$1',
      [req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const u = result.rows[0];
    res.json({
      success: true,
      user: { id: u.id, phone: u.phone, fullName: u.full_name, email: u.email, role: u.role, isPhoneVerified: u.is_phone_verified, createdAt: u.created_at },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

module.exports = {
  sendRegistrationOTP, register, login,
  sendForgotPasswordOTP, resetPassword,
  refreshToken, logout, getMe,
};
