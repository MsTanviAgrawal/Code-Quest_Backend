import express from "express"
import  {login,signup} from '../controller/auth.js'
import { getallusers,updateprofile,googleLogin } from "../controller/users.js";
import { sendEmailOtp, verifyEmailOtp } from '../controller/emailOtp.js';
import { sendPhoneOtp, verifyPhoneOtp } from '../controller/phoneOtp.js';
import { getLoginHistory, getRecentLogins, getLoginStats } from '../controller/loginHistory.js';
import auth from "../middleware/auth.js"

const router=express.Router();

router.post("/signup",signup);
router.post("/login",login);
router.post("/googlelogin", googleLogin);

// Email OTP routes for video upload verification
router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);

// Phone OTP routes for phone login
router.post("/send-otp", sendPhoneOtp);
router.post("/verify-otp", verifyPhoneOtp);

// Login history routes
router.get("/login-history/:userId", auth, getLoginHistory);
router.get("/recent-logins/:userId", auth, getRecentLogins);
router.get("/login-stats/:userId", auth, getLoginStats);

router.get("/getallusers",getallusers)
router.patch("/update/:id",auth,updateprofile)


export default router