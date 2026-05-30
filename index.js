import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const LINE_TOKEN = process.env.LINE_TOKEN;
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL =
  process.env.DIFY_API_URL || "https://api.dify.ai/v1/chat-messages";

const conversationStore = new Map();

app.get("/", (req, res) => {
  res.send("LINE x Dify bot is running.");
});

app.post("/webhook", async (req, res) => {
  res.status(200).send("OK");

  const events = req.body.events || [];

  for (const event of events) {
    if (event.type !== "message") continue;
    if (event.message.type !== "text") continue;

    const userMessage = event.message.text;
    const replyToken = event.replyToken;
    const lineUserId = event.source?.userId || "line-user";
    const conversationId = conversationStore.get(lineUserId) || "";

    try {
      const difyRes = await axios.post(
        DIFY_API_URL,
        {
          inputs: {},
          query: userMessage,
          response_mode: "blocking",
          user: lineUserId,
          conversation_id: conversationId,
        },
        {
          headers: {
            Authorization: `Bearer ${DIFY_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const answer = difyRes.data.answer || "うまく返答できませんでした。";

      if (difyRes.data.conversation_id) {
        conversationStore.set(lineUserId, difyRes.data.conversation_id);
      }

      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken,
          messages: [{ type: "text", text: answer }],
        },
        {
          headers: {
            Authorization: `Bearer ${LINE_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("ERROR:", error.response?.data || error.message);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
