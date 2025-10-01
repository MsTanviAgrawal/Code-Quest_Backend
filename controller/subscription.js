import Razorpay from 'razorpay';
import crypto from 'crypto';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import User from '../models/auth.js';
import { SUBSCRIPTION_PLANS, isPaymentTimeAllowed } from '../config/subscriptionPlans.js';
import nodemailer from 'nodemailer';

// Initialize Razorpay (Add keys to .env)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Get all subscription plans
export const getPlans = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            plans: SUBSCRIPTION_PLANS
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plans',
            error: error.message
        });
    }
};

// Get user's current subscription
export const getMySubscription = async (req, res) => {
    try {
        const { userId } = req;

        let subscription = await Subscription.findOne({ userId });

        // Create free subscription if doesn't exist
        if (!subscription) {
            subscription = await Subscription.create({
                userId,
                planType: 'free',
                questionsPerDay: 1
            });
        }

        // Check if expired
        if (subscription.isExpired()) {
            subscription.planType = 'free';
            subscription.questionsPerDay = 1;
            subscription.isActive = false;
            await subscription.save();
        }

        // Reset daily count if needed
        subscription.resetDailyCount();
        await subscription.save();

        res.status(200).json({
            success: true,
            subscription,
            planDetails: SUBSCRIPTION_PLANS[subscription.planType]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription',
            error: error.message
        });
    }
};

