/**
 * justiceContent.ts
 * Comprehensive SA Child Justice content library.
 * Covers all violation types, pathways, steps, timelines, documents and contacts.
 * Legal basis: Children's Act 38/2005, Sexual Offences Act 32/2007, SA Schools Act 84/1996,
 * Cybercrimes Act 19/2020, Domestic Violence Act 116/1998, Equality Act 4/2000,
 * Protection from Harassment Act 17/2011, Basic Conditions of Employment Act.
 */

export type GradeLevel = "grade_1_2" | "grade_3_5" | "grade_6_7" | "grade_8_12";
export type JusticePathway = "criminal" | "civil" | "both";
export type Urgency = "emergency" | "urgent" | "standard";
export type ViolationContext =
  | "school"
  | "home"
  | "community"
  | "healthcare"
  | "online"
  | "state"
  | "business";

export interface RightsViolated {
  right: string;
  legalBasis: string;
}

export interface Contact {
  name: string;
  number?: string;
  website?: string;
  note?: string;
  isFree?: boolean;
}

export interface JusticeStep {
  id: string;
  order: number;
  title: string;
  description: Record<GradeLevel, string>;
  timeline: string;
  dueInDays: number | null;
  isDeadlineCritical: boolean;
  actions: string[];
  documents: string[];
  contacts: Contact[];
  ePolicingOptions?: string[];
  tips: string[];
  warningFlags: string[];
  legalBasis?: string;
}

export interface ViolationType {
  id: string;
  context: ViolationContext;
  label: string;
  emoji: string;
  ageGroups: GradeLevel[];
  shortDescription: Record<GradeLevel, string>;
  rightsViolated: RightsViolated[];
  pathway: JusticePathway;
  urgency: Urgency;
  criminalSteps?: JusticeStep[];
  civilSteps?: JusticeStep[];
  ePolicing?: {
    title: string;
    description: string;
    links: { label: string; url: string }[];
  };
}

export interface ViolationContextGroup {
  id: ViolationContext;
  label: string;
  emoji: string;
  description: string;
  types: ViolationType[];
}

// ─── SHARED CONTACTS ─────────────────────────────────────────────────────────

const CHILDLINE: Contact = {
  name: "Childline SA",
  number: "116",
  website: "https://www.childlinesa.org.za",
  note: "Free, 24/7 — counselling, advice, referrals",
  isFree: true,
};
const SAPS: Contact = {
  name: "South African Police Service",
  number: "10111",
  note: "Nearest SAPS FCS (Family Violence, Child Protection & Sexual Offences) Unit",
  isFree: true,
};
const GBV_HOTLINE: Contact = {
  name: "GBV Command Centre",
  number: "0800 428 428",
  note: "Free, 24/7 — gender-based violence support",
  isFree: true,
};
const LEGAL_AID: Contact = {
  name: "Legal Aid South Africa",
  number: "0800 110 110",
  website: "https://www.legal-aid.co.za",
  note: "Free legal representation for those who qualify",
  isFree: true,
};
const SAHRC: Contact = {
  name: "SA Human Rights Commission",
  number: "011 877 3600",
  website: "https://www.sahrc.org.za",
  note: "Complaints about human rights violations",
};
const CGE: Contact = {
  name: "Commission for Gender Equality",
  number: "0800 007 709",
  website: "https://www.cge.org.za",
  note: "Gender-based discrimination complaints",
  isFree: true,
};
const DSD: Contact = {
  name: "Department of Social Development",
  number: "0800 428 428",
  note: "Social workers, child protection services",
  isFree: true,
};
const THUTHUZELA: Contact = {
  name: "Thuthuzela Care Centre",
  note: "One-stop support centres for sexual violence survivors — at major hospitals",
};
const LAWYERS_ABUSE: Contact = {
  name: "Lawyers Against Abuse (LAA)",
  number: "011 025 8520",
  website: "https://www.lawyersagainstabuse.org",
  note: "Free legal services for GBV and child abuse victims",
  isFree: true,
};
const POWA: Contact = {
  name: "People Opposing Women Abuse (POWA)",
  number: "011 642 4345",
  website: "https://www.powa.co.za",
  note: "Legal support, shelter, counselling",
  isFree: true,
};
const DBE: Contact = {
  name: "Dept of Basic Education — Hotline",
  number: "0800 202 933",
  note: "Education complaints and school-related violations",
  isFree: true,
};
const SACE: Contact = {
  name: "SA Council for Educators (SACE)",
  number: "012 663 9517",
  website: "https://www.sace.org.za",
  note: "Report educator misconduct",
};
const IPID: Contact = {
  name: "Independent Police Investigative Directorate (IPID)",
  number: "0800 023 334",
  website: "https://www.ipid.gov.za",
  note: "Investigate police misconduct and brutality",
  isFree: true,
};

// ─── SHARED STEP TEMPLATES ───────────────────────────────────────────────────

const STEP_IMMEDIATE_SAFETY: JusticeStep = {
  id: "immediate_safety",
  order: 1,
  title: "Get to Safety First",
  description: {
    grade_1_2: "Tell a grown-up you trust RIGHT NOW — a teacher, family member, or neighbour. You do NOT have to be alone. Call 116 if you need help right away.",
    grade_3_5: "Your safety comes first. Get away from the person who hurt you and go to a safe place. Tell a trusted adult — parent, teacher, or neighbour. You can also call Childline 116 for free.",
    grade_6_7: "Prioritise your physical safety immediately. Leave the situation if you can. Reach out to a trusted adult or go to your nearest police station, hospital, or Thuthuzela Care Centre. Childline 116 is free and confidential.",
    grade_8_12: "Ensure your immediate physical safety first. Remove yourself from the dangerous situation. Contact a trusted adult, Childline (116), the SAPS (10111), or the GBV Command Centre (0800 428 428). Do not confront the perpetrator alone.",
  },
  timeline: "Immediately",
  dueInDays: 0,
  isDeadlineCritical: true,
  actions: [
    "Move to a safe place away from the person who hurt you",
    "Call someone you trust",
    "Call 116 (Childline) or 10111 (Police) if in danger",
    "Save or screenshot any evidence if safe to do so",
  ],
  documents: [],
  contacts: [CHILDLINE, SAPS, GBV_HOTLINE],
  tips: [
    "You don't have to face this alone",
    "It is NOT your fault",
    "Asking for help is brave and the right thing to do",
  ],
  warningFlags: [
    "Do not clean yourself or change clothes if sexual assault occurred — this preserves important medical evidence",
    "Do not confront the person who hurt you alone",
  ],
};

const STEP_MEDICAL_J88: JusticeStep = {
  id: "medical_j88",
  order: 2,
  title: "Get Medical Help (J88 Form)",
  description: {
    grade_1_2: "A doctor needs to check that you are okay. They will write down what happened on a special paper called a J88 form. This helps the police and the judge.",
    grade_3_5: "Go to a hospital or clinic as soon as possible. A doctor will examine you and complete a J88 form — this is an official record of your injuries that helps with the court case.",
    grade_6_7: "Get medical treatment as soon as possible — ideally within 72 hours. A doctor will complete a J88 form which documents your injuries and serves as legal medical evidence. Go to the nearest Thuthuzela Care Centre or hospital emergency.",
    grade_8_12: "Seek medical attention within 72 hours — the sooner the better for DNA and evidence collection. The doctor will complete a J88 form (Form 308). This is critical legal medical evidence that can be used in court. You do NOT need to open a police case first, but it's recommended. Go to a Thuthuzela Care Centre, hospital emergency unit, or any doctor.",
  },
  timeline: "Within 72 hours — the sooner the better",
  dueInDays: 3,
  isDeadlineCritical: true,
  actions: [
    "Go to the nearest hospital, clinic, or Thuthuzela Care Centre",
    "Tell the doctor or nurse what happened",
    "Ask for a J88 form to be completed",
    "Ask for a copy of the J88 for your records",
    "Get treatment for any injuries",
    "HIV PEP (Post-Exposure Prophylaxis) if applicable — must be started within 72 hours",
  ],
  documents: ["J88 form (the doctor completes this)", "Copy of J88 for your records"],
  contacts: [THUTHUZELA, CHILDLINE, GBV_HOTLINE],
  ePolicingOptions: [
    "Use the SAPS website to find nearest Thuthuzela Care Centre: https://www.saps.gov.za",
  ],
  tips: [
    "You do not need money — this is a FREE service at government hospitals",
    "Bring a trusted adult if possible",
    "The doctor cannot force you to open a case — the J88 is for your protection",
  ],
  warningFlags: [
    "Do NOT shower or change clothes before the medical examination — this destroys forensic evidence",
    "HIV PEP treatment must start within 72 hours to be effective",
    "Try not to eat, drink, or wash your hands before the examination if the violation was recent",
  ],
  legalBasis: "Sexual Offences Act 32 of 2007; Children's Act 38 of 2005",
};

