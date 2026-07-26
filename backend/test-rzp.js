import dotenv from 'dotenv';
dotenv.config();

import Razorpay from 'razorpay';

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

async function test() {
    try {
        const options = {
            amount: 50000,
            currency: 'INR',
            receipt: 'receipt_booking_60d5ec49c693a43588f01b12'
        };
        const order = await razorpayInstance.orders.create(options);
        console.log('Success:', order);
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
