import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const LINE_CHANNEL_ACCESS_TOKEN = "hY0eeIvLyCI3J7wN0Br5cfYKPQI7bWMR3aHIKkH9JojSGwwgOECdxsDgJAu1eTQnp7vGvcjxusoCEFr2p06u2Ijgk5UktQ6dsf/dLZ0alBzVRmcKEIKnoNCasdhfUtCfeMQvPzx6cJnll0msVmrnYwdB04t89/1O/w1cDnyilFU=";
const DIFY_API_KEY = "app-JiVYwUws27NIRP6c0VfkE3Eo";

// 本番はDB推奨。まずは簡易保存でOK
const conversationStore = new Map();

app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];

  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text") continue;

    const userMessage = event.message.text;
    const replyToken = event.replyToken;
    const lineUserId = event.source?.userId || "line-user";

    // 前回の conversation_id を取得
    const conversationId = conversationStore.get(lineUserId) || "";

    try {
      const difyRes = await axios.post(
        "https://api.dify.ai/v1/chat-messages",
        {
          inputs: {},
          query: userMessage,
          response_mode: "blocking",
          user: lineUserId,
          conversation_id: conversationId
        },
        {
          headers: {
            Authorization: `Bearer ${DIFY_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 新しい conversation_id を保存
      const newConversationId = difyRes.data.conversation_id;
      if (newConversationId) {
        conversationStore.set(lineUserId, newConversationId);
      }

      const replyText = difyRes.data.answer || "うまく返答できませんでした。";

      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken,
          messages: [{ type: "text", text: replyText }],
        },
        {
          headers: {
            Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error(
        "Dify/LINE error:",
        error.response?.data || error.message
      );
    }
  }

  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
