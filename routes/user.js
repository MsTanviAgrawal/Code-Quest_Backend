import express from "express"
import  {login,signup} from '../controller/auth.js'
import { getallusers,updateprofile,googleLogin } from "../controller/users.js";
import auth from "../middleware/auth.js"

const router=express.Router();

router.post("/signup",signup);
router.post("/login",login);
router.post("/googlelogin", googleLogin);
router.get("/getallusers",getallusers)

router.patch("/update/:id",auth,updateprofile)


export default router