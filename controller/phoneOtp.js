import User from '../models/auth.js';
import jwt from 'jsonwebtoken';

// Simple fallback functions
const parseUserAgent = (ua) => {
    return { browser: 'Unknown', os: 'Unknown', deviceType: 'desktop' };
};

const getIpAddress = (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
};

const isMobileAccessAllowed = () => {
    return true; // Always allow for now
};

// In-memory OTP storage (for production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send Phone OTP
export const sendPhoneOtp = async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
    }

    try {
        const otp = generateOTP();
        const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP with expiry
        otpStore.set(phone, { otp, expiryTime });

        // For development: log OTP to terminal
        console.log(`\n📱 ========== PHONE OTP GENERATED ==========`);
        console.log(`Phone: ${phone}`);
        console.log(`OTP: ${otp}`);
        console.log(`Valid for: 10 minutes`);
        console.log(`==========================================\n`);

        // Development mode: return OTP in response (for testing)
        res.status(200).json({ 
            message: "OTP sent successfully",
            success: true,
            devOtp: otp // For development/testing - will show in popup
        });

    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ 
            message: "Failed to send OTP. Please try again.",
            error: error.message 
        });
    }
};

// Verify Phone OTP
export const verifyPhoneOtp = async (req, res) => {
    const { phone, otp, name } = req.body;

    console.log(`\n🔍 ========== OTP VERIFICATION REQUEST ==========`);
    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);
    console.log(`Name: ${name || 'Not provided'}`);
    console.log(`================================================\n`);

    if (!phone || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    try {
        const storedData = otpStore.get(phone);

        if (!storedData) {
            console.log('❌ OTP not found in store for phone:', phone);
            console.log('Current OTP store keys:', Array.from(otpStore.keys()));
            return res.status(400).json({ message: "OTP not found or expired. Please request a new OTP." });
        }

        const { otp: storedOtp, expiryTime } = storedData;
        console.log(`📋 Stored OTP: ${storedOtp}, Provided OTP: ${otp}`);
        console.log(`⏰ Expiry: ${new Date(expiryTime)}, Current: ${new Date()}`);
        console.log(`⏳ Time remaining: ${Math.round((expiryTime - Date.now()) / 1000)} seconds`);

        // Check if OTP expired
        if (Date.now() > expiryTime) {
            otpStore.delete(phone);
            return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
        }

        // Verify OTP
        if (otp !== storedOtp) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }

        // Get device information
        const userAgent = req.headers['user-agent'] || '';
        const { browser, os, deviceType } = parseUserAgent(userAgent);
        const ipAddress = getIpAddress(req);

        // Check mobile time restriction
        if (deviceType === 'mobile' && !isMobileAccessAllowed()) {
            otpStore.delete(phone);
            return res.status(403).json({ 
                message: "Mobile access is only allowed between 10 AM to 1 PM" 
            });
        }

        // Check if user exists
        console.log('🔍 Checking if user exists for phone:', phone);
        let user = await User.findOne({ phone });
        let isNewUser = false;
        
        // If user doesn't exist, check if name is provided
        if (!user) {
            isNewUser = true;
            console.log('👤 New user detected');
            
            // If name not provided, return flag to ask for name (DON'T delete OTP yet)
            if (!name || name.trim() === '') {
                console.log('📝 Name not provided, asking for name');
                return res.status(200).json({
                    isNewUser: true,
                    message: "OTP verified. Please provide your name.",
                    phone: phone // Include phone for frontend reference
                });
            }
            
            // Validate name
            if (name.trim().length < 2) {
                return res.status(400).json({ 
                    message: "Name must be at least 2 characters long." 
                });
            }
            
            // Create new user with provided name
            console.log('✨ Creating new user with name:', name.trim());
            try {
                const userData = {
                    name: name.trim(),
                    phone: phone,
                    friends: [],  // Initialize friends array
                    joinedon: new Date()
                };
                
                // Explicitly don't include email field for phone registration
                console.log('📋 User data to save:', userData);
                
                user = new User(userData);
                await user.save();
                console.log('✅ User created successfully:', user._id);
            } catch (saveError) {
                console.error('❌ Error creating user:', saveError);
                console.error('❌ Full error details:', JSON.stringify(saveError, null, 2));
                
                // Handle duplicate key error
                if (saveError.code === 11000) {
                    console.log('🔍 Duplicate key error details:', saveError.keyPattern);
                    if (saveError.keyPattern?.phone) {
                        return res.status(400).json({ 
                            message: "Phone number already registered." 
                        });
                    }
                    if (saveError.keyPattern?.email) {
                        return res.status(400).json({ 
                            message: "This phone number is associated with an existing email account. Please use email login instead." 
                        });
                    }
                    // Generic duplicate key error
                    return res.status(400).json({ 
                        message: "Account already exists. Please try logging in instead." 
                    });
                }
                
                return res.status(500).json({ 
                    message: "Failed to create user account. Please try again.",
                    error: saveError.message 
                });
            }
        } else {
            console.log('✅ Existing user found:', user._id);
        }

        // OTP verified and registration complete, now delete from store
        otpStore.delete(phone);
        console.log('🗑️ OTP deleted from store');

        // Generate JWT token
        console.log('🔑 Generating JWT token');
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-change-this';
        if (!process.env.JWT_SECRET) {
            console.warn('⚠️ JWT_SECRET not found in .env, using default (not recommended for production)');
        }
        
        const token = jwt.sign(
            { 
                email: user.email || null, 
                id: user._id, 
                phone: user.phone,
                name: user.name
            },
            jwtSecret,
            { expiresIn: '7d' }
        );
        console.log('✅ JWT token generated');

        // Skip login history for now
        console.log('ℹ️ Login history skipped');

        console.log(`✅ Phone login successful for ${phone}`);

        res.status(200).json({ 
            result: user,
            token,
            isNewUser: false,
            message: isNewUser ? "Registration successful" : "Login successful"
        });

    } catch (error) {
        console.error("❌ Error verifying OTP:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ 
            message: "Failed to verify OTP. Please try again.",
            error: error.message 
        });
    }
};
