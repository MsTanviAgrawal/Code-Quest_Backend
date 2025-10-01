export const SUBSCRIPTION_PLANS = {
    free: {
        name: 'Free Plan',
        price: 0,
        questionsPerDay: 1,
        duration: null, // Permanent
        features: [
            '1 question per day',
            'Basic support',
            'Access to community answers'
        ]
    },
    bronze: {
        name: 'Bronze Plan',
        price: 100,
        questionsPerDay: 5,
        duration: 30, // days
        features: [
            '5 questions per day',
            'Priority support',
            'Access to community answers',
            'No ads'
        ]
    },
    silver: {
        name: 'Silver Plan',
        price: 300,
        questionsPerDay: 10,
        duration: 30, // days
        features: [
            '10 questions per day',
            'Priority support',
            'Access to community answers',
            'No ads',
            'Featured questions'
        ]
    },
    gold: {
        name: 'Gold Plan',
        price: 1000,
        questionsPerDay: -1, // Unlimited
        duration: 30, // days
        features: [
            'Unlimited questions',
            '24/7 Premium support',
            'Access to community answers',
            'No ads',
            'Featured questions',
            'Private code review',
            'Early access to new features'
        ]
    }
};

// Payment time window (10 AM - 11 AM IST)
export const PAYMENT_WINDOW = {
    startHour: 10,
    endHour: 11,
    timezone: 'Asia/Kolkata'
};

// Check if current time is within payment window
export const isPaymentTimeAllowed = () => {
    const now = new Date();
    // Get IST time
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const currentHour = istTime.getHours();
    
    // Payment allowed between 10 AM and 11 AM (10:00 - 10:59)
    return currentHour >= PAYMENT_WINDOW.startHour && currentHour < PAYMENT_WINDOW.endHour;
};

// Get payment status with details
export const getPaymentStatus = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const currentHour = istTime.getHours();
    const isAllowed = isPaymentTimeAllowed();
    
    return {
        isAllowed,
        currentTime: istTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        currentHour,
        allowedWindow: `${PAYMENT_WINDOW.startHour}:00 AM - ${PAYMENT_WINDOW.endHour}:00 AM IST`,
        message: isAllowed 
            ? 'Payments are currently allowed' 
            : `Payments are only allowed between ${PAYMENT_WINDOW.startHour}:00 AM - ${PAYMENT_WINDOW.endHour}:00 AM IST`
    };
};
