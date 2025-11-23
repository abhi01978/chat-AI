async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Notes
async function generateNotes() {
  const topic = document.getElementById("notesTopic").value.trim();
  if (!topic) return alert("Enter topic");
  document.getElementById("notesOut").innerText = "Generating...";
  const data = await postJson("/api/notes", { topic });
  document.getElementById("notesOut").innerText = data.success ? data.notes : JSON.stringify(data);
}

// Summary
async function generateSummary() {
  const text = document.getElementById("summaryText").value.trim();
  const length = document.getElementById("summaryLen").value;
  if (!text) return alert("Paste text");
  document.getElementById("summaryOut").innerText = "Generating...";
  const data = await postJson("/api/summary", { text, length });
  document.getElementById("summaryOut").innerText = data.success ? data.summary : JSON.stringify(data);
}

// Doubt
async function solveDoubt() {
  const question = document.getElementById("doubtQuestion").value.trim();
  if (!question) return alert("Type question");
  document.getElementById("doubtOut").innerText = "Solving...";
  const data = await postJson("/api/doubt", { question });
  document.getElementById("doubtOut").innerText = data.success ? data.answer : JSON.stringify(data);
}

// Chat
async function chatAsk() {
  const userMessage = document.getElementById("chatMsg").value.trim();
  if (!userMessage) return alert("Type message");
  document.getElementById("chatOut").innerText = "Thinking...";
  const data = await postJson("/api/chat", { userMessage });
  document.getElementById("chatOut").innerText = data.success ? data.reply : JSON.stringify(data);
}
