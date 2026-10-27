import { Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { EmergencyHelp } from "@/components/EmergencyHelp";
import { useListCases } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, MapPin, BookOpen, Clock, Star, ShoppingBag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function Home() {
  const { isAuthenticated, user, login } = useAuth();

  const { data: casesData, isLoading } = useListCases({
    query: { enabled: isAuthenticated }
  });

  const activeCase = casesData?.cases?.[0];

  return (
    <MobileLayout>
      <div className="pt-4 pb-8">

        {/* Hero Banner with Brand Gradient */}
        <div className="mx-4 mb-5 rounded-3xl overflow-hidden relative brand-gradient p-5 shadow-lg">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
          <div className="relative z-10">
            {isAuthenticated ? (
              <>
                <p className="text-white/80 font-sans text-sm font-semibold mb-0.5">Welcome back 👋</p>
                <h2 className="text-2xl font-display font-bold text-white mb-1">
                  {user?.firstName || 'Friend'}!
                </h2>
              </>
            ) : (
              <>
                <p className="text-white/80 font-sans text-xs font-bold uppercase tracking-widest mb-1">M-TETO Search Engine</p>
                <h2 className="text-2xl font-display font-bold text-white mb-1 leading-tight">
                  Conquering SRGBV,<br />One Search at a Time
                </h2>
              </>
            )}
            <p className="text-white/85 text-sm font-sans">
              Know your rights. Find help. Stay safe. 💪
            </p>
          </div>
        </div>

        {/* Global Emergency Button */}
        <EmergencyHelp />

        {/* Authenticated Dashboard */}
        {isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 space-y-5"
          >
            {/* Active Case Status Card */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-display font-bold text-lg">My Case</h3>
                <Link href="/tracker" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {isLoading ? (
                <Card className="rounded-3xl border-border/50 shadow-md p-6">
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : activeCase ? (
                <Link href={`/tracker/${activeCase.id}`} className="block">
                  <Card className="rounded-3xl border-primary/20 shadow-lg hover:shadow-xl hover:border-primary/40 transition-all duration-300 overflow-hidden cursor-pointer group">
                    <div className="h-2 brand-gradient w-full" />
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">Active Case</p>
                          <h4 className="font-display font-bold text-lg">{activeCase.title}</h4>
                        </div>
                        <div className="bg-primary/10 p-2 rounded-2xl">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                      </div>

                      <div className="bg-muted/60 rounded-2xl p-3 border border-border/50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                          <span className="font-bold text-sm">Phase: <span className="text-primary capitalize">{activeCase.stage.replace('_', ' ')}</span></span>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-muted-foreground gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Updated {formatDistanceToNow(new Date(activeCase.updatedAt))} ago
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Card className="rounded-3xl border-dashed border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-7 text-center flex flex-col items-center">
                    <div className="w-16 h-16 brand-gradient rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-display font-bold text-lg mb-1">No Cases Yet</h4>
                    <p className="text-sm text-muted-foreground mb-5">Track your case step by step with timeline guidance and reminders.</p>
                    <Link href="/tracker">
                      <Button className="rounded-full brand-gradient text-white font-bold shadow-md border-0 px-6">
                        Start Tracking
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </section>
          </motion.div>
        ) : (
          /* Guest View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 space-y-5"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-xl border-2 border-primary/20 group">
              <img
                src={`${import.meta.env.BASE_URL}images/hero-illustration.png`}
                alt="Community support illustration"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                <h3 className="font-display font-bold text-white text-2xl mb-1">You are not alone. 💛</h3>
                <p className="text-white/90 text-sm">M-TETO is here to guide you through the justice system with safety and privacy.</p>
              </div>
            </div>

            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
              <div className="flex justify-center mb-3">
                <div className="brand-gradient text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                  Free for all learners
                </div>
              </div>
              <h3 className="font-display font-bold text-xl mb-2 text-center">Get Full Access</h3>
              <p className="text-sm text-muted-foreground text-center mb-5">Log in to track cases, earn points, redeem rewards, and access age-appropriate support.</p>
              <Button onClick={login} className="w-full rounded-full py-5 font-bold text-base shadow-lg brand-gradient text-white border-0 hover:opacity-90">
                Log In to Get Started
              </Button>
            </div>
          </motion.div>
        )}

        {/* Quick Links (Both Auth and Guest) */}
        <section className="px-4 mt-6">
          <h3 className="font-display font-bold text-lg mb-4 px-1">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/directory" className="block">
              <Card className="rounded-3xl border-2 border-secondary/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full bg-gradient-to-br from-white to-secondary/10 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-secondary to-accent w-full" />
                <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/15 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-secondary" />
                  </div>
                  <h4 className="font-display font-bold text-sm">Find Help</h4>
                  <p className="text-[10px] text-muted-foreground font-sans">Hospitals, TCCs & Police</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/learn" className="block">
              <Card className="rounded-3xl border-2 border-primary/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full bg-gradient-to-br from-white to-primary/10 overflow-hidden">
                <div className="h-1.5 brand-gradient w-full" />
                <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-display font-bold text-sm">Know Your Rights</h4>
                  <p className="text-[10px] text-muted-foreground font-sans">Legal terms & guides</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/learn" className="block">
              <Card className="rounded-3xl border-2 border-accent/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full bg-gradient-to-br from-white to-accent/10 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-accent to-secondary w-full" />
                <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-accent" />
                  </div>
                  <h4 className="font-display font-bold text-sm">M-TETO Uni</h4>
                  <p className="text-[10px] text-muted-foreground font-sans">Learn & earn points</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/square" className="block">
              <Card className="rounded-3xl border-2 border-primary/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full bg-gradient-to-br from-white to-primary/10 overflow-hidden">
                <div className="h-1.5 brand-gradient w-full" />
                <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-display font-bold text-sm">The Square</h4>
                  <p className="text-[10px] text-muted-foreground font-sans">Redeem your points</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

      </div>
    </MobileLayout>
  );
}
