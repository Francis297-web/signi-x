// ===============================
// Signix AI Chatbot - Improved v2
// Supports: main chat + side menu, retrieval, history persistence
// Compliant with @supabase/supabase-js@2.50.0 UMD
// ===============================

const AI_ENDPOINT = "https://ocfdsuthkdtcpjliuesz.supabase.co/functions/v1/chat"; // keep 'chat' if that's your deployed name, or change to 'signix-bot'
const HISTORY_KEY = "signix_chat_history";
const MAX_HISTORY = 12;

// Load persisted history
let history = [];
try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch {}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20)));
}

function bubble(text, sender, win) {
  if (!win) return;
  const div = document.createElement("div");
  div.className = `bot-bubble ${sender}`; // works with your existing CSS
  div.textContent = text;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
  return div;
}

function renderSources(sources, win) {
  if (!sources?.length || !win) return;
  sources.forEach(s => {
    const a = document.createElement("a");
    a.href = s.url;
    a.target = "_blank";
    a.className = "small d-block mt-1 text-decoration-none";
    a.innerHTML = `▶ <b>${s.word}</b> by @${s.signer} <span class="badge bg-light border text-dark ms-1">Learn</span>`;
    win.appendChild(a);
  });
  win.scrollTop = win.scrollHeight;
}

async function callAI(message) {
  // 1. Try modern supabaseClient (uses anon key + auth automatically) - best for 2.50.0
  if (window.supabaseClient?.functions?.invoke) {
    try {
      // try signix-bot first, then fallback to chat
      let { data, error } = await window.supabaseClient.functions.invoke("signix-bot", {
        body: { message, history: history.slice(-MAX_HISTORY) },
      });
      if (error || !data) {
        const res2 = await window.supabaseClient.functions.invoke("chat", {
          body: { message, history: history.slice(-MAX_HISTORY) },
        });
        data = res2.data; error = res2.error;
      }
      if (!error && data?.reply) return data; // returns {reply, sources}
    } catch (e) {
      console.warn("invoke failed, falling back to fetch", e);
    }
  }

  // 2. Fallback direct fetch (your old method)
  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history: history.slice(-MAX_HISTORY) }),
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.json(); // {reply, sources}
}

function initChat({ winId, inputId, btnId }) {
  const win = document.getElementById(winId);
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!win || !input || !btn) return;

  // restore last 4 messages in this window
  history.slice(-4).forEach(m => {
    bubble(m.content, m.role === "user" ? "user" : "ai", win);
  });

  async function sendMessage() {
    const message = input.value.trim();
    if (!message || message.length > 1000) return;

    bubble(message, "user", win);
    history.push({ role: "user", content: message });
    saveHistory();
    input.value = "";
    btn.disabled = true;

    const typing = bubble("Signix AI is typing...", "ai", win);

    try {
      const data = await callAI(message);
      typing?.remove();
      bubble(data.reply, "ai", win);
      renderSources(data.sources, win);
      history.push({ role: "assistant", content: data.reply });
      saveHistory();
    } catch (error) {
      typing?.remove();
      bubble("⚠ Unable to reach Signix AI. Please try again.", "ai", win);
      console.error(error);
    } finally {
      btn.disabled = false;
      input.focus();
    }
  }

  btn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); sendMessage(); }
  });
}

// Init both chat instances - main + side menu
window.addEventListener("DOMContentLoaded", () => {
  initChat({ winId: "chatWindow", inputId: "chatInput", btnId: "sendBtn" });
  initChat({ winId: "sideChatWindow", inputId: "sideChatInput", btnId: "sideChatSend" });
  
  // focus main input if present
  document.getElementById("chatInput")?.focus();
  document.getElementById("sideChatInput")?.focus();
});
