import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/Auth";
import chatRoutes from "./routes/Chat";
import appointmentRoutes from "./routes/Appointments"; // Add this

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/appointments", appointmentRoutes); // Add this

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
