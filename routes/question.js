import express from "express"
import { Askquestion,getallquestion,getvideoquestions,gettextquestions,deletequestion,editquestion,votequestion } from "../controller/Question.js"
import auth from "../middleware/auth.js"
import upload from "../middleware/upload.js"

const router=express.Router();

router.post('/Ask', auth, upload.single('video'), Askquestion);
router.get('/get',getallquestion);
router.get('/get/video', getvideoquestions);
router.get('/get/text', gettextquestions);
router.delete("/delete/:id",auth,deletequestion);
router.patch("/edit/:id",auth,editquestion);
router.patch("/vote/:id",auth,votequestion)


export default router;
