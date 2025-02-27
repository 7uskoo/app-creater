// server.js (Backend)
require("dotenv").config(); // Load environment variables
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Email address from environment variables
    pass: process.env.EMAIL_PASSWORD, // Email password from environment variables
  },
});

// Endpoint to handle feedback
app.post("/send-feedback", async (req, res) => {
  const { feedback, userId } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender email
    to: "creatorminiapp@gmail.com", // Receiver email
    subject: "New Feedback from WorldChain AI App Generator",
    text: `Feedback from User ID: ${userId}\n\n${feedback}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Feedback sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send feedback." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
