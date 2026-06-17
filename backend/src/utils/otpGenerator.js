const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const generateOTP = () => {
  const buffer = crypto.randomBytes(3);
  const num = parseInt(buffer.toString('hex'), 16);
  return String((num % 900000) + 100000);
};

const hashOTP = async (otp) => bcrypt.hash(otp, 10);

const verifyOTP = async (otp, hash) => bcrypt.compare(otp, hash);

module.exports = { generateOTP, hashOTP, verifyOTP };
