import bcrypt from 'bcrypt';
import db from '../config/db.js';

// Change these to your desired super admin credentials
const name = 'Super Admin';
const email = 'admin@revora.com';
const password = 'Admin@1234';

const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

await db.execute(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, 'super_admin']
);

console.log('✅ Super Admin created successfully!');
console.log(`   Email   : ${email}`);
console.log(`   Password: ${password}`);

process.exit(0);
