import bcrypt from 'bcrypt';
import connectDB from '../config/db.js';
import User from '../models/User.js';

// Change these to your desired super admin credentials
const name = 'Super Admin';
const email = 'admin@revora.com';
const password = 'Admin@1234';

const init = async () => {
    await connectDB();
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'super_admin'
    });
    
    console.log('✅ Super Admin created successfully!');
    console.log(`   Email   : ${email}`);
    console.log(`   Password: ${password}`);
    
    process.exit(0);
};

init();
