import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetPoints } from "@workspace/api-client-react";
import {
  User, Settings, Star, BookOpen, Shield, Trophy, LogOut, Flag,
  ChevronRight, Edit2, CheckCircle, Accessibility, Bell, Info,
  Coins, GraduationCap, TrendingUp, Calendar, Lock, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/context/AccessibilityContext";

const PROVINCES = ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape"];
const GRADES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "University", "Out of school"];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-background border border-border/60 rounded-3xl overflow-hidden shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 pt-3.5 pb-1">{title}</p>
      {children}
    </div>
  );
}

function Row({ icon, label, value, onPress, danger }: { icon: React.ReactNode; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onPress}
      disabled={!onPress}
      className={`w-full flex items-center gap-3 px-4 py-3 border-t border-border/40 first:border-t-0 hover:bg-muted/40 transition-colors text-left ${danger ? "text-red-600" : ""}`}
    >
      <span className={`shrink-0 ${danger ? "text-red-500" : "text-muted-foreground"}`}>{icon}</span>
      <span className={`flex-1 text-sm font-semibold ${danger ? "text-red-600" : "text-foreground"}`}>{label}</span>
      {value && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{value}</span>}
      {onPress && <ChevronRight className={`w-4 h-4 shrink-0 ${danger ? "text-red-400" : "text-muted-foreground/50"}`} />}
    </button>
  );
}

