import { useState } from "react";
import { useLocation } from "wouter";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useListProviders } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search, MapPin, Phone, Star, AlertTriangle, Scale, Heart,
  Home, Stethoscope, Shield, Hospital, Building2, Users,
  Clock, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

const PROVIDER_TYPES = [
  { id: "all", label: "All Services", emoji: "🔍" },
  { id: "police_station", label: "Police", emoji: "🚓" },
  { id: "court", label: "Courts", emoji: "⚖️" },
  { id: "thuthuzela_care_centre", label: "TCCs", emoji: "🛡️" },
  { id: "hospital", label: "Hospitals", emoji: "🏥" },
  { id: "clinic", label: "Clinics", emoji: "💊" },
  { id: "shelter", label: "Shelters", emoji: "🏠" },
  { id: "social_worker", label: "Social Dev", emoji: "👥" },
  { id: "legal_aid", label: "Legal Aid", emoji: "📋" },
  { id: "legal", label: "Lawyers", emoji: "⚖️" },
  { id: "ngo", label: "NGOs", emoji: "🤝" },
];

const AREAS = [
  { id: "", label: "All Areas" },
  { id: "City of Johannesburg", label: "Johannesburg" },
  { id: "City of Tshwane", label: "Tshwane/Pretoria" },
  { id: "Ekurhuleni", label: "Ekurhuleni" },
  { id: "West Rand", label: "West Rand" },
  { id: "Sedibeng", label: "Sedibeng" },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  police_station: <Shield className="w-3.5 h-3.5" />,
  court: <Scale className="w-3.5 h-3.5" />,
  hospital: <Hospital className="w-3.5 h-3.5" />,
  clinic: <Stethoscope className="w-3.5 h-3.5" />,
  thuthuzela_care_centre: <Heart className="w-3.5 h-3.5" />,
  shelter: <Home className="w-3.5 h-3.5" />,
  social_worker: <Users className="w-3.5 h-3.5" />,
  legal_aid: <Scale className="w-3.5 h-3.5" />,
  pro_bono_legal: <Scale className="w-3.5 h-3.5" />,
  legal_clinic: <Building2 className="w-3.5 h-3.5" />,
  counsellor: <Heart className="w-3.5 h-3.5" />,
  srhr_practitioner: <Stethoscope className="w-3.5 h-3.5" />,
  doctor_office: <Stethoscope className="w-3.5 h-3.5" />,
  ngo: <Users className="w-3.5 h-3.5" />,
  cso: <Users className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<string, string> = {
  police_station: "bg-blue-50 text-blue-700 border-blue-200",
  court: "bg-indigo-50 text-indigo-700 border-indigo-200",
  hospital: "bg-teal-50 text-teal-700 border-teal-200",
  clinic: "bg-cyan-50 text-cyan-700 border-cyan-200",
  thuthuzela_care_centre: "bg-purple-50 text-purple-700 border-purple-200",
  shelter: "bg-amber-50 text-amber-700 border-amber-200",
  social_worker: "bg-orange-50 text-orange-700 border-orange-200",
  legal_aid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pro_bono_legal: "bg-violet-50 text-violet-700 border-violet-200",
  legal_clinic: "bg-indigo-50 text-indigo-700 border-indigo-200",
  counsellor: "bg-rose-50 text-rose-700 border-rose-200",
  srhr_practitioner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  doctor_office: "bg-sky-50 text-sky-700 border-sky-200",
  ngo: "bg-pink-50 text-pink-700 border-pink-200",
  cso: "bg-pink-50 text-pink-700 border-pink-200",
};

const TYPE_LABELS: Record<string, string> = {
  police_station: "Police Station",
  court: "Court",
  hospital: "Hospital",
  clinic: "Clinic",
  thuthuzela_care_centre: "Thuthuzela Care Centre",
  shelter: "Shelter / Crisis Centre",
  social_worker: "Social Development",
  legal_aid: "Legal Aid",
  pro_bono_legal: "Pro-Bono Lawyers",
  legal_clinic: "University Law Clinic",
  counsellor: "Counselling",
  srhr_practitioner: "SRHR Practitioner",
  doctor_office: "Doctor's Office",
  ngo: "NGO / NPO",
  cso: "Civil Society Organisation",
};

const FREE_TYPES = ["legal_aid", "pro_bono_legal", "legal_clinic", "counsellor", "shelter", "srhr_practitioner", "social_worker"];
const URGENT_TYPES = ["police_station", "thuthuzela_care_centre", "hospital"];

export default function Directory() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedArea, setSelectedArea] = useState("");
  const [, navigate] = useLocation();

  const { data, isLoading } = useListProviders({
    query: {
      search: search || undefined,
      type: selectedType !== "all" ? selectedType : undefined,
      area: selectedArea || undefined,
      province: "Gauteng",
    },
  });

  const providers = data?.providers ?? [];

  return (
    <MobileLayout title="Helpers">
      <div className="mx-auto w-full max-w-5xl px-4 pt-4 pb-8 space-y-4">

        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 rounded-2xl p-4 border border-purple-200/40">
          <p className="font-bold text-sm text-foreground">🛡️ Gauteng Government Services</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            All police stations, courts, Thuthuzela Care Centres, hospitals, clinics,
            shelters and social development offices across Gauteng.
          </p>
        </div>

        {/* Sticky search + filters */}
        <div className="sticky top-[68px] z-30 bg-background/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 space-y-3 shadow-sm border-b border-border/50">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, suburb or municipality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 rounded-2xl bg-card border-border/60 shadow-sm focus-visible:ring-primary/20 text-sm"
            />
          </div>

          {/* Area tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4 snap-x">
            {AREAS.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                className={`snap-start whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
                  selectedArea === area.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {area.label}
              </button>
            ))}
          </div>

          {/* Type tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4 snap-x">
            {PROVIDER_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`snap-start whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
                  selectedType === type.id
                    ? "bg-secondary text-secondary-foreground shadow-md shadow-secondary/20 scale-105"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {type.emoji} {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-xs text-muted-foreground font-medium px-1">
            {providers.length === 0 ? "No results" : `${providers.length} service${providers.length !== 1 ? "s" : ""} found`}
            {selectedArea ? ` in ${selectedArea}` : " across Gauteng"}
          </p>
        )}

        {/* Provider list */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="rounded-2xl border-border/50 p-4">
                <div className="animate-pulse flex space-x-3">
                  <div className="rounded-xl bg-muted h-12 w-12 shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3.5 bg-muted rounded w-2/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </div>
                </div>
              </Card>
            ))
          ) : providers.length === 0 ? (
            <div className="text-center py-12 px-4 md:col-span-2">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="font-bold text-lg">No services found</h3>
              <p className="text-muted-foreground mt-2 text-sm">Try adjusting your search or filters.</p>
            </div>
          ) : (
            providers.map((provider, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.025, 0.3) }}
                key={provider.id}
              >
                <div onClick={() => navigate(`/directory/${provider.id}`)}>
                  <Card className={`rounded-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    provider.averageRating && provider.averageRating < 7
                      ? "border-destructive/30 bg-destructive/[0.015]"
                      : "border-border/50 hover:border-primary/30 hover:shadow-md"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Type badge + flags */}
                          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 border flex items-center gap-1 shrink-0 ${TYPE_COLORS[provider.type] || "border-primary/20 text-primary bg-primary/5"}`}
                            >
                              {TYPE_ICONS[provider.type]}
                              {TYPE_LABELS[provider.type] || provider.type.replace(/_/g, " ")}
                            </Badge>
                            {FREE_TYPES.includes(provider.type) && (
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-bold shrink-0">Free</Badge>
                            )}
                            {URGENT_TYPES.includes(provider.type) && (
                              <Badge className="text-[10px] px-2 py-0.5 font-bold bg-red-500 text-white shrink-0">24/7</Badge>
                            )}
                            {provider.averageRating && provider.averageRating < 7 && (
                              <Badge variant="destructive" className="text-[10px] px-2 py-0.5 flex items-center gap-1 shrink-0">
                                <AlertTriangle className="w-3 h-3" /> Low Rating
                              </Badge>
                            )}
                          </div>

                          {/* Name */}
                          <h3 className="font-bold text-sm leading-snug text-foreground">{provider.name}</h3>

                          {/* Location */}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <MapPin className="w-3 h-3 shrink-0 text-primary/60" />
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {provider.suburb}{provider.municipality ? `, ${provider.municipality}` : ""}
                            </span>
                          </div>

                          {/* Hours */}
                          {provider.operatingHours && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Clock className="w-3 h-3 shrink-0 text-muted-foreground/60" />
                              <span className="text-[11px] text-muted-foreground/80">{provider.operatingHours}</span>
                            </div>
                          )}
                        </div>

                        {/* Right: rating + call */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          {provider.reviewCount && provider.reviewCount > 0 ? (
                            <div className="flex flex-col items-center justify-center bg-card border border-border/50 rounded-xl p-2 min-w-[48px]">
                              <Star className={`w-4 h-4 mb-0.5 ${provider.averageRating && provider.averageRating >= 7 ? "text-secondary fill-secondary" : "text-muted-foreground/30"}`} />
                              <span className="font-bold text-sm leading-none">
                                {provider.averageRating ? provider.averageRating.toFixed(1) : "-"}
                              </span>
                              <span className="text-[8px] text-muted-foreground uppercase font-bold mt-0.5">{provider.reviewCount}</span>
                            </div>
                          ) : null}

                          <a
                            href={`tel:${provider.contactNumber.replace(/\s/g, "")}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 bg-primary text-primary-foreground px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            Call
                          </a>

                          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
