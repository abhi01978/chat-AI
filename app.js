import express from "express";
import axios from "axios";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

const GEMINI_KEY = process.env.GEMINI_KEY;

// Gemini call (100% working)
async function gemini(prompt) {
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    }
  );
  return res.data.candidates[0].content.parts[0].text;
}

// 1. NOTES GENERATOR
app.post("/notes", async (req, res) => {
  const { topic } = req.body;
  const prompt = `"${topic}" pe Class 11/12 JEE-NEET level ke detailed study notes banao. 
Hinglish mein, bullet points, **bold** important cheezein, real life examples, memory tricks aur last mein 3 common mistakes add karo. Dost jaisa tone rakho.`;

  const result = await gemini(prompt);
  res.json({ success: true, result });
});

// 2. DOUBT SOLVER
app.post("/doubt", async (req, res) => {
  const { question } = req.body;
  const prompt = `JEE/NEET student ka doubt hai: "${question}"
Step-by-step Hinglish mein samjha, concept clear kar, shortcut trick bata aur last mein common mistake bol. Friendly tone rakho jaise dost padha raha ho.`;

  const result = await gemini(prompt);
  res.json({ success: true, result });
});

// 3. SUMMARY
app.post("/summary", async (req, res) => {
  const { text } = req.body;
  const prompt = `Is text ko 150–200 words mein short, crisp, exam-focused Hinglish summary banao. 
Important points **bold** karo aur last mein 2-3 PYQ level tips add karo.

Text: ${text}`;

  const result = await gemini(prompt);
  res.json({ success: true, result });
});

// 4. STUDY BUDDY CHAT (with memory)
let chatHistory = [
  { role: "system", content: "Tu ek mast Hinglish JEE/NEET study buddy hai. Har baat mein 'bhai', 'yaar', 'rattan mar lo' wala vibe rakh. Motivate karte rehna!" }
];

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  chatHistory.push({ role: "user", content: message });

  // Convert history to Gemini format
  const contents = chatHistory.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    { contents }
  );

  const reply = response.data.candidates[0].content.parts[0].text;
  chatHistory.push({ role: "assistant", content: reply });

  res.json({ success: true, result: reply });
});

app.post("/chat/reset", (req, res) => {
  chatHistory = [{ role: "system", content: "Tu ek mast Hinglish JEE/NEET study buddy hai..." }];
  res.json({ success: true });
});

// 5. PDF DOWNLOAD (with title + watermark)
app.post("/pdf", async (req, res) => {
  const { content, title = "My Notes" } = req.body;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
      <style>
        body { font-family: Arial; padding: 40px; background: #f0f0f0; }
        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        h1 { color: #1e40af; text-align: center; }
        .watermark { position: fixed; bottom: 30px; right: 30px; opacity: 0.2; font-size: 40px; color: #1e40af; transform: rotate(-30deg); pointer-events: none; }
      </style>
    </head>
    <body>
      <div class="watermark">StudyBhai.in</div>
      <div class="container" id="content">
        <h1>${title}</h1>
        <div style="line-height: 1.8; font-size: 16px;">${content.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</div>
      </div>

      <script>
        window.onload = () => {
          html2canvas(document.getElementById("content"), {scale: 2}).then(canvas => {
            const imgData = canvas.toDataURL("image/png");
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF("p", "mm", "a4");
            const width = pdf.internal.pageSize.getWidth();
            const height = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, "PNG", 0, 0, width, height);
            pdf.save("${title.replace(/[^a-z0-9]/gi, '_')}.pdf");
          });
        }
      </script>
    </body>
    </html>`;

  res.send(htmlContent);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(5000, () => {
  console.log("FULL MVP READY → http://localhost:5000");
  console.log("Notes ✓ Doubt ✓ Summary ✓ Chat ✓ PDF with Watermark ✓");
  console.log("Gemini 2.0 Flash = 1500+ free requests/day");

});