// Create payment order
export const createOrder = async (req, res) => {
    console.log('\n🚀 ========== CREATE ORDER START ==========');
    try {
        const { planType } = req.body;
        const userId = req.userid || req.userId;
        
        console.log('Request body:', req.body);
        console.log('User ID from auth:', userId);
        
        if (!userId) {
            console.log('❌ No userId found');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        // Get user email from database
        let email = 'test@example.com';
        try {
            const user = await User.findById(userId);
            if (user && user.email) {
                email = user.email;
            }
        } catch (e) {
            console.log('⚠️ Could not fetch user email, using default');
        }

        console.log('💳 Create order request:', { planType, userId, email });

        // Check payment time window
        if (!isPaymentTimeAllowed()) {
            console.log('⏰ Payment outside time window');
            return res.status(403).json({
                success: false,
                message: 'Payments are only allowed between 10:00 AM to 11:00 AM IST. Please try again during the allowed time window.',
                timeRestriction: true,
                allowedWindow: '10:00 AM - 11:00 AM IST'
            });
        }

        // Validate plan
        if (!SUBSCRIPTION_PLANS[planType] || planType === 'free') {
            console.log('❌ Invalid plan type:', planType);
            return res.status(400).json({
                success: false,
                message: 'Invalid plan type'
            });
        }

        const plan = SUBSCRIPTION_PLANS[planType];
        const amount = plan.price * 100; // Convert to paise

        console.log('📦 Plan details:', { name: plan.name, amount: plan.price });

        // Create Razorpay order
        const options = {
            amount,
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            notes: {
                userId: userId.toString(),
                planType,
                email
            }
        };

        console.log('🔄 Creating Razorpay order...');
        
        let order;
        // Check if Razorpay is properly configured
        if (process.env.RAZORPAY_KEY_ID === 'rzp_test_dummy' || !process.env.RAZORPAY_KEY_ID) {
            console.log('⚠️ Razorpay not configured, using mock order for testing');
            // Create mock order for testing
            order = {
                id: `order_mock_${Date.now()}`,
                entity: 'order',
                amount: amount,
                amount_paid: 0,
                amount_due: amount,
                currency: 'INR',
                receipt: options.receipt,
                status: 'created',
                attempts: 0,
                notes: options.notes,
                created_at: Math.floor(Date.now() / 1000)
            };
        } else {
            order = await razorpay.orders.create(options);
        }
        
        console.log('✅ Order created:', order.id);

        // Save payment record
        console.log('💾 Saving payment record...');
        try {
            // Check if order already exists
            const existingPayment = await Payment.findOne({ orderId: order.id });
            if (!existingPayment) {
                await Payment.create({
                    userId,
                    orderId: order.id,
                    amount: plan.price,
                    planType,
                    email: email || undefined,
                    status: 'pending'
                });
                console.log('✅ Payment record saved');
            } else {
                console.log('⚠️ Payment record already exists');
            }
        } catch (saveError) {
            console.error('❌ Error saving payment:', saveError.message);
            console.error('Save error details:', saveError);
            // Continue even if save fails - order is created
        }

        console.log(`\n💳 ========== PAYMENT ORDER CREATED ==========`);
        console.log(`User: ${email}`);
        console.log(`Plan: ${plan.name}`);
        console.log(`Amount: ₹${plan.price}`);
        console.log(`Order ID: ${order.id}`);
        console.log(`=============================================\n`);

        res.status(200).json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
            planDetails: plan
        });
    } catch (error) {
        console.error('\n❌ ========== ORDER CREATION FAILED ==========');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('=============================================\n');
        
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Verify payment and activate subscription
export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const { userId, email } = req;

        // Verify signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Find payment record
        const payment = await Payment.findOne({ orderId: razorpay_order_id });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
        }

        // Update payment status
        payment.paymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = 'completed';
        payment.completedAt = new Date();
        await payment.save();

        // Get plan details
        const plan = SUBSCRIPTION_PLANS[payment.planType];
        
        // Calculate end date
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);

        // Update or create subscription
        let subscription = await Subscription.findOne({ userId });
        
        if (subscription) {
            subscription.planType = payment.planType;
            subscription.planPrice = payment.amount;
            subscription.questionsPerDay = plan.questionsPerDay === -1 ? 999999 : plan.questionsPerDay;
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.isActive = true;
            subscription.paymentId = razorpay_payment_id;
            subscription.orderId = razorpay_order_id;
            subscription.questionsUsedToday = 0;
            await subscription.save();
        } else {
            subscription = await Subscription.create({
                userId,
                planType: payment.planType,
                planPrice: payment.amount,
                questionsPerDay: plan.questionsPerDay === -1 ? 999999 : plan.questionsPerDay,
                startDate,
                endDate,
                isActive: true,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id
            });
        }

        // Send invoice email
        await sendInvoiceEmail(payment, subscription, email);

        console.log(`\n✅ ========== PAYMENT SUCCESSFUL ==========`);
        console.log(`User: ${email}`);
        console.log(`Plan: ${plan.name}`);
        console.log(`Amount: ₹${payment.amount}`);
        console.log(`Valid until: ${endDate.toLocaleDateString()}`);
        console.log(`==========================================\n`);

        res.status(200).json({
            success: true,
            message: 'Payment verified and subscription activated',
            subscription,
            payment
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
};

// Send invoice email
const sendInvoiceEmail = async (payment, subscription, userEmail) => {
    try {
        const plan = SUBSCRIPTION_PLANS[payment.planType];
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Payment Successful - ${plan.name} Subscription`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #667eea; text-align: center;">🎉 Payment Successful!</h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #333;">Invoice Details</h3>
                        <p><strong>Invoice Number:</strong> ${payment.invoiceNumber}</p>
                        <p><strong>Date:</strong> ${payment.completedAt.toLocaleDateString()}</p>
                        <p><strong>Order ID:</strong> ${payment.orderId}</p>
                        <p><strong>Payment ID:</strong> ${payment.paymentId}</p>
                    </div>

                    <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #333;">Subscription Details</h3>
                        <p><strong>Plan:</strong> ${plan.name}</p>
                        <p><strong>Amount Paid:</strong> ₹${payment.amount}</p>
                        <p><strong>Questions Per Day:</strong> ${plan.questionsPerDay === -1 ? 'Unlimited' : plan.questionsPerDay}</p>
                        <p><strong>Valid From:</strong> ${subscription.startDate.toLocaleDateString()}</p>
                        <p><strong>Valid Until:</strong> ${subscription.endDate.toLocaleDateString()}</p>
                    </div>

                    <div style="background: #f1f8e9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #333;">Plan Features</h3>
                        <ul>
                            ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                        </ul>
                    </div>

                    <p style="text-align: center; color: #666; margin-top: 30px;">
                        Thank you for subscribing! If you have any questions, please contact our support team.
                    </p>
                    
                    <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                        This is an automated email. Please do not reply.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Invoice email sent to ${userEmail}`);
    } catch (error) {
        console.error('Email sending failed:', error);
        // Don't throw error, email failure shouldn't stop payment completion
    }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
    try {
        const { userId } = req;

        const payments = await Payment.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json({
            success: true,
            payments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment history',
            error: error.message
        });
    }
};
