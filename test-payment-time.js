// Test script to verify payment time restrictions
import { isPaymentTimeAllowed, PAYMENT_WINDOW } from './config/subscriptionPlans.js';

console.log('\n🧪 ========== PAYMENT TIME RESTRICTION TEST ==========');

// Get current time in IST
const now = new Date();
const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
const currentHour = istTime.getHours();
const currentMinute = istTime.getMinutes();

console.log(`📅 Current IST Time: ${istTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
console.log(`⏰ Current Hour: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
console.log(`🎯 Payment Window: ${PAYMENT_WINDOW.startHour}:00 AM - ${PAYMENT_WINDOW.endHour}:00 AM`);

// Test current time
const isAllowed = isPaymentTimeAllowed();
console.log(`✅ Payment Currently Allowed: ${isAllowed ? '✓ YES' : '❌ NO'}`);

// Test different hours
console.log('\n📊 Testing Different Hours:');
const testHours = [9, 10, 10.5, 11, 12, 15, 20];

testHours.forEach(hour => {
    const testTime = new Date();
    testTime.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
    
    // Mock the time check
    const testHourInt = Math.floor(hour);
    const allowed = testHourInt >= PAYMENT_WINDOW.startHour && testHourInt < PAYMENT_WINDOW.endHour;
    
    console.log(`  ${hour.toString().padStart(4, ' ')}:00 - ${allowed ? '✓ Allowed' : '❌ Blocked'}`);
});

console.log('\n💡 Tips:');
console.log('- Payments are only allowed between 10:00 AM - 10:59 AM IST');
console.log('- Users will see a popup with current time if they try to pay outside this window');
console.log('- The restriction applies to both real and mock payments');

console.log('\n================================================\n');
