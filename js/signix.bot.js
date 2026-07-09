// js/signix-bot.js - Free AI for Signix Bot - uses Pollinations free API
const SIGNIX_SYSTEM = `You are Signix AI, the friendly assistant for Signix, a reference platform for sign languages starting with Kenyan Sign Language KSL.
Rules: Be concise, helpful, kind. If asked about a sign, give handshape, movement, context and regional variant if known. If you do not know, say so and suggest uploading. Never claim to be another model.`;

async function callFreeAI(userPrompt, history = []) {
  // Build messages for OpenAI compatible endpoint
  const messages = [
    { role: "system", content: SIGNIX_SYSTEM },
   ...history.slice(-6), // keep last 6 turns
    { role: "user", content: userPrompt }
  ];

  // Option A: Pollinations free, no key, CORS enabled
  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai", // auto-routed to best free model
      messages,
      temperature: 0.7,
      max_tokens: 400
    })
  });

  if (!res.ok) throw new Error("API error " + res.status);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "Could not get a reply.";
}

// UI glue - works with your existing offcanvas bot markup
(function(){
  const win = document.getElementById('chatWindow');
  const input = document.getElementById('chatInput');
  const btn = document.getElementById('sendBtn');
  if(!win ||!input ||!btn) return;

  const history = [];
  let typingEl = null;

  function addBubble(text, who){
    const d = document.createElement('div');
    d.className = 'bot-bubble ' + who;
    d.textContent = text;
    win.appendChild(d);
    win.scrollTop = win.scrollHeight;
    return d;
  }
  function showTyping(){
    typingEl = document.createElement('div');
    typingEl.className = 'bot-bubble ai';
    typingEl.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Thinking...';
    win.appendChild(typingEl);
    win.scrollTop = win.scrollHeight;
  }
  function hideTyping(){ if(typingEl){ typingEl.remove(); typingEl = null; } }

  async function send(){
    const q = input.value.trim();
    if(!q) return;
    addBubble(q, 'user');
    input.value = '';
    history.push({role:'user', content:q});
    showTyping();
    btn.disabled = true;
    try{
      const reply = await callFreeAI(q, history);
      hideTyping();
      addBubble(reply, 'ai');
      history.push({role:'assistant', content:reply});
    }catch(e){
      hideTyping();
      addBubble("I am offline right now. Try again, or ask about Habari, Asante, or how to upload.", 'ai');
      console.error(e);
    }finally{
      btn.disabled = false;
    }
  }

  btn.addEventListener('click', send);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') send(); });
  document.querySelectorAll('.quick-prompt,.quickSearch').forEach(b=>{
    b.addEventListener('click', ()=>{ input.value = b.textContent; send(); });
  });

  // expose for other scripts
  window.SignixBot = { send, callFreeAI };
})();
