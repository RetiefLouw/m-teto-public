import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAccessibility } from "@/context/AccessibilityContext";
import {
  Scale,
  FileText,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Gavel,
  Sparkles,
  Loader2,
  X,
  Play,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const GRADE = (localStorage.getItem("mteto_grade") || "grade_6_7") as string;

// ─── Document Catalogue ───────────────────────────────────────────────────────

interface LegalDocument {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  emoji: string;
  colour: string;
  tagline: string;
  whatItIs: string;
  whenUsed: string;
  sampleContent: string;
  videoUrl?: string;
  videoTitle?: string;
  officialLink?: string;
}

const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: "j88",
    title: "J88 Medical Examination Form",
    shortTitle: "J88 Form",
    category: "Medical & Forensic",
    emoji: "🏥",
    colour: "#E8215D",
    tagline: "The medical form used to record injuries after assault or rape",
    whatItIs: "A J88 is a medico-legal form completed by a registered doctor or nurse after they examine someone who has been assaulted or sexually abused. It records injuries, physical findings, and forensic evidence. It is used as crucial evidence in court.",
    whenUsed: "After any physical or sexual assault. You can get a J88 done at any public hospital with a casualty department or a Thuthuzela Care Centre (TCC) — you do NOT need a police case number first. Time matters: get to a doctor as soon as possible after the incident.",
    sampleContent: `J88 — MEDICO-LEGAL EXAMINATION FORM
Republic of South Africa

SECTION A: PATIENT DETAILS
Date of examination: _______________
Name of examiner: Dr _______________
Name of patient: [Confidential]
Date of birth: _______________
SAPS case number (if applicable): _______________

SECTION B: HISTORY (As told by patient / accompanying person)
Circumstances of alleged assault: _______________
Date and time of alleged incident: _______________
Nature of alleged assault: _______________

SECTION C: PHYSICAL EXAMINATION
General condition: _______________
Injuries noted:
  Head and neck: _______________
  Trunk: _______________
  Upper extremities: _______________
  Lower extremities: _______________
  Genital / anal area: _______________

SECTION D: FORENSIC SPECIMENS COLLECTED
☐ Vaginal swabs collected
☐ Anal swabs collected
☐ Blood specimen
☐ Clothing preserved
☐ Photographs taken

SECTION E: OPINION
Findings consistent with alleged assault: ☐ Yes ☐ No ☐ Inconclusive

Signature of examining medical practitioner: _______________
Medical Council registration number: _______________`,
    videoUrl: "https://www.youtube.com/embed/Q9DRq5DvnEQ",
    videoTitle: "Understanding the J88 Form — South Africa",
    officialLink: "https://www.justice.gov.za/forms/form_j88.htm",
  },
  {
    id: "affidavit",
    title: "Affidavit",
    shortTitle: "Affidavit",
    category: "Court Documents",
    emoji: "📝",
    colour: "#7C3AED",
    tagline: "A written statement sworn to be true before a commissioner of oaths",
    whatItIs: "An affidavit is a written statement of facts that you swear or affirm is true, signed in front of a Commissioner of Oaths (a person authorised by law to witness sworn statements — police officers, lawyers, bank managers, and post office staff can do this). Once sworn, an affidavit becomes a legal document that can be used as evidence in court.",
    whenUsed: "To report a crime, to support an application for a protection order, as evidence in court proceedings, to confirm facts in any legal matter. Children can make affidavits — a parent or guardian usually assists.",
    sampleContent: `AFFIDAVIT

I, [YOUR FULL NAME], identity number [ID NUMBER], do hereby make oath and say:

1. I am an adult / minor (age ___) [female/male] residing at [YOUR ADDRESS].

2. I am the complainant / deponent in this matter.

3. On [DATE] at approximately [TIME], at [PLACE]:

   3.1 [Describe what happened in your own words — be as specific as possible about dates, times, places, names of persons involved, and what was said or done.]

   3.2 [Continue describing the events in numbered paragraphs.]

4. [Add any further relevant facts.]

5. The contents of this affidavit are within my personal knowledge and are both true and correct.

DEPONENT

__________________________
Signature / Mark of Deponent

SWORN TO AND SUBSCRIBED BEFORE ME AT [PLACE] ON THIS [DATE]

__________________________
Commissioner of Oaths
[Full name and designation]`,
    officialLink: "https://www.justice.gov.za",
  },
  {
    id: "summons",
    title: "Summons",
    shortTitle: "Summons",
    category: "Court Documents",
    emoji: "📬",
    colour: "#D97706",
    tagline: "An official court notice requiring someone to appear in court",
    whatItIs: "A summons is an official document issued by a court that requires a person (the defendant or respondent) to appear in court on a specific date and time to answer a legal claim or criminal charge. If you receive a summons, you must respond — ignoring it can result in a warrant of arrest.",
    whenUsed: "In criminal cases, a summons may be issued to an accused person to appear in court for a hearing. In civil cases, a plaintiff uses a summons to start a lawsuit against a defendant. Courts also issue summonses to witnesses who must testify.",
    sampleContent: `IN THE [MAGISTRATES' COURT / HIGH COURT] OF SOUTH AFRICA
[PROVINCE]

Case Number: _______________

In the matter between:

[NAME OF COMPLAINANT / STATE]         Complainant/Plaintiff
and
[NAME OF ACCUSED / DEFENDANT]         Accused/Defendant

SUMMONS

To: [FULL NAME OF PERSON BEING SUMMONED]
    [ADDRESS]

You are hereby summoned to appear before the Magistrate / Judge at:

COURT: [Name of court]
ADDRESS: [Address of court]
DATE: [Date]
TIME: [Time]

[In criminal matters:]
To answer the charge of: [Description of the charge, e.g. "Assault with intent to do grievous bodily harm, in contravention of the Criminal Procedure Act"]

[In civil matters:]
To answer the plaintiff's claim as set out in the attached Particulars of Claim.

TAKE NOTICE that failure to appear may result in:
- A warrant being issued for your arrest
- Judgment being granted against you in your absence

Issued at [Place] on [Date]

_______________________________
Registrar / Clerk of the Court`,
    officialLink: "https://www.justice.gov.za/mc_za/mc.htm",
  },
  {
    id: "notice-to-defend",
    title: "Notice to Defend",
    shortTitle: "Notice to Defend",
    category: "Court Documents",
    emoji: "🛡️",
    colour: "#059669",
    tagline: "Your response to a summons — telling the court you will defend yourself",
    whatItIs: "A Notice to Defend is a formal document filed with the court by a defendant (the person being sued or charged) to indicate that they intend to defend themselves against the claim or charge. Filing this notice prevents judgment from being granted against you automatically (in default).",
    whenUsed: "You must file a Notice to Defend within a specific time after receiving a summons (usually 10 business days in Magistrates' Court, 20 business days in High Court). This is one of the most time-sensitive legal steps — missing the deadline means you could lose the case without the court hearing your side.",
    sampleContent: `IN THE [MAGISTRATES' COURT / HIGH COURT] OF SOUTH AFRICA
[PROVINCE]

Case Number: _______________

In the matter between:

[NAME OF PLAINTIFF]               Plaintiff
and
[NAME OF DEFENDANT]               Defendant

NOTICE OF INTENTION TO DEFEND

TAKE NOTICE that the Defendant, [FULL NAME], intends to defend this action.

TAKE FURTHER NOTICE that:

1. The Defendant's attorney is:
   Name: [Attorney's name / "The Defendant acts in person" if no attorney]
   Address for service: [Address]
   Telephone: [Phone number]
   Email: [Email address]

2. This Notice is delivered in terms of the Uniform Rules of Court, Rule 19.

Dated at [Place] on [Date].

___________________________
[Defendant / Attorney for Defendant]
[Name and address]

TO: The Plaintiff / Plaintiff's Attorney
    [Address]`,
    officialLink: "https://www.justice.gov.za",
  },
  {
    id: "heads-of-argument",
    title: "Heads of Argument",
    shortTitle: "Heads of Argument",
    category: "Legal Submissions",
    emoji: "⚖️",
    colour: "#0284C7",
    tagline: "A written summary of legal arguments presented to the court",
    whatItIs: "Heads of Argument (also called 'written submissions' or 'legal argument') is a document filed by a lawyer setting out the main legal arguments they will make in court. It includes references to relevant laws, sections of the Constitution, and previous court judgments (precedents) that support their client's case.",
    whenUsed: "In appeals, applications, and complex trials. Judges read these documents before or during the hearing so they understand the legal arguments. When you have a lawyer, they prepare this document for you. It helps the judge understand the law that applies to your situation.",
    sampleContent: `IN THE HIGH COURT OF SOUTH AFRICA
[DIVISION AND PROVINCE]

Case Number: _______________
Date of Hearing: _______________

In the matter between:

[APPLICANT / APPELLANT]             Applicant/Appellant
and
[RESPONDENT]                        Respondent

HEADS OF ARGUMENT ON BEHALF OF THE [APPLICANT / APPELLANT]

A. INTRODUCTION

1. This is an application for [describe what the application is about, e.g., "a review of the Magistrate's decision to refuse bail"].

2. The Applicant seeks the following relief: [list what you are asking the court to order].

B. THE FACTS

3. The material facts are as follows:
   3.1 [First key fact]
   3.2 [Second key fact]

C. THE LEGAL FRAMEWORK

4. The relevant legislation includes:
   4.1 The Constitution of the Republic of South Africa, 1996, sections ___
   4.2 The [Relevant Act], sections ___

D. ARGUMENT

5. [Main legal argument 1]

6. [Support from case law: e.g., "In Minister of Justice v X 2023 (1) SA 100 (CC), the Constitutional Court held that..."]

E. CONCLUSION AND RELIEF SOUGHT

7. For the above reasons, the Applicant respectfully submits that [state what the court should decide].

___________________________
[Name of Advocate / Attorney]
[Date]`,
    officialLink: "https://www.justice.gov.za",
  },
  {
    id: "contract",
    title: "Contract / Agreement",
    shortTitle: "Contract",
    category: "Legal Agreements",
    emoji: "🤝",
    colour: "#9333EA",
    tagline: "A legally binding agreement between two or more parties",
    whatItIs: "A contract is a legally enforceable agreement between two or more parties. For a contract to be valid it must have: an offer (one person proposes something), acceptance (the other person agrees), consideration (something of value exchanged), and the parties must have the legal capacity to contract. Children under 18 generally cannot sign contracts without a parent or guardian.",
    whenUsed: "Contracts are used in everyday life — when you agree to terms and conditions online, when you accept a job, when you rent something, or enter into any agreement. Important: if an adult tries to make you sign a contract without your parent's knowledge or consent, this is a red flag.",
    sampleContent: `SERVICE AGREEMENT

This Agreement is entered into on [DATE] between:

PARTY 1: [Name of first party]
          [ID Number / Registration Number]
          [Address]
          (hereinafter referred to as "the Service Provider")

and

PARTY 2: [Name of second party]
          [ID Number]
          [Address]
          (hereinafter referred to as "the Client")

1. SERVICES

   The Service Provider agrees to provide the following services to the Client:
   [Describe the services clearly and specifically]

2. PAYMENT

   The Client agrees to pay the Service Provider:
   Amount: R [amount]
   When: [date / upon completion / monthly]
   How: [EFT / cash / other]

3. DURATION

   This Agreement commences on [start date] and ends on [end date / is ongoing].

4. TERMINATION

   Either party may terminate this Agreement by giving [number] days written notice.

5. DISPUTE RESOLUTION

   Any dispute arising from this Agreement shall first be resolved through mediation.

SIGNATURES:

_______________________          _______________________
Service Provider                  Client
Date:                             Date:

_______________________          _______________________
Witness                           Witness`,
    officialLink: "https://www.justice.gov.za",
  },
  {
    id: "court-record",
    title: "Court Record / Transcript",
    shortTitle: "Court Record",
    category: "Court Documents",
    emoji: "📋",
    colour: "#BE185D",
    tagline: "An official written record of everything said and done in court",
    whatItIs: "A court record (also called a transcript or record of proceedings) is an official document that contains everything that happened during a court case — the evidence given by witnesses, the questions asked by lawyers, the rulings made by the judge or magistrate, and the final judgment or sentence. Court records are the official memory of the case.",
    whenUsed: "Court records are kept for every case. You may need a court record to appeal a decision, to check what was said in a previous hearing, or to understand what happened in your case. You can request a copy of your court record from the court registry — there may be a fee. In cases involving children, access to records is restricted to protect your privacy.",
    sampleContent: `RECORD OF PROCEEDINGS
IN THE MAGISTRATES' COURT OF [PLACE]

Case No: _______________
Date: _______________
Before: Magistrate [Name]

In the matter of: STATE v [ACCUSED'S NAME]

CHARGE: [Description of charge]

PRESENT:
- Prosecutor: [Name]
- Defence Attorney: [Name] / The accused appears in person
- Accused: [Name]
- Court Interpreter: [Name] (interpreting in [language])

PROCEEDINGS:

MAGISTRATE: The court is in session. [Accused name], you are charged with [charge]. Do you understand the charge?

ACCUSED: Yes, Your Worship.

MAGISTRATE: How do you plead?

ACCUSED: Not guilty, Your Worship.

MAGISTRATE: [Ruling / Order]

[WITNESS 1 takes the stand and is sworn in]

PROSECUTOR: Please state your full name for the record.

WITNESS: [Full name].

PROSECUTOR: [Questions...]

WITNESS: [Answers...]

[Court adjourned to [date]]

___________________________
Signed: [Court Clerk / Registrar]
Date: _______________
Official stamp`,
    officialLink: "https://www.judiciary.org.za",
  },
  {
    id: "protection-order",
    title: "Protection Order",
    shortTitle: "Protection Order",
    category: "Protection & Safety",
    emoji: "🛡️",
    colour: "#16A34A",
    tagline: "A court order that protects you from abuse or harassment",
    whatItIs: "A Protection Order is a court order that legally prohibits an abuser from contacting, harassing, or approaching you. It is available under the Domestic Violence Act 116 of 1998. Violating a protection order is a criminal offence and the abuser can be arrested immediately. Children can apply for protection orders against any person who abuses them.",
    whenUsed: "When you are experiencing domestic violence, sexual abuse, harassment, stalking, or any form of abuse by a person you have a domestic relationship with (family members, someone you live with, a partner). You can apply at any Magistrates' Court for free — you do not need a lawyer. If you are under 18, your parent, guardian, or social worker can apply on your behalf.",
    sampleContent: `INTERIM PROTECTION ORDER
[In terms of section 5 of the Domestic Violence Act 116 of 1998]

IN THE MAGISTRATES' COURT OF [PLACE]

Case No: _______________

COMPLAINANT: [Your name and contact details for service]

RESPONDENT (the abuser): [Name, address where they can be found]

INTERIM PROTECTION ORDER

TO THE RESPONDENT [NAME]:

Take notice that the Complainant has applied for a Protection Order against you.

PENDING THE RETURN DATE OF [DATE], THE COURT ORDERS THAT YOU:

☑ Are prohibited from committing any act of domestic violence against the Complainant.
☑ Are prohibited from enlisting the help of another person to commit any act of domestic violence against the Complainant.
☑ Are prohibited from entering the following premises: [Address of home / school / workplace].
☑ Are prohibited from preventing the Complainant from accessing personal property.

RETURN DATE: You must appear in court on [DATE] at [TIME] at [COURT ADDRESS] to show cause why a Final Protection Order should not be granted.

WARNING: Failure to appear may result in a Final Protection Order being granted in your absence. Any breach of this order is a criminal offence.

Given under my hand and the seal of the Court at [Place] on [Date].

___________________________
Magistrate / Clerk of Court`,
    officialLink: "https://www.justice.gov.za/forms/dv_forms.htm",
    videoUrl: "https://www.youtube.com/embed/4_XtoPFq_r0",
    videoTitle: "How to Apply for a Protection Order in South Africa",
  },
];

