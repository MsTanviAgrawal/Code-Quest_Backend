import express from 'express';
import {
    getPlans,
    getMySubscription,
    createOrder,
    verifyPayment,
    getPaymentHistory
} from '../controller/subscription.js';
import { createOrderSimple } from '../controller/subscriptionSimple.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all subscription plans
router.get('/plans', getPlans);

// Get user's current subscription (requires auth)
router.get('/my-subscription', auth, getMySubscription);

// Create payment order - SIMPLE VERSION (requires auth)
router.post('/create-order', auth, createOrderSimple);

// Verify payment and activate subscription (requires auth)
router.post('/verify-payment', auth, verifyPayment);

// Get payment history (requires auth)
router.get('/payment-history', auth, getPaymentHistory);

export default router;
