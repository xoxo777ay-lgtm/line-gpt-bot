import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const LINE_TOKEN = process.env.LINE_TOKEN;
const DIFY_API_KEY = process.env.DIFY_API_KEY;

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/webhook", async (req, res) => {
  // まず先に 200 を返す
  res.status(200).send("OK");

  try {
    const events = req.body?.events || [];

    for (const event of events) {
      if (event.type !== "message") continue;
      if (event.message?.type !== "text") continue;

      const userMessage = event.message.text;

      const difyRes = await axios.post(
        "https://api.dify.ai/v1/chat-messages",
        {
          inputs: {},
          query: userMessage,
          response_mode: "blocking",
          user: event.source?.userId || "line-user"
        },
        {
          headers: {
            Authorization: `Bearer ${DIFY_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const reply = difyRes.data.answer || "返信できませんでした。";

      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: reply }]
        },
        {
          headers: {
            Authorization: `Bearer ${LINE_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );
    }
  } catch (error) {
    console.error("Webhook error:", error.response?.data || error.message);
  }
});

app.listen(3000, () => console.log("Running"));
