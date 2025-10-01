import Question from "../models/Question.js";
import Subscription from "../models/Subscription.js";
import mongoose from "mongoose";

export const Askquestion = async (req, res) => {
    try {
        const { questiontitle, questionbody, questiontags, userposted, hasVideo } = req.body;
        const userid = req.userid;

        // Check user's subscription and question limit
        let subscription = await Subscription.findOne({ userId: userid });
        
        // Create free subscription if doesn't exist
        if (!subscription) {
            subscription = await Subscription.create({
                userId: userid,
                planType: 'free',
                questionsPerDay: 1
            });
        }

        // Check if subscription is expired
        if (subscription.isExpired()) {
            subscription.planType = 'free';
            subscription.questionsPerDay = 1;
            subscription.isActive = false;
            await subscription.save();
        }

        // Reset daily count if new day
        subscription.resetDailyCount();

        // Check if user can post question
        if (!subscription.canPostQuestion()) {
            const planType = subscription.planType.toUpperCase();
            const limit = subscription.questionsPerDay;
            return res.status(403).json({
                message: `Daily question limit reached! ${planType} plan allows ${limit} question${limit > 1 ? 's' : ''} per day. Upgrade your plan to post more questions.`,
                currentPlan: subscription.planType,
                dailyLimit: subscription.questionsPerDay,
                usedToday: subscription.questionsUsedToday
            });
        }

        // Parse questiontags if it's a JSON string
        let parsedTags = questiontags;
        if (typeof questiontags === 'string') {
            try {
                parsedTags = JSON.parse(questiontags);
            } catch (e) {
                parsedTags = questiontags.split(' ');
            }
        }

        // Create question data object
        const questionData = {
            questiontitle,
            questionbody,
            questiontags: parsedTags,
            userposted,
            userid,
            hasVideo: hasVideo === 'true' || hasVideo === true,
            video: null
        };

        // If video file is uploaded, add video path
        if (req.file) {
            questionData.video = `/uploads/videos/${req.file.filename}`;
        }

        const postquestion = new Question(questionData);
        await postquestion.save();

        // Increment question count
        subscription.questionsUsedToday += 1;
        await subscription.save();

        console.log(`\n📝 Question posted by user ${userposted}`);
        console.log(`Plan: ${subscription.planType} | Used: ${subscription.questionsUsedToday}/${subscription.questionsPerDay}\n`);
        
        res.status(200).json({ 
            message: "Posted a question successfully",
            question: postquestion,
            questionsRemaining: subscription.planType === 'gold' ? 'Unlimited' : subscription.questionsPerDay - subscription.questionsUsedToday
        });
    } catch (error) {
        console.error('Error posting question:', error);
        res.status(500).json({ 
            message: "Couldn't post a new question",
            error: error.message 
        });
    }
};

export const getallquestion = async (req, res) => {
    try {
        const questionlist = await Question.find().sort({ askedon: -1 });
        res.status(200).json(questionlist)
    } catch (error) {
        console.log(error)
        res.status(404).json({ message: error.message });
        return
    }
};

// Get video questions only
export const getvideoquestions = async (req, res) => {
    try {
        const questionlist = await Question.find({ hasVideo: true }).sort({ askedon: -1 });
        res.status(200).json(questionlist)
    } catch (error) {
        console.log(error)
        res.status(404).json({ message: error.message });
        return
    }
};

// Get text questions only
export const gettextquestions = async (req, res) => {
    try {
        const questionlist = await Question.find({ $or: [{ hasVideo: false }, { hasVideo: { $exists: false } }] }).sort({ askedon: -1 });
        res.status(200).json(questionlist)
    } catch (error) {
        console.log(error)
        res.status(404).json({ message: error.message });
        return
    }
};

export const deletequestion = async (req, res) => {
    const { id: _id } = req.params;
    const userid = req.userid;
    
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send("question unavailable...");
    }
    
    try {
        const question = await Question.findById(_id);
        
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }
        
        // Check if user is the owner of the question
        if (question.userid !== userid) {
            return res.status(403).json({ message: "You can only delete your own questions" });
        }
        
        await Question.findByIdAndDelete(_id);
        console.log(`🗑️ Question deleted by user ${question.userposted}`);
        res.status(200).json({ message: "Question successfully deleted" })
    } catch (error) {
        res.status(404).json({ message: error.message });
        return
    }
};

export const editquestion = async (req, res) => {
    const { id: _id } = req.params;
    const { questiontitle, questionbody, questiontags } = req.body;
    const userid = req.userid;
    
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send("question unavailable...");
    }
    
    try {
        const question = await Question.findById(_id);
        
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }
        
        // Check if user is the owner of the question
        if (question.userid !== userid) {
            return res.status(403).json({ message: "You can only edit your own questions" });
        }
        
        // Update question fields
        const updatedQuestion = {
            questiontitle: questiontitle || question.questiontitle,
            questionbody: questionbody || question.questionbody,
            questiontags: questiontags || question.questiontags
        };
        
        await Question.findByIdAndUpdate(_id, updatedQuestion, { new: true });
        
        console.log(`✏️ Question edited by user ${question.userposted}`);
        res.status(200).json({ 
            message: "Question successfully updated",
            question: updatedQuestion 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
        return
    }
};

export const votequestion = async (req, res) => {
    const { id: _id } = req.params;
    const { value } = req.body;
    const userid = req.userid;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send("question unavailable...");
    }
    try {
        const question = await Question.findById(_id);
        const upindex = question.upvote.findIndex((id) => id === String(userid))
        const downindex = question.downvote.findIndex((id) => id === String(userid))
        if (value === "upvote") {
            if (downindex !== -1) {
                question.downvote = question.downvote.filter((id) => id !== String(userid))
            }
            if (upindex === -1) {
                question.upvote.push(userid);
            } else {
                question.upvote = question.upvote.filter((id) => id !== String(userid))
            }
        } else if (value === "downvote") {
            if (upindex !== -1) {
                question.upvote = question.upvote.filter((id) => id !== String(userid))
            }
            if (downindex  === -1) {
                question.downvote.push(userid);
            } else {
                question.downvote = question.downvote.filter((id) => id !== String(userid))
            }
        }
        await Question.findByIdAndUpdate(_id, question);
        res.status(200).json({ message: "voted successfully.." })

    } catch (error) {
        res.status(404).json({ message: "id not found" });
        return
    }
}