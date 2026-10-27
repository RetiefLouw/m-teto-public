import { db, squareItemsTable, articlesTable, quizQuestionsTable, providersTable } from "@workspace/db";

export async function seedPhase2() {
  // Seed Square Items
  const existingItems = await db.select({ id: squareItemsTable.id }).from(squareItemsTable).limit(1);
  if (existingItems.length === 0) {
    await db.insert(squareItemsTable).values([
      // SRHR Products
      { name: "Sanitary Pads (12 pack)", description: "Essential period hygiene products for school-going girls.", category: "srhr", pointsCost: 30, imageEmoji: "🌸", stock: -1 },
      { name: "Female Condoms (5 pack)", description: "Protect your sexual and reproductive health rights.", category: "srhr", pointsCost: 25, imageEmoji: "💊", stock: -1 },
      { name: "Male Condoms (10 pack)", description: "Safe sex essentials for HIV and pregnancy prevention.", category: "srhr", pointsCost: 20, imageEmoji: "🩺", stock: -1 },
      { name: "Emergency Contraception Voucher", description: "Voucher redeemable at participating SRHR clinics.", category: "srhr", pointsCost: 80, imageEmoji: "🏥", stock: -1 },
      // Education Items
      { name: "School Notebook (A4)", description: "Lined A4 notebook to help you stay focused on learning.", category: "education", pointsCost: 40, imageEmoji: "📓", stock: -1 },
      { name: "Pencil & Pen Set", description: "Basic stationery to support your schooling.", category: "education", pointsCost: 20, imageEmoji: "✏️", stock: -1 },
      { name: "M-Teto Learning E-Voucher", description: "Access premium University module content for 30 days.", category: "education", pointsCost: 50, imageEmoji: "🎓", stock: -1 },
      // Hygiene
      { name: "Soap Bar (3 pack)", description: "Basic hygiene essentials to keep you healthy.", category: "hygiene", pointsCost: 25, imageEmoji: "🧼", stock: -1 },
      { name: "Toothbrush & Toothpaste", description: "Dental hygiene starter kit.", category: "hygiene", pointsCost: 30, imageEmoji: "🦷", stock: -1 },
      { name: "Mask & Sanitiser Kit", description: "Health protection kit for school.", category: "hygiene", pointsCost: 35, imageEmoji: "🧴", stock: -1 },
      // Emergency / Safety
      { name: "Personal Safety Whistle", description: "Loud whistle to attract attention in dangerous situations.", category: "emergency", pointsCost: 15, imageEmoji: "🔔", stock: -1 },
      { name: "Emergency Contact Card", description: "Printed card with all key emergency numbers for your area.", category: "emergency", pointsCost: 10, imageEmoji: "📋", stock: -1 },
      // Digital
      { name: "Mobile Data Voucher (100MB)", description: "Stay connected to support and resources.", category: "digital", pointsCost: 60, imageEmoji: "📱", stock: -1 },
      { name: "Airtime Voucher (R10)", description: "Call emergency services or a trusted adult anytime.", category: "digital", pointsCost: 50, imageEmoji: "📞", stock: -1 },
    ]);
    console.log("✅ Square items seeded");
  }

  // Seed SRGBV and University Articles
  const existingSRGBV = await db.select({ id: articlesTable.id }).from(articlesTable).where(
    db.$count !== undefined ? undefined : undefined
  ).limit(100);

  // Add SRGBV and University articles if they don't already exist
  const srgbvArticle = existingSRGBV.find(a => a.id === "srgbv-1");
  if (!srgbvArticle) {
    await db.insert(articlesTable).values([
      // SRGBV Knowledge Base Articles
      {
        title: "What is SRGBV?",
        category: "SRGBV",
        summary: "Understanding School-Related Gender-Based Violence and why it matters.",
        content: `School-Related Gender-Based Violence (SRGBV) refers to acts of sexual, physical, or psychological violence inflicted on children in and around schools because of stereotypes and roles or norms attributed to or expected of them because of their sex or gendered identity.

SRGBV includes:
• Bullying and cyberbullying
• Corporal punishment
• Sexual harassment
• Rape and sexual assault
• Verbal and emotional abuse based on gender or sexuality

Both students and teachers can be perpetrators. Globally, 246 million children experience some form of SRGBV each year. You are not alone.

If you experience or witness SRGBV at school, you can:
1. Tell a trusted adult immediately
2. Report to your school principal or governing body
3. Contact the South African Human Rights Commission (SAHRC)
4. Call the GBV Command Centre on 0800 428 428 (free, 24/7)`,
        isStepByStep: false,
        moduleType: "knowledge_base",
        gradeLevel: "grade_6_7",
        pointsReward: 5,
      },
      {
        title: "Recognising Bullying at School",
        category: "SRGBV",
        summary: "How to identify bullying and what to do about it.",
        content: `Bullying is repeated harmful behaviour that can take many forms.

Types of bullying:
• Physical: hitting, pushing, damaging property
• Verbal: name-calling, insults, threats
• Social: excluding someone, spreading rumours
• Cyberbullying: harmful messages, posts, or images online

Signs you or a friend may be experiencing bullying:
• Not wanting to go to school
• Changes in mood, becoming withdrawn or sad
• Unexplained injuries or missing belongings
• Drop in school performance

What you can do:
Step 1: Tell a trusted adult at school or home
Step 2: Document incidents with dates and details
Step 3: Report to your school's anti-bullying desk or principal
Step 4: If no action is taken, contact the Department of Basic Education at 0800 202 933`,
        isStepByStep: true,
        moduleType: "knowledge_base",
        gradeLevel: "grade_3_5",
        pointsReward: 5,
      },
      {
        title: "Your Body, Your Choice",
        category: "SRGBV",
        summary: "Understanding bodily autonomy and what to do if someone crosses boundaries.",
        content: `You have the right to decide what happens to your body. This is called bodily autonomy.

No one has the right to touch you without your permission. This includes:
• Teachers, coaches, or other adults at school
• Classmates or friends
• Family members

What is consent?
Consent means freely agreeing to something. For children under 16, South African law says they CANNOT legally consent to sexual activity with an adult. This means any sexual contact with a person under 16 is illegal — no matter what the adult says.

If someone crosses your boundaries:
1. Say "No" clearly if you can
2. Tell a trusted adult immediately
3. Remember: it is NEVER your fault
4. Call Childline on 116 (free, 24 hours)`,
        isStepByStep: false,
        moduleType: "knowledge_base",
        gradeLevel: "grade_6_7",
        pointsReward: 5,
      },
      {
        title: "Sexual Harassment at School",
        category: "SRGBV",
        summary: "Understanding sexual harassment and your right to learn in a safe environment.",
        content: `Sexual harassment is unwanted behaviour of a sexual nature that makes you feel uncomfortable, unsafe, or humiliated.

Examples of sexual harassment include:
• Unwanted touching or groping
• Comments about your body or appearance
• Being asked for sexual favours in exchange for grades (called "transactional sex" or "sexual exploitation")
• Sharing intimate photos without permission
• Persistent unwanted attention

Your rights:
You have the right to:
• Learn in a safe environment free from sexual harassment
• Report harassment without fear of retaliation
• Access confidential support services

How to report sexual harassment at school:
Step 1: Write down what happened — date, time, what was said or done, who was present
Step 2: Report to a trusted teacher, the school principal, or school governing body
Step 3: If your school does not act, report to the Department of Basic Education (0800 202 933)
Step 4: For urgent situations, contact SAPS on 10111 or a Thuthuzela Care Centre`,
        isStepByStep: true,
        moduleType: "knowledge_base",
        gradeLevel: "grade_8_12",
        pointsReward: 5,
      },
      // University Module Articles
      {
        title: "Understanding Gender Equality",
        category: "University",
        summary: "A foundational lesson on gender equality, stereotypes, and why they matter.",
        content: `Welcome to M-Teto University. This module explores gender equality and how unfair stereotypes affect us all.

What is gender?
Gender refers to the roles, behaviours, and expectations that society assigns to people based on their sex. These are not fixed — they are social constructs that change across cultures and time.

Gender stereotypes are harmful because:
• They limit what people believe they can achieve
• They create unequal power dynamics
• They are a major cause of gender-based violence

Gender equality means:
All people — regardless of gender — have the same rights, opportunities, and dignity.

Sustainable Development Goal 5 is about achieving gender equality and empowering all women and girls. M-Teto directly supports this goal.

Reflection exercise:
Think about one stereotype you have heard about boys or girls at your school. How does this stereotype affect the way people treat each other?

💡 Answer the quiz below to earn 10 points!`,
        isStepByStep: false,
        moduleType: "university",
        gradeLevel: "grade_8_12",
        pointsReward: 5,
      },
      {
        title: "Healthy vs Unhealthy Relationships",
        category: "University",
        summary: "Learn the signs of healthy and unhealthy relationships and how to protect yourself.",
        content: `Knowing the difference between healthy and unhealthy relationships is a crucial life skill.

Signs of a HEALTHY relationship:
✅ Mutual respect — both people treat each other with dignity
✅ Trust — you can rely on each other
✅ Honest communication — you can talk openly without fear
✅ Independence — you both have your own friends and space
✅ Equality — decisions are made together

Signs of an UNHEALTHY relationship:
❌ Control — one person tells the other what to do, who to see, what to wear
❌ Jealousy — extreme jealousy used to justify control
❌ Disrespect — put-downs, insults, public humiliation
❌ Pressure — being pressured into sexual activity
❌ Fear — you feel scared to say no or express your opinion

Intimate Partner Violence (IPV) often starts with small signs of control. Trust your instincts — if something feels wrong, it probably is.

If you are in an unhealthy or dangerous relationship:
• Talk to a trusted adult
• Contact the GBV Command Centre: 0800 428 428
• Visit a Thuthuzela Care Centre for support`,
        isStepByStep: false,
        moduleType: "university",
        gradeLevel: "grade_6_7",
        pointsReward: 5,
      },
      {
        title: "HIV, AIDS and Your Rights",
        category: "University",
        summary: "Essential knowledge about HIV/AIDS, prevention, and your rights as a young person.",
        content: `HIV (Human Immunodeficiency Virus) weakens the immune system. AIDS (Acquired Immunodeficiency Syndrome) is the advanced stage of HIV infection.

Key Facts:
• HIV is transmitted through unprotected sex, sharing needles, or from mother to child during birth/breastfeeding
• HIV is NOT transmitted through hugging, sharing food, or being in the same room
• South Africa has the largest HIV epidemic in the world — testing and knowing your status is critical

Prevention:
1. Use a condom consistently with every sexual encounter
2. Get tested regularly for HIV
3. PrEP (Pre-Exposure Prophylaxis) — medication that prevents HIV — is available at clinics for free
4. If you think you have been exposed, PEP (Post-Exposure Prophylaxis) must be started within 72 hours

Your rights:
• You have the right to confidential HIV testing
• You cannot be discriminated against based on your HIV status
• Condoms and PrEP are free at public health clinics
• Young people aged 12 and older can consent to HIV testing without parental permission in South Africa

Free HIV testing near you: Visit any CHC, TCC, or government clinic`,
        isStepByStep: false,
        moduleType: "university",
        gradeLevel: "grade_8_12",
        pointsReward: 5,
      },
      {
        title: "Staying Safe Online",
        category: "University",
        summary: "How to protect yourself from cyberbullying and online predators.",
        content: `The internet is a powerful tool, but it can also be dangerous. Here's how to stay safe online.

Cyberbullying:
• Never share personal information online (home address, school name, phone number)
• If someone online is making you uncomfortable, block and report them immediately
• Screenshots are evidence — save them before blocking
• Report cyberbullying to your school or SAPS

Online grooming — what to watch for:
Grooming is when an adult builds trust with a child online to eventually exploit them. Warning signs:
• Someone much older showing unusual interest in you
• Being asked to keep your conversations secret
• Requests for photos
• Offers of gifts, money, or opportunities in exchange for anything

What to do:
1. Stop communicating immediately
2. Do not delete messages — they are evidence
3. Tell a trusted adult
4. Report to CyberCrime Division: 086 100 2000

Remember: It is NEVER your fault if someone tries to exploit you online.`,
        isStepByStep: false,
        moduleType: "university",
        gradeLevel: "grade_3_5",
        pointsReward: 5,
      },
    ]);
    console.log("✅ SRGBV and University articles seeded");
  }

  // Seed Quiz Questions
  const existingQuiz = await db.select({ id: quizQuestionsTable.id }).from(quizQuestionsTable).limit(1);
  if (existingQuiz.length === 0) {
    await db.insert(quizQuestionsTable).values([
      {
        question: "What does SRGBV stand for?",
        optionA: "School-Related Gender-Based Violence",
        optionB: "Social Rights and Gender Behaviour Violence",
        optionC: "School Rules Governing Behaviour Violations",
        correctOption: "A",
        explanation: "SRGBV stands for School-Related Gender-Based Violence — physical, sexual, or psychological violence in educational settings based on gender.",
        gradeLevel: "grade_6_7",
        pointsReward: 10,
      },
      {
        question: "If someone is bullying you at school, what should you do FIRST?",
        optionA: "Fight back to show them you're not afraid",
        optionB: "Tell a trusted adult such as a teacher or parent",
        optionC: "Just ignore it and it will stop",
        correctOption: "B",
        explanation: "Always tell a trusted adult first. Documenting the bullying and reporting it is the safest way to address it.",
        gradeLevel: "grade_3_5",
        pointsReward: 10,
      },
      {
        question: "In South Africa, what is the age of consent for sexual activity?",
        optionA: "14 years old",
        optionB: "16 years old",
        optionC: "18 years old",
        correctOption: "B",
        explanation: "In South Africa, the legal age of consent is 16 years. Sexual activity with someone under 16 is illegal, regardless of circumstances.",
        gradeLevel: "grade_8_12",
        pointsReward: 10,
      },
      {
        question: "What does 'consent' mean?",
        optionA: "Agreeing because you were pressured to",
        optionB: "Doing something because you have no choice",
        optionC: "Freely and enthusiastically agreeing to something",
        correctOption: "C",
        explanation: "Consent must be freely given, reversible, informed, enthusiastic, and specific (FRIES). Pressure, fear, or being too young makes consent invalid.",
        gradeLevel: "grade_6_7",
        pointsReward: 10,
      },
      {
        question: "Which phone number can you call for gender-based violence support in South Africa (free, 24/7)?",
        optionA: "0800 428 428",
        optionB: "10177",
        optionC: "0800 023 334",
        correctOption: "A",
        explanation: "0800 428 428 is the GBV Command Centre. It is free to call, available 24/7, and provides emergency support, counselling and referrals.",
        gradeLevel: "all",
        pointsReward: 10,
      },
      {
        question: "Which of these is a sign of an unhealthy relationship?",
        optionA: "Your partner respects your opinion",
        optionB: "Your partner controls what you wear and who you talk to",
        optionC: "Your partner gives you space to spend time with friends",
        correctOption: "B",
        explanation: "Control — telling you what to wear, who to see, or monitoring your phone — is a serious warning sign of an unhealthy or abusive relationship.",
        gradeLevel: "grade_8_12",
        pointsReward: 10,
      },
      {
        question: "PEP must be started within how many hours of possible HIV exposure?",
        optionA: "24 hours",
        optionB: "48 hours",
        optionC: "72 hours",
        correctOption: "C",
        explanation: "PEP (Post-Exposure Prophylaxis) must be started within 72 hours of possible HIV exposure to be effective. It is available free at government clinics.",
        gradeLevel: "grade_8_12",
        pointsReward: 10,
      },
      {
        question: "What is cyberbullying?",
        optionA: "Using the internet to learn new skills",
        optionB: "Harmful or hurtful behaviour directed at someone online",
        optionC: "A virus that attacks your computer",
        correctOption: "B",
        explanation: "Cyberbullying is using digital devices to bully, harass, or harm someone. It can include hurtful messages, sharing photos without permission, or online exclusion.",
        gradeLevel: "grade_3_5",
        pointsReward: 10,
      },
    ]);
    console.log("✅ Quiz questions seeded");
  }

  // Seed Pro-Bono and Additional Providers
  const existingProviders = await db.select({ id: providersTable.id }).from(providersTable).limit(100);
  if (existingProviders.length < 25) {
    await db.insert(providersTable).values([
      // Legal Aid / Pro-Bono Lawyers
      { name: "Legal Aid South Africa (Johannesburg)", type: "legal_aid", address: "Legal Aid House, 29 De Beer Street, Braamfontein", suburb: "Braamfontein", province: "Gauteng", contactNumber: "011 877 2000" },
      { name: "Legal Aid South Africa (Cape Town)", type: "legal_aid", address: "Legal Aid Building, 30 Queen Victoria Street", suburb: "Cape Town CBD", province: "Western Cape", contactNumber: "021 426 3582" },
      { name: "Legal Aid South Africa (Durban)", type: "legal_aid", address: "2nd Floor, Durban Club Place", suburb: "Durban CBD", province: "KwaZulu-Natal", contactNumber: "031 304 2511" },
      // Counsellors / Psycho-Social Support
      { name: "SADAG (South African Depression & Anxiety Group)", type: "counsellor", address: "Online / Telephonic Support", suburb: "National", province: "National", contactNumber: "0800 567 567" },
      { name: "People Opposing Women Abuse (POWA)", type: "counsellor", address: "12 Pein Street, Bez Valley", suburb: "Johannesburg", province: "Gauteng", contactNumber: "011 642 4345" },
      { name: "Childline South Africa - Gauteng", type: "counsellor", address: "PO Box 73303, Fairland", suburb: "Johannesburg North", province: "Gauteng", contactNumber: "116" },
      // Shelters
      { name: "Ikhaya Lethemba Shelter", type: "shelter", address: "Address provided on call for safety", suburb: "Johannesburg", province: "Gauteng", contactNumber: "011 333 3000" },
      { name: "Cape Town Domestic Violence Shelter", type: "shelter", address: "Address provided on call for safety", suburb: "Cape Town", province: "Western Cape", contactNumber: "021 761 7585" },
      // SRHR Practitioners
      { name: "Marie Stopes SA - Johannesburg", type: "srhr_practitioner", address: "20 Albert Street, Marshalltown", suburb: "Johannesburg CBD", province: "Gauteng", contactNumber: "0800 11 77 85" },
      { name: "Marie Stopes SA - Cape Town", type: "srhr_practitioner", address: "Klipfontein Road", suburb: "Athlone", province: "Western Cape", contactNumber: "0800 11 77 85" },
    ]);
    console.log("✅ Pro-bono and additional providers seeded");
  }

  console.log("🎉 Phase 2 seed complete");
}
