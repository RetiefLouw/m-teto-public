import { useState, useMemo } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { trackEvent } from "@/lib/trackEvent";
import { getRecommendedCategories, resolveKnowledgeGap, markTopicExplored } from "@/lib/adaptiveLearning";
import { useListArticles, useGetArticle, useAwardPoints, useListQuizQuestions, useAnswerQuiz } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, ChevronRight, ListOrdered, X, ShieldAlert, GraduationCap, ArrowLeft, Coins, CheckCircle2, XCircle, Sparkles, Scale, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const MODULE_TABS = [
  { id: "knowledge_base", label: "Knowledge Base" },
  { id: "university", label: "🎓 University" },
  { id: "justice", label: "⚖️ Justice" },
  { id: "legal_docs", label: "📄 Legal Docs" },
];

const KB_CATEGORIES = ["All", "Your Rights", "Process Guides", "Legal Terms", "SRGBV"];
const UNI_CATEGORIES = ["All", "University", "SRGBV"];

const GRADE_OPTIONS = [
  { id: "all", label: "All Ages" },
  { id: "grade_1_2", label: "Gr 1–2" },
  { id: "grade_3_5", label: "Gr 3–5" },
  { id: "grade_6_7", label: "Gr 6–7" },
  { id: "grade_8_12", label: "Gr 8–12" },
];

const CATEGORY_COLORS: Record<string, string> = {
  SRGBV: "bg-rose-50 text-rose-700 border-rose-200",
  University: "bg-purple-50 text-purple-700 border-purple-200",
  "Your Rights": "bg-teal-50 text-teal-700 border-teal-200",
  "Process Guides": "bg-blue-50 text-blue-700 border-blue-200",
  "Legal Terms": "bg-amber-50 text-amber-700 border-amber-200",
};

// Fallback content
const MOCK_ARTICLES = [
  {
    id: "m1", title: "What is a J88 Form?", category: "Legal Terms", summary: "A crucial medical document completed by a doctor after an assault.", content: "A J88 form is a legal medical document used in South Africa. It must be completed by a medical practitioner who examines you after an assault. It records your injuries and serves as critical objective evidence in a court of law.\n\nImportant: You do NOT need to open a police case before getting a J88 filled out, but it is highly recommended to do so quickly.", isStepByStep: false, moduleType: "knowledge_base", gradeLevel: "all", pointsReward: 5
  },
  {
    id: "m2", title: "Applying for a Protection Order", category: "Process Guides", summary: "Step-by-step guide to securing a Domestic Violence protection order.", content: "Step 1: Go to your nearest Magistrate's Court.\nStep 2: Ask the clerk of the court for an application form (Form 2) for a protection order.\nStep 3: Fill out the affidavit detailing the abuse.\nStep 4: The magistrate will review it and may issue an interim protection order immediately if they believe you are in danger.", isStepByStep: true, moduleType: "knowledge_base", gradeLevel: "all", pointsReward: 5
  },
  {
    id: "m3", title: "Your Rights as a Victim", category: "Your Rights", summary: "Understanding the Victims' Charter in South Africa.", content: "According to the Service Charter for Victims of Crime in South Africa, you have the right to:\n\n1. Be treated with fairness, respect, dignity and privacy.\n2. Offer information during the criminal investigation.\n3. Receive information regarding the progress of your case.\n4. Protection from the accused.\n5. Assistance and compensation where applicable.", isStepByStep: false, moduleType: "knowledge_base", gradeLevel: "all", pointsReward: 5
  }
];

type QuizState = "idle" | "showing" | "answered";

