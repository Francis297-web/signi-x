// ===============================
// Signix AI Chatbot - Fixed v2.1
// Reads anon key from supabase.js, no hardcoded key needed
// ===============================
const HISTORY_KEY = "signix_chat_history";
let history = [];
try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch {}

function saveHistory(){ localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20))); }

function bubble(text, sender, win) {
  if(!win) return;
  const div = document.createElement("div");
  div.className = `bot-bubble ${sender}`;
  div.textContent = text;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
  return div;
}

async function callAI(message) {
  const anonKey = window.SUPABASE_ANON_KEY;
  const url = window.SUPABASE_URL || "https://ocfdsuthkdtcpjliuesz.supabase.co";

  if (!anonKey) throw new Error("SUPABASE_ANON_KEY not found - check supabase.js loads before signix.bot.js");

  // Best way: supabase-js 2.50.0 invoke (auto adds auth)
  if (window.supabaseClient?.functions) {
    try {
      let { data, error } = await window.supabaseClient.functions.invoke("signix-bot", {
        body: { message, history: history.slice(-12) }
      });
      if (error || !data?.reply) {
        const r2 = await window.supabaseClient.functions.invoke("chat", {
          body: { message, history: history.slice(-12) }
        });
        data = r2.data; error = r2.error;
      }
      if (!error && data?.reply) return data;
      throw error || new Error("No reply");
    } catch(e){ console.warn("invoke failed, using fetch", e); }
  }

  // Fallback fetch WITH apikey header - this was your bug
  const endpoint = `${url}/functions/v1/chat`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": anonKey,
      "Authorization": `Bearer ${anonKey}`
    },
    body: JSON.stringify({ message, history: history.slice(-12) })
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text}`);
  return JSON.parse(text);
}

function initChat({ winId, inputId, btnId }) {
  const win = document.getElementById(winId);
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!win || !input || !btn) return;

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    
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
      if (data.sources?.length) {
        data.sources.forEach(s => {
          const a = document.createElement("a");
          a.href = s.url; a.target="_blank";
          a.className="small d-block mt-1";
          a.textContent=`▶ ${s.word} by @${s.signer}`;
          win.appendChild(a);
        });
      }
      history.push({ role: "assistant", content: data.reply });
      saveHistory();
    } catch (err) {
      typing?.remove();
      bubble(`Error: ${err.message.slice(0,250)}`, "ai", win);
      console.error(err);
    } finally {
      btn.disabled = false;
      input.focus();
    }
  }

  btn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => { if(e.key==="Enter"){ e.preventDefault(); sendMessage(); } });
}

window.addEventListener("DOMContentLoaded", () => {
  initChat({ winId: "chatWindow", inputId: "chatInput", btnId: "sendBtn" });
  initChat({ winId: "sideChatWindow", inputId: "sideChatInput", btnId: "sideChatSend" });
});
