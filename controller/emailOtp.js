// In-memory OTP storage (for production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send Email OTP
export const sendEmailOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const otp = generateOTP();
        const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP with expiry
        otpStore.set(email, { otp, expiryTime });

        // For development: log OTP to console
        console.log(`\n📧 ========== OTP GENERATED ==========`);
        console.log(`Email: ${email}`);
        console.log(`OTP: ${otp}`);
        console.log(`Valid for: 10 minutes`);
        console.log(`======================================\n`);

        // Development mode: return OTP in response
        // In production with email setup, implement nodemailer separately
        res.status(200).json({ 
            message: "OTP generated successfully",
            success: true,
            devOtp: otp // For development/testing
        });

    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ 
            message: "Failed to send OTP. Please try again.",
            error: error.message 
        });
    }
};

// Verify Email OTP
export const verifyEmailOtp = async (req, res, returnOnly = false) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        if (returnOnly) return false;
        return res.status(400).json({ message: "Email and OTP are required" });
    }

    try {
        const storedData = otpStore.get(email);

        if (!storedData) {
            if (returnOnly) return false;
            return res.status(400).json({ message: "OTP not found or expired. Please request a new OTP." });
        }

        const { otp: storedOtp, expiryTime } = storedData;

        // Check if OTP expired
        if (Date.now() > expiryTime) {
            otpStore.delete(email);
            if (returnOnly) return false;
            return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
        }

        // Verify OTP
        if (otp !== storedOtp) {
            if (returnOnly) return false;
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }

        // OTP verified successfully, remove from store
        otpStore.delete(email);

        if (returnOnly) return true;

        res.status(200).json({ 
            message: "OTP verified successfully",
            success: true 
        });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        if (returnOnly) return false;
        res.status(500).json({ 
            message: "Failed to verify OTP. Please try again.",
            error: error.message 
        });
    }
};