export default function Learn() {
  const [activeModule, setActiveModule] = useState("knowledge_base");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [gradeLevel, setGradeLevel] = useState("all");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<{ correct: boolean; explanation: string | null; pointsEarned: number | null } | null>(null);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [, navigate] = useLocation();
  const categories = activeModule === "knowledge_base" ? KB_CATEGORIES : UNI_CATEGORIES;

  const { data, isLoading } = useListArticles({
    query: {
      search: search || undefined,
      category: category !== "All" ? category : undefined,
      moduleType: activeModule,
      gradeLevel: gradeLevel !== "all" ? gradeLevel : undefined,
    }
  });

  const { data: articleData, isLoading: articleLoading } = useGetArticle(
    selectedArticleId || "",
    { query: { enabled: !!selectedArticleId && !selectedArticleId.startsWith("m") } }
  );

  const { data: quizData } = useListQuizQuestions({
    query: {
      articleId: selectedArticleId && !selectedArticleId.startsWith("m") ? selectedArticleId : undefined,
      gradeLevel: gradeLevel !== "all" ? gradeLevel : undefined,
    }
  });

  const { mutate: award } = useAwardPoints({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/points"] })
    }
  });

  const { mutate: answerQuiz } = useAnswerQuiz({
    mutation: {
      onSuccess: (data) => {
        setQuizResult({
          correct: data.correct,
          explanation: data.explanation ?? null,
          pointsEarned: data.pointsEarned ?? null,
        });
        setQuizState("answered");
        if (data.correct) queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      }
    }
  });

  const recommendedCategories = useMemo(() => getRecommendedCategories(), []);

  const articlesList = (data?.articles && data.articles.length > 0)
    ? data.articles
    : activeModule === "knowledge_base"
      ? MOCK_ARTICLES.filter(a =>
          (category === "All" || a.category === category) &&
          (search === "" || a.title.toLowerCase().includes(search.toLowerCase()))
        )
      : [];

  const selectedArticle = selectedArticleId?.startsWith("m")
    ? MOCK_ARTICLES.find(a => a.id === selectedArticleId)
    : articleData?.article;

  const currentQuiz = quizData?.questions?.[0] ?? null;

  function handleOpenArticle(id: string, title?: string, articleCategory?: string) {
    setSelectedArticleId(id);
    setQuizState("idle");
    setSelectedOption(null);
    setQuizResult(null);
    trackEvent("article_read", { articleId: id, title: title ?? "", category: articleCategory ?? "" });
    // Adaptive learning: resolve gap and mark topic explored
    if (articleCategory) {
      resolveKnowledgeGap(articleCategory);
      markTopicExplored(articleCategory, title ?? articleCategory);
    }
    // Award points for reading (only for real articles, not mocks)
    if (!id.startsWith("m") && isAuthenticated) {
      award({ data: { reason: "read_article", referenceId: id } });
    }
  }

  function handleAnswerQuiz(option: string) {
    if (!currentQuiz || quizState === "answered") return;
    setSelectedOption(option);
    answerQuiz({ data: { questionId: currentQuiz.id, selectedOption: option } });
  }

  return (
    <MobileLayout title={activeModule === "university" ? "M-Teto University" : activeModule === "justice" ? "Justice Roadmap" : "Knowledge Base"}>
      <div className="px-4 pt-4 pb-8 space-y-5">

        {/* Module Tabs */}
        <div className="flex gap-1 bg-muted/40 rounded-2xl p-1">
          {MODULE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "university") { navigate("/university"); return; }
                if (tab.id === "legal_docs") { navigate("/legal-docs"); return; }
                setActiveModule(tab.id); setCategory("All");
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeModule === tab.id
                  ? 'bg-background shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── JUSTICE ROADMAP TAB ─────────────────────────────────────── */}
        {activeModule === "justice" && (
          <motion.div
            key="justice-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Hero card */}
            <div
              className="rounded-3xl p-5 text-white shadow-lg relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #E8215D 0%, #F4826C 100%)" }}
            >
              <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-white/10" />
              <div className="absolute -right-8 -bottom-6 w-36 h-36 rounded-full bg-white/5" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display font-black text-xl leading-tight mb-1">Accessing Justice Roadmap</h2>
                <p className="text-sm text-white/90 leading-snug mb-4">
                  An interactive, step-by-step guide through the SA justice system — built specifically for young people.
                  Know your rights. Know your steps.
                </p>
                <button
                  onClick={() => navigate("/justice")}
                  className="flex items-center gap-2 bg-white text-primary font-bold text-sm px-5 py-3 rounded-2xl active:scale-95 transition-all shadow-sm"
                >
                  Start My Journey
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* What it covers */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">What the Roadmap Covers</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { emoji: "🏫", title: "At School", desc: "Corporal punishment, bullying, assault, exclusion" },
                  { emoji: "🏠", title: "At Home", desc: "Physical, sexual, emotional abuse and neglect" },
                  { emoji: "💻", title: "Online", desc: "Cyberbullying, sextortion, image-based abuse" },
                  { emoji: "🏘️", title: "Community", desc: "Sexual assault, trafficking, robbery" },
                  { emoji: "🏥", title: "Healthcare", desc: "Denied treatment, discrimination" },
                  { emoji: "🏛️", title: "By Police", desc: "Brutality, unlawful arrest, corruption" },
                ].map((item) => (
                  <button
                    key={item.title}
                    onClick={() => navigate("/justice")}
                    className="text-left p-3 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <p className="text-xs font-bold text-foreground mt-1">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pathway explainer */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Two Pathways</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-50 border border-red-200">
                  <div className="text-xl">⚖️</div>
                  <div>
                    <p className="text-sm font-bold text-red-800">Criminal Justice Pathway</p>
                    <p className="text-xs text-red-700">Police → Investigation → NPA → Trial → Sentencing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="text-xl">📋</div>
                  <div>
                    <p className="text-sm font-bold text-blue-800">Civil Justice Pathway</p>
                    <p className="text-xs text-blue-700">SAHRC, Children's Court, Equality Court, IPID & more</p>
                  </div>
                </div>
              </div>
            </div>

            {/* E-policing highlight */}
            <div className="p-4 rounded-3xl bg-teal-50 border border-teal-200">
              <p className="text-sm font-bold text-teal-800 mb-1">🖥️ E-Policing Integration</p>
              <p className="text-xs text-teal-700 mb-3">
                Each step includes online reporting options — SAPS e-services, SAHRC online complaints, platform takedown links, and more.
              </p>
              <button
                onClick={() => navigate("/justice")}
                className="w-full py-3 rounded-2xl text-sm font-bold text-teal-700 border-2 border-teal-200 bg-white hover:bg-teal-50 transition-all"
              >
                Open Justice Roadmap →
              </button>
            </div>

            {/* Legal basis note */}
            <p className="text-[10px] text-muted-foreground text-center px-2">
              Content grounded in SA law: Children's Act 38/2005 · Sexual Offences Act 32/2007 · SA Schools Act 84/1996 · Cybercrimes Act 19/2020 · Domestic Violence Act 116/1998 · IPID Act 1/2011
            </p>
          </motion.div>
        )}

        {/* Recommended for You — adaptive based on assessment gaps */}
        {recommendedCategories.length > 0 && activeModule === "knowledge_base" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-4 border-2 border-primary/20"
            style={{ background: "linear-gradient(135deg, #fff0f4 0%, #fff8f0 100%)" }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-xl brand-gradient flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold brand-gradient-text">Recommended for You</p>
                <p className="text-[10px] text-muted-foreground">Based on your assessment — tap a topic to learn more</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendedCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold border-2 border-primary/30 transition-all hover:scale-105 active:scale-95"
                  style={{ color: "#E8215D", background: "white" }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* University Welcome */}
        {activeModule === "university" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-4 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">M-Teto University</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Free educational content on gender equality, SRGBV, health rights, and personal safety. Earn points as you learn!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search & Filters — hidden on Justice tab */}
        <div className={`sticky top-[68px] z-30 bg-background/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 space-y-3 shadow-sm border-b border-border/50 ${activeModule === "justice" ? "hidden" : ""}`}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={activeModule === "university" ? "Search lessons..." : "Search guides, terms, rights..."}
              aria-label={activeModule === "university" ? "Search lessons" : "Search guides, rights and terms"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-2xl bg-card border-border/60 shadow-sm focus-visible:ring-primary/20 text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 snap-x">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`snap-start whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  category === cat
                  ? 'bg-secondary text-secondary-foreground shadow-md shadow-secondary/20 scale-105'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grade Level Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 snap-x">
            {GRADE_OPTIONS.map(g => (
              <button
                key={g.id}
                onClick={() => setGradeLevel(g.id)}
                className={`snap-start whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  gradeLevel === g.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content List — hidden on Justice tab */}
        <div className={`space-y-3 ${activeModule === "justice" ? "hidden" : ""}`}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-3xl border-border p-5 animate-pulse bg-muted/20 h-28"></Card>
            ))
          ) : articlesList.length === 0 ? (
            <div className="text-center py-12 px-4">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-bold text-lg text-muted-foreground">No articles found</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">Try a different grade level or category</p>
            </div>
          ) : (
            articlesList.map((article, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={article.id}
              >
                <Card
                  className="rounded-3xl border border-border/60 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleOpenArticle(article.id, article.title, article.category)}
                >
                  <CardContent className="p-4 flex gap-4 items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      article.category === "SRGBV" ? 'bg-rose-50 text-rose-600' :
                      article.category === "University" ? 'bg-purple-50 text-purple-600' :
                      article.isStepByStep ? 'bg-secondary/15 text-secondary' : 'bg-primary/10 text-primary'
                    }`}>
                      {article.isStepByStep ? <ListOrdered className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase tracking-wider font-bold border ${CATEGORY_COLORS[article.category] || 'text-muted-foreground border-muted-foreground/30'}`}
                        >
                          {article.category}
                        </Badge>
                        {article.gradeLevel && article.gradeLevel !== "all" && (
                          <Badge variant="outline" className="text-[9px] font-medium text-muted-foreground border-muted-foreground/20">
                            {article.gradeLevel.replace(/_/g, " ")}
                          </Badge>
                        )}
                        {article.pointsReward && (
                          <span className="text-[9px] text-primary font-bold flex items-center gap-0.5">
                            <Coins className="w-2.5 h-2.5" />+{article.pointsReward}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm leading-tight text-foreground group-hover:text-primary transition-colors">{article.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{article.summary}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Full Screen Article Reader */}
      <AnimatePresence>
        {selectedArticleId && (
          <Dialog open={!!selectedArticleId} onOpenChange={(open) => { if (!open) { setSelectedArticleId(null); setQuizState("idle"); }}}>
            <DialogContent className="max-w-[430px] w-full h-[100dvh] max-h-screen rounded-none sm:rounded-3xl p-0 overflow-hidden flex flex-col border-none sm:border-solid sm:border-border sm:h-[90vh]">

              <div className="bg-background border-b border-border/50 p-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => { setSelectedArticleId(null); setQuizState("idle"); }} className="rounded-full -ml-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <span className="font-bold text-xs tracking-widest uppercase text-muted-foreground">
                  {activeModule === "university" ? "University Lesson" : "Article"}
                </span>
                <div className="w-10" />
              </div>

              <div className="overflow-y-auto flex-1 bg-card">
                {articleLoading ? (
                  <div className="p-8 animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/4 mb-8"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                ) : selectedArticle ? (
                  <div className="p-6 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <Badge className={`border hover:bg-transparent font-bold shadow-sm ${CATEGORY_COLORS[selectedArticle.category] || 'bg-primary/10 text-primary border-transparent'}`}>
                          {selectedArticle.category}
                        </Badge>
                        {selectedArticle.gradeLevel && selectedArticle.gradeLevel !== "all" && (
                          <Badge variant="outline" className="font-medium text-muted-foreground">
                            {selectedArticle.gradeLevel.replace(/_/g, " ")}
                          </Badge>
                        )}
                        {selectedArticle.pointsReward && isAuthenticated && (
                          <Badge variant="secondary" className="font-bold text-xs">
                            +{selectedArticle.pointsReward} pts earned!
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-2xl font-display font-bold leading-tight text-foreground">{selectedArticle.title}</h1>
                      <p className="text-base font-medium text-muted-foreground leading-relaxed border-l-4 border-secondary pl-4 mt-3">
                        {selectedArticle.summary}
                      </p>
                    </div>

                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none
                      prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground
                      prose-p:leading-relaxed prose-p:text-foreground/90
                      prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                      prose-li:marker:text-primary">
                      {selectedArticle.content?.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="whitespace-pre-wrap">{paragraph}</p>
                      ))}
                    </div>

                    {selectedArticle.isStepByStep && (
                      <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-secondary-foreground font-bold mb-2">
                          <ShieldAlert className="w-5 h-5 text-secondary" />
                          Need Immediate Help?
                        </div>
                        <p className="text-sm text-secondary-foreground/90">
                          If you are currently in danger, exit this guide and use the Emergency Help button on the Home screen to call authorities immediately.
                        </p>
                      </div>
                    )}

                    {/* Quiz Section */}
                    {isAuthenticated && currentQuiz && quizState !== "answered" && (
                      <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">🧠</div>
                          <div>
                            <p className="font-bold text-sm">Quick Quiz</p>
                            <p className="text-xs text-muted-foreground">Answer correctly to earn {currentQuiz.pointsReward} points!</p>
                          </div>
                        </div>
                        <p className="font-semibold text-sm text-foreground">{currentQuiz.question}</p>
                        <div className="space-y-2">
                          {[
                            { key: "A", text: currentQuiz.optionA },
                            { key: "B", text: currentQuiz.optionB },
                            { key: "C", text: currentQuiz.optionC },
                          ].map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => handleAnswerQuiz(opt.key)}
                              className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all duration-200 ${
                                selectedOption === opt.key
                                  ? 'border-primary bg-primary/10 font-semibold'
                                  : 'border-border/50 bg-background hover:border-primary/40'
                              }`}
                            >
                              <span className="font-bold text-primary mr-2">{opt.key}.</span> {opt.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quiz Result */}
                    {quizState === "answered" && quizResult && (
                      <div className={`rounded-3xl p-5 border-2 ${quizResult.correct ? 'bg-secondary/10 border-secondary/30' : 'bg-muted/30 border-border/50'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          {quizResult.correct ? (
                            <CheckCircle2 className="w-6 h-6 text-secondary" />
                          ) : (
                            <XCircle className="w-6 h-6 text-muted-foreground" />
                          )}
                          <div>
                            <p className={`font-bold text-sm ${quizResult.correct ? 'text-secondary-foreground' : 'text-foreground'}`}>
                              {quizResult.correct ? `Correct! +${quizResult.pointsEarned} points earned 🎉` : "Not quite right"}
                            </p>
                          </div>
                        </div>
                        {quizResult.explanation && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{quizResult.explanation}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">Article content could not be loaded.</div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
