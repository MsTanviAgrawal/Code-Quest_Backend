import mongoose from "mongoose"
import users from '../models/auth.js'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const getallusers = async (req, res) => {
    try {
        const allusers = await users.find()
        const alluserdetails = [];
        allusers.forEach((user) => {
            alluserdetails.push({_id:user._id,
                name:user.name,
                about:user.about,
                tags:user.tags,
                joinedon:user.joinedon,
            });     
        });
        res.status(200).json(alluserdetails)
    } catch (error) {
        res.status(404).json({message:error.message})
        return
    }
}
export const updateprofile=async(req,res)=>{
    const{id:_id}=req.params;
    const {name,about,tags}=req.body;
    if(!mongoose.Types.ObjectId.isValid(_id)){
        return res.status(404).send("user unavailable");
    }
    try {
        const updateprofile=await users.findByIdAndUpdate(_id,{$set:{name:name,about:about,tags:tags}},
            {new:true}
        );
        res.status(200).json(updateprofile)
    } catch (error) {
        res.status(404).json({message:error.message})
        return
    }
}

export const googleLogin = async (req, res) => {
    const { email, name, googleId, token } = req.body;

    try {
        let existingUser = await users.findOne({ email });

        if (!existingUser) {
            existingUser = await users.create({
                name,
                email,
                googleId,
                password: '', // No password needed for Google users
                joinedon: new Date()
            });
        }

        const jwtToken = jwt.sign(
            { email: existingUser.email, id: existingUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ result: existingUser, token: jwtToken });
    } catch (error) {
        console.log('Google Login Error:', error.message);
        res.status(500).json({ message: "Google login failed" });
    }
};
