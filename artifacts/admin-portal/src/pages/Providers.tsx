import { useEffect, useState } from "react";
import { Building2, Search, Phone, MapPin, Users, Shield, Heart, Gavel, Hospital } from "lucide-react";
import { fetchPublic } from "../lib/api";

const TYPE_LABELS: Record<string, string> = {
  police_station: "Police Station",
  court: "Court",
  thuthuzela: "Thuthuzela Care Centre",
  hospital: "Hospital",
  clinic: "Clinic",
  social_worker: "Social Development",
  shelter: "Shelter",
  legal_aid: "Legal Aid",
  ngo: "NGO",
  cso: "CSO",
  legal_clinic: "Legal Clinic",
  crisis_centre: "Crisis Centre",
};

const TYPE_ICONS: Record<string, any> = {
  police_station: Shield,
  court: Gavel,
  thuthuzela: Heart,
  hospital: Hospital,
  ngo: Users,
  cso: Users,
  default: Building2,
};

const TYPE_COLORS: Record<string, string> = {
  police_station: "#2563EB",
  court: "#7C3AED",
  thuthuzela: "#E8215D",
  hospital: "#16A34A",
  clinic: "#16A34A",
  social_worker: "#F97316",
  shelter: "#EAB308",
  ngo: "#EC4899",
  cso: "#06B6D4",
  default: "#64748B",
};

export default function Providers() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchPublic("/providers?limit=500&province=Gauteng")
      .then((d: any) => setProviders(d.providers ?? []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  const types = ["all", ...Array.from(new Set(providers.map((p) => p.type).filter(Boolean)))];

  const filtered = providers.filter((p) => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.suburb?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const byType: Record<string, number> = {};
  providers.forEach((p) => {
    byType[p.type ?? "other"] = (byType[p.type ?? "other"] ?? 0) + 1;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Service Providers</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {providers.length} providers across Gauteng — government services & civil society organisations
        </p>
      </div>

      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([type, count]) => {
          const color = TYPE_COLORS[type] ?? TYPE_COLORS.default;
          const Icon = TYPE_ICONS[type] ?? TYPE_ICONS.default;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
              className={`rounded-xl p-3 text-center transition-all border ${typeFilter === type ? "border-2 shadow-sm" : "bg-white border-gray-100 hover:border-gray-200"}`}
              style={typeFilter === type ? { borderColor: color, background: `${color}10` } : {}}
            >
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
              <div className="text-lg font-black" style={{ color }}>{count}</div>
              <div className="text-[9px] font-semibold text-gray-500 leading-tight">{TYPE_LABELS[type] ?? type}</div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or area..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#E8215D] transition-colors bg-white"
          />
        </div>
        {typeFilter !== "all" && (
          <button
            onClick={() => setTypeFilter("all")}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
          >
            Clear filter
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Loading providers...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 font-medium">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No providers match your search</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.slice(0, 100).map((p) => {
                  const color = TYPE_COLORS[p.type] ?? TYPE_COLORS.default;
                  const Icon = TYPE_ICONS[p.type] ?? TYPE_ICONS.default;
                  return (
                    <div key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                        <Icon className="w-4.5 h-4.5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {p.suburb && (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> {p.suburb}
                            </span>
                          )}
                          {p.phone && (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5">
                              <Phone className="w-3 h-3" /> {p.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className="text-[11px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: `${color}15`, color }}
                      >
                        {TYPE_LABELS[p.type] ?? p.type}
                      </span>
                    </div>
                  );
                })}
                {filtered.length > 100 && (
                  <div className="text-center py-4 text-sm text-gray-400 border-t border-gray-100">
                    Showing 100 of {filtered.length} providers — refine your search to see more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