const STEP_POLICE_REPORT: JusticeStep = {
  id: "police_report",
  order: 3,
  title: "Open a Police Case (CAS Number)",
  description: {
    grade_1_2: "A trusted grown-up can help you go to the police station. The police will write down what happened and give you a special number called a CAS number. Keep it safe!",
    grade_3_5: "Go to the police station with a trusted adult. Tell the police what happened. They will open a case and give you a CAS (Case Administration System) number. Write it down and keep it.",
    grade_6_7: "Go to your nearest police station — ideally the one in the area where the incident occurred. Ask for the FCS (Family Violence, Child Protection & Sexual Offences) Unit specifically. They are trained to handle cases involving children. You will receive a CAS number.",
    grade_8_12: "Open a case at the SAPS FCS Unit. Bring your ID or birth certificate if you have it, but the police CANNOT refuse to take your statement without ID. You can also report online via the SAPS e-services portal. The FCS Unit handles SRGBV, child abuse, and sexual offences.",
  },
  timeline: "As soon as possible — within 24–72 hours",
  dueInDays: 3,
  isDeadlineCritical: true,
  actions: [
    "Go to the nearest police station (FCS Unit)",
    "Bring a trusted adult (parent, social worker, or Childline counsellor)",
    "Report exactly what happened — be as detailed as possible",
    "Receive and write down your CAS number",
    "Ask for the name and phone number of your Investigating Officer (IO)",
    "Ask when your next follow-up appointment is",
  ],
  documents: [
    "J88 form (if already completed)",
    "ID / birth certificate (not required but helpful)",
    "Any physical evidence or screenshots",
  ],
  contacts: [SAPS, CHILDLINE, LAWYERS_ABUSE, POWA],
  ePolicingOptions: [
    "SAPS Online Reporting: https://www.saps.gov.za/resource_centre/online_services.php",
    "Report cybercrime online: https://www.saps.gov.za/services/crimestop.php",
    "SAPS e-docket check: Contact your nearest FCS Unit for your docket number",
  ],
  tips: [
    "The police MUST take your report — they cannot refuse",
    "Ask specifically for the FCS (Family Violence, Child Protection & Sexual Offences) Unit",
    "Keep your CAS number safe — you will need it for all future steps",
    "You are entitled to a free copy of your statement",
    "If police refuse to help, call the SAPS National Commissioner: 012 393 1000",
  ],
  warningFlags: [
    "If police refuse to take your statement, call Childline 116 or IPID 0800 023 334",
    "Do not sign a blank statement form",
    "Never give original documents — keep copies",
    "The CAS number is proof your case was opened",
  ],
  legalBasis: "Criminal Procedure Act 51 of 1977; Sexual Offences Act 32 of 2007",
};

const STEP_STATEMENT: JusticeStep = {
  id: "statement",
  order: 4,
  title: "Give Your Official Statement",
  description: {
    grade_1_2: "The police will ask you to tell them everything that happened. A kind police officer will write it all down. A grown-up you trust can stay with you.",
    grade_3_5: "You will give a full statement to the police. Tell them everything you remember about what happened. A trusted adult can be with you. The police will write it down and ask you to sign.",
    grade_6_7: "Your detailed written statement is a key piece of evidence. Tell the police everything — when, where, what happened, who was involved, and any witnesses. Read the statement carefully before signing. You can have a trusted adult or legal representative present.",
    grade_8_12: "Your sworn statement is crucial legal evidence. Be thorough and honest. Include the date, time, location, what was said and done, any witnesses, and the impact on you. You have the right to have a legal representative present. Read everything before signing — once signed it becomes a legal document.",
  },
  timeline: "Within 1 week of reporting",
  dueInDays: 7,
  isDeadlineCritical: false,
  actions: [
    "Tell the police everything you remember about the incident",
    "Include: date, time, place, what happened, who did it, any witnesses",
    "Read the full statement before signing",
    "Keep a signed copy of your statement",
    "Ask when you can follow up on your case",
  ],
  documents: [
    "Your written and signed statement (keep a copy)",
    "List of any witnesses",
  ],
  contacts: [SAPS, LEGAL_AID, LAWYERS_ABUSE],
  tips: [
    "Take your time — you do not have to rush",
    "If you remember something later, you can add it as a supplementary statement",
    "Ask for an interpreter if needed — free of charge",
  ],
  warningFlags: [
    "Do not sign anything you have not read and understood",
    "Keep a copy of everything you sign",
    "If you feel pressured or unsafe at the police station, call Childline 116",
  ],
};

const STEP_INVESTIGATION: JusticeStep = {
  id: "investigation",
  order: 5,
  title: "Police Investigation",
  description: {
    grade_1_2: "The police are now looking for information to help your case. They will talk to witnesses and collect evidence. This takes some time — be patient.",
    grade_3_5: "The police will investigate your case. They will speak to witnesses, collect evidence, and build a file about what happened. This can take several months.",
    grade_6_7: "During the investigation phase, the police will gather all evidence, interview witnesses, collect forensic evidence, and build a docket. Your Investigating Officer (IO) is responsible for your case. You can request updates using your CAS number.",
    grade_8_12: "The IO will gather all evidence for your docket — witness statements, forensic reports, CCTV, digital evidence, J88 forms. You can contact the station commander if your IO is unresponsive. The investigation phase typically takes 6–18 months.",
  },
  timeline: "6–18 months (typical)",
  dueInDays: null,
  isDeadlineCritical: false,
  actions: [
    "Keep all contact information for your Investigating Officer (IO)",
    "Follow up on your case every 30 days using your CAS number",
    "Notify your IO of any new information or witnesses",
    "Keep a record of all communication with police",
    "Get counselling support (Childline, FAMSA, etc.)",
  ],
  documents: [
    "CAS number (reference for all follow-ups)",
    "IO name and contact number",
    "Form 23 (police case progress form) — you can request this",
  ],
  contacts: [SAPS, CHILDLINE, LAWYERS_ABUSE, DSD],
  tips: [
    "You have the right to know the progress of your case — ask regularly",
    "If your IO changes, get the new IO's contact information",
    "Keep a diary/log of all interactions with police",
    "Request a Form 23 (case progress update) every 3 months",
  ],
  warningFlags: [
    "If your case is not being investigated actively, escalate to the Station Commander",
    "If the IO is unhelpful or hostile, report to IPID: 0800 023 334",
    "Cases can expire (prescribe) after 20 years for serious crimes — don't wait forever",
  ],
  legalBasis: "Criminal Procedure Act 51 of 1977",
};

const STEP_NPA_DECISION: JusticeStep = {
  id: "npa_decision",
  order: 6,
  title: "Prosecutor's Decision (NPA)",
  description: {
    grade_1_2: "The police will send everything to a special person called a prosecutor. This person decides if the person who hurt you will go to court. It can take a while.",
    grade_3_5: "After the investigation, a prosecutor from the National Prosecuting Authority (NPA) will review the evidence and decide whether to take the case to court.",
    grade_6_7: "The docket goes to the National Prosecuting Authority (NPA). The prosecutor reviews all evidence and decides whether to prosecute (take to court) or decline. You have the right to be notified of this decision and to give input.",
    grade_8_12: "The NPA prosecutor reviews the full docket and decides whether to prosecute. If they decline to prosecute, you have the right to request written reasons and to appeal the decision. You can engage a legal representative to advocate for prosecution. This step typically takes 12–24 months from the date of reporting.",
  },
  timeline: "12–24 months from date of reporting",
  dueInDays: null,
  isDeadlineCritical: false,
  actions: [
    "Stay in contact with your IO about the docket status",
    "Provide any new evidence to the IO promptly",
    "Get legal representation if possible",
    "Request to be informed when a decision is made",
  ],
  documents: ["CAS number", "Your statement copy"],
  contacts: [LEGAL_AID, LAWYERS_ABUSE, CHILDLINE],
  tips: [
    "You have the right to know the NPA's decision",
    "If they decline to prosecute, you can request written reasons",
    "A lawyer can help you appeal a decision not to prosecute",
  ],
  warningFlags: [
    "If prosecution is declined without good reason, you can file a formal complaint with the NPA",
    "Do not give up — many cases are successfully prosecuted after initial delays",
  ],
  legalBasis: "NPA Act 32 of 1998; Constitution Section 179",
};

