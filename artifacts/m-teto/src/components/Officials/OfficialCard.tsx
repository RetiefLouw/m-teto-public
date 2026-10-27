import { useState } from "react";
import { Phone, Mail, Shield, Star, AlertTriangle, Clock, User, ChevronDown, ChevronUp, Award, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Official } from "@workspace/api-client-react";

const ROLE_CONFIG: Record<string, { label: string; color: string; order: number }> = {
  director: { label: "Director", color: "bg-purple-100 text-purple-700 border-purple-200", order: 0 },
  manager: { label: "Manager", color: "bg-blue-100 text-blue-700 border-blue-200", order: 1 },
  supervisor: { label: "Supervisor", color: "bg-teal-100 text-teal-700 border-teal-200", order: 2 },
  frontline: { label: "Frontline Staff", color: "bg-green-100 text-green-700 border-green-200", order: 3 },
};

interface OfficialCardProps {
  official: Official;
  onReview?: (official: Official) => void;
  showEscalation?: boolean;
  compact?: boolean;
}

export function OfficialCard({ official, onReview, showEscalation = false, compact = false }: OfficialCardProps) {
  const [expanded, setExpanded] = useState(false);
  const roleConfig = ROLE_CONFIG[official.role] ?? ROLE_CONFIG.frontline;

  const initials = official.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const flagLevel =
    official.flagCount >= 3 ? "high" :
    official.flagCount >= 1 ? "medium" : "none";

  return (
    <Card className={`rounded-2xl border-border/50 shadow-sm overflow-hidden transition-all ${official.isOnDuty ? "border-l-4 border-l-green-500" : "opacity-75"}`}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            {official.photoUrl ? (
              <img
                src={official.photoUrl}
                alt={official.name}
                className={`${compact ? "w-10 h-10" : "w-12 h-12"} rounded-xl object-cover`}
              />
            ) : (
              <div className={`${compact ? "w-10 h-10" : "w-12 h-12"} rounded-xl bg-primary/10 flex items-center justify-center`}>
                <span className="font-bold text-primary text-sm">{initials}</span>
              </div>
            )}
            {/* On-duty indicator */}
            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card ${official.isOnDuty ? "bg-green-500" : "bg-gray-300"}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className={`font-bold text-foreground ${compact ? "text-sm" : "text-base"}`}>{official.name}</p>
                  {official.badgeNumber && (
                    <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      #{official.badgeNumber}
                    </span>
                  )}
                </div>
                <p className={`text-muted-foreground ${compact ? "text-[11px]" : "text-xs"} font-medium mt-0.5`}>{official.title}</p>
                {official.unit && !compact && (
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">{official.unit}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={`text-[10px] px-2 py-0.5 border font-bold shrink-0 ${roleConfig.color}`}>
                  {roleConfig.label}
                </Badge>
                {official.isOnDuty ? (
                  <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> On Duty
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Off Duty</span>
                )}
              </div>
            </div>

            {/* Stats row */}
            {!compact && official.reviewCount > 0 && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-bold text-foreground">
                    {official.averageScore != null ? official.averageScore.toFixed(1) : "—"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">({official.reviewCount})</span>
                </div>
                {official.flagCount > 0 && (
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold
                    ${flagLevel === "high" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {official.flagCount} flag{official.flagCount !== 1 ? "s" : ""}
                  </div>
                )}
                {official.recognitionCount > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700">
                    <Award className="w-2.5 h-2.5" />
                    {official.recognitionCount}
                  </div>
                )}
              </div>
            )}

            {/* Contact & action row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {official.phone && (
                <a
                  href={`tel:${official.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  {compact ? "Call" : official.phone}
                </a>
              )}
              {official.email && !compact && (
                <a
                  href={`mailto:${official.email}`}
                  className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  <Mail className="w-3 h-3" /> Email
                </a>
              )}
              {onReview && official.isOnDuty && (
                <button
                  onClick={() => onReview(official)}
                  className="ml-auto text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                >
                  <Star className="w-3 h-3" /> Rate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Badge verification info */}
        {!compact && official.badgeNumber && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <BadgeCheck className="w-3.5 h-3.5 text-primary" />
              <span>Verify identity: ask for badge <strong className="text-foreground font-mono">#{official.badgeNumber}</strong> before sharing personal information</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function sortOfficialsByRole(officials: Official[]): Official[] {
  return [...officials].sort((a, b) => {
    const aOrder = ROLE_CONFIG[a.role]?.order ?? 99;
    const bOrder = ROLE_CONFIG[b.role]?.order ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    // On duty first within same role
    if (a.isOnDuty && !b.isOnDuty) return -1;
    if (!a.isOnDuty && b.isOnDuty) return 1;
    return 0;
  });
}
