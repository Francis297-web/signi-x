import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "gemini-2.0-flash"; // FIXED - 2.5-flash is retired, use 2.0-flash or 1.5-flash

function extractSearchTerm(message: string): string {
  const cleaned = message.toLowerCase()
  .replace(/teach me|how to sign|sign for|what is|what's|how do you|in ksl|kenyan sign language/g, "")
  .replace(/[^\w\s]/g, " ")
  .trim();
  return cleaned.split(/\s+/).slice(0, 3).join(" ").slice(0, 40);
}

async function searchSignixLibrary(keyword: string, url: string, key: string) {
  try {
    if (!keyword || keyword.length < 2) return [];
    const res = await fetch(
      `${url}/rest/v1/videos?word=ilike.%${encodeURIComponent(keyword)}%&select=word,url,signer,desc&limit=3`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY missing");

    const { message, history = [] } = await req.json();
    if (!message || typeof message!== "string" || message.trim().length < 1 || message.length > 1000) {
      return new Response(JSON.stringify({ error: "Valid message required" }), {
        status: 400, headers: {...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let sources: any[] = [];
    let retrievalContext = "";

    if (supabaseUrl && supabaseKey) {
      const term = extractSearchTerm(message);
      sources = await searchSignixLibrary(term, supabaseUrl, supabaseKey);
      if (sources.length) {
        retrievalContext = sources.map((s:any) => `- ${s.word} by @${s.signer}: ${s.desc || ''} (${s.url})`).join("\n");
      }
    }

    const systemPrompt = `
You are Signix AI, official tutor for Signix.

Platform: Signix is a reference and creator platform for sign languages, starting with Kenyan Sign Language (KSL). Founder: Patience Wambui, Nairobi.

Pages by visible name (do NOT use.html filenames):
- Home Feed: community feed
- Learn: searchable KSL dictionary from uploads
- Languages: directory of 18 sign languages, only KSL is live
- Upload / Studio: where users upload signs
- About: founder story and roadmap
- Creators: verified creators

YOUR TEACHING STYLE:
1. Describe signs with: Handshape, Location, Movement, Palm Orientation, Facial Expression, Context.
2. Give English + Swahili example.
3. Correct gently, encourage practice.
4. If you are uncertain about a Kenyan Sign Language sign, say that you are unsure and recommend consulting a verified KSL source or a qualified Deaf instructor. Do not make up signs.
5. Respect Deaf culture.
6. If user asks where to find something in Signix, refer to the page by its visible name, such as Learn, Languages, or Upload, rather than mentioning HTML filenames.
7. Keep answers short (3-5 sentences) unless teaching step-by-step.
8. You can use light Sheng: Sawa, Poa.
9. Always suggest a next lesson on Signix.
10. If the user simply says "Hi", "Hello", "Hey", "Good morning", or another greeting, greet them warmly before talking about Signix.

${retrievalContext? `Relevant Signix library matches:\n${retrievalContext}\nIf relevant, mention them as "I found this in Learn" with title.` : ""}
`;

    const contents = [
    ...history.slice(-12).map((m: any) => ({
        role: m.role === "assistant"? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.65, topP: 0.9, maxOutputTokens: 1200 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return new Response(JSON.stringify({ error: err }), {
        status: geminiRes.status, headers: {...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?? "Pole, jaribu tena.";

    return new Response(JSON.stringify({ reply, sources }), {
      headers: {...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error? err.message : "Unknown" }), {
      status: 500, headers: {...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
