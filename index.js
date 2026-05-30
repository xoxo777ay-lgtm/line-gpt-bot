import express from "express";
import axios from "axios";

const app = express();

app.use(express.json());

const LINE_TOKEN = process.env.LINE_TOKEN;
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL =
  process.env.DIFY_API_URL || "https://api.dify.ai/v1/chat-messages";

// LINEユーザーごとの会話保持
const conversationStore = new Map();

app.get("/", (req, res) => {
  res.send("LINE x Dify bot is running.");
});

app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];

  for (const event of events) {
    try {
      if (event.type !== "message") continue;
      if (event.message.type !== "text") continue;

      const userMessage = event.message.text;
      const replyToken = event.replyToken;
      const lineUserId = event.source?.userId || "line-user";

      const conversationId =
        conversationStore.get(lineUserId) || "";

      console.log("===== REQUEST =====");
      console.log("userMessage:", userMessage);
      console.log("replyToken:", replyToken);

      // Difyへ送信
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

      const answer =
        difyRes.data.answer ||
        "うまく返答できませんでした。";

      console.log("===== RESPONSE =====");
      console.log("answer:", answer);

      // conversation保存
      if (difyRes.data.conversation_id) {
        conversationStore.set(
          lineUserId,
          difyRes.data.conversation_id
        );
      }

      // LINE返信
      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken: replyToken,
          messages: [
            {
              type: "text",
              text: answer,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${LINE_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("LINE reply success");
    } catch (error) {
      console.error(
        "ERROR:",
        error.response?.data || error.message
      );
    }
  }

  // ← ここ重要
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
