// import express from "express"
// import mongoose from "mongoose"
// import cors from "cors"
// import dotenv from "dotenv"
// import userRoutes from "./routes/user.js"
// import questionroutes from "./routes/question.js"
// import answerroutes from "./routes/answer.js"

// dotenv.config();
// export const googleLogin = (authData) => API.post('/user/google-login', authData);

// const app = express();

// app.use(express.json({ limit: "30mb", extended: true }))
// app.use(express.urlencoded({ limit: "30mb", extended: true }))

// // app.use(cors());

// app.use(cors({
//   origin: ['https://codequest93.netlify.app', 'http://localhost:5173'],
//   methods: ["GET", "POST", "PATCH"],
//   credentials: true
// }));

// app.use("/user", userRoutes);
// app.use('/questions', questionroutes)
// app.use('/answer',answerroutes)
// app.get('/', (req, res) => {
//     res.send("Codequest is running perfect")
// })

// const PORT = process.env.PORT || 5000
// const database_url = process.env.MONGODB_URL

// mongoose.connect(database_url)
//     .then(() => app.listen(PORT, () => { console.log(`server running on port ${PORT}`) }))
//     .catch((err) => console.log(err.message))


import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.js";
import questionroutes from "./routes/question.js";
import answerroutes from "./routes/answer.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://codequest93.netlify.app"
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS Not Allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.use("/user", userRoutes);
app.use("/questions", questionroutes);
app.use("/answer", answerroutes);

app.get("/", (req, res) => {
  res.send("Codequest is running perfect");
});

const PORT = process.env.PORT || 5000;
const database_url = process.env.MONGODB_URL;

mongoose.connect(database_url)
  .then(() => app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  }))
  .catch((err) => console.log(err.message));



