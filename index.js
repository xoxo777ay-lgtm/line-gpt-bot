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
  const events = req.body.events;

  for (const event of events) {
    if (event.type === "message") {
      const userMessage = event.message.text;

      const difyRes = await axios.post(
        "https://api.dify.ai/v1/chat-messages",
        {
          inputs: {},
          query: userMessage,
          response_mode: "blocking",
          user: "user",
        },
        {
          headers: {
            Authorization: `Bearer ${DIFY_API_KEY}`,
          },
        }
      );

      const reply = difyRes.data.answer;

      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: reply }],
        },
        {
          headers: {
            Authorization: `Bearer ${LINE_TOKEN}`,
          },
        }
      );
    }
  }

  res.send("OK");
});

app.listen(3000, () => console.log("Running"));