function Badge({ icon, label, earned }: { icon: string; label: string; earned: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-2xl border ${earned ? "bg-violet-50 border-violet-200" : "bg-gray-50 border-gray-100 opacity-50"}`}>
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <span className="text-[10px] font-bold text-center leading-tight">{label}</span>
    </div>
  );
}

export default function Profile() {
  const { isAuthenticated, user, logout } = useAuth();
  const { openPanel } = useAccessibility();
  const [, navigate] = useLocation();
  const { data: pointsData } = useGetPoints({ query: { enabled: isAuthenticated } });

  // Local profile (localStorage — editable)
  const [name, setName] = useState(() => localStorage.getItem("mteto_name") || user?.firstName || "");
  const [grade, setGrade] = useState(() => localStorage.getItem("mteto_grade") || "");
  const [province, setProvince] = useState(() => localStorage.getItem("mteto_province") || "Gauteng");
  const [school, setSchool] = useState(() => localStorage.getItem("mteto_school") || "");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Report issue state
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportCategory, setReportCategory] = useState("bug");
  const [reportSent, setReportSent] = useState(false);

  // Logout confirm
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const totalPoints = pointsData?.totalPoints ?? 0;
  const transactions = pointsData?.transactions ?? [];
  const level = Math.floor(totalPoints / 100) + 1;
  const levelProgress = totalPoints % 100;

  // Derived stats from transactions
  const stats = {
    articlesRead: transactions.filter((t: { reason: string }) => t.reason === "read_article").length,
    quizzes: transactions.filter((t: { reason: string }) => t.reason === "quiz_correct").length,
    checklists: transactions.filter((t: { reason: string }) => t.reason === "checklist_item").length,
    reviews: transactions.filter((t: { reason: string }) => t.reason === "wrote_review").length,
  };

  const badges = [
    { icon: "🌱", label: "First Steps", earned: totalPoints > 0 },
    { icon: "📚", label: "Reader", earned: stats.articlesRead >= 3 },
    { icon: "🧠", label: "Quiz Master", earned: stats.quizzes >= 5 },
    { icon: "⭐", label: "100 Coins", earned: totalPoints >= 100 },
    { icon: "🔥", label: "Streak", earned: false },
    { icon: "🦅", label: "TETO's Ally", earned: totalPoints >= 500 },
  ];

  const saveProfile = () => {
    localStorage.setItem("mteto_name", name);
    localStorage.setItem("mteto_grade", grade);
    localStorage.setItem("mteto_province", province);
    localStorage.setItem("mteto_school", school);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const submitReport = () => {
    if (!reportText.trim()) return;
    // Store locally and simulate send
    const reports = JSON.parse(localStorage.getItem("mteto_reports") || "[]");
    reports.push({
      id: Date.now().toString(),
      category: reportCategory,
      text: reportText.trim(),
      date: new Date().toISOString(),
      status: "submitted",
    });
    localStorage.setItem("mteto_reports", JSON.stringify(reports));
    setReportSent(true);
    setReportText("");
    setTimeout(() => { setReportSent(false); setShowReport(false); }, 3000);
  };

  const handleLogout = () => {
    logout();
    navigate("/explore");
  };

  return (
    <MobileLayout title="My Profile">
      <div className="px-3 py-4 space-y-4">

        {/* Profile Card */}
        <div className="brand-gradient rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/25 border-2 border-white/40 flex items-center justify-center text-3xl shrink-0" aria-label="Profile avatar">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={name || "User"} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span aria-hidden="true">🦅</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-display font-bold text-xl leading-tight truncate capitalize">
                {name || "My Profile"}
              </h1>
              {user?.email && <p className="text-white/70 text-xs mt-0.5 truncate">{user.email}</p>}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="bg-white/25 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">Level {level}</span>
                <span className="bg-white/25 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Coins className="w-3 h-3" /> {totalPoints}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-white/70 mb-1.5">
              <span>Progress to Level {level + 1}</span><span>{levelProgress}/100 coins</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${levelProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Saved confirmation */}
        {saved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-2.5" role="status" aria-live="polite">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-green-700 text-sm font-semibold">Profile saved!</p>
          </div>
        )}

        {/* Edit Profile */}
        <SectionCard title="My Information">
          {editing ? (
            <div className="px-4 py-3 space-y-3">
              <div>
                <label htmlFor="profile-name" className="text-xs font-semibold text-muted-foreground block mb-1">Name / Alias</label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="What should TETO call you?"
                  className="w-full text-sm border border-border/60 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label htmlFor="profile-grade" className="text-xs font-semibold text-muted-foreground block mb-1">Grade / Level</label>
                <select
                  id="profile-grade"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full text-sm border border-border/60 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background"
                >
                  <option value="">Select grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="profile-province" className="text-xs font-semibold text-muted-foreground block mb-1">Province</label>
                <select
                  id="profile-province"
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className="w-full text-sm border border-border/60 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background"
                >
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="profile-school" className="text-xs font-semibold text-muted-foreground block mb-1">School (optional)</label>
                <input
                  id="profile-school"
                  type="text"
                  value={school}
                  onChange={e => setSchool(e.target.value)}
                  placeholder="Your school name"
                  className="w-full text-sm border border-border/60 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={saveProfile} className="flex-1 rounded-xl brand-gradient border-0 text-white font-bold">Save Changes</Button>
                <Button variant="ghost" onClick={() => setEditing(false)} className="rounded-xl">Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <Row icon={<User className="w-4 h-4" />} label="Name / Alias" value={name || "Tap to set"} onPress={() => setEditing(true)} />
              <Row icon={<GraduationCap className="w-4 h-4" />} label="Grade" value={grade || "Not set"} onPress={() => setEditing(true)} />
              <Row icon={<Shield className="w-4 h-4" />} label="Province" value={province} onPress={() => setEditing(true)} />
              <Row icon={<BookOpen className="w-4 h-4" />} label="School" value={school || "Not set"} onPress={() => setEditing(true)} />
              <div className="px-4 pb-3 pt-2">
                <Button size="sm" onClick={() => setEditing(true)} variant="outline" className="rounded-xl text-xs border-primary/40 text-primary flex items-center gap-1.5">
                  <Edit2 className="w-3 h-3" /> Edit Profile
                </Button>
              </div>
            </>
          )}
        </SectionCard>

        {/* Progress & Achievements */}
        <SectionCard title="Progress & Knowledge Journey">
          {/* Stats row */}
          <div className="px-4 py-3 grid grid-cols-4 gap-2">
            {[
              { icon: "📰", label: "Articles", val: stats.articlesRead },
              { icon: "🧠", label: "Quizzes", val: stats.quizzes },
              { icon: "✅", label: "Checklists", val: stats.checklists },
              { icon: "⭐", label: "Reviews", val: stats.reviews },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1 bg-muted/40 rounded-2xl py-2">
                <span className="text-lg" aria-hidden="true">{s.icon}</span>
                <span className="text-sm font-bold text-foreground">{s.val}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div className="px-4 pb-3">
            <p className="text-[11px] font-bold text-muted-foreground mb-2">Badges Earned</p>
            <div className="grid grid-cols-3 gap-2">
              {badges.map(b => <Badge key={b.label} {...b} />)}
            </div>
          </div>

          {/* Transaction timeline */}
          {transactions.length > 0 && (
            <div className="px-4 pb-3 border-t border-border/40 pt-3">
              <p className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Recent Activity
              </p>
              <div className="space-y-2">
                {transactions.slice(0, 8).map((t: { id: string; reason: string; amount: number; createdAt: string }) => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-foreground capitalize">{t.reason.replace(/_/g, " ")}</span>
                    </div>
                    <span className="font-bold text-amber-600">+{t.amount} 🪙</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {transactions.length === 0 && (
            <div className="px-4 pb-4 text-center">
              <p className="text-xs text-muted-foreground">Start reading articles, taking quizzes, and using the app to earn coins and build your progress timeline.</p>
            </div>
          )}
        </SectionCard>

        {/* Settings */}
        <SectionCard title="App Settings">
          <Row icon={<Accessibility className="w-4 h-4" />} label="Accessibility Settings" onPress={openPanel} />
          <Row icon={<Bell className="w-4 h-4" />} label="Notification Preferences" value="On" onPress={() => {}} />
          <Row icon={<Lock className="w-4 h-4" />} label="Privacy & Data" onPress={() => {}} />
        </SectionCard>

        {/* Help & Support */}
        <SectionCard title="Help & Support">
          <Row
            icon={<Flag className="w-4 h-4" />}
            label="Report an Issue"
            onPress={() => setShowReport(!showReport)}
          />
          {showReport && (
            <div className="px-4 pb-4 pt-1 border-t border-border/30">
              {reportSent ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-3 py-2.5" role="status" aria-live="polite">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-green-700 text-xs font-semibold">Thank you! Your report has been saved. We'll investigate it.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div>
                    <label htmlFor="report-category" className="text-xs font-semibold text-muted-foreground block mb-1">Category</label>
                    <select
                      id="report-category"
                      value={reportCategory}
                      onChange={e => setReportCategory(e.target.value)}
                      className="w-full text-sm border border-border/60 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background"
                    >
                      <option value="bug">App bug / error</option>
                      <option value="content">Wrong or harmful content</option>
                      <option value="provider">Incorrect service provider info</option>
                      <option value="safety">Safety concern</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="report-text" className="text-xs font-semibold text-muted-foreground block mb-1">Describe the issue</label>
                    <textarea
                      id="report-text"
                      value={reportText}
                      onChange={e => setReportText(e.target.value)}
                      placeholder="Please describe what happened…"
                      className="w-full text-sm border border-border/60 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                      rows={3}
                    />
                  </div>
                  <Button onClick={submitReport} className="w-full rounded-xl brand-gradient border-0 text-white font-bold">
                    Submit Report
                  </Button>
                </div>
              )}
            </div>
          )}
          <Row icon={<Info className="w-4 h-4" />} label="About M-TETO" value="v1.0" onPress={() => {}} />
          <div className="px-4 pb-4 pt-2 border-t border-border/40">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              M-TETO™ is a South African child-safe search engine combating School-Related Gender-Based Violence (SRGBV). 
              Copyright © {new Date().getFullYear()} Adv. Thando Gumede ZA. All rights reserved.
            </p>
          </div>
        </SectionCard>

        {/* Auth section */}
        {isAuthenticated ? (
          <>
            {!showLogoutConfirm ? (
              <Button
                onClick={() => setShowLogoutConfirm(true)}
                variant="outline"
                className="w-full rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-bold flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </Button>
            ) : (
              <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 space-y-3">
                <p className="text-sm font-bold text-red-700 text-center">Are you sure you want to log out?</p>
                <p className="text-xs text-red-600 text-center">Your diary and reminders are saved on this device.</p>
                <div className="flex gap-3">
                  <Button onClick={handleLogout} className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 border-0 text-white font-bold">
                    Yes, log out
                  </Button>
                  <Button onClick={() => setShowLogoutConfirm(false)} variant="outline" className="flex-1 rounded-2xl font-bold">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-4 text-center space-y-3">
            <p className="text-sm font-bold text-foreground">Log in to sync your progress</p>
            <p className="text-xs text-muted-foreground">Your coins, quiz results, and achievements are saved across devices when you log in.</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
