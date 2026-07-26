import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Booking from './models/Booking.js';
import Package from './models/Package.js';

async function test() {
    await connectDB();
    const bookings = await Booking.find().populate('package_id').limit(5);
    for (let b of bookings) {
        console.log(`Booking ID: ${b._id}, Status: ${b.status}`);
        if (!b.package_id) {
            console.log('  -> Package is NULL');
        } else {
            console.log(`  -> Package: ${b.package_id._id}, Price: ${b.package_id.price}`);
        }
    }
    process.exit(0);
}
test();
