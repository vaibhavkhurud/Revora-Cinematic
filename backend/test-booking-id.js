import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Booking from './models/Booking.js';

async function test() {
    await connectDB();
    const b = await Booking.findById('67933f7d14b0b14ab6123eec');
    console.log('Booking found:', b);
    process.exit(0);
}
test();
