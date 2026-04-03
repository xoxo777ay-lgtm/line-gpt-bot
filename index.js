import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const LINE_TOKEN = "hY0eeIvLyCI3J7wN0Br5cfYKPQI7bWMR3aHIKkH9JojSGwwgOECdxsDgJAu1eTQnp7vGvcjxusoCEFr2p06u2Ijgk5UktQ6dsf/dLZ0alBzVRmcKEIKnoNCasdhfUtCfeMQvPzx6cJnll0msVmrnYwdB04t89/1O/w1cDnyilFU=";
const DIFY_API_KEY = "app-o5FUA8X6aiGk6dNaqca1fTy2";

app.post("/webhook", async (req, res) => {
  const event = req.body.events?.[0];

  if (!event || event.type !== "message") {
    return res.sendStatus(200);
  }

  const userText = event.message.text;
  const replyToken = event.replyToken;

  const dify = await axios.post(
    "https://api.dify.ai/v1/chat-messages",
    {
      inputs: {},
      query: userText,
      user: "line-user"
    },
    {
      headers: {
        Authorization: `Bearer ${DIFY_API_KEY}`
      }
    }
  );

  const replyText = dify.data.answer;

  await axios.post(
    "https://api.line.me/v2/bot/message/reply",
    {
      replyToken: replyToken,
      messages: [{ type: "text", text: replyText }]
    },
    {
      headers: {
        Authorization: `Bearer ${LINE_TOKEN}`
      }
    }
  );

  res.sendStatus(200);
});

app.listen(3000);
