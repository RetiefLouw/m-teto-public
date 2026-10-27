import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useListSquareItems, useRedeemSquareItem, useGetPoints } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShoppingBag, Coins, CheckCircle2, Sparkles, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "srhr", label: "Health & SRHR" },
  { id: "education", label: "Education" },
  { id: "hygiene", label: "Hygiene" },
  { id: "emergency", label: "Safety" },
  { id: "digital", label: "Digital" },
];

const CATEGORY_COLORS: Record<string, string> = {
  srhr: "bg-rose-50 text-rose-700 border-rose-200",
  education: "bg-blue-50 text-blue-700 border-blue-200",
  hygiene: "bg-teal-50 text-teal-700 border-teal-200",
  emergency: "bg-orange-50 text-orange-700 border-orange-200",
  digital: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function TheSquare() {
  const { isAuthenticated, login } = useAuth();
  const [category, setCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<NonNullable<ReturnType<typeof useListSquareItems>["data"]>["items"][0] | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: itemsData, isLoading } = useListSquareItems({
    query: { category: category !== "all" ? category : undefined }
  });

  const { data: pointsData } = useGetPoints({
    query: { enabled: isAuthenticated }
  });

  const { mutate: redeem, isPending: redeeming } = useRedeemSquareItem({
    mutation: {
      onSuccess: () => {
        setRedeemSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["/api/points"] });
        queryClient.invalidateQueries({ queryKey: ["/api/square/redemptions"] });
      }
    }
  });

  const totalPoints = pointsData?.totalPoints ?? 0;

  function handleRedeem() {
    if (!selectedItem) return;
    redeem({ data: { itemId: selectedItem.id } });
  }

  return (
    <MobileLayout title="The Square">
      <div className="px-4 pt-4 pb-8 space-y-6">

        {/* Points Banner */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-5 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium mb-1">Your Balance</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-display font-bold">{totalPoints}</span>
              <span className="text-white/80 mb-1 font-medium">points</span>
            </div>
            {isAuthenticated ? (
              <p className="text-white/70 text-xs mt-2">Earn points by learning, writing reviews & completing quizzes</p>
            ) : (
              <button onClick={login} className="mt-2 text-white font-bold text-sm underline underline-offset-2">
                Log in to earn & redeem →
              </button>
            )}
          </div>
          <div className="absolute right-4 bottom-4 opacity-20">
            <Sparkles className="w-16 h-16" />
          </div>
        </div>

        {/* Category Filters */}
        <div className="sticky top-[72px] z-30 bg-background/95 backdrop-blur-md py-3 -mx-4 px-4 border-b border-border/50">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  category === cat.id
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 text-sm text-secondary-foreground">
          <p className="font-semibold mb-1 flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> About The Square</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Redeem your earned points for empowerment items including SRHR products, educational materials, hygiene supplies, and safety resources. All items are free — just use your points!
          </p>
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="rounded-3xl h-48 animate-pulse bg-muted/20 border-border" />
            ))}
          </div>
        ) : !itemsData?.items.length ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-bold text-muted-foreground">No items in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {itemsData.items.map((item, idx) => {
              const canAfford = totalPoints >= item.pointsCost;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card
                    className={`rounded-3xl border transition-all duration-300 cursor-pointer h-full ${
                      canAfford && isAuthenticated
                        ? 'border-border/50 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5'
                        : 'border-border/30 opacity-70'
                    }`}
                    onClick={() => isAuthenticated ? setSelectedItem(item) : login()}
                  >
                    <CardContent className="p-4 flex flex-col gap-3 h-full">
                      <div className="text-4xl text-center py-3 bg-muted/30 rounded-2xl">{item.imageEmoji}</div>
                      <div className="flex-1">
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase tracking-wider font-bold mb-2 border ${CATEGORY_COLORS[item.category] || ''}`}
                        >
                          {item.category}
                        </Badge>
                        <p className="font-bold text-sm leading-snug text-foreground">{item.name}</p>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1 text-primary font-bold text-sm">
                          <Coins className="w-4 h-4" />
                          {item.pointsCost}
                        </div>
                        {!isAuthenticated && <Lock className="w-4 h-4 text-muted-foreground/50" />}
                        {isAuthenticated && !canAfford && (
                          <span className="text-[10px] text-muted-foreground">Need more pts</span>
                        )}
                        {isAuthenticated && canAfford && (
                          <span className="text-[10px] text-secondary font-bold">Redeem →</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* How to Earn Points */}
        <div className="bg-card rounded-3xl border border-border/50 p-5">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" /> How to Earn Points
          </h3>
          <div className="space-y-3 text-sm">
            {[
              { emoji: "📖", action: "Read an article", points: 5 },
              { emoji: "✅", action: "Complete a checklist item", points: 3 },
              { emoji: "⭐", action: "Write a provider review", points: 15 },
              { emoji: "🧠", action: "Answer a quiz correctly", points: 10 },
              { emoji: "👤", action: "Complete your profile", points: 20 },
            ].map(({ emoji, action, points }) => (
              <div key={action} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-base">{emoji}</span> {action}
                </span>
                <Badge variant="secondary" className="font-bold text-xs">+{points} pts</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Redeem Modal */}
      <AnimatePresence>
        {selectedItem && (
          <Dialog open={!!selectedItem} onOpenChange={(open) => { if (!open) { setSelectedItem(null); setRedeemSuccess(false); }}}>
            <DialogContent className="max-w-[380px] w-[90vw] rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <div className="text-5xl text-center mb-2">{selectedItem.imageEmoji}</div>
                <DialogTitle className="text-center text-xl font-display">{selectedItem.name}</DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground">
                  {selectedItem.description}
                </DialogDescription>
              </DialogHeader>

              {redeemSuccess ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-secondary" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">Redeemed!</p>
                    <p className="text-muted-foreground text-sm mt-1">Your item has been requested. You will be contacted to arrange delivery.</p>
                    <p className="text-primary font-bold text-sm mt-2">Remaining balance: {pointsData?.totalPoints} pts</p>
                  </div>
                  <Button className="w-full rounded-xl" onClick={() => { setSelectedItem(null); setRedeemSuccess(false); }}>
                    Back to The Square
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between bg-muted/40 rounded-2xl p-4">
                    <span className="text-sm text-muted-foreground">Item cost</span>
                    <span className="font-bold text-primary flex items-center gap-1">
                      <Coins className="w-4 h-4" /> {selectedItem.pointsCost} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-muted/40 rounded-2xl p-4">
                    <span className="text-sm text-muted-foreground">Your balance</span>
                    <span className={`font-bold flex items-center gap-1 ${totalPoints >= selectedItem.pointsCost ? 'text-secondary' : 'text-destructive'}`}>
                      <Coins className="w-4 h-4" /> {totalPoints} pts
                    </span>
                  </div>
                  {totalPoints < selectedItem.pointsCost && (
                    <p className="text-center text-destructive text-sm font-medium">
                      You need {selectedItem.pointsCost - totalPoints} more points to redeem this item.
                    </p>
                  )}
                  <Button
                    className="w-full rounded-xl py-6 font-bold"
                    disabled={totalPoints < selectedItem.pointsCost || redeeming}
                    onClick={handleRedeem}
                  >
                    {redeeming ? "Processing..." : "Confirm Redemption"}
                  </Button>
                  <Button variant="ghost" className="w-full rounded-xl" onClick={() => setSelectedItem(null)}>
                    Cancel
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
