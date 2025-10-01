import users from '../models/auth.js'
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import LoginHistory from '../models/LoginHistory.js'
import { parseUserAgent, getIpAddress, isMobileAccessAllowed, requiresOTP, hasDirectAccess } from '../utils/deviceDetection.js'
import { sendEmailOtp } from './emailOtp.js'

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const extinguser = await users.findOne({ email });
        if (extinguser) {
            return res.status(404).json({ message: "User already exist" });
        }
        const hashedpassword = await bcrypt.hash(password, 12);
        const newuser = await users.create({
            name,
            email,
            password: hashedpassword
        });
        const token = jwt.sign(
            {email: newuser.email, id: newuser._id},
             process.env.JWT_SECRET, 
             { expiresIn: "1h" }
        )
        res.status(201).json({ result: newuser, token });
    } catch (error) {
        res.status(500).json("something went wrong...")
        return
    }
}

export const login = async (req, res) => {
    const { email, password, otp } = req.body;
    
    try {
        const existingUser = await users.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "User does not exist" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Get device information
        const userAgent = req.headers['user-agent'] || '';
        const { browser, os, deviceType } = parseUserAgent(userAgent);
        const ipAddress = getIpAddress(req);

        console.log(`\n🔐 ========== LOGIN ATTEMPT ==========`);
        console.log(`Email: ${email}`);
        console.log(`Browser: ${browser}`);
        console.log(`OS: ${os}`);
        console.log(`Device: ${deviceType}`);
        console.log(`IP: ${ipAddress}`);
        console.log(`======================================\n`);

        // Check mobile time restriction
        if (deviceType === 'mobile' && !isMobileAccessAllowed()) {
            await LoginHistory.create({
                userId: existingUser._id,
                email: existingUser.email,
                browser,
                os,
                deviceType,
                ipAddress,
                loginMethod: 'email',
                success: false
            });
            
            return res.status(403).json({ 
                message: "Mobile access is only allowed between 10 AM to 1 PM" 
            });
        }

        // Browser-based authentication logic
        const needsOtp = requiresOTP(browser);
        const directAccess = hasDirectAccess(browser);

        // Microsoft Edge - Direct access without OTP
        if (directAccess) {
            const token = jwt.sign(
                { email: existingUser.email, id: existingUser._id },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            // Log login history
            await LoginHistory.create({
                userId: existingUser._id,
                email: existingUser.email,
                browser,
                os,
                deviceType,
                ipAddress,
                loginMethod: 'email',
                requireOtp: false,
                success: true
            });

            console.log(`✅ Direct login allowed for ${browser}`);
            return res.status(200).json({ result: existingUser, token });
        }

        // Chrome - Requires OTP
        if (needsOtp && !otp) {
            // First attempt - send OTP
            await sendEmailOtp(req, res);
            return; // Response is handled by sendEmailOtp
        }

        // Chrome with OTP - verify and login
        if (needsOtp && otp) {
            // Import and verify OTP
            const { verifyEmailOtp } = await import('./emailOtp.js');
            const otpVerified = await verifyEmailOtp(req, res, true); // true = return result instead of sending response
            
            if (!otpVerified) {
                return; // Error response already sent by verifyEmailOtp
            }
        }

        // Other browsers or OTP verified - proceed with login
        const token = jwt.sign(
            { email: existingUser.email, id: existingUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Log successful login history
        await LoginHistory.create({
            userId: existingUser._id,
            email: existingUser.email,
            browser,
            os,
            deviceType,
            ipAddress,
            loginMethod: 'email',
            requireOtp: needsOtp,
            success: true
        });

        console.log(`✅ Login successful for ${email}`);
        res.status(200).json({ result: existingUser, token, needOtp: false });
        
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Something went wrong..." });
    }
}



// import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";
// import User from "../models/auth.js";

// const secret = process.env.JWT_SECRET;

// export const signup = async (req, res) => {
//   const { name, email, password } = req.body;
//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser)
//       return res.status(400).json({ message: "User already exists" });

//     const hashedPassword = await bcrypt.hash(password, 12);
//     const newUser = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//     });

//     const token = jwt.sign({ email: newUser.email, id: newUser._id }, secret, {
//       expiresIn: "1h",
//     });

//     res.status(200).json({ result: newUser, token });
//   } catch (error) {
//     res.status(500).json({ message: "Something went wrong" });
//   }
// };

// export const login = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const existingUser = await User.findOne({ email });
//     if (!existingUser)
//       return res.status(404).json({ message: "User doesn't exist" });

//     const isPasswordCorrect = await bcrypt.compare(
//       password,
//       existingUser.password
//     );

//     if (!isPasswordCorrect)
//       return res.status(400).json({ message: "Invalid credentials" });

//     const token = jwt.sign(
//       { email: existingUser.email, id: existingUser._id },
//       secret,
//       { expiresIn: "1h" }
//     );

//     res.status(200).json({ result: existingUser, token });
//   } catch (error) {
//     res.status(500).json({ message: "Something went wrong" });
//   }
// };