const STEP_TRIAL: JusticeStep = {
  id: "trial",
  order: 7,
  title: "Court Trial",
  description: {
    grade_1_2: "The person who hurt you will go to court. A judge will listen to everyone and decide what happens. You might have to tell the judge what happened — but a special helper will be with you.",
    grade_3_5: "The person who hurt you will have to go to court. A judge or magistrate will listen to both sides. You may need to testify (tell the court what happened). There are special people who will help and support you through this.",
    grade_6_7: "The court case involves a prosecutor (who helps you), a defence attorney (for the accused), and a magistrate or judge. You may be called as a witness. As a child, you have the right to testify behind a screen or via closed-circuit TV (Section 170A of the Criminal Procedure Act).",
    grade_8_12: "The trial takes place in the Magistrate's Court (for less serious offences) or High Court (for serious offences like rape). You have the right to: testify behind a screen or via CCTV, have a support person next to you, receive witness protection if needed, and have a child justice intermediary appointed to help you communicate.",
  },
  timeline: "18–36 months from reporting (varies significantly)",
  dueInDays: null,
  isDeadlineCritical: false,
  actions: [
    "Attend all court dates",
    "Meet with the prosecutor before testifying",
    "Request a court preparation session from Childline/NPA victim support",
    "Know your rights as a witness (screen, CCTV, support person)",
    "Keep all court documents",
  ],
  documents: [
    "Subpoena / summons to appear",
    "CAS number",
    "All prior documents",
    "Witness statement",
  ],
  contacts: [LEGAL_AID, LAWYERS_ABUSE, CHILDLINE, POWA],
  tips: [
    "You have the right to testify behind a screen as a child witness",
    "Ask the prosecutor to explain the court process before you testify",
    "A support person (not a witness) can sit next to you in court",
    "Court preparation is available through the NPA — ask for it",
    "You cannot be forced to face the accused directly if you are under 18",
  ],
  warningFlags: [
    "Missing a court date can damage the case — contact the prosecutor immediately if you cannot attend",
    "Do not discuss your testimony with other witnesses",
    "Record all court dates in writing",
  ],
  legalBasis: "Criminal Procedure Act Section 170A; Children's Act 38 of 2005",
};

const STEP_VERDICT_SENTENCING: JusticeStep = {
  id: "verdict_sentencing",
  order: 8,
  title: "Verdict & Sentencing",
  description: {
    grade_1_2: "The judge will decide if the person is guilty. If they are, the judge will decide what happens to them. You will be safe.",
    grade_3_5: "The magistrate or judge will give a verdict: guilty or not guilty. If the person is found guilty, they will be sentenced — this could be jail time, a fine, or community service.",
    grade_6_7: "After all evidence is heard, the magistrate or judge gives a verdict. If guilty, sentencing follows — considering the seriousness of the offence and the impact on you (victim impact statement). You can submit a victim impact statement.",
    grade_8_12: "The verdict is either guilty or not guilty. If guilty, the magistrate/judge sentences based on legislation (e.g. Sexual Offences Act has minimum sentences for rape). You have the right to submit a Victim Impact Statement (VIS) to be considered at sentencing. If not guilty, you can discuss appeal options with your legal representative.",
  },
  timeline: "After trial concludes",
  dueInDays: null,
  isDeadlineCritical: false,
  actions: [
    "Attend the verdict and sentencing",
    "Prepare a Victim Impact Statement (VIS) to submit to the court",
    "Ask your legal representative about appeals if not guilty verdict",
    "Ensure the accused is registered on the National Sex Offender Register (if applicable)",
  ],
  documents: [
    "Victim Impact Statement (you write this)",
    "Court judgment document",
  ],
  contacts: [LEGAL_AID, LAWYERS_ABUSE, CHILDLINE],
  tips: [
    "A Victim Impact Statement lets you tell the court how the crime affected your life",
    "Ask your attorney or the prosecutor to help you write the VIS",
    "The National Sex Offender Register means the offender cannot work with children",
  ],
  warningFlags: [
    "Not guilty does not mean nothing happened — it means the prosecution did not prove it beyond reasonable doubt",
    "You can still pursue civil action even after a not guilty verdict",
  ],
  legalBasis: "Sexual Offences Act 32 of 2007; Criminal Procedure Act; Victim Empowerment Programme",
};

// Civil Steps
const STEP_CIVIL_RIGHTS_ASSESSMENT: JusticeStep = {
  id: "civil_rights_assessment",
  order: 1,
  title: "Understand Which Civil Rights Were Violated",
  description: {
    grade_1_2: "Someone broke the rules about how you should be treated. There are laws that protect you. A special person can help you understand what happened and what can be done.",
    grade_3_5: "Different laws protect different rights. Understanding which law was broken helps you find the right place to get help. A social worker, lawyer, or counsellor can help you figure this out.",
    grade_6_7: "South African law gives you rights through the Constitution, the Children's Act, the Schools Act, and many others. When a right is violated, you can take your case to the right organisation or court.",
    grade_8_12: "Identify the specific right violated and the relevant legal framework. Is it a Constitutional right (SAHRC)? A school right (DBE/Equality Court)? A privacy right (POPIA/Information Regulator)? This determines which body has jurisdiction and can provide the remedy.",
  },
  timeline: "As soon as you are safe",
  dueInDays: 30,
  isDeadlineCritical: false,
  actions: [
    "Write down exactly what happened",
    "Identify who violated your rights and in what context",
    "Speak to a lawyer, social worker, or Childline for guidance",
    "Identify which law or right was violated",
  ],
  documents: ["Written account of what happened", "Any evidence (photos, messages, witnesses)"],
  contacts: [CHILDLINE, LEGAL_AID, SAHRC, LAWYERS_ABUSE],
  tips: [
    "You don't have to know all the legal details — Childline and Legal Aid can help guide you",
    "Keep records of everything from the start",
  ],
  warningFlags: [
    "Some civil complaints have time limits (prescription) — act within 3 years in most cases",
    "For SAHRC complaints, submit within 2 years of the violation",
  ],
};

const STEP_CIVIL_COMPLAINT: JusticeStep = {
  id: "civil_complaint",
  order: 2,
  title: "File a Formal Complaint",
  description: {
    grade_1_2: "A grown-up can write a letter to the school or another organisation explaining what happened and asking them to fix it.",
    grade_3_5: "You or a trusted adult can file a formal complaint with the right organisation — the school, the Department of Education, the Human Rights Commission, or another body.",
    grade_6_7: "File a formal written complaint with the relevant body. Include all details, evidence, and what remedy you are seeking. Keep a copy of everything you submit.",
    grade_8_12: "Draft and submit a formal complaint to the relevant body (SAHRC, CGE, DBE, Information Regulator, etc.). Include: your details, the respondent's details, full account of the violation, evidence, and specific remedy sought. Many bodies have online complaint forms.",
  },
  timeline: "As soon as possible — within 30 days",
  dueInDays: 30,
  isDeadlineCritical: false,
  actions: [
    "Write a clear, detailed complaint letter",
    "Attach all supporting evidence",
    "Submit to the correct body",
    "Get written acknowledgement of your complaint",
    "Keep copies of everything",
  ],
  documents: [
    "Formal complaint letter",
    "Supporting evidence (photos, messages, reports)",
    "Acknowledgement of receipt",
  ],
  contacts: [SAHRC, CGE, DBE, LEGAL_AID],
  ePolicingOptions: [
    "SAHRC Online Complaint Form: https://www.sahrc.org.za/index.php/complaints-form",
    "CGE Online Complaint: https://www.cge.org.za/file-a-complaint/",
    "DBE Hotline: 0800 202 933",
  ],
  tips: [
    "Always get written proof that your complaint was received",
    "Follow up in writing if you don't hear back within 30 days",
  ],
  warningFlags: [
    "SAHRC has a 2-year prescription period from the date of violation",
    "Equality Court applications should be filed within 3 years",
  ],
};

