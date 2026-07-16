// ===============================
// Signix AI Chatbot
// ===============================

const chatWindow = document.getElementById("chatWindow");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

// Change this only if your project ID changes
const AI_ENDPOINT =
  "https://ocfdsuthkdtcpjliuesz.supabase.co/functions/v1/chat";

const history = [];

// -------------------------------
// Create Chat Bubble
// -------------------------------
function bubble(text, sender) {
  const div = document.createElement("div");
  div.className = `bot-bubble ${sender}`;
  div.textContent = text;

  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return div;
}

// -------------------------------
// Call Gemini via Supabase
// -------------------------------
async function callAI(message) {
  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  const data = await response.json();

  return data.reply;
}

// -------------------------------
// Send Message
// -------------------------------
async function sendMessage() {
  const message = chatInput.value.trim();

  if (!message) return;

  bubble(message, "user");

  history.push({
    role: "user",
    content: message,
  });

  chatInput.value = "";

  sendBtn.disabled = true;

  const typing = bubble("Signix AI is typing...", "ai");

  try {
    const reply = await callAI(message);

    typing.remove();

    bubble(reply, "ai");

    history.push({
      role: "assistant",
      content: reply,
    });

  } catch (error) {

    typing.remove();

    bubble(
      "⚠️ Unable to reach Signix AI. Please try again in a moment.",
      "ai"
    );

    console.error(error);

  } finally {

    sendBtn.disabled = false;

    chatInput.focus();

  }
}

// -------------------------------
// Events
// -------------------------------
sendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// Focus input on page load
window.addEventListener("load", () => {
  chatInput.focus();
});
