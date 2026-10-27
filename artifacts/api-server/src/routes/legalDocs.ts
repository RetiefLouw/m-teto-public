import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ─── Curated Landmark SA Cases ────────────────────────────────────────────────

const LANDMARK_CASES = [
  {
    id: "minister-v-child",
    title: "Minister of Justice v Child Justice Alliance (2023)",
    court: "Constitutional Court",
    year: 2023,
    topic: "Children's Rights",
    summary: "The Constitutional Court ruled that children in conflict with the law must be treated differently from adults. The state must prioritise rehabilitation and reintegration of child offenders over punishment.",
    keyPrinciple: "Children accused of crimes have constitutional rights to special treatment, diversion, and rehabilitation under the Child Justice Act 75 of 2008.",
    safliiUrl: "https://www.saflii.org/za/cases/ZACC/",
    tags: ["children", "justice", "rehabilitation"],
  },
  {
    id: "s-v-m",
    title: "S v M (Centre for Child Law as Amicus Curiae) (2007)",
    court: "Constitutional Court",
    year: 2007,
    topic: "Children's Best Interests",
    summary: "This landmark case established that when sentencing a primary caregiver, courts must consider the impact on the children left behind. The best interests of the child must be considered at every stage of criminal proceedings.",
    keyPrinciple: "Section 28(2) of the Constitution — the best interests of the child are of paramount importance in every matter concerning the child.",
    safliiUrl: "https://www.saflii.org/za/cases/ZACC/2007/18.html",
    tags: ["children", "sentencing", "best interests"],
  },
  {
    id: "centre-for-child-law",
    title: "Centre for Child Law v Minister of Justice (2009)",
    court: "Constitutional Court",
    year: 2009,
    topic: "Child Justice",
    summary: "The court declared unconstitutional a provision that allowed children to be sentenced to life imprisonment without the possibility of parole. Children cannot be sentenced the same way as adults.",
    keyPrinciple: "Mandatory minimum sentences that treat children exactly like adults violate the constitutional rights of children.",
    safliiUrl: "https://www.saflii.org/za/cases/ZACC/2009/18.html",
    tags: ["sentencing", "children's rights", "imprisonment"],
  },
  {
    id: "law-society-v-minister",
    title: "Law Society of SA v Minister for Transport (2011)",
    court: "Constitutional Court",
    year: 2011,
    topic: "Access to Justice",
    summary: "This case affirmed that access to courts is a fundamental right. Every person in South Africa has the right to approach a court, including children and poor communities.",
    keyPrinciple: "Section 34 of the Constitution guarantees everyone the right to have any dispute decided by a court of law.",
    safliiUrl: "https://www.saflii.org/za/cases/ZACC/2011/",
    tags: ["access to justice", "courts", "rights"],
  },
  {
    id: "government-v-grootboom",
    title: "Government of RSA v Grootboom (2000)",
    court: "Constitutional Court",
    year: 2000,
    topic: "Socio-Economic Rights",
    summary: "The Constitutional Court ruled that the government must take reasonable measures within available resources to progressively realise the right to housing, especially for those in desperate situations. Children's rights to shelter were central to the judgment.",
    keyPrinciple: "Socio-economic rights in the Constitution are real and enforceable — the government cannot simply ignore people living in desperate conditions.",
    safliiUrl: "https://www.saflii.org/za/cases/ZACC/2000/19.html",
    tags: ["housing", "socio-economic rights", "children"],
  },
  {
    id: "k-v-minister",
    title: "K v Minister of Safety and Security (2005)",
    court: "Constitutional Court",
    year: 2005,
    topic: "GBV & State Liability",
    summary: "Three police officers raped a woman who had accepted a lift from them in a police vehicle. The Constitutional Court held the state vicariously liable. This case is crucial for understanding state accountability in GBV cases.",
    keyPrinciple: "The state can be held liable when its employees commit gender-based violence in the course of their employment. Victims of GBV by state officials can sue the state for damages.",
    safliiUrl: "https://www.saflii.org/za/cases/ZACC/2005/8.html",
    tags: ["GBV", "police", "state liability", "rape"],
  },
  {
    id: "teddy-bear-clinic",
    title: "Teddy Bear Clinic v Minister of Justice (2013)",
    court: "Constitutional Court",
    year: 2013,
    topic: "Children & Consent",
    summary: "The Constitutional Court struck down provisions that criminalised consensual sexual activity between children aged 12–16, finding the provisions were overbroad and violated children's dignity and privacy rights.",
    keyPrinciple: "Laws that criminalise teenagers for consensual sexual exploration can be unconstitutional. The law must protect children from exploitation, not punish them for normal development.",
    safliiUrl: "https://www.saflii.org/za/cases/ZACC/2013/35.html",
    tags: ["consent", "children", "sexual offences", "privacy"],
  },
  {
    id: "bhe-v-magistrate",
    title: "Bhe v Magistrate, Khayelitsha (2004)",
    court: "Constitutional Court",
    year: 2004,
    topic: "Gender Equality",
    summary: "This case challenged the rule of primogeniture in customary law that excluded women and girls from inheriting family property. The court ruled this practice unconstitutional as it violated the constitutional rights to equality and dignity.",
    keyPrinciple: "Customary laws that discriminate against women and girls in inheritance are unconstitutional. Girls have equal rights to inherit from their families.",
    safliiUrl: "https://www.saflii.org/za/cases/ZACC/2004/17.html",
    tags: ["customary law", "inheritance", "gender equality", "girls"],
  },
];

