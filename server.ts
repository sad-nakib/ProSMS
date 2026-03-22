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

  // Balance Check API
  app.get("/api/balance", async (req, res) => {
    const apiKey = process.env.SMS_API_KEY || "5a42c899";
    const baseUrl = "https://smsfly.top/apibalance.php";

    try {
      const apiUrl = `${baseUrl}?apikey=${apiKey}`;
      console.log(`Checking balance via: ${apiUrl}`);
      const response = await fetch(apiUrl);
      const textResponse = (await response.text()).trim();
      console.log(`Raw Balance Response: "${textResponse}"`);

      let balanceValue: any = textResponse;
      let limitValue = 1000;

      try {
        // Handle JSON response like {"limit": 19}
        if (textResponse.startsWith('{')) {
          const jsonData = JSON.parse(textResponse);
          if (jsonData && typeof jsonData.limit !== 'undefined') {
            balanceValue = jsonData.limit;
            limitValue = jsonData.limit;
          }
        } else {
          // Handle plain number response
          const parsed = parseFloat(textResponse);
          if (!isNaN(parsed)) {
            balanceValue = parsed;
            limitValue = parsed;
          }
        }
      } catch (e) {
        console.error("Parsing error:", e);
      }
      
      res.json({ 
        success: true, 
        balance: balanceValue, 
        currency: "SMS", 
        limit: limitValue 
      });
    } catch (error) {
      console.error("Balance Check Error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch balance" });
    }
  });

  // API Routes
  app.post("/api/send-sms", async (req, res) => {
    const { to, body } = req.body;
    const apiKey = process.env.SMS_API_KEY || "5a42c899"; // Use provided key as fallback
    const baseUrl = "https://smsfly.top/sms.php";

    try {
      // Clean the phone number: remove +88 or 88 if present, ensure it starts with 01
      let cleanNumber = to.trim().replace(/^\+?88/, '');
      if (!cleanNumber.startsWith('01')) {
        // If it doesn't start with 01 but has 10 digits, it's likely missing the leading 0
        if (cleanNumber.length === 10 && cleanNumber.startsWith('1')) {
          cleanNumber = '0' + cleanNumber;
        }
      }

      // The API uses GET with query parameters: key, number, msg
      const params = new URLSearchParams({
        key: apiKey,
        number: cleanNumber,
        msg: body
      });

      const apiUrl = `${baseUrl}?${params.toString()}`;
      
      console.log(`Sending SMS to ${cleanNumber} (original: ${to}) via ${baseUrl}`);
      
      const response = await fetch(apiUrl);
      const textResponse = await response.text();

      console.log("SMS API Response:", textResponse);

      res.json({ 
        success: true, 
        message: "SMS request processed", 
        rawResponse: textResponse,
        formattedNumber: cleanNumber
      });
    } catch (error) {
      console.error("SMS Sending Error:", error);
      res.status(500).json({ 
        success: false, 
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
