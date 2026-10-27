export const DEMO_DATA = {
  overview: {
    totals: {
      assessments: 142,
      withRiskFlags: 23,
      avgKnowledgeScore: 58,
      completed: 119,
      searches: 487,
    },
    riskByLevel: [
      { riskLevel: "high", count: 18 },
      { riskLevel: "medium", count: 31 },
      { riskLevel: "low", count: 44 },
      { riskLevel: "none", count: 49 },
    ],
    recentActivity: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split("T")[0],
      count: Math.floor(Math.sin(i / 2) * 5 + 10),
    })),
  },
  demographics: {
    byProvince: [
      { province: "Gauteng", count: 48, riskCount: 9 },
      { province: "Western Cape", count: 32, riskCount: 5 },
      { province: "KwaZulu-Natal", count: 27, riskCount: 6 },
      { province: "Eastern Cape", count: 18, riskCount: 4 },
      { province: "Limpopo", count: 11, riskCount: 3 },
      { province: "Mpumalanga", count: 6, riskCount: 2 },
    ],
    byGrade: [
      { gradeLevel: "grade_1_2", count: 22 },
      { gradeLevel: "grade_3_5", count: 45 },
      { gradeLevel: "grade_6_7", count: 38 },
      { gradeLevel: "grade_8_12", count: 37 },
    ],
    byGender: [
      { gender: "Girl", count: 68 },
      { gender: "Boy", count: 44 },
      { gender: "Non-binary", count: 18 },
      { gender: "Prefer not to say", count: 12 },
    ],
    byRace: [
      { race: "Black African", count: 82 },
      { race: "Coloured", count: 28 },
      { race: "Indian/Asian", count: 17 },
      { race: "White", count: 10 },
      { race: "Other", count: 5 },
    ],
    byAreaType: [
      { areaType: "Township", count: 55 },
      { areaType: "City", count: 42 },
      { areaType: "Town", count: 28 },
      { areaType: "Rural", count: 17 },
    ],
    bySchoolType: [
      { schoolType: "Public school", count: 103 },
      { schoolType: "Private school", count: 24 },
      { schoolType: "Home schooled", count: 11 },
      { schoolType: "Other", count: 4 },
    ],
  },
  risk: {
    hotspots: [
      { province: "Gauteng", areaType: "township", total: 28, riskCount: 8, highRisk: 4, mediumRisk: 4 },
      { province: "KwaZulu-Natal", areaType: "rural", total: 15, riskCount: 5, highRisk: 3, mediumRisk: 2 },
      { province: "Eastern Cape", areaType: "township", total: 12, riskCount: 4, highRisk: 2, mediumRisk: 2 },
      { province: "Western Cape", areaType: "city", total: 22, riskCount: 3, highRisk: 1, mediumRisk: 2 },
    ],
    flagCounts: [
      { flag: "witnessed_violence_at_home", count: 14 },
      { flag: "experienced_violence_at_school", count: 12 },
      { flag: "not_feel_safe_at_school", count: 11 },
      { flag: "experienced_online_harassment", count: 9 },
      { flag: "not_know_who_to_tell", count: 8 },
    ],
    riskByGrade: [
      { gradeLevel: "grade_1_2", highRisk: 3, mediumRisk: 5, lowRisk: 7, noRisk: 7, total: 22 },
      { gradeLevel: "grade_3_5", highRisk: 5, mediumRisk: 12, lowRisk: 15, noRisk: 13, total: 45 },
      { gradeLevel: "grade_6_7", highRisk: 6, mediumRisk: 9, lowRisk: 12, noRisk: 11, total: 38 },
      { gradeLevel: "grade_8_12", highRisk: 4, mediumRisk: 5, lowRisk: 10, noRisk: 18, total: 37 },
    ],
  },
  knowledge: {
    byGrade: [
      { gradeLevel: "grade_1_2", avgScore: 38, count: 22, high: 3, medium: 8, low: 11 },
      { gradeLevel: "grade_3_5", avgScore: 52, count: 45, high: 14, medium: 19, low: 12 },
      { gradeLevel: "grade_6_7", avgScore: 64, count: 38, high: 18, medium: 14, low: 6 },
      { gradeLevel: "grade_8_12", avgScore: 72, count: 37, high: 22, medium: 11, low: 4 },
    ],
    histogram: [
      { range: "0–10", count: 4 },
      { range: "11–20", count: 8 },
      { range: "21–30", count: 11 },
      { range: "31–40", count: 18 },
      { range: "41–50", count: 22 },
      { range: "51–60", count: 27 },
      { range: "61–70", count: 24 },
      { range: "71–80", count: 16 },
      { range: "81–90", count: 8 },
      { range: "91–100", count: 4 },
    ],
  },
  searches: {
    topQueries: [
      { query: "what is srgbv", count: 34 },
      { query: "how to report abuse", count: 28 },
      { query: "childline south africa", count: 24 },
      { query: "children's rights", count: 22 },
      { query: "what is consent", count: 19 },
      { query: "gender based violence", count: 17 },
      { query: "protection order", count: 15 },
      { query: "bullying at school", count: 14 },
      { query: "sanitary pads free", count: 11 },
      { query: "mental health support", count: 10 },
    ],
    byGrade: [
      { gradeLevel: "grade_1_2", count: 62 },
      { gradeLevel: "grade_3_5", count: 148 },
      { gradeLevel: "grade_6_7", count: 143 },
      { gradeLevel: "grade_8_12", count: 134 },
    ],
    byProvince: [
      { province: "Gauteng", count: 182 },
      { province: "Western Cape", count: 108 },
      { province: "KwaZulu-Natal", count: 97 },
      { province: "Eastern Cape", count: 55 },
      { province: "Limpopo", count: 45 },
    ],
    recentSearches: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split("T")[0],
      count: Math.floor(Math.sin(i / 2) * 8 + 25),
    })),
  },
};

export const GRADE_LABELS: Record<string, string> = {
  grade_1_2: "Grade 1–2",
  grade_3_5: "Grade 3–5",
  grade_6_7: "Grade 6–7",
  grade_8_12: "Grade 8–12",
};

export const RISK_COLORS: Record<string, string> = {
  high: "#EF4444",
  medium: "#F97316",
  low: "#EAB308",
  none: "#22C55E",
};

export const CHART_COLORS = ["#E8215D", "#3B82F6", "#7C3AED", "#16A34A", "#F59E0B", "#EC4899"];
