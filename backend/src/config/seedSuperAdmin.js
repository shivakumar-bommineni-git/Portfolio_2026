require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('./database');

const seed = async () => {
  const phone = process.env.SUPER_ADMIN_PHONE;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  if (!phone || !password) {
    console.error('❌ Set SUPER_ADMIN_PHONE and SUPER_ADMIN_PASSWORD in .env');
    process.exit(1);
  }

  const existing = await query('SELECT id, role FROM users WHERE phone = $1', [phone]);
  if (existing.rows.length > 0) {
    if (existing.rows[0].role === 'super_admin') {
      console.log('ℹ️  Super admin already exists for this phone.');
    } else {
      await query("UPDATE users SET role = 'super_admin', updated_at = NOW() WHERE phone = $1", [phone]);
      console.log('✅ Existing user promoted to super_admin.');
    }
    await pool.end();
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO users (phone, password_hash, full_name, role, is_phone_verified)
     VALUES ($1, $2, $3, 'super_admin', TRUE)`,
    [phone, hash, name]
  );

  console.log('✅ Super admin created successfully');
  console.log(`   Phone   : ${phone}`);
  console.log(`   Name    : ${name}`);
  console.log(`   Password: ${password}`);
  console.log('\n⚠️  Store these credentials securely and remove them from .env in production.\n');

  await pool.end();
};

seed().catch((err) => { console.error('❌', err.message); process.exit(1); });
