import React, { useState, useEffect } from "react";
import { Button, Textarea, Card, CardContent, Input, Select, Option } from "@/components/ui";
import axios from "axios";
import { WorldIDWidget } from "@worldcoin/id"; // World ID SDK
import { ethers } from "ethers"; // For handling payments
import emailjs from "emailjs-com"; // For sending feedback via EmailJS

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const ONE_TIME_USAGE_COST = ethers.utils.parseEther("0.01"); // 0.01 World Coin

export default function WorldChainAIBot() {
  const [userId, setUserId] = useState("");
  const [description, setDescription] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [hasPaid, setHasPaid] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [appDetails, setAppDetails] = useState({
    behavior: "",
    style: "",
    color: "",
    category: "",
    pricing: "free",
  });

  // World ID Verification
  const handleWorldIDVerification = (verificationResponse) => {
    if (verificationResponse.success) {
      const verifiedUserId = verificationResponse.userId;
      setUserId(verifiedUserId);
      localStorage.setItem("userId", verifiedUserId);
      alert("World ID verification successful!");
    } else {
      alert("World ID verification failed. Please try again.");
    }
  };

  // Handle app generation
  const handleGenerate = async () => {
    if (!userId) {
      alert("Please verify your World ID first.");
      return;
    }

    if (usageCount >= 1 && !hasPaid) {
      alert("Please pay 0.01 World Coin for one-time access.");
      return;
    }

    if (appDetails.pricing === "paid" && !hasPaid) {
      alert("Only paid users can create paid apps.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-app`, {
        description,
        userId,
        ...appDetails,
      });

      if (response.data && response.data.code) {
        // Simulate AI writing the code slowly
        let code = "";
        for (let i = 0; i < response.data.code.length; i++) {
          setTimeout(() => {
            code += response.data.code[i];
            setGeneratedCode(code);
          }, i * 10);
        }
      } else {
        throw new Error("No code generated.");
      }

      setUsageCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error generating app:", error);
      alert(error.message || "An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle payment using World App
  const handlePayment = async () => {
    const confirmPayment = window.confirm(`Are you sure you want to pay 0.01 World Coin for one-time access?`);
    if (!confirmPayment) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const transaction = await signer.sendTransaction({
        to: process.env.NEXT_PUBLIC_WALLET_ADDRESS,
        value: ONE_TIME_USAGE_COST,
      });

      await transaction.wait();
      setHasPaid(true);
      alert("Payment successful! You now have one-time access.");

      // Record transaction on World Chain cloud
      await axios.post(`${API_BASE_URL}/record-transaction`, {
        userId,
        transactionHash: transaction.hash,
        amount: ONE_TIME_USAGE_COST.toString(),
      });
    } catch (error) {
      console.error("Payment error:", error);
      alert(error.message || "An error occurred during payment.");
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      alert("Please enter your feedback before submitting.");
      return;
    }

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID, // EmailJS service ID
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, // EmailJS template ID
        {
          feedback,
          userId,
        },
        process.env.NEXT_PUBLIC_EMAILJS_USER_ID // EmailJS user ID
      );

      alert("Thank you for your feedback!");
      setFeedback("");
    } catch (error) {
      console.error("Feedback error:", error);
      alert("An error occurred while submitting feedback.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* World ID Verification */}
      {!userId && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Verify Your World ID</h2>
          <WorldIDWidget
            actionId={process.env.NEXT_PUBLIC_WORLD_ID_ACTION_ID}
            onSuccess={handleWorldIDVerification}
            onError={(error) => console.error("World ID Error:", error)}
          />
        </div>
      )}

      {/* App Generator */}
      {userId && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-4">WorldChain AI App Generator</h2>

            {/* App Creation Form */}
            <div className="space-y-4">
              <Input
                placeholder="App Behavior (e.g., 'A to-do list app')"
                value={appDetails.behavior}
                onChange={(e) => setAppDetails({ ...appDetails, behavior: e.target.value })}
              />
              <Input
                placeholder="App Style (e.g., 'Minimalist')"
                value={appDetails.style}
                onChange={(e) => setAppDetails({ ...appDetails, style: e.target.value })}
              />
              <Input
                placeholder="App Color (e.g., 'Blue')"
                value={appDetails.color}
                onChange={(e) => setAppDetails({ ...appDetails, color: e.target.value })}
              />
              <Select
                value={appDetails.category}
                onChange={(e) => setAppDetails({ ...appDetails, category: e.target.value })}
              >
                <Option value="mini-world">Mini World App</Option>
                <Option value="external-world">External World App</Option>
              </Select>
              <Select
                value={appDetails.pricing}
                onChange={(e) => setAppDetails({ ...appDetails, pricing: e.target.value })}
              >
                <Option value="free">Free App</Option>
                <Option value="paid">Paid App</Option>
              </Select>
            </div>

            {/* Generate Button */}
            <Button onClick={handleGenerate} disabled={loading} className="mt-4">
              {loading ? "Generating..." : "Generate App"}
            </Button>

            {/* Payment Button */}
            {!hasPaid && usageCount >= 1 && (
              <Button onClick={handlePayment} className="mt-4">
                Pay 0.01 World Coin for One-Time Access
              </Button>
            )}

            {/* Generated Code */}
            {generatedCode && (
              <div className="mt-4 bg-gray-900 text-white p-3 rounded overflow-auto">
                <pre>
                  <code>{generatedCode}</code>
                </pre>
              </div>
            )}

            {/* Feedback Form */}
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-2">Feedback</h3>
              <Textarea
                placeholder="Your feedback..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mb-2"
              />
              <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