// ─── Landmark Cases ───────────────────────────────────────────────────────────

interface LandmarkCase {
  id: string;
  title: string;
  court: string;
  year: number;
  topic: string;
  summary: string;
  keyPrinciple: string;
  safliiUrl: string;
  tags: string[];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LegalDocs() {
  const { speak, prefs } = useAccessibility();
  const [activeTab, setActiveTab] = useState<"documents" | "cases">("documents");
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [selectedCase, setSelectedCase] = useState<LandmarkCase | null>(null);
  const [caseSearch, setCaseSearch] = useState("");
  const [cases, setCases] = useState<LandmarkCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [caseExplanations, setCaseExplanations] = useState<Record<string, string>>({});
  const [loadingCaseExplanation, setLoadingCaseExplanation] = useState<string | null>(null);

  const filteredDocs = LEGAL_DOCUMENTS.filter(
    (d) =>
      !docSearch ||
      d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.category.toLowerCase().includes(docSearch.toLowerCase())
  );

  // Group docs by category
  const byCategory = filteredDocs.reduce<Record<string, LegalDocument[]>>((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {});

  const fetchCases = useCallback(async (search = "") => {
    setLoadingCases(true);
    try {
      const url = search
        ? `/api/legal-docs/cases?search=${encodeURIComponent(search)}`
        : `/api/legal-docs/cases`;
      const res = await fetch(url);
      const data = await res.json();
      setCases(data.cases || []);
    } catch {
      setCases([]);
    } finally {
      setLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "cases") fetchCases();
  }, [activeTab, fetchCases]);

  const fetchExplanation = useCallback(async (doc: LegalDocument) => {
    setLoadingExplanation(true);
    setExplanation("");
    try {
      const res = await fetch("/api/legal-docs/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: doc.title,
          documentContent: doc.sampleContent,
          userGrade: GRADE,
        }),
      });
      const data = await res.json();
      setExplanation(data.explanation || "");
    } catch {
      setExplanation("Sorry, I couldn't load the explanation right now. Please try again.");
    } finally {
      setLoadingExplanation(false);
    }
  }, []);

  const fetchCaseExplanation = useCallback(async (cas: LandmarkCase) => {
    if (caseExplanations[cas.id]) return;
    setLoadingCaseExplanation(cas.id);
    try {
      const res = await fetch("/api/legal-docs/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: `Court case: ${cas.title}`,
          documentContent: `${cas.title}\n\nSummary: ${cas.summary}\n\nKey Principle: ${cas.keyPrinciple}`,
          userGrade: GRADE,
        }),
      });
      const data = await res.json();
      setCaseExplanations((prev) => ({ ...prev, [cas.id]: data.explanation || "" }));
    } catch {
      setCaseExplanations((prev) => ({ ...prev, [cas.id]: "Sorry, I couldn't load the explanation right now." }));
    } finally {
      setLoadingCaseExplanation(null);
    }
  }, [caseExplanations]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openDoc = (doc: LegalDocument) => {
    setSelectedDoc(doc);
    setExplanation("");
    fetchExplanation(doc);
    if (prefs.tts) speak(`Opening ${doc.title}. ${doc.whatItIs}`);
  };

  return (
    <MobileLayout title="Legal Library">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 bg-primary text-white px-4 py-2 rounded-lg font-bold">
        Skip to content
      </a>

      <main id="main-content" className="px-4 pt-4 pb-6">
        {/* Header */}
        <section aria-labelledby="legal-lib-heading" className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8215D, #7C3AED)" }}>
              <Scale className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 id="legal-lib-heading" className="font-display font-bold text-xl text-foreground">
                Legal Document Library
              </h1>
              <p className="text-xs text-muted-foreground">Understanding the law — explained for you</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-amber-500" aria-hidden="true" />
            Every document here comes with an <strong>AI plain-language explainer</strong> so you always understand what it means for you. Examples are for education only — always seek legal advice for your specific situation.
          </p>
        </section>

        {/* Tabs */}
        <div className="flex gap-2 mb-5" role="tablist" aria-label="Legal library sections">
          {[
            { id: "documents" as const, label: "📄 Documents", icon: FileText },
            { id: "cases" as const, label: "⚖️ Court Cases", icon: Gavel },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
              style={{
                background: activeTab === tab.id ? "linear-gradient(135deg, #E8215D, #F4826C)" : "transparent",
                color: activeTab === tab.id ? "white" : "#6B7280",
                border: activeTab === tab.id ? "none" : "2px solid #E5E7EB",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* DOCUMENTS TAB */}
        {activeTab === "documents" && (
          <div id="documents-panel" role="tabpanel" aria-labelledby="documents-tab">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" aria-hidden="true" />
              <input
                type="search"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search documents…"
                className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-primary text-sm"
                aria-label="Search legal documents"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-4">
              {Object.entries(byCategory).map(([category, docs]) => (
                <section key={category} aria-labelledby={`cat-${category.replace(/\s/g, "-")}`}>
                  <h2 id={`cat-${category.replace(/\s/g, "-")}`} className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    {category}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {docs.map((doc) => (
                      <motion.button
                        key={doc.id}
                        onClick={() => openDoc(doc)}
                        whileTap={{ scale: 0.98 }}
                        className="w-full text-left rounded-2xl border-2 border-gray-100 bg-white p-4 flex items-start gap-3 hover:border-primary/30 hover:shadow-sm transition-all"
                        aria-label={`Open ${doc.title}: ${doc.tagline}`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                          style={{ background: `${doc.colour}15` }}
                          aria-hidden="true"
                        >
                          {doc.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground leading-snug">{doc.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{doc.tagline}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-1" aria-hidden="true" />
                      </motion.button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {/* COURT CASES TAB */}
        {activeTab === "cases" && (
          <div id="cases-panel" role="tabpanel" aria-labelledby="cases-tab">
            {/* Search */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" aria-hidden="true" />
                <input
                  type="search"
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") fetchCases(caseSearch); }}
                  placeholder="Search cases (e.g. GBV, children, consent)…"
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-primary text-sm"
                  aria-label="Search landmark court cases"
                />
              </div>
              <button
                onClick={() => fetchCases(caseSearch)}
                className="px-4 py-3 rounded-2xl font-bold text-sm text-white transition-all"
                style={{ background: "linear-gradient(135deg, #E8215D, #F4826C)" }}
                aria-label="Search court cases"
              >
                Search
              </button>
            </div>

            {/* SAFLII note */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2">
              <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-blue-800">Access more SA court cases free on SAFLII</p>
                <a
                  href={`https://www.saflii.org/cgi-bin/sinosrch.cgi?query=${encodeURIComponent(caseSearch || "children rights")}&method=all&meta=%2Fza%2Fcases`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 underline font-semibold"
                  aria-label="Search SAFLII database for court cases (opens in new tab)"
                >
                  Search SAFLII.org →
                </a>
              </div>
            </div>

            {loadingCases ? (
              <div className="flex justify-center py-12" aria-live="polite" aria-label="Loading cases">
                <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
                <span className="sr-only">Loading court cases…</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3" role="list">
                {cases.map((cas) => (
                  <article key={cas.id} className="rounded-2xl border-2 border-gray-100 bg-white overflow-hidden" role="listitem">
                    <button
                      onClick={() => {
                        setSelectedCase(selectedCase?.id === cas.id ? null : cas);
                        if (selectedCase?.id !== cas.id) fetchCaseExplanation(cas);
                      }}
                      className="w-full text-left p-4 flex items-start gap-3"
                      aria-expanded={selectedCase?.id === cas.id}
                      aria-controls={`case-detail-${cas.id}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                        <Gavel className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground leading-snug">{cas.title}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">{cas.court}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700">{cas.year}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{cas.topic}</span>
                        </div>
                      </div>
                      {selectedCase?.id === cas.id
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" aria-hidden="true" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" aria-hidden="true" />
                      }
                    </button>

                    <AnimatePresence>
                      {selectedCase?.id === cas.id && (
                        <motion.div
                          id={`case-detail-${cas.id}`}
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="px-4 pb-4 border-t border-gray-100">
                            <div className="mt-3 space-y-3">
                              <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs font-bold text-foreground mb-1">What this case decided:</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{cas.summary}</p>
                              </div>
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <p className="text-xs font-bold text-amber-800 mb-1">⚖️ Key legal principle:</p>
                                <p className="text-xs text-amber-700 leading-relaxed">{cas.keyPrinciple}</p>
                              </div>

                              {/* AI Explainer */}
                              <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="w-3.5 h-3.5 text-violet-600" aria-hidden="true" />
                                  <p className="text-xs font-bold text-violet-800">AI explains this in plain language</p>
                                </div>
                                {loadingCaseExplanation === cas.id ? (
                                  <div className="flex items-center gap-2" aria-live="polite">
                                    <Loader2 className="w-4 h-4 animate-spin text-violet-500" aria-hidden="true" />
                                    <p className="text-xs text-violet-600">Generating explanation…</p>
                                    <span className="sr-only">Loading AI explanation</span>
                                  </div>
                                ) : caseExplanations[cas.id] ? (
                                  <div className="text-xs text-violet-700 leading-relaxed whitespace-pre-wrap">
                                    {caseExplanations[cas.id]}
                                  </div>
                                ) : null}
                              </div>

                              <a
                                href={cas.safliiUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800"
                                aria-label={`Read full ${cas.title} judgment on SAFLII (opens in new tab)`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                                Read full judgment on SAFLII →
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Document Detail Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            className="fixed inset-0 z-[150] flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Document: ${selectedDoc.title}`}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedDoc(null)}
            />
            <motion.div
              className="relative bg-white rounded-t-3xl overflow-hidden flex flex-col"
              style={{ maxHeight: "92vh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              {/* Doc Header */}
              <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${selectedDoc.colour}15` }}
                      aria-hidden="true"
                    >
                      {selectedDoc.emoji}
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-base text-foreground leading-snug">{selectedDoc.title}</h2>
                      <p className="text-xs text-muted-foreground">{selectedDoc.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                    aria-label="Close document"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-foreground/80">{selectedDoc.tagline}</p>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-6">
                {/* AI Explanation */}
                <section className="mt-4 mb-4 bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 rounded-2xl p-4" aria-labelledby="ai-explainer-heading">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-violet-600" aria-hidden="true" />
                    <h3 id="ai-explainer-heading" className="font-bold text-sm text-violet-800">AI Plain Language Explainer</h3>
                  </div>
                  {loadingExplanation ? (
                    <div className="flex items-center gap-2 text-violet-600" aria-live="polite">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <p className="text-sm">Generating your explanation…</p>
                      <span className="sr-only">AI is generating a plain language explanation</span>
                    </div>
                  ) : explanation ? (
                    <div className="text-sm text-violet-700 leading-relaxed whitespace-pre-wrap">
                      {explanation}
                    </div>
                  ) : null}
                </section>

                {/* What it is */}
                <section className="mb-4" aria-labelledby={`what-${selectedDoc.id}`}>
                  <button
                    onClick={() => toggleSection(`what-${selectedDoc.id}`)}
                    className="w-full flex items-center justify-between text-left font-bold text-sm text-foreground py-2"
                    aria-expanded={expandedSections.has(`what-${selectedDoc.id}`)}
                    aria-controls={`what-content-${selectedDoc.id}`}
                    id={`what-${selectedDoc.id}`}
                  >
                    <span>📖 What is it?</span>
                    {expandedSections.has(`what-${selectedDoc.id}`)
                      ? <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      : <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    }
                  </button>
                  <AnimatePresence>
                    {expandedSections.has(`what-${selectedDoc.id}`) && (
                      <motion.div
                        id={`what-content-${selectedDoc.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <p className="text-sm text-muted-foreground leading-relaxed pb-2">{selectedDoc.whatItIs}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* When used */}
                <section className="mb-4 border-t border-gray-100 pt-4" aria-labelledby={`when-${selectedDoc.id}`}>
                  <button
                    onClick={() => toggleSection(`when-${selectedDoc.id}`)}
                    className="w-full flex items-center justify-between text-left font-bold text-sm text-foreground py-2"
                    aria-expanded={expandedSections.has(`when-${selectedDoc.id}`)}
                    aria-controls={`when-content-${selectedDoc.id}`}
                    id={`when-${selectedDoc.id}`}
                  >
                    <span>⏰ When is it used?</span>
                    {expandedSections.has(`when-${selectedDoc.id}`)
                      ? <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      : <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    }
                  </button>
                  <AnimatePresence>
                    {expandedSections.has(`when-${selectedDoc.id}`) && (
                      <motion.div
                        id={`when-content-${selectedDoc.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <p className="text-sm text-muted-foreground leading-relaxed pb-2">{selectedDoc.whenUsed}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* Sample Document */}
                <section className="mb-4 border-t border-gray-100 pt-4" aria-labelledby={`sample-${selectedDoc.id}`}>
                  <button
                    onClick={() => toggleSection(`sample-${selectedDoc.id}`)}
                    className="w-full flex items-center justify-between text-left font-bold text-sm text-foreground py-2"
                    aria-expanded={expandedSections.has(`sample-${selectedDoc.id}`)}
                    aria-controls={`sample-content-${selectedDoc.id}`}
                    id={`sample-${selectedDoc.id}`}
                  >
                    <span>📄 See Example Document</span>
                    {expandedSections.has(`sample-${selectedDoc.id}`)
                      ? <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      : <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    }
                  </button>
                  <AnimatePresence>
                    {expandedSections.has(`sample-${selectedDoc.id}`) && (
                      <motion.div
                        id={`sample-content-${selectedDoc.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mt-2">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">⚠️ Example only — for educational purposes</p>
                          <pre className="text-[11px] text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                            {selectedDoc.sampleContent}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* Video explainer */}
                {selectedDoc.videoUrl && (
                  <section className="mb-4 border-t border-gray-100 pt-4" aria-labelledby={`video-${selectedDoc.id}`}>
                    <h3 id={`video-${selectedDoc.id}`} className="font-bold text-sm text-foreground mb-2 flex items-center gap-2">
                      <Play className="w-4 h-4 text-primary" aria-hidden="true" />
                      Video Explainer
                    </h3>
                    <div className="relative rounded-2xl overflow-hidden" style={{ paddingTop: "56.25%" }}>
                      <iframe
                        src={`${selectedDoc.videoUrl}?cc_load_policy=${prefs.alwaysShowCaptions ? 1 : 0}&rel=0&modestbranding=1`}
                        title={selectedDoc.videoTitle || `Video about ${selectedDoc.title}`}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    {prefs.alwaysShowCaptions && (
                      <p className="text-[10px] text-blue-600 font-bold mt-1 flex items-center gap-1">
                        <span aria-hidden="true">CC</span> Captions enabled
                      </p>
                    )}
                  </section>
                )}

                {/* Official link */}
                {selectedDoc.officialLink && (
                  <a
                    href={selectedDoc.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 border-t border-gray-100 pt-4"
                    aria-label={`Official government resource for ${selectedDoc.title} (opens in new tab)`}
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    Official Government Resource →
                  </a>
                )}

                {/* Help numbers */}
                <div className="mt-5 bg-violet-50 border border-violet-200 rounded-2xl p-4" role="note" aria-label="Emergency help numbers">
                  <p className="text-xs font-bold text-violet-800 mb-2">Need legal help? Contact:</p>
                  {[
                    { label: "Legal Aid SA (free legal advice)", number: "0800 110 110" },
                    { label: "Childline (if you're under 18)", number: "116" },
                    { label: "GBV Command Centre", number: "0800 428 428" },
                  ].map((h) => (
                    <a key={h.number} href={`tel:${h.number.replace(/\s/g, "")}`} className="flex justify-between items-center py-1.5 border-b border-violet-100 last:border-0" aria-label={`Call ${h.label}: ${h.number}`}>
                      <span className="text-xs text-violet-700">{h.label}</span>
                      <span className="text-xs font-bold text-primary">{h.number}</span>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
