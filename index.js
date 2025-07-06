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
//   origin: "https://codequest93.netlify.app", // Netlify domain
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




import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.js";
import questionroutes from "./routes/question.js";
import answerroutes from "./routes/answer.js";

import http from "http";               // ⬅️ Required for Socket.IO
import { Server } from "socket.io";    // ⬅️ Import socket.io

dotenv.config();

const app = express();
const server = http.createServer(app); // ⬅️ Create HTTP server from Express app

// SOCKET.IO setup
const io = new Server(server, {
  cors: {
    origin: "https://codequest93.netlify.app", // or "*" during testing
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  }
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("send-notification", (data) => {
    console.log("📢 Notification sent:", data);
    socket.broadcast.emit("receive-notification", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Middleware
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.use(cors({
  origin: "https://codequest93.netlify.app",
  methods: ["GET", "POST", "PATCH"],
  credentials: true,
}));

// Routes
app.use("/user", userRoutes);
app.use('/questions', questionroutes);
app.use('/answer', answerroutes);

app.get('/', (req, res) => {
  res.send("Codequest is running perfect");
});

// DB + Server start
const PORT = process.env.PORT || 5000;
const database_url = process.env.MONGODB_URL;

mongoose.connect(database_url)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server with Socket.IO running on port ${PORT}`);
    });
  })
  .catch((err) => console.log("❌ MongoDB connection error:", err.message));
