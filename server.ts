import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health Check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Balance Check API
  app.get("/api/balance", async (req, res) => {
    const apiKey = process.env.SMS_API_KEY || "5a42c899";
    const baseUrl = "https://smsfly.top/apibalance.php";

    try {
      // Use 'key' instead of 'apikey' for consistency
      const apiUrl = `${baseUrl}?key=${apiKey}`;
      console.log(`Checking balance via: ${apiUrl}`);
      const response = await fetch(apiUrl);
      const textResponse = (await response.text()).trim();
      console.log(`Raw Balance Response: "${textResponse}"`);

      let balanceValue: any = textResponse;
      let limitValue = 0;
      let success = false;
      let status = "error";

      try {
        // Handle JSON response like {"limit": 19} or {"status": "error", "message": "..."}
        if (textResponse.startsWith('{')) {
          const jsonData = JSON.parse(textResponse);
          if (jsonData && typeof jsonData.limit !== 'undefined') {
            balanceValue = jsonData.limit;
            limitValue = jsonData.limit;
            success = true;
            status = "success";
          } else if (jsonData.status === 'error') {
            balanceValue = jsonData.message || "API Error";
            success = false;
            status = "error";
          }
        } else {
          // Handle plain number response or error codes
          const parsed = parseFloat(textResponse);
          if (!isNaN(parsed)) {
            balanceValue = parsed;
            limitValue = parsed;
            success = true;
            status = "success";
          } else {
            // Check for common error codes
            if (textResponse === "101") balanceValue = "Invalid API Key";
            else if (textResponse === "102") balanceValue = "Invalid Number";
            else if (textResponse === "103") balanceValue = "Insufficient Balance";
            success = false;
            status = "error";
          }
        }
      } catch (e) {
        console.error("Parsing error:", e);
      }
      
      res.json({ 
        success, 
        status,
        balance: balanceValue, 
        currency: "SMS", 
        limit: limitValue,
        raw: textResponse
      });
    } catch (error) {
      console.error("Balance Check Error:", error);
      res.status(500).json({ success: false, status: "error", error: "Failed to fetch balance" });
    }
  });

  // API Routes
  app.post("/api/send-sms", async (req, res) => {
    const { to, body } = req.body;
    const apiKey = process.env.SMS_API_KEY || "5a42c899";
    const baseUrl = "https://smsfly.top/sms.php";

    try {
      // Clean the phone number: Ensure it starts with 8801
      let cleanNumber = to.trim().replace(/^\+/, '');
      
      // If it starts with 01, prepend 88
      if (cleanNumber.startsWith('01') && cleanNumber.length === 11) {
        cleanNumber = '88' + cleanNumber;
      } 
      // If it starts with 1, prepend 880
      else if (cleanNumber.startsWith('1') && cleanNumber.length === 10) {
        cleanNumber = '880' + cleanNumber;
      }
      // If it starts with 8801, keep it
      else if (cleanNumber.startsWith('8801') && cleanNumber.length === 13) {
        // already correct
      }
      // Fallback: if it's 11 digits and starts with 0, assume it's a local number
      else if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
        cleanNumber = '88' + cleanNumber;
      }

      const params = new URLSearchParams({
        key: apiKey,
        number: cleanNumber,
        msg: body
      });

      const apiUrl = `${baseUrl}?${params.toString()}`;
      
      console.log(`Sending SMS to ${cleanNumber} (original: ${to}) via ${baseUrl}`);
      
      const response = await fetch(apiUrl);
      const textResponse = (await response.text()).trim();

      console.log("SMS API Response:", textResponse);

      let isSuccess = false;
      let apiMessage = textResponse;

      try {
        if (textResponse.startsWith('{')) {
          const jsonData = JSON.parse(textResponse);
          if (jsonData.status === 'success' || jsonData.code === 100 || jsonData.success === true) {
            isSuccess = true;
            apiMessage = jsonData.message || "SMS sent successfully";
          } else if (jsonData.status === 'error' || jsonData.error) {
            isSuccess = false;
            apiMessage = jsonData.message || jsonData.error || textResponse;
          }
        } else {
          isSuccess = textResponse === "100" || textResponse.toLowerCase().includes("success") || textResponse.toLowerCase().includes("sent");
        }
      } catch (e) {
        isSuccess = textResponse === "100" || textResponse.toLowerCase().includes("success") || textResponse.toLowerCase().includes("sent");
      }

      res.json({ 
        success: isSuccess, 
        status: isSuccess ? "success" : "error",
        message: isSuccess ? "SMS sent successfully" : `SMS failed: ${apiMessage}`, 
        rawResponse: textResponse,
        formattedNumber: cleanNumber
      });
    } catch (error) {
      console.error("SMS Sending Error:", error);
      res.status(500).json({ 
        success: false, 
        status: "error",
        error: error instanceof Error ? error.message : "Failed to send SMS" 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