const STEP_MEDIATION: JusticeStep = {
  id: "mediation",
  order: 3,
  title: "Mediation / Conciliation",
  description: {
    grade_1_2: "Some problems can be solved by talking with a helper. They will listen to both sides and help find a fair solution.",
    grade_3_5: "Before going to court, many organisations try to solve the problem through mediation — talking with a neutral person who helps both sides reach an agreement.",
    grade_6_7: "Many civil bodies require a mediation step before going to court. A neutral mediator helps both parties reach an agreement. If successful, you avoid the stress of a full court process.",
    grade_8_12: "Most civil bodies (SAHRC, CGE, Equality Court) first attempt conciliation/mediation. This is a faster, less formal process. If mediation fails or the respondent refuses, the matter proceeds to a formal hearing or court.",
  },
  timeline: "3–6 months after complaint",
  dueInDays: null,
  isDeadlineCritical: false,
  actions: [
    "Attend all scheduled mediation sessions",
    "Prepare a clear statement of what remedy you want",
    "Bring supporting evidence",
    "Have a support person or legal representative with you",
  ],
  documents: ["Your complaint documents", "Evidence"],
  contacts: [LEGAL_AID, SAHRC, LAWYERS_ABUSE],
  tips: [
    "Know what you want as a result before mediation (apology, reinstatement, compensation, etc.)",
    "You don't have to agree to an outcome that doesn't satisfy you",
  ],
  warningFlags: [
    "Do not sign any settlement agreement without reading and understanding it fully",
    "Get legal advice before accepting or rejecting a settlement",
  ],
};

const STEP_CIVIL_HEARING: JusticeStep = {
  id: "civil_hearing",
  order: 4,
  title: "Formal Hearing or Court",
  description: {
    grade_1_2: "If talking didn't work, a judge or panel will listen to your story and decide what is fair.",
    grade_3_5: "If mediation doesn't work, your case goes to a formal hearing or court where a judge decides what should happen.",
    grade_6_7: "If mediation fails, the matter goes to a formal hearing (at SAHRC, CGE, or Equality Court). You present your evidence and the other party does the same. A panel or magistrate makes a binding decision.",
    grade_8_12: "The formal civil hearing or court process involves presenting evidence, cross-examination, legal arguments, and ultimately a binding decision. In the Children's Court, matters involving child welfare are decided. In the Equality Court, discrimination matters are resolved. The High Court handles more complex civil matters.",
  },
  timeline: "6–18 months after complaint",
  dueInDays: null,
  isDeadlineCritical: false,
  actions: [
    "Prepare your full evidence file",
    "Obtain legal representation if possible",
    "Attend all hearings — missing a hearing can result in dismissal",
    "Submit all required documents in advance",
  ],
  documents: ["All prior correspondence and evidence", "Legal submissions"],
  contacts: [LEGAL_AID, LAWYERS_ABUSE, SAHRC],
  tips: [
    "Ask your legal representative to explain the process before the hearing",
    "Child-friendly accommodations can be requested",
  ],
  warningFlags: [
    "Missing a hearing can result in your case being dismissed",
    "Bring all original documents as well as copies",
  ],
};

const STEP_CIVIL_JUDGMENT: JusticeStep = {
  id: "civil_judgment",
  order: 5,
  title: "Order / Judgment & Enforcement",
  description: {
    grade_1_2: "The judge will say what must happen to make things right for you. The other side has to do what the judge says.",
    grade_3_5: "The judge or panel makes a final decision. If you win, the person or organisation must do what the judge orders — like saying sorry, paying money, or changing their rules.",
    grade_6_7: "The court or hearing panel issues a binding order. Remedies can include an apology, reinstatement, compensation, changes in policy, or referral to a criminal court. If the order is not followed, it can be enforced through the court.",
    grade_8_12: "Civil remedies include: declaratory order (confirming your rights were violated), prohibitory interdicts (stopping harmful behaviour), mandatory interdicts (compelling action), and compensation (damages). If the respondent does not comply with the order, you can apply to the High Court for enforcement, contempt of court proceedings, or sheriff enforcement.",
  },
  timeline: "After hearing concludes",
  dueInDays: null,
  isDeadlineCritical: false,
  actions: [
    "Collect the final written order",
    "Monitor compliance with the order",
    "Report non-compliance to your legal representative",
    "Apply to court for enforcement if order is ignored",
  ],
  documents: ["Final court order or judgment", "All case documents"],
  contacts: [LEGAL_AID, LAWYERS_ABUSE, SAHRC],
  tips: [
    "Keep the original court order in a safe place",
    "If the order is not complied with, you can go back to court for enforcement",
  ],
  warningFlags: [
    "Do not destroy any documents — they may be needed for enforcement",
    "Deadlines in court orders are legally binding on both parties",
  ],
};

// ─── VIOLATION TYPES ─────────────────────────────────────────────────────────

