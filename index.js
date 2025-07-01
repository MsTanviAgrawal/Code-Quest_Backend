import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import userRoutes from "./routes/user.js"
import questionroutes from "./routes/question.js"
import answerroutes from "./routes/answer.js"

const app = express();
dotenv.config();
app.use(express.json({ limit: "30mb", extended: true }))
app.use(express.urlencoded({ limit: "30mb", extended: true }))
app.use(cors());

app.use("/user", userRoutes);
app.use('/questions', questionroutes)
app.use('/answer',answerroutes)
app.get('/', (req, res) => {
    res.send("Codequest is running perfect")
})

const PORT = process.env.PORT || 5000
const database_url = process.env.MONGODB_URL

mongoose.connect(database_url)
    .then(() => app.listen(PORT, () => { console.log(`server running on port ${PORT}`) }))
    .catch((err) => console.log(err.message))

// const PORT = process.env.PORT || 5000
// const DB_URL = process.env.MONGODB_URL

// mongoose
//   .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() =>
//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
//   )
//   .catch((err) => console.log(err.message));

// mongoose.connect(database_url)
//     .then(() => app.listen(PORT, () => { console.log(`server running on port ${PORT}`) }))
//     .catch((err) => console.log(err.message)) 