import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { query, queryOne } from '../src/db';

async function hashPassword() {
  const email = 'quang@lhu.edu.vn';
  const password = '123456789';

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  console.log('Password hash:', passwordHash);

  // Check if user exists
  const user = await queryOne<{ Id: string; Email: string; PasswordHash: string | null }>(
    'SELECT Id, Email, PasswordHash FROM Users WHERE Email = @email',
    { email }
  );

  if (!user) {
    console.log('User not found:', email);
    return;
  }

  console.log('Current PasswordHash:', user.PasswordHash);

  // Update password hash
  await query(
    'UPDATE Users SET PasswordHash = @passwordHash WHERE Email = @email',
    { passwordHash, email }
  );

  console.log('Password updated successfully!');
  process.exit(0);
}

hashPassword().catch(console.error);
