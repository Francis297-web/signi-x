// bot.js - Signix Relevant Bot - no fake data
const SIGNIX_KB = [
  {
    q: ["habari","jambo","how are you","hujambo"],
    a: "**Habari (How are you)** in KSL:\nHandshape: Open B-hand, palm in, at chest level. Movement: Small forward push with friendly eye contact. Variant: Nod slightly. Check Learn > Greetings for video."
  },
  {
    q: ["karibu","welcome"],
    a: "**Karibu (Welcome)**:\nBoth open hands, palms up, moving inward toward chest. Means 'you are welcome here'. Use for guests, classroom."
  },
  {
    q: ["asante","thank","asante sana","thanks"],
    a: "**Asante / Asante sana (Thank you very much)**:\nFlat hand from chin moving forward and down. For 'sana' add second hand emphasizing. Always caption it."
  },
  {
    q: ["upload","how to upload","publish","post video"],
    a: "To upload (real upload only):\n1. Go to Upload > Choose 60s max video\n2. Good lighting, plain background, show hands clearly\n3. Fill: Sign Word, Category, Language = KSL, Your username\n4. Add English + Swahili caption\n5. Click Publish. It appears instantly on Creators feed. Reviewed by Deaf moderator within 24h."
  },
  {
    q: ["verify","verified","verification","blue tick"],
    a: "To get verified on Signix:\n- 5 approved uploads\n- 100% captioned\n- Fluency check by Deaf moderator\n- No rejected videos. Verified creators show on top of feed."
  },
  {
    q: ["moderation","review","approve","reject","why rejected"],
    a: "Moderation rules:\nEvery video is reviewed by a Deaf moderator for: accuracy, lighting, hand visibility, captions, and respect. Common reject reasons: blurry, >60s, no caption, wrong sign, offensive content."
  },
  {
    q: ["caption","subtitle","cc"],
    a: "Signix requires 100% captioned. Add English + Swahili caption in upload form. Example: 'Karibu - Welcome / Karibu - Karibu'."
  },
  {
    q: ["ndiyo","yes","hapana","no"],
    a: "**Ndiyo (Yes)**: Fist nods forward. **Hapana (No)**: Index + middle fingers tap together, head shake. Use facial expression for emphasis."
  },
  {
    q: ["namba","numbers","1-10"],
    a: "Namba 1-10: One-handed, palm forward. 1-5 palm forward, 6-10 twist from 1-5. See Learn > Numbers for slow-mo drill."
  },
  {
    q: ["shule","school","classroom"],
    a: "School signs: Shule (school) = two flat hands clap like roof. Mwalimu (teacher) = Shule + person marker. All in Learn > Classroom."
  },
  {
    q: ["what is signix","ksl","what is ksl","about signix"],
    a: "Signix is a free reference & creator platform for sign languages, starting with Kenyan Sign Language (KSL). Built by NEXORA, for the Deaf community. All videos are by real fluent signers, not AI."
  }
];

function findAnswer(input){
  const t = input.toLowerCase().trim();
  let best = null, score = 0;
  for(const item of SIGNIX_KB){
    let s = 0;
    for(const k of item.q){ if(t.includes(k)) s++; }
    if(s > score){ score = s; best = item; }
  }
  if(best && score > 0) return best.a;
  // fuzzy fallback for sign lookup
  if(t.startsWith("how to sign") || t.startsWith("sign for")){
    return `To sign "${input.replace(/how to sign|sign for/i,'').trim()}" — I don't have that yet. Check Learn page or Upload a request. Try: "How to sign Asante sana?" or "How to upload?"`;
  }
  return "I can help with: **KSL signs** (Habari, Karibu, Asante sana, Namba), **how to upload**, **captions**, **verification & moderation**. Ask like: 'How do I get verified?' or 'How to sign Karibu?'";
}

function initBot({windowId='chatWindow', inputId='chatInput', btnId='sendBtn', quickClass='quick-prompt'}){
  const win = document.getElementById(windowId);
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if(!win || !input || !btn) return;
  
  function addMsg(text, who){
    const d = document.createElement('div');
    d.className = 'bot-bubble ' + who;
    d.style.whiteSpace = 'pre-line';
    d.textContent = text;
    win.appendChild(d);
    win.scrollTop = win.scrollHeight;
  }
  function send(){
    const v = input.value.trim();
    if(!v) return;
    addMsg(v, 'user');
    input.value = '';
    setTimeout(()=> addMsg(findAnswer(v), 'ai'), 350);
  }
  btn.addEventListener('click', send);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') send(); });
  document.querySelectorAll('.'+quickClass).forEach(b=> b.addEventListener('click', ()=>{ input.value=b.textContent; send(); }));
}

document.addEventListener('DOMContentLoaded', ()=> initBot({}));
