import express from 'express';
import dotenv from 'dotenv';

// Test imports
console.log('Testing imports...');

try {
    console.log('✓ Express imported');
    dotenv.config();
    console.log('✓ Dotenv loaded');
    
    // Test subscription imports
    const subscriptionModule = await import('./routes/subscription.js');
    console.log('✓ Subscription routes imported');
    
    const subscriptionController = await import('./controller/subscription.js');
    console.log('✓ Subscription controller imported');
    
    // Test Razorpay
    const Razorpay = (await import('razorpay')).default;
    console.log('✓ Razorpay imported');
    
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
    });
    console.log('✓ Razorpay initialized');
    
    console.log('\n✅ All imports successful! Server should start now.');
    
} catch (error) {
    console.error('\n❌ Error found:');
    console.error(error);
    process.exit(1);
}
