import mongoose from 'mongoose';
import { createPaymentOrder } from './controllers/paymentController.js';
import connectDB from './config/db.js';

async function test() {
    await connectDB();
    const req = {
        body: { booking_id: '67933f7d14b0b14ab6123eec' }
    };
    const res = {
        status: function(code) {
            this.code = code;
            return this;
        },
        json: function(data) {
            console.log('STATUS:', this.code);
            console.log('JSON:', JSON.stringify(data, null, 2));
        }
    };
    
    await createPaymentOrder(req, res);
    process.exit(0);
}
test();
