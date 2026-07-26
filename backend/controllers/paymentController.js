import crypto from 'crypto';
import razorpayInstance from '../config/razorpay.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Package from '../models/Package.js';

// @desc    Create Razorpay Order for a booking
// @route   POST /api/payments/create-order
// @access  Showroom Owner
export const createPaymentOrder = async (req, res) => {
    try {
        const { booking_id } = req.body;

        if (!booking_id) {
            return res.status(400).json({ message: 'Booking ID is required.' });
        }

        const booking = await Booking.findById(booking_id).populate('package_id');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const selectedPackage = booking.package_id;
        if (!selectedPackage) {
            return res.status(400).json({ message: 'No package associated with this booking.' });
        }

        // Razorpay expects amount in paise (1 INR = 100 paise)
        const amountInPaise = Math.round(selectedPackage.price * 100);

        if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
            return res.status(400).json({ message: 'Amount must be a valid number of at least 1 INR (100 paise).' });
        }

        // Check if Razorpay keys are configured in environment variables
        const hasKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

        if (!hasKeys) {
            console.log('⚠️ Razorpay credentials missing in backend/.env. Running in Mock Mode.');
            
            // Save mock payment record as pending
            let payment = await Payment.findOne({ booking_id: booking._id });
            if (payment) {
                payment.amount = selectedPackage.price;
                payment.razorpay_order_id = `mock_order_${booking._id}`;
                payment.status = 'pending';
                await payment.save();
            } else {
                payment = new Payment({
                    booking_id: booking._id,
                    amount: selectedPackage.price,
                    payment_method: 'online',
                    status: 'pending',
                    razorpay_order_id: `mock_order_${booking._id}`
                });
                await payment.save();
            }

            return res.status(200).json({
                success: true,
                order_id: `mock_order_${booking._id}`,
                amount: amountInPaise,
                currency: 'INR',
                key_id: 'rzp_test_mock_key',
                is_mock: true
            });
        }

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `bk_${booking._id}`,
        };

        const order = await razorpayInstance.orders.create(options);

        // Save payment record as pending
        let payment = await Payment.findOne({ booking_id: booking._id });
        if (payment) {
            payment.amount = selectedPackage.price;
            payment.razorpay_order_id = order.id;
            payment.status = 'pending';
            await payment.save();
        } else {
            payment = new Payment({
                booking_id: booking._id,
                amount: selectedPackage.price,
                payment_method: 'online',
                status: 'pending',
                razorpay_order_id: order.id
            });
            await payment.save();
        }

        res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error creating payment order:', error);
        res.status(500).json({ 
            message: 'Failed to create payment order.', 
            error: error.error || error.message || error.description || String(error) 
        });
    }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payments/verify
// @access  Showroom Owner
export const verifyPaymentSignature = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            booking_id
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
            return res.status(400).json({ message: 'Missing required payment verification details.' });
        }

        const hasKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

        // Verify Mock Mode signature bypass
        if (!hasKeys && razorpay_order_id.startsWith('mock_order_')) {
            const payment = await Payment.findOne({ booking_id });
            if (!payment) {
                return res.status(404).json({ message: 'Payment record not found.' });
            }

            payment.status = 'completed';
            payment.transaction_id = razorpay_payment_id;
            payment.razorpay_payment_id = razorpay_payment_id;
            payment.razorpay_signature = razorpay_signature;
            payment.paid_at = new Date();
            await payment.save();

            const booking = await Booking.findById(booking_id);
            if (booking) {
                await booking.save();
            }

            return res.status(200).json({ success: true, message: 'Mock payment verified successfully.' });
        }

        // Generate expected signature
        const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
        }

        // Find and update payment record
        const payment = await Payment.findOne({ booking_id });
        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found.' });
        }

        payment.status = 'completed';
        payment.transaction_id = razorpay_payment_id;
        payment.razorpay_payment_id = razorpay_payment_id;
        payment.razorpay_signature = razorpay_signature;
        payment.paid_at = new Date();
        await payment.save();

        // Update Booking status
        const booking = await Booking.findById(booking_id);
        if (booking) {
            await booking.save();
        }

        res.status(200).json({ success: true, message: 'Payment verified successfully.' });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Payment verification failed.' });
    }
};
