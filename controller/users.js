import mongoose from "mongoose"
import users from '../models/auth.js'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import LoginHistory from '../models/LoginHistory.js';
import { parseUserAgent, getIpAddress, isMobileAccessAllowed } from '../utils/deviceDetection.js';

export const getallusers = async (req, res) => {
    try {
        const allusers = await users.find()
        const alluserdetails = [];
        allusers.forEach((user) => {
            alluserdetails.push({
                _id: user._id,
                name: user.name,
                about: user.about,
                tags: user.tags,
                joinedon: user.joinedon,
            });
        });
        res.status(200).json(alluserdetails)
    } catch (error) {
        res.status(404).json({ message: error.message })
        return
    }
}
export const updateprofile = async (req, res) => {
    const { id: _id } = req.params;
    const { name, about, tags } = req.body;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send("user unavailable");
    }
    try {
        const updateprofile = await users.findByIdAndUpdate(_id, { $set: { name: name, about: about, tags: tags } },
            { new: true }
        );
        res.status(200).json(updateprofile)
    } catch (error) {
        res.status(404).json({ message: error.message })
        return
    }
}

export const googleLogin = async (req, res) => {
    const { email, name, token, googleId } = req.body;

    try {
        // Get device information
        const userAgent = req.headers['user-agent'] || '';
        const { browser, os, deviceType } = parseUserAgent(userAgent);
        const ipAddress = getIpAddress(req);

        // Check mobile time restriction
        if (deviceType === 'mobile' && !isMobileAccessAllowed()) {
            return res.status(403).json({ 
                message: "Mobile access is only allowed between 10 AM to 1 PM" 
            });
        }

        let existingUser = await users.findOne({ email });

        if (!existingUser) {
             const hashedPassword = await bcrypt.hash(googleId, 12);
            existingUser = await users.create({
                name,
                email,
                googleId,
                password: hashedPassword,
                joinedon: new Date()
            });
        }

        const jwtToken = jwt.sign(
            { email: existingUser.email, id: existingUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Log Google login history
        await LoginHistory.create({
            userId: existingUser._id,
            email: existingUser.email,
            browser,
            os,
            deviceType,
            ipAddress,
            loginMethod: 'google',
            requireOtp: false,
            success: true
        });

        console.log(`✅ Google login successful for ${email}`);
        res.status(200).json({ result: existingUser, token: jwtToken });

    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(500).json({ message: "Google login failed" });
    }
};
