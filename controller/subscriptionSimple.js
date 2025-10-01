import { SUBSCRIPTION_PLANS, isPaymentTimeAllowed } from '../config/subscriptionPlans.js';

// Simple create order - NO database, NO razorpay, PURE MOCK
export const createOrderSimple = async (req, res) => {
    console.log('\n✅ SIMPLE ORDER ENDPOINT HIT');
    try {
        const { planType } = req.body;
        const userId = req.userid;

        console.log('Plan:', planType);
        console.log('User:', userId);

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

        if (!planType) {
            return res.status(400).json({
                success: false,
                message: 'Plan type required'
            });
        }

        if (!SUBSCRIPTION_PLANS[planType]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan'
            });
        }

        const plan = SUBSCRIPTION_PLANS[planType];
        const mockOrder = {
            id: `order_mock_${Date.now()}`,
            amount: plan.price * 100,
            currency: 'INR',
            status: 'created'
        };

        console.log('✅ Mock order created:', mockOrder.id);

        // For testing, return success with mock payment details
        return res.status(200).json({
            success: true,
            order: mockOrder,
            key: 'rzp_test_dummy',
            planDetails: plan,
            message: 'Test mode - Payment will be auto-completed',
            // Auto-complete payment in test mode
            testMode: true,
            autoComplete: true
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
