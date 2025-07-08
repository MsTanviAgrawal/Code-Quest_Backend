import users from '../models/auth.js'
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

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
    const { email, password } = req.body;
    try {
        const existingUser = await users.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "User does not exist" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { email: existingUser.email, id: existingUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ result: existingUser, token });
    } catch (error) {
        res.status(500).json("something went wrong...")
        return
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