const VIOLATIONS: ViolationContextGroup[] = [
  // ── SCHOOL ───────────────────────────────────────────────────────────────
  {
    id: "school",
    label: "At School",
    emoji: "🏫",
    description: "Violations that happen at school — by teachers, other learners, or school management",
    types: [
      {
        id: "school_corporal_punishment",
        context: "school",
        label: "Beaten or hit by a teacher",
        emoji: "🚫",
        ageGroups: ["grade_1_2", "grade_3_5", "grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "A teacher is not allowed to hit you. This is called corporal punishment and it's against the law in South Africa.",
          grade_3_5: "Corporal punishment (beating or hitting) by teachers has been banned in South African schools since 1996 under the Schools Act. Any teacher who hits a learner is breaking the law.",
          grade_6_7: "Corporal punishment in schools is prohibited by Section 10 of the South African Schools Act 84 of 1996 and violates your right to dignity under the Constitution (Section 10). Teachers who physically punish learners can face criminal charges and dismissal.",
          grade_8_12: "Corporal punishment is absolutely prohibited under Section 10 of the SA Schools Act 84 of 1996 and violates Constitution Section 10 (dignity) and Section 12 (freedom and security of person). The offending educator can face criminal assault charges and SACE professional misconduct proceedings.",
        },
        rightsViolated: [
          { right: "Right to dignity (Section 10)", legalBasis: "Constitution of South Africa" },
          { right: "Right to physical integrity (Section 12)", legalBasis: "Constitution of South Africa" },
          { right: "Right to be free from corporal punishment", legalBasis: "SA Schools Act 84 of 1996, Section 10" },
        ],
        pathway: "both",
        urgency: "urgent",
        criminalSteps: [
          STEP_IMMEDIATE_SAFETY,
          STEP_MEDICAL_J88,
          STEP_POLICE_REPORT,
          STEP_STATEMENT,
          STEP_INVESTIGATION,
          STEP_NPA_DECISION,
          STEP_TRIAL,
          STEP_VERDICT_SENTENCING,
        ],
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            id: "school_complaint",
            title: "Report to School and Department of Education",
            actions: [
              "Report to the school principal in writing",
              "If no action: report to the District Director of Education",
              "File a complaint with SACE (South African Council for Educators)",
              "File a complaint with the DBE Hotline: 0800 202 933",
              "You can also file with the School Governing Body (SGB)",
            ],
            contacts: [DBE, SACE, LEGAL_AID],
          },
          STEP_MEDIATION,
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
        ePolicing: {
          title: "Report Online",
          description: "You can report educator misconduct online without going to the school first.",
          links: [
            { label: "SACE Online Complaint", url: "https://www.sace.org.za" },
            { label: "DBE Hotline", url: "tel:0800202933" },
          ],
        },
      },
      {
        id: "school_sexual_assault",
        context: "school",
        label: "Sexual assault or rape at school",
        emoji: "🆘",
        ageGroups: ["grade_3_5", "grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "No one is allowed to touch your private parts or hurt you in a private way. This is very wrong and adults must help you right away.",
          grade_3_5: "Sexual assault at school — by a teacher, learner, or staff member — is a serious crime. You must get help immediately. Call Childline 116 or go to a trusted adult.",
          grade_6_7: "Sexual assault or rape at school is a serious criminal offence under the Sexual Offences Act 32 of 2007. Whether committed by a teacher, learner, or staff member, it is a crime. Get medical help within 72 hours and report to police.",
          grade_8_12: "Sexual assault by an educator constitutes a serious criminal offence under the Sexual Offences Act and a violation of the Employment of Educators Act. The educator faces criminal prosecution, registration on the Sex Offenders Register, and permanent removal from the teaching profession via SACE.",
        },
        rightsViolated: [
          { right: "Right to dignity (Section 10)", legalBasis: "Constitution of South Africa" },
          { right: "Right to bodily integrity (Section 12(2))", legalBasis: "Constitution of South Africa" },
          { right: "Sexual offences against children", legalBasis: "Sexual Offences Act 32 of 2007" },
          { right: "Protection from educator misconduct", legalBasis: "Employment of Educators Act 76 of 1998" },
        ],
        pathway: "both",
        urgency: "emergency",
        criminalSteps: [
          STEP_IMMEDIATE_SAFETY,
          STEP_MEDICAL_J88,
          STEP_POLICE_REPORT,
          STEP_STATEMENT,
          STEP_INVESTIGATION,
          STEP_NPA_DECISION,
          STEP_TRIAL,
          STEP_VERDICT_SENTENCING,
        ],
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            title: "Report to SACE and Department of Education",
            contacts: [SACE, DBE, LAWYERS_ABUSE],
          },
          STEP_MEDIATION,
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
        ePolicing: {
          title: "Report Sexual Assault Online",
          description: "Report online or find your nearest Thuthuzela Care Centre.",
          links: [
            { label: "SAPS Online Reporting", url: "https://www.saps.gov.za/resource_centre/online_services.php" },
            { label: "Find nearest TCC", url: "https://www.saps.gov.za" },
          ],
        },
      },
      {
        id: "school_bullying",
        context: "school",
        label: "Bullying — physical or emotional",
        emoji: "😢",
        ageGroups: ["grade_1_2", "grade_3_5", "grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "Someone at school is being mean, hurting, or scaring you on purpose. This is not okay and you should tell a teacher or parent.",
          grade_3_5: "Bullying — hitting, threatening, excluding, calling names — is wrong and schools must take action. If a teacher or the principal doesn't help, you can escalate.",
          grade_6_7: "Persistent bullying violates your right to safety and dignity at school. Schools have a duty to provide a safe learning environment under the SA Schools Act. Bullying that involves assault can also be reported to police.",
          grade_8_12: "Severe bullying (physical assault, threats, sexual harassment) is a criminal offence. Schools have a legal duty of care. If the school fails to act, you can escalate to the District Director of Education, file a Protection from Harassment Act application, or pursue civil remedies.",
        },
        rightsViolated: [
          { right: "Right to dignity (Section 10)", legalBasis: "Constitution of South Africa" },
          { right: "Right to education in a safe environment", legalBasis: "SA Schools Act 84 of 1996" },
        ],
        pathway: "both",
        urgency: "urgent",
        criminalSteps: [
          STEP_IMMEDIATE_SAFETY,
          STEP_POLICE_REPORT,
          STEP_STATEMENT,
          STEP_INVESTIGATION,
          STEP_NPA_DECISION,
          STEP_TRIAL,
          STEP_VERDICT_SENTENCING,
        ],
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            title: "Report to School Principal and SGB",
            actions: [
              "Report bullying in writing to the principal",
              "If no action: escalate to School Governing Body (SGB)",
              "If still no action: report to District Director of Education",
              "Apply for a Protection Order under the Protection from Harassment Act 17 of 2011",
              "Report to DBE Hotline: 0800 202 933",
            ],
            contacts: [DBE, LEGAL_AID, CHILDLINE],
          },
          STEP_MEDIATION,
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
      },
      {
        id: "school_unfair_exclusion",
        context: "school",
        label: "Unfairly expelled or excluded from school",
        emoji: "🚪",
        ageGroups: ["grade_3_5", "grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "Every child in South Africa has the right to go to school. If a school is stopping you from going to school, a grown-up can help fix this.",
          grade_3_5: "Every child has the right to basic education. Schools cannot expel learners without following proper procedures.",
          grade_6_7: "Learners cannot be expelled or suspended without following the proper disciplinary procedures in the SA Schools Act. You have the right to a fair hearing and to appeal any decision.",
          grade_8_12: "Expulsion and suspension must follow Chapter 8 of the SA Schools Act. You have the right to be represented, heard, and to appeal. Emergency exclusions longer than 5 days without a hearing are unlawful. Challenge through the school, SGB, District, and Equality Court if necessary.",
        },
        rightsViolated: [
          { right: "Right to basic education (Section 29)", legalBasis: "Constitution of South Africa" },
          { right: "Right to fair disciplinary procedures", legalBasis: "SA Schools Act 84 of 1996, Section 9" },
        ],
        pathway: "civil",
        urgency: "urgent",
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            title: "Appeal the Expulsion Decision",
            actions: [
              "Request written reasons for the expulsion",
              "Submit a formal appeal to the School Governing Body (SGB)",
              "If SGB upholds: appeal to the Head of Department",
              "If still unsuccessful: approach the Equality Court or High Court",
              "Contact Legal Aid or Lawyers Against Abuse for representation",
            ],
            contacts: [DBE, LEGAL_AID, SAHRC],
          },
          STEP_MEDIATION,
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
        ePolicing: {
          title: "Report Exclusion Online",
          description: "File a complaint about unfair school exclusion online.",
          links: [
            { label: "DBE Hotline (online form)", url: "https://www.education.gov.za" },
            { label: "SAHRC Online Complaint", url: "https://www.sahrc.org.za" },
          ],
        },
      },
    ],
  },

  // ── HOME / FAMILY ─────────────────────────────────────────────────────────
  {
    id: "home",
    label: "At Home / Family",
    emoji: "🏠",
    description: "Violations within the home — by parents, guardians, or family members",
    types: [
      {
        id: "home_physical_abuse",
        context: "home",
        label: "Physical abuse by a parent or guardian",
        emoji: "🤕",
        ageGroups: ["grade_1_2", "grade_3_5", "grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "A grown-up at home is hurting you with their hands or an object. This is NOT okay and it's against the law. You can call 116 for help — it's free.",
          grade_3_5: "Hitting or physically harming children — even by parents — is abuse under South African law. You deserve to be safe. Call Childline 116 or a social worker.",
          grade_6_7: "Physical abuse by a parent or caregiver is a criminal offence under the Children's Act 38 of 2005. A social worker can get a court order to protect you. You can report to SAPS or the Department of Social Development.",
          grade_8_12: "Physical abuse by a parent or caregiver violates Sections 10 and 12 of the Constitution and is an offence under Section 305 of the Children's Act 38 of 2005. A Children's Court can issue an order removing you from the abusive environment and placing you in a place of safety.",
        },
        rightsViolated: [
          { right: "Right to dignity (Section 10)", legalBasis: "Constitution of South Africa" },
          { right: "Right to be protected from physical abuse", legalBasis: "Children's Act 38 of 2005" },
          { right: "Right to physical integrity (Section 12)", legalBasis: "Constitution of South Africa" },
        ],
        pathway: "both",
        urgency: "emergency",
        criminalSteps: [
          STEP_IMMEDIATE_SAFETY,
          STEP_MEDICAL_J88,
          STEP_POLICE_REPORT,
          STEP_STATEMENT,
          STEP_INVESTIGATION,
          STEP_NPA_DECISION,
          STEP_TRIAL,
          STEP_VERDICT_SENTENCING,
        ],
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            title: "Report to Social Worker / Children's Court",
            actions: [
              "Report to the Department of Social Development (DSD)",
              "A social worker will assess your situation within 24 hours for urgent cases",
              "The social worker can apply to the Children's Court for an emergency protection order",
              "You can also report to SAPS — they can contact DSD",
              "Apply for a Domestic Violence Protection Order at your nearest Magistrate's Court",
            ],
            contacts: [DSD, CHILDLINE, POWA, LEGAL_AID],
          },
          STEP_MEDIATION,
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
      },
      {
        id: "home_sexual_abuse",
        context: "home",
        label: "Sexual abuse by a family member",
        emoji: "🆘",
        ageGroups: ["grade_3_5", "grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "If someone in your family is touching your private parts or doing bad things with your body, you must tell a teacher or call 116 right away. It is NOT your fault.",
          grade_3_5: "Sexual abuse by a family member is a serious crime. It is NEVER your fault. Call Childline 116, tell a teacher, or go to the police. You will be protected.",
          grade_6_7: "Sexual abuse by a family member (incest) is a serious criminal offence under the Sexual Offences Act 32 of 2007. You will be protected — a social worker can remove you from the home and a criminal case can be opened. It is NOT your fault.",
          grade_8_12: "Sexual abuse by a family member constitutes rape/sexual assault under the Sexual Offences Act 32 of 2007. The perpetrator can face imprisonment. You can be removed from the home by the DSD, placed in a place of safety, and receive full legal protection. HIV PEP, emergency contraception, and trauma counselling are available free of charge.",
        },
        rightsViolated: [
          { right: "Right to bodily integrity (Section 12(2))", legalBasis: "Constitution of South Africa" },
          { right: "Right to be protected from sexual abuse", legalBasis: "Sexual Offences Act 32 of 2007; Children's Act 38 of 2005" },
        ],
        pathway: "both",
        urgency: "emergency",
        criminalSteps: [
          STEP_IMMEDIATE_SAFETY,
          STEP_MEDICAL_J88,
          STEP_POLICE_REPORT,
          STEP_STATEMENT,
          STEP_INVESTIGATION,
          STEP_NPA_DECISION,
          STEP_TRIAL,
          STEP_VERDICT_SENTENCING,
        ],
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            title: "Emergency Protection Through Children's Court",
            actions: [
              "Contact DSD immediately — request emergency removal from the home",
              "SAPS can apply for emergency protection on your behalf",
              "Children's Court can issue an emergency order placing you in a place of safety",
              "A social worker will be assigned to your case",
            ],
            contacts: [DSD, CHILDLINE, GBV_HOTLINE, THUTHUZELA],
          },
          STEP_MEDIATION,
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
      },
      {
        id: "home_neglect",
        context: "home",
        label: "Neglect — no food, clothing, or care",
        emoji: "😔",
        ageGroups: ["grade_1_2", "grade_3_5", "grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "Every child must be given food, clothes, and someone to look after them. If this is not happening, a social worker can help.",
          grade_3_5: "Child neglect — when parents or guardians don't provide food, clothing, shelter, or medical care — is against the law.",
          grade_6_7: "Child neglect is an offence under the Children's Act 38 of 2005. The Department of Social Development can intervene, provide support to the family, and protect children from neglect.",
          grade_8_12: "Neglect — failure to provide adequate food, clothing, shelter, medical care, or supervision — constitutes a violation of children's rights under the Children's Act. DSD can intervene, provide social grants, and if necessary, remove the child through the Children's Court.",
        },
        rightsViolated: [
          { right: "Right to basic nutrition, shelter, healthcare and social services (Section 28(1)(c))", legalBasis: "Constitution of South Africa" },
          { right: "Protection from neglect", legalBasis: "Children's Act 38 of 2005" },
        ],
        pathway: "civil",
        urgency: "urgent",
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            title: "Report to Department of Social Development",
            actions: [
              "Report to the DSD social services at your nearest DSD office",
              "Contact Childline 116 — they can refer you to DSD",
              "A social worker will assess the home situation",
              "DSD can provide social grants, food parcels, and support",
              "If the situation is critical, the Children's Court can be approached",
            ],
            contacts: [DSD, CHILDLINE, LEGAL_AID],
          },
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
      },
    ],
  },

  // ── COMMUNITY ─────────────────────────────────────────────────────────────
  {
    id: "community",
    label: "In the Community",
    emoji: "🏘️",
    description: "Violations in public spaces — streets, taxis, community events",
    types: [
      {
        id: "community_sexual_assault",
        context: "community",
        label: "Sexual assault or rape",
        emoji: "🆘",
        ageGroups: ["grade_3_5", "grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "If someone touched you in a bad way, tell a grown-up right away. Call 116 or 10111. You are not in trouble. It is not your fault.",
          grade_3_5: "Sexual assault is never your fault. Get help right away — go to an adult you trust, call 116, or go to the hospital. Evidence is important — don't shower yet.",
          grade_6_7: "Sexual assault or rape is a serious crime under the Sexual Offences Act 32 of 2007. Get to safety, get medical care within 72 hours, and report to the police. A Thuthuzela Care Centre provides all services in one place.",
          grade_8_12: "Sexual assault/rape is prosecuted under the Sexual Offences Act 32 of 2007. You have the right to HIV PEP, emergency contraception, trauma counselling, forensic examination, and legal support — all free through Thuthuzela Care Centres. Preserve all forensic evidence before any washing.",
        },
        rightsViolated: [
          { right: "Right to bodily integrity (Section 12(2))", legalBasis: "Constitution of South Africa" },
          { right: "Sexual offences", legalBasis: "Sexual Offences Act 32 of 2007" },
        ],
        pathway: "criminal",
        urgency: "emergency",
        criminalSteps: [
          STEP_IMMEDIATE_SAFETY,
          STEP_MEDICAL_J88,
          STEP_POLICE_REPORT,
          STEP_STATEMENT,
          STEP_INVESTIGATION,
          STEP_NPA_DECISION,
          STEP_TRIAL,
          STEP_VERDICT_SENTENCING,
        ],
        ePolicing: {
          title: "Report Sexual Assault Online / Get Help",
          description: "Find a Thuthuzela Care Centre near you or report to SAPS online.",
          links: [
            { label: "Find nearest TCC (SAPS)", url: "https://www.saps.gov.za" },
            { label: "SAPS Online Report", url: "https://www.saps.gov.za/resource_centre/online_services.php" },
          ],
        },
      },
      {
        id: "community_trafficking",
        context: "community",
        label: "Human trafficking or being held against your will",
        emoji: "⚠️",
        ageGroups: ["grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "If someone is keeping you somewhere you don't want to be, try to get help from any adult, call 116, or shout for help.",
          grade_3_5: "Human trafficking is when people are forced, tricked, or controlled by others for exploitation. If this is happening to you or someone you know, call 116 immediately.",
          grade_6_7: "Human trafficking violates your fundamental rights. It is a serious crime under the Prevention and Combating of Trafficking in Persons Act 7 of 2013. Victims get full legal protection, support services, and cannot be prosecuted for crimes committed while being trafficked.",
          grade_8_12: "Human trafficking is prosecuted under the Prevention and Combating of Trafficking in Persons Act 7 of 2013. Victims are protected from prosecution, entitled to a reflection and recovery period, immediate shelter and support, and legal assistance. Contact the NPA's Trafficking in Persons Unit or SAPS DPCI (Hawks).",
        },
        rightsViolated: [
          { right: "Right to freedom and security (Section 12)", legalBasis: "Constitution of South Africa" },
          { right: "Right against slavery and forced labour (Section 13)", legalBasis: "Constitution of South Africa" },
          { right: "Protection from trafficking", legalBasis: "Prevention and Combating of Trafficking in Persons Act 7 of 2013" },
        ],
        pathway: "criminal",
        urgency: "emergency",
        criminalSteps: [
          STEP_IMMEDIATE_SAFETY,
          STEP_MEDICAL_J88,
          STEP_POLICE_REPORT,
          STEP_STATEMENT,
          STEP_INVESTIGATION,
          STEP_NPA_DECISION,
          STEP_TRIAL,
          STEP_VERDICT_SENTENCING,
        ],
        ePolicing: {
          title: "Emergency Trafficking Reporting",
          description: "Report trafficking immediately through these channels.",
          links: [
            { label: "SAPS Crime Stop (anonymous)", url: "tel:0860010111" },
            { label: "NPA Trafficking Unit", url: "https://www.npa.gov.za" },
          ],
        },
      },
    ],
  },

  // ── ONLINE / DIGITAL ──────────────────────────────────────────────────────
  {
    id: "online",
    label: "Online / Digital",
    emoji: "💻",
    description: "Violations that happen online — cyberbullying, sextortion, image-based abuse",
    types: [
      {
        id: "online_cyberbullying",
        context: "online",
        label: "Cyberbullying — being bullied, harassed or threatened online",
        emoji: "📱",
        ageGroups: ["grade_3_5", "grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "If someone is being mean to you on a phone or computer, tell a parent or teacher. Block them and don't reply.",
          grade_3_5: "Cyberbullying — being threatened, insulted, or harassed online — is hurtful and not okay. Screenshot the evidence, block the person, and tell a trusted adult.",
          grade_6_7: "Cyberbullying can be prosecuted under the Cybercrimes Act 19 of 2020 if it involves harassment, threats, or sending harmful data. Take screenshots, block the bully, and report to police.",
          grade_8_12: "Cyberbullying (harassment, threats, sharing of private information) can be prosecuted under the Cybercrimes Act 19 of 2020 (Sections 14–16), the Protection from Harassment Act 17 of 2011 (online harassment), and the Protection from Personal Information Act (POPIA). Preserve all digital evidence before blocking.",
        },
        rightsViolated: [
          { right: "Right to dignity (Section 10)", legalBasis: "Constitution of South Africa" },
          { right: "Prohibition of cyberharassment", legalBasis: "Cybercrimes Act 19 of 2020" },
          { right: "Protection from harassment", legalBasis: "Protection from Harassment Act 17 of 2011" },
        ],
        pathway: "both",
        urgency: "urgent",
        criminalSteps: [
          STEP_IMMEDIATE_SAFETY,
          {
            ...STEP_POLICE_REPORT,
            title: "Report to Police (Cybercrime Unit)",
            description: {
              ...STEP_POLICE_REPORT.description,
              grade_8_12: "Report to the SAPS Cybercrime Unit at your nearest police station. Bring screenshots, links, usernames, and dates. You can also report cybercrime online through the SAPS e-services portal or directly to your Internet Service Provider.",
            },
            ePolicingOptions: [
              "SAPS Cybercrime Online Report: https://www.saps.gov.za",
              "Report to platform (Facebook, Instagram, TikTok) built-in reporting tools",
              "South African Cybercrime Advisory: https://www.cybersecurityhub.gov.za",
            ],
          },
          STEP_STATEMENT,
          STEP_INVESTIGATION,
          STEP_NPA_DECISION,
          STEP_TRIAL,
          STEP_VERDICT_SENTENCING,
        ],
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            title: "Apply for a Protection from Harassment Order",
            actions: [
              "Collect all screenshots and evidence of the harassment",
              "Apply to the Magistrate's Court for a Protection from Harassment Order",
              "Report to the platform (report the user on Facebook, Instagram, TikTok, etc.)",
              "File with SAHRC if online hate speech is involved",
            ],
            contacts: [LEGAL_AID, SAHRC, CHILDLINE],
            ePolicingOptions: [
              "South African Harassment Protection Order: Apply at Magistrate's Court",
              "Platform reporting: Use platform tools to report and take down content",
            ],
          },
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
        ePolicing: {
          title: "Report Cyberbullying Online",
          description: "Report cyberbullying directly online through these platforms.",
          links: [
            { label: "SAPS Cybercrime Report", url: "https://www.saps.gov.za/resource_centre/online_services.php" },
            { label: "Internet Safety SA (Childline)", url: "https://www.childlinesa.org.za" },
            { label: "Report on Facebook", url: "https://www.facebook.com/help/174867545921415" },
          ],
        },
      },
      {
        id: "online_sextortion",
        context: "online",
        label: "Sextortion — sharing or threatening to share intimate images",
        emoji: "⚠️",
        ageGroups: ["grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "If someone is showing or sending pictures of private body parts, tell a grown-up immediately. This is very wrong.",
          grade_3_5: "If someone is threatening to show private pictures of you, or has already shared them, this is a crime. Tell an adult you trust immediately.",
          grade_6_7: "Sextortion (threatening to share private images to force you to do something) and non-consensual sharing of intimate images are serious crimes under the Cybercrimes Act 19 of 2020 and the Films and Publications Act. Report immediately — do NOT comply with demands.",
          grade_8_12: "Sextortion and non-consensual image sharing (revenge porn) are criminal offences under Sections 16–17 of the Cybercrimes Act 19 of 2020 (up to 3 years imprisonment). Do NOT pay money or comply with demands — this escalates the abuse. Report to SAPS Cybercrime Unit, apply for a takedown through the FPB, and contact Childline.",
        },
        rightsViolated: [
          { right: "Right to privacy (Section 14)", legalBasis: "Constitution of South Africa" },
          { right: "Right to dignity (Section 10)", legalBasis: "Constitution of South Africa" },
          { right: "Prohibition of non-consensual pornography", legalBasis: "Cybercrimes Act 19 of 2020; Films and Publications Act" },
        ],
        pathway: "both",
        urgency: "emergency",
        criminalSteps: [
          {
            ...STEP_IMMEDIATE_SAFETY,
            actions: [
              "Do NOT comply with the sextortionist's demands",
              "Do NOT pay money",
              "Screenshot all evidence (messages, profiles, threats)",
              "Report to a trusted adult immediately",
              "Block the person on all platforms",
              "Report to Childline 116",
            ],
          },
          STEP_POLICE_REPORT,
          STEP_STATEMENT,
          STEP_INVESTIGATION,
          STEP_NPA_DECISION,
          STEP_TRIAL,
          STEP_VERDICT_SENTENCING,
        ],
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            title: "Request Image Takedown and Protection Order",
            actions: [
              "Apply to the Film and Publication Board (FPB) for content takedown",
              "Report to each platform (Instagram, Facebook, TikTok, etc.) using CSAM/abuse reports",
              "Apply for a Protection from Harassment Order at Magistrate's Court",
              "Contact the Information Regulator if POPIA was violated",
            ],
            contacts: [LEGAL_AID, CHILDLINE, SAHRC],
            ePolicingOptions: [
              "FPB Takedown Request: https://www.fpb.org.za",
              "Report CSAM globally: https://www.cybertip.ca (NCMEC partner)",
            ],
          },
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
        ePolicing: {
          title: "Emergency Online Reporting — Sextortion",
          description: "Act fast to take down content and report the crime.",
          links: [
            { label: "FPB Takedown Request", url: "https://www.fpb.org.za" },
            { label: "SAPS Online Cybercrime Report", url: "https://www.saps.gov.za" },
            { label: "StopNCII (image removal tool)", url: "https://stopncii.org" },
          ],
        },
      },
    ],
  },

  // ── HEALTHCARE ────────────────────────────────────────────────────────────
  {
    id: "healthcare",
    label: "Healthcare",
    emoji: "🏥",
    description: "Violations by healthcare providers — refusal of care, privacy breaches",
    types: [
      {
        id: "healthcare_denied_treatment",
        context: "healthcare",
        label: "Denied medical treatment or turned away from a hospital",
        emoji: "🚑",
        ageGroups: ["grade_3_5", "grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "Every child must be given medical help when they need it. No hospital can say no to an emergency.",
          grade_3_5: "Every person has the right to emergency healthcare in South Africa. No public hospital can turn you away in an emergency.",
          grade_6_7: "The right to access healthcare is guaranteed by Section 27 of the Constitution. No public hospital can refuse emergency medical care to anyone. Minor children cannot be denied emergency treatment even without parental consent.",
          grade_8_12: "Section 27(3) of the Constitution prohibits refusal of emergency medical care. The National Health Act 61 of 2003 protects patients' rights. If denied care, document everything, escalate to the hospital superintendent, then the Department of Health Ombudsman and SAHRC.",
        },
        rightsViolated: [
          { right: "Right of access to healthcare (Section 27)", legalBasis: "Constitution of South Africa" },
          { right: "Patient rights", legalBasis: "National Health Act 61 of 2003" },
        ],
        pathway: "civil",
        urgency: "emergency",
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            title: "Escalate to Hospital Management and Health Ombudsman",
            actions: [
              "Demand emergency treatment — insist on your constitutional rights",
              "Ask to speak to the hospital Superintendent or CEO immediately",
              "Document everything: date, time, who refused, what was said",
              "Report to the Provincial Department of Health",
              "File a complaint with the Office of Health Standards Compliance (OHSC)",
              "Report to SAHRC for constitutional rights violations",
            ],
            contacts: [SAHRC, LEGAL_AID, CHILDLINE],
            ePolicingOptions: [
              "OHSC Complaints: https://www.ohsc.org.za",
              "SAHRC Online Complaint: https://www.sahrc.org.za",
            ],
          },
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
      },
    ],
  },

  // ── STATE / POLICE ────────────────────────────────────────────────────────
  {
    id: "state",
    label: "By Police or Government",
    emoji: "🏛️",
    description: "Violations by police officers or government officials",
    types: [
      {
        id: "state_police_brutality",
        context: "state",
        label: "Police brutality or assault by police",
        emoji: "⚖️",
        ageGroups: ["grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "Police are supposed to keep you safe. If a police officer hurts you, tell a trusted adult or call 116.",
          grade_3_5: "Police officers are not allowed to hurt you. If this happens, there are special organisations that investigate police behaviour.",
          grade_6_7: "Police brutality violates your fundamental rights. The Independent Police Investigative Directorate (IPID) investigates police misconduct and can prosecute officers who abuse their power.",
          grade_8_12: "Police brutality/misconduct is investigated by IPID (Independent Police Investigative Directorate) under the IPID Act 1 of 2011. IPID can recommend criminal prosecution of officers and file civil claims against the Minister of Police. You can also file with the SAHRC and pursue civil damages.",
        },
        rightsViolated: [
          { right: "Right to dignity (Section 10)", legalBasis: "Constitution of South Africa" },
          { right: "Right not to be tortured (Section 12(1)(d))", legalBasis: "Constitution of South Africa" },
          { right: "Accountability of SAPS members", legalBasis: "IPID Act 1 of 2011" },
        ],
        pathway: "both",
        urgency: "urgent",
        criminalSteps: [
          STEP_IMMEDIATE_SAFETY,
          STEP_MEDICAL_J88,
          {
            ...STEP_POLICE_REPORT,
            title: "Report to IPID (Not SAPS)",
            description: {
              ...STEP_POLICE_REPORT.description,
              grade_8_12: "Do NOT report police misconduct to SAPS — go directly to IPID. File a complaint with the Independent Police Investigative Directorate (IPID) in person, online, or by phone. IPID is independent of SAPS.",
            },
            contacts: [IPID, SAHRC, LEGAL_AID, LAWYERS_ABUSE],
            ePolicingOptions: [
              "IPID Online Complaint: https://www.ipid.gov.za/complaints",
              "IPID Toll-free: 0800 023 334",
            ],
          },
          STEP_STATEMENT,
          STEP_INVESTIGATION,
          STEP_NPA_DECISION,
          STEP_TRIAL,
          STEP_VERDICT_SENTENCING,
        ],
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            title: "File Civil Claim and SAHRC Complaint",
            actions: [
              "File a complaint with IPID (independent of SAPS)",
              "File a civil claim for damages against the Minister of Police",
              "File with SAHRC for constitutional rights violations",
              "Get medical records (J88) to document injuries",
            ],
            contacts: [IPID, SAHRC, LEGAL_AID],
            ePolicingOptions: [
              "IPID Complaint Online: https://www.ipid.gov.za",
              "SAHRC Complaint: https://www.sahrc.org.za",
            ],
          },
          STEP_MEDIATION,
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
        ePolicing: {
          title: "Report Police Misconduct Online",
          description: "IPID accepts complaints online, by phone, or in person.",
          links: [
            { label: "IPID Online Complaint", url: "https://www.ipid.gov.za" },
            { label: "SAHRC Complaint Form", url: "https://www.sahrc.org.za" },
          ],
        },
      },
    ],
  },

  // ── BUSINESS / WORKPLACE ──────────────────────────────────────────────────
  {
    id: "business",
    label: "By a Business or Employer",
    emoji: "🏢",
    description: "Child labour, exploitation, or violations by businesses",
    types: [
      {
        id: "business_child_labour",
        context: "business",
        label: "Child labour — being forced to work instead of going to school",
        emoji: "⚠️",
        ageGroups: ["grade_3_5", "grade_6_7", "grade_8_12"],
        shortDescription: {
          grade_1_2: "Every child has the right to go to school, play, and be safe — not to work hard jobs. If someone is making you work, tell a teacher or 116.",
          grade_3_5: "In South Africa, children under 15 cannot legally work. Employers who use children for labour can be reported and prosecuted.",
          grade_6_7: "Child labour is prohibited by the Children's Act 38 of 2005 and the Basic Conditions of Employment Act. Children under 15 cannot work at all. Children under 18 cannot do hazardous work.",
          grade_8_12: "Child labour is prohibited under Section 43 of the Children's Act 38 of 2005 and Section 43 of the BCEA. Children under 15 may not perform any work. Children 15–17 may only do light work that does not endanger their health, education, or development. Employers can be fined and prosecuted.",
        },
        rightsViolated: [
          { right: "Right to education (Section 29)", legalBasis: "Constitution of South Africa" },
          { right: "Right not to be exploited (Section 28(1)(f))", legalBasis: "Constitution of South Africa" },
          { right: "Prohibition of child labour", legalBasis: "Children's Act 38 of 2005; BCEA" },
        ],
        pathway: "both",
        urgency: "urgent",
        criminalSteps: [
          STEP_IMMEDIATE_SAFETY,
          STEP_POLICE_REPORT,
          STEP_STATEMENT,
          STEP_INVESTIGATION,
          STEP_NPA_DECISION,
          STEP_TRIAL,
          STEP_VERDICT_SENTENCING,
        ],
        civilSteps: [
          STEP_CIVIL_RIGHTS_ASSESSMENT,
          {
            ...STEP_CIVIL_COMPLAINT,
            title: "Report to Department of Labour and DSD",
            actions: [
              "Report to the Department of Employment and Labour",
              "Report to the Department of Social Development",
              "Contact the CCMA (Commission for Conciliation, Mediation and Arbitration) for labour matters",
              "Contact SAHRC for human rights violations",
            ],
            contacts: [DSD, LEGAL_AID, SAHRC, CHILDLINE],
            ePolicingOptions: [
              "Dept of Labour Online Complaint: https://www.labour.gov.za",
              "CCMA Online: https://www.ccma.org.za",
            ],
          },
          STEP_CIVIL_HEARING,
          STEP_CIVIL_JUDGMENT,
        ],
      },
    ],
  },
];

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

