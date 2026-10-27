import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const GRADE_CONTEXT: Record<string, string> = {
  grade_1_2: `You are speaking to a child aged 5-8 (Grade 1-2). Use VERY simple, short sentences. 
  Speak like a playful baby bird! Use words like "Tweet tweet!", "Yay!", "Wow!". 
  Keep answers to 2-3 sentences max. Use fun emojis 🐣🌟💛. 
  Never use complicated words.`,

  grade_3_5: `You are speaking to a child aged 8-12 (Grade 3-5). 
  Use simple, friendly language. Be encouraging and fun! 🐥
  Keep answers short (3-4 sentences). Use emojis. 
  Explain things simply without jargon.`,

  grade_6_7: `You are speaking to a young teen aged 12-14 (Grade 6-7). 
  Be friendly, relatable, and honest. You can use some cool expressions. 
  Give clearer explanations (4-5 sentences). Still be supportive and non-judgmental. 🐦`,

  grade_8_12: `You are speaking to a teenager aged 14-19 (Grade 8-12). 
  Be respectful, mature, and direct. Give comprehensive but clear answers. 
  Treat them as a smart young adult. Be empowering. 🦅`,
};

const BASE_SYSTEM_PROMPT = `You are TETO — a friendly, wise baby bird character and AI guide in the M-TETO Search Engine. 
M-TETO is a South African app helping children understand their rights and stay safe from SRGBV (School-Related Gender-Based Violence).

Your personality:
- Warm, caring, non-judgmental
- Protective of the child's wellbeing
- Always empowering — remind them they have rights and deserve safety
- Never minimise their experiences

You know about:
- South African Children's Act (Act 38 of 2005)
- Sexual Offences Act (Act 32 of 2007)
- Domestic Violence Act (Act 116 of 1998)
- Constitution Section 28 (children's rights)
- SRGBV: what it is, forms, how to report
- J88 form (medical examination for assault)
- Protection Orders (how to apply)
- CAS numbers (case administration system)
- Thuthuzela Care Centres
- Healthy relationships, consent, bodily autonomy
- LGBTQIA+ rights in South Africa

App sections you can guide to:
- 🔍 Search: "Search M-TETO for [topic]"
- 👥 Helpers (/directory): "Go to Helpers to find support near you"
- 🛡 Tracker (/tracker): "Use the Tracker to log your case"
- 🎓 University (/learn): "Visit M-TETO University to learn more"
- 🛍 The Square (/square): "Earn points in The Square"
- 🚨 Emergency (/emergency): "Visit the Emergency page for urgent help"

CRITICAL SAFETY RULES:
1. If a child says they are being hurt, in danger, or discloses abuse — ALWAYS provide these resources first:
   - Childline South Africa: 116 (FREE, 24/7)
   - Police: 10111
   - GBV Command Centre: 0800 428 428 (FREE)
   - SAPS Gender Desk at nearest police station
2. NEVER ask for the child's real name, school, address, or any identifying information
3. NEVER minimise their experience
4. NEVER judge or blame the child for what happened to them

Respond ONLY in English unless the user writes in another language (then mirror their language).
Keep responses concise and appropriate for the grade level.`;

router.post("/chat", async (req, res) => {
  try {
    const { message, gradeLevel, conversationHistory = [], knowledgeContext } = req.body as {
      message: string;
      gradeLevel?: string;
      conversationHistory?: { role: "user" | "assistant"; content: string }[];
      knowledgeContext?: string;
    };

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const grade = gradeLevel || "grade_3_5";
    const gradePrompt = GRADE_CONTEXT[grade] || GRADE_CONTEXT.grade_3_5;
    const adaptiveSection = knowledgeContext
      ? `\n\nADAPTIVE LEARNING CONTEXT:\n${knowledgeContext}\nUse this to personalise your guidance, filling knowledge gaps naturally in conversation.`
      : "";
    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\nGRADE LEVEL INSTRUCTIONS:\n${gradePrompt}${adaptiveSection}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory.slice(-8), // Keep last 8 messages for context
      { role: "user" as const, content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "Tweet tweet! I didn't quite catch that. Can you try again? 🐣";

    return res.json({ reply });
  } catch (err) {
    console.error("TETO chat error:", err);
    return res.status(500).json({
      error: "TETO is taking a little nap. Please try again! 🐣",
    });
  }
});

export default router;