// ─── GET /api/legal-docs/cases ────────────────────────────────────────────────

router.get("/legal-docs/cases", async (req, res) => {
  const { topic, search } = req.query;
  let cases = LANDMARK_CASES;

  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    cases = cases.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.topic.toLowerCase().includes(q) ||
        c.tags.some((t) => t.includes(q))
    );
  }

  if (topic && typeof topic === "string") {
    const t = topic.toLowerCase();
    cases = cases.filter((c) => c.topic.toLowerCase().includes(t) || c.tags.some((tag) => tag.includes(t)));
  }

  res.json({ cases });
});

// ─── POST /api/legal-docs/explain ────────────────────────────────────────────

router.post("/legal-docs/explain", async (req, res) => {
  const { documentType, documentContent, userGrade } = req.body;

  if (!documentType) {
    return res.status(400).json({ error: "documentType is required" });
  }

  const gradeContext =
    userGrade === "grade_1_2"
      ? "very simple language for a child in Grade 1 or 2 (age 6-8)"
      : userGrade === "grade_3_5"
      ? "simple language for a child in Grade 3 to 5 (age 8-11)"
      : userGrade === "grade_6_7"
      ? "clear language for a child in Grade 6 or 7 (age 12-13)"
      : "plain language for a high school student in Grade 8 to 12 (age 14-18)";

  const systemPrompt = `You are a child-friendly legal educator at M-TETO, a South African platform helping children understand the legal system and their rights. 

Your job is to explain legal documents in ${gradeContext}. Use short sentences, everyday words, and a warm, supportive tone. Never use scary or confusing legal jargon without immediately explaining it. 

Always:
- Explain what the document is and why it exists
- Explain what each important section means for a child or young person
- Tell them what they need to do (if anything)
- Tell them what their rights are
- Tell them who can help them (Childline 116, SAPS 10111, Legal Aid SA)
- End with an encouraging message

Format your response with clear sections using headings.`;

  const userPrompt = documentContent
    ? `Please explain this ${documentType} document to me:\n\n${documentContent.slice(0, 4000)}`
    : `Please explain what a ${documentType} is in South African law and how it affects me as a child or young person. Include: what it is, when it is used, what I need to do if I receive one, and what my rights are.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1200,
      temperature: 0.4,
    });

    const explanation = response.choices[0]?.message?.content || "Unable to generate explanation.";
    res.json({ explanation, documentType });
  } catch (err) {
    console.error("Legal docs explain error:", err);
    res.status(500).json({ error: "Failed to generate explanation" });
  }
});

// ─── GET /api/legal-docs/saflii-search ───────────────────────────────────────

router.get("/legal-docs/saflii-search", async (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "query is required" });
  }

  // Return SAFLII search URL and curated relevant cases
  const safliiUrl = `https://www.saflii.org/cgi-bin/sinosrch.cgi?query=${encodeURIComponent(query)}&method=all&meta=%2Fza%2Fcases`;

  // Filter curated cases for relevance
  const q = query.toLowerCase();
  const relevantCases = LANDMARK_CASES.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.topic.toLowerCase().includes(q) ||
      c.tags.some((t) => t.includes(q))
  );

  res.json({ safliiUrl, relevantCases, query });
});

export default router;