export const VIOLATION_GROUPS = VIOLATIONS;

export function getViolationGroup(contextId: ViolationContext): ViolationContextGroup | undefined {
  return VIOLATIONS.find((g) => g.id === contextId);
}

export function getViolationType(typeId: string): ViolationType | undefined {
  for (const group of VIOLATIONS) {
    const type = group.types.find((t) => t.id === typeId);
    if (type) return type;
  }
  return undefined;
}

export function getStepsForPathway(violationType: ViolationType, pathway: JusticePathway): JusticeStep[] {
  if (pathway === "criminal") return violationType.criminalSteps ?? [];
  if (pathway === "civil") return violationType.civilSteps ?? [];
  return [...(violationType.criminalSteps ?? []), ...(violationType.civilSteps ?? [])];
}

export function getDeadlineStatus(step: JusticeStep, startDate: Date): "overdue" | "due_soon" | "on_track" | "no_deadline" {
  if (step.dueInDays === null) return "no_deadline";
  const dueDate = new Date(startDate.getTime() + step.dueInDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);
  if (diffDays < 0) return "overdue";
  if (diffDays < 2) return "due_soon";
  return "on_track";
}

export const CONTEXT_LABELS: Record<ViolationContext, string> = {
  school: "At School",
  home: "At Home / Family",
  community: "In the Community",
  healthcare: "Healthcare",
  online: "Online / Digital",
  state: "By Police / Government",
  business: "By a Business",
};

export const PATHWAY_LABELS: Record<JusticePathway, string> = {
  criminal: "Criminal Justice Pathway",
  civil: "Civil Justice Pathway",
  both: "Criminal & Civil Pathways",
};
