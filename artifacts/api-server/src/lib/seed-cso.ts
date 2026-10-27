import { db, providersTable, officialsTable } from "@workspace/db";
import { and, isNotNull, eq, count } from "drizzle-orm";

type OfficialSeed = {
  name: string;
  title: string;
  role: "frontline" | "supervisor" | "manager" | "director";
  unit?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
  badgeNumber?: string;
};

type ProviderSeed = {
  name: string;
  type: string;
  address: string;
  suburb: string;
  municipality: string;
  area: string;
  province: string;
  contactNumber: string;
  email?: string;
  website?: string;
  operatingHours?: string;
  officials?: OfficialSeed[];
};

const PROVINCE = "Gauteng";

const CSO_PROVIDERS: ProviderSeed[] = [
  // ═══════════════════════════════════════════════════════════════
  // CHILDLINE SOUTH AFRICA — Gauteng offices
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Childline South Africa — Gauteng",
    type: "ngo",
    address: "90 Bram Fischer Drive",
    suburb: "Randburg",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "116",
    email: "gauteng@childlinesa.org.za",
    website: "https://www.childlinesa.org.za",
    operatingHours: "24 hours, 7 days",
    officials: [
      {
        name: "Provincial Director",
        title: "Provincial Director",
        role: "director",
        unit: "Management",
        phone: "011 789 9716",
        email: "director.gauteng@childlinesa.org.za",
        isPrimary: true,
      },
      {
        name: "Child Protection Manager",
        title: "Child Protection Programme Manager",
        role: "manager",
        unit: "Child Protection",
        phone: "011 789 9716",
      },
      {
        name: "Crisis Counsellor",
        title: "Registered Social Worker / Crisis Counsellor",
        role: "frontline",
        unit: "Crisis Helpline",
        phone: "116",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // RAPCAN — Johannesburg
  // ═══════════════════════════════════════════════════════════════
  {
    name: "RAPCAN — Resources Aimed at the Prevention of Child Abuse and Neglect",
    type: "ngo",
    address: "45 De Villiers Street",
    suburb: "Johannesburg CBD",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 333 9888",
    email: "jhb@rapcan.org.za",
    website: "https://www.rapcan.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Regional Coordinator",
        title: "Gauteng Regional Coordinator",
        role: "manager",
        phone: "011 333 9888",
        isPrimary: true,
      },
      {
        name: "Prevention Officer",
        title: "Child Abuse Prevention Educator",
        role: "frontline",
        unit: "School Programmes",
        phone: "011 333 9888",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // POWA — People Opposing Women Abuse
  // ═══════════════════════════════════════════════════════════════
  {
    name: "POWA — People Opposing Women Abuse (Johannesburg)",
    type: "cso",
    address: "Box 2421, Crown Gardens, Johannesburg South",
    suburb: "Johannesburg South",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 642 4345",
    email: "powa@powa.co.za",
    website: "https://www.powa.co.za",
    operatingHours: "Mon–Fri 08:00–16:00",
    officials: [
      {
        name: "Executive Director",
        title: "Executive Director",
        role: "director",
        phone: "011 642 4345",
        email: "director@powa.co.za",
        isPrimary: true,
      },
      {
        name: "Legal Support Manager",
        title: "Legal Support and Advocacy Manager",
        role: "manager",
        unit: "Legal Services",
        phone: "011 642 4345",
      },
      {
        name: "Shelter Social Worker",
        title: "Social Worker — Shelter Services",
        role: "frontline",
        unit: "Shelter & Crisis Support",
        phone: "011 642 4345",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // TSHWARANANG LEGAL ADVOCACY CENTRE
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Tshwaranang Legal Advocacy Centre",
    type: "legal_clinic",
    address: "Ground Floor, Bram Fischer Building, 25 Jorrisen Street",
    suburb: "Braamfontein",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 403 4583",
    email: "tshwaranang@tshwaranang.org.za",
    website: "https://www.tshwaranang.org.za",
    operatingHours: "Mon–Fri 08:30–16:30",
    officials: [
      {
        name: "Executive Director",
        title: "Executive Director",
        role: "director",
        phone: "011 403 4583",
        isPrimary: true,
      },
      {
        name: "Legal Manager",
        title: "Senior Attorney / Legal Manager",
        role: "manager",
        unit: "Legal Services",
        phone: "011 403 4583",
      },
      {
        name: "Paralegal Advisor",
        title: "Paralegal and Client Support Officer",
        role: "frontline",
        unit: "Client Services",
        phone: "011 403 4583",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // FAMSA — Families South Africa (Johannesburg)
  // ═══════════════════════════════════════════════════════════════
  {
    name: "FAMSA Johannesburg — Families South Africa",
    type: "counsellor",
    address: "97 De Korte Street",
    suburb: "Braamfontein",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 833 2057",
    email: "johannesburg@famsa.org.za",
    website: "https://www.famsa.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Branch Director",
        title: "Branch Director",
        role: "director",
        phone: "011 833 2057",
        isPrimary: true,
      },
      {
        name: "Family Therapy Supervisor",
        title: "Registered Social Worker — Supervisor",
        role: "supervisor",
        unit: "Family Counselling",
        phone: "011 833 2057",
      },
      {
        name: "Youth Counsellor",
        title: "Counsellor — Youth and Child Services",
        role: "frontline",
        unit: "Youth Services",
        phone: "011 833 2057",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // LIFELINE SOUTHERN AFRICA — Johannesburg
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Lifeline Johannesburg",
    type: "counsellor",
    address: "110 Commissioner Street",
    suburb: "Johannesburg CBD",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 728 1347",
    email: "info@lifelinejhb.org.za",
    website: "https://www.lifelinesa.co.za",
    operatingHours: "24 hours helpline; Walk-in: Mon–Fri 08:00–16:00",
    officials: [
      {
        name: "Executive Director",
        title: "Executive Director",
        role: "director",
        phone: "011 728 1347",
        isPrimary: true,
      },
      {
        name: "Counselling Supervisor",
        title: "Registered Counsellor — Supervisor",
        role: "supervisor",
        unit: "Trauma & Crisis Counselling",
        phone: "011 728 1347",
      },
      {
        name: "Crisis Counsellor",
        title: "Trauma Counsellor",
        role: "frontline",
        unit: "Crisis Line",
        phone: "011 728 1347",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // TEDDY BEAR FOUNDATION — Johannesburg
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Teddy Bear Foundation for Abused Children",
    type: "ngo",
    address: "72 Anerley Road",
    suburb: "Parktown",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 484 4554",
    email: "info@teddybear.org.za",
    website: "https://www.teddybear.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Executive Director",
        title: "Executive Director",
        role: "director",
        phone: "011 484 4554",
        email: "director@teddybear.org.za",
        isPrimary: true,
      },
      {
        name: "Child Protection Manager",
        title: "Child Protection Programme Manager",
        role: "manager",
        unit: "Child Protection",
        phone: "011 484 4554",
      },
      {
        name: "Forensic Social Worker",
        title: "Forensic Social Worker",
        role: "frontline",
        unit: "Forensic Assessment",
        phone: "011 484 4554",
      },
      {
        name: "Play Therapist",
        title: "Registered Play Therapist",
        role: "frontline",
        unit: "Therapeutic Services",
        phone: "011 484 4554",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // LAWYERS AGAINST ABUSE (LvA)
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Lawyers Against Abuse (LvA)",
    type: "legal_clinic",
    address: "Suite 511, 9th Floor, 158 Jan Smuts Avenue",
    suburb: "Rosebank",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 038 8990",
    email: "info@lva.org.za",
    website: "https://www.lva.org.za",
    operatingHours: "Mon–Fri 08:30–17:00",
    officials: [
      {
        name: "Executive Director",
        title: "Executive Director",
        role: "director",
        phone: "011 038 8990",
        isPrimary: true,
      },
      {
        name: "Supervising Attorney",
        title: "Attorney — Supervising Lawyer",
        role: "supervisor",
        unit: "Legal Team",
        phone: "011 038 8990",
      },
      {
        name: "Paralegal",
        title: "Paralegal and Court Preparation Officer",
        role: "frontline",
        unit: "Client Services",
        phone: "011 038 8990",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SOUL CITY INSTITUTE
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Soul City Institute — Johannesburg Office",
    type: "ngo",
    address: "38 Wierda Road East",
    suburb: "Sandton",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 784 7600",
    email: "info@soulcity.org.za",
    website: "https://www.soulcity.org.za",
    operatingHours: "Mon–Fri 08:00–17:00",
    officials: [
      {
        name: "CEO",
        title: "Chief Executive Officer",
        role: "director",
        phone: "011 784 7600",
        isPrimary: true,
      },
      {
        name: "GBV Programme Manager",
        title: "GBV Programme Manager",
        role: "manager",
        unit: "Gender-Based Violence",
        phone: "011 784 7600",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // AFRICA TIKKUN — Alexandra
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Afrika Tikkun — Alexandra Community Centre",
    type: "ngo",
    address: "Extension 6, Alexandra Township",
    suburb: "Alexandra",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 440 3923",
    email: "info@afrikatikkun.org",
    website: "https://www.afrikatikkun.org",
    operatingHours: "Mon–Fri 07:30–17:30",
    officials: [
      {
        name: "Site Manager",
        title: "Community Centre Site Manager",
        role: "manager",
        phone: "011 440 3923",
        isPrimary: true,
      },
      {
        name: "Social Development Officer",
        title: "Social Development Practitioner",
        role: "frontline",
        unit: "Child and Youth Development",
        phone: "011 440 3923",
      },
      {
        name: "Youth Programme Coordinator",
        title: "Youth Programme Coordinator",
        role: "supervisor",
        unit: "Youth Programmes",
        phone: "011 440 3923",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // JOHANNESBURG CHILD WELFARE SOCIETY
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Johannesburg Child and Family Welfare Society",
    type: "social_worker",
    address: "Cnr Hoofd & Simmonds Streets",
    suburb: "Johannesburg CBD",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 836 3433",
    email: "info@jcfws.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Director of Services",
        title: "Director of Social Services",
        role: "director",
        phone: "011 836 3433",
        isPrimary: true,
      },
      {
        name: "Social Work Supervisor",
        title: "Senior Social Worker — Supervisor",
        role: "supervisor",
        unit: "Child Protection",
        phone: "011 836 3433",
      },
      {
        name: "Field Social Worker",
        title: "Registered Social Worker",
        role: "frontline",
        unit: "Child and Family Services",
        phone: "011 836 3433",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // NISAA INSTITUTE FOR WOMEN'S DEVELOPMENT — Lenasia
  // ═══════════════════════════════════════════════════════════════
  {
    name: "NISAA Institute for Women's Development",
    type: "cso",
    address: "2 Nirvana Place, Lenasia",
    suburb: "Lenasia",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 852 5265",
    email: "nisaa@nisaa.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Director",
        title: "Director",
        role: "director",
        phone: "011 852 5265",
        isPrimary: true,
      },
      {
        name: "Counsellor / Social Worker",
        title: "Registered Social Worker",
        role: "frontline",
        unit: "Counselling Services",
        phone: "011 852 5265",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // TEARS FOUNDATION — Gauteng
  // ═══════════════════════════════════════════════════════════════
  {
    name: "TEARS Foundation — Gauteng",
    type: "cso",
    address: "Sandown, Sandton",
    suburb: "Sandton",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "*134*7355#",
    email: "info@tears.co.za",
    website: "https://www.tears.co.za",
    operatingHours: "24 hours USSD helpline",
    officials: [
      {
        name: "CEO",
        title: "Chief Executive Officer",
        role: "director",
        phone: "010 590 5920",
        isPrimary: true,
      },
      {
        name: "Survivor Support Manager",
        title: "Survivor Support Programme Manager",
        role: "manager",
        unit: "Survivor Support",
        phone: "010 590 5920",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SANCA — Johannesburg
  // ═══════════════════════════════════════════════════════════════
  {
    name: "SANCA Johannesburg",
    type: "counsellor",
    address: "Sanca House, 78 De Villiers Street",
    suburb: "Johannesburg CBD",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 337 2010",
    email: "jhb@sanca.co.za",
    website: "https://www.sancajhb.co.za",
    operatingHours: "Mon–Fri 08:00–17:00",
    officials: [
      {
        name: "Director",
        title: "Director of Treatment Services",
        role: "director",
        phone: "011 337 2010",
        isPrimary: true,
      },
      {
        name: "Social Worker Supervisor",
        title: "Registered Social Worker — Supervisor",
        role: "supervisor",
        unit: "Substance Abuse Counselling",
        phone: "011 337 2010",
      },
      {
        name: "Youth Counsellor",
        title: "Youth Substance Abuse Counsellor",
        role: "frontline",
        unit: "Youth Services",
        phone: "011 337 2010",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // OPERATION BOBBI BEAR — Gauteng
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Operation Bobbi Bear — Gauteng",
    type: "ngo",
    address: "Simmonds Street",
    suburb: "Johannesburg CBD",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 836 3433",
    email: "info@operationbobbibear.org.za",
    website: "https://www.operationbobbibear.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Project Director",
        title: "Project Director",
        role: "director",
        isPrimary: true,
        phone: "011 836 3433",
      },
      {
        name: "Field Worker",
        title: "Child Protection Field Worker",
        role: "frontline",
        unit: "Child Trafficking / Abuse",
        phone: "011 836 3433",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // GIFT OF THE GIVERS — Gauteng
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Gift of the Givers — Gauteng Office",
    type: "ngo",
    address: "Inanda Greens Business Park",
    suburb: "Sandton",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 207 0900",
    email: "gauteng@giftofthegivers.org",
    website: "https://www.giftofthegivers.org",
    operatingHours: "24 hours emergency; Office: Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Gauteng Director",
        title: "Gauteng Regional Director",
        role: "director",
        phone: "011 207 0900",
        isPrimary: true,
      },
      {
        name: "Humanitarian Coordinator",
        title: "Humanitarian Response Coordinator",
        role: "supervisor",
        phone: "011 207 0900",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SURVIVORS OF TRAFFICKING SOUTH AFRICA (STATA)
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Survivors of Trafficking South Africa (STATA)",
    type: "ngo",
    address: "Johannesburg CBD",
    suburb: "Johannesburg CBD",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 334 4805",
    email: "info@stata.org.za",
    operatingHours: "Mon–Fri 08:30–16:00",
    officials: [
      {
        name: "Director",
        title: "Director",
        role: "director",
        phone: "011 334 4805",
        isPrimary: true,
      },
      {
        name: "Case Manager",
        title: "Trafficking Survivor Case Manager",
        role: "supervisor",
        unit: "Case Management",
        phone: "011 334 4805",
      },
      {
        name: "Support Officer",
        title: "Survivor Support Officer",
        role: "frontline",
        unit: "Survivor Support",
        phone: "011 334 4805",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ADVICE DESK FOR ABUSED WOMEN — Berea
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Advice Desk for Abused Women — Berea",
    type: "cso",
    address: "156 Muller Street",
    suburb: "Berea",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 642 4345",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Manager",
        title: "Programme Manager",
        role: "manager",
        isPrimary: true,
        phone: "011 642 4345",
      },
      {
        name: "Advice Officer",
        title: "Advice and Support Officer",
        role: "frontline",
        phone: "011 642 4345",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ITHEMBA LETHU — Soweto
  // ═══════════════════════════════════════════════════════════════
  {
    name: "iThemba Lethu (HIV/AIDS + GBV Support) — Soweto",
    type: "cso",
    address: "Elias Motsoaledi Street",
    suburb: "Soweto",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 989 9000",
    operatingHours: "Mon–Fri 07:30–16:30",
    officials: [
      {
        name: "Programme Director",
        title: "Programme Director",
        role: "director",
        isPrimary: true,
        phone: "011 989 9000",
      },
      {
        name: "Social Worker",
        title: "Registered Social Worker",
        role: "frontline",
        unit: "GBV Support",
        phone: "011 989 9000",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // GRIP — Gender-Based Violence Crisis Centre
  // ═══════════════════════════════════════════════════════════════
  {
    name: "GRIP Gender Resource Centre — Johannesburg",
    type: "crisis_centre",
    address: "CNR Loveday & Plein Street",
    suburb: "Johannesburg CBD",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 336 7515",
    email: "info@grip.org.za",
    operatingHours: "Mon–Fri 08:00–17:00; Crisis line 24 hrs",
    officials: [
      {
        name: "Director",
        title: "Executive Director",
        role: "director",
        isPrimary: true,
        phone: "011 336 7515",
      },
      {
        name: "GBV Counsellor Supervisor",
        title: "GBV Counselling Supervisor",
        role: "supervisor",
        unit: "GBV Counselling",
        phone: "011 336 7515",
      },
      {
        name: "Crisis Counsellor",
        title: "Crisis Counsellor",
        role: "frontline",
        unit: "Crisis Line",
        phone: "011 336 7515",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PRETORIA / TSHWANE CSOs
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Childline South Africa — Tshwane",
    type: "ngo",
    address: "301 Stanza Bopape Street",
    suburb: "Arcadia",
    municipality: "City of Tshwane",
    area: "City of Tshwane",
    province: PROVINCE,
    contactNumber: "116",
    email: "tshwane@childlinesa.org.za",
    website: "https://www.childlinesa.org.za",
    operatingHours: "24 hours, 7 days",
    officials: [
      {
        name: "Area Manager",
        title: "Tshwane Area Manager",
        role: "manager",
        isPrimary: true,
        phone: "012 430 2864",
      },
      {
        name: "Social Worker",
        title: "Registered Social Worker",
        role: "frontline",
        unit: "Child Protection",
        phone: "012 430 2864",
      },
    ],
  },
  {
    name: "FAMSA Pretoria — Families South Africa",
    type: "counsellor",
    address: "Cnr Paul Kruger & Scheiding Streets",
    suburb: "Pretoria CBD",
    municipality: "City of Tshwane",
    area: "City of Tshwane",
    province: PROVINCE,
    contactNumber: "012 323 1740",
    email: "pretoria@famsa.org.za",
    website: "https://www.famsa.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Branch Director",
        title: "Branch Director",
        role: "director",
        isPrimary: true,
        phone: "012 323 1740",
      },
      {
        name: "Counselling Supervisor",
        title: "Registered Social Worker — Supervisor",
        role: "supervisor",
        unit: "Family Counselling",
        phone: "012 323 1740",
      },
      {
        name: "Youth Counsellor",
        title: "Counsellor — Youth Services",
        role: "frontline",
        phone: "012 323 1740",
      },
    ],
  },
  {
    name: "Lifeline Tshwane",
    type: "counsellor",
    address: "479 Church Street",
    suburb: "Pretoria CBD",
    municipality: "City of Tshwane",
    area: "City of Tshwane",
    province: PROVINCE,
    contactNumber: "012 344 4884",
    email: "tshwane@lifelinesa.co.za",
    website: "https://www.lifelinesa.co.za",
    operatingHours: "24 hours helpline; Walk-in: Mon–Fri 08:00–16:00",
    officials: [
      {
        name: "Director",
        title: "Director",
        role: "director",
        isPrimary: true,
        phone: "012 344 4884",
      },
      {
        name: "Trauma Counsellor",
        title: "Registered Trauma Counsellor",
        role: "frontline",
        phone: "012 344 4884",
      },
    ],
  },
  {
    name: "Mosaic — Centre for Women and Children",
    type: "crisis_centre",
    address: "1207 Church Street",
    suburb: "Hatfield",
    municipality: "City of Tshwane",
    area: "City of Tshwane",
    province: PROVINCE,
    contactNumber: "012 993 6116",
    email: "info@mosaicsa.co.za",
    website: "https://www.mosaicsa.co.za",
    operatingHours: "Mon–Fri 08:00–16:30; 24hr shelter",
    officials: [
      {
        name: "Executive Director",
        title: "Executive Director",
        role: "director",
        isPrimary: true,
        phone: "012 993 6116",
        email: "director@mosaicsa.co.za",
      },
      {
        name: "Shelter Manager",
        title: "Shelter Manager",
        role: "manager",
        unit: "Shelter Services",
        phone: "012 993 6116",
      },
      {
        name: "Social Worker",
        title: "Registered Social Worker",
        role: "frontline",
        unit: "Client Services",
        phone: "012 993 6116",
      },
    ],
  },
  {
    name: "SANCA Tshwane",
    type: "counsellor",
    address: "322 Pretorius Street",
    suburb: "Pretoria CBD",
    municipality: "City of Tshwane",
    area: "City of Tshwane",
    province: PROVINCE,
    contactNumber: "012 325 2440",
    email: "tshwane@sanca.co.za",
    operatingHours: "Mon–Fri 08:00–17:00",
    officials: [
      {
        name: "Director",
        title: "Director of Services",
        role: "director",
        isPrimary: true,
        phone: "012 325 2440",
      },
      {
        name: "Counsellor",
        title: "Youth Substance Abuse Counsellor",
        role: "frontline",
        unit: "Youth Services",
        phone: "012 325 2440",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EKURHULENI CSOs
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Childline Ekurhuleni",
    type: "ngo",
    address: "Cnr Rose & Hay Streets, Edenvale",
    suburb: "Edenvale",
    municipality: "Ekurhuleni",
    area: "Ekurhuleni",
    province: PROVINCE,
    contactNumber: "116",
    email: "ekurhuleni@childlinesa.org.za",
    operatingHours: "24 hours, 7 days",
    officials: [
      {
        name: "Area Manager",
        title: "Ekurhuleni Area Manager",
        role: "manager",
        isPrimary: true,
        phone: "011 455 0042",
      },
      {
        name: "Child Protection Worker",
        title: "Child Protection Worker",
        role: "frontline",
        phone: "011 455 0042",
      },
    ],
  },
  {
    name: "FAMSA Ekurhuleni — Springs",
    type: "counsellor",
    address: "31 Fourth Street",
    suburb: "Springs",
    municipality: "Ekurhuleni",
    area: "Ekurhuleni",
    province: PROVINCE,
    contactNumber: "011 363 4440",
    email: "springs@famsa.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Branch Manager",
        title: "Branch Manager",
        role: "manager",
        isPrimary: true,
        phone: "011 363 4440",
      },
      {
        name: "Social Worker",
        title: "Registered Social Worker",
        role: "frontline",
        phone: "011 363 4440",
      },
    ],
  },
  {
    name: "Benoni Community Advice Office",
    type: "legal_clinic",
    address: "17 Elston Avenue",
    suburb: "Benoni",
    municipality: "Ekurhuleni",
    area: "Ekurhuleni",
    province: PROVINCE,
    contactNumber: "011 845 1000",
    operatingHours: "Mon–Fri 08:30–16:00",
    officials: [
      {
        name: "Advice Office Manager",
        title: "Community Advice Office Manager",
        role: "manager",
        isPrimary: true,
        phone: "011 845 1000",
      },
      {
        name: "Paralegal",
        title: "Paralegal Advisor",
        role: "frontline",
        phone: "011 845 1000",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // WEST RAND CSOs
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Childline West Rand — Krugersdorp",
    type: "ngo",
    address: "Cnr Smuts & Paardekraal Drive",
    suburb: "Krugersdorp",
    municipality: "Mogale City",
    area: "West Rand",
    province: PROVINCE,
    contactNumber: "116",
    email: "westrand@childlinesa.org.za",
    operatingHours: "24 hours helpline; Walk-in: Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Area Coordinator",
        title: "West Rand Area Coordinator",
        role: "manager",
        isPrimary: true,
        phone: "011 660 1340",
      },
      {
        name: "Social Worker",
        title: "Social Worker",
        role: "frontline",
        phone: "011 660 1340",
      },
    ],
  },
  {
    name: "FAMSA West Rand — Krugersdorp",
    type: "counsellor",
    address: "16 Monument Street",
    suburb: "Krugersdorp",
    municipality: "Mogale City",
    area: "West Rand",
    province: PROVINCE,
    contactNumber: "011 660 6631",
    email: "westrand@famsa.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Branch Director",
        title: "Branch Director",
        role: "director",
        isPrimary: true,
        phone: "011 660 6631",
      },
      {
        name: "Counsellor",
        title: "Registered Counsellor",
        role: "frontline",
        phone: "011 660 6631",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SEDIBENG CSOs
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Childline Sedibeng — Vereeniging",
    type: "ngo",
    address: "8 Leslie Street",
    suburb: "Vereeniging",
    municipality: "Emfuleni",
    area: "Sedibeng",
    province: PROVINCE,
    contactNumber: "116",
    email: "sedibeng@childlinesa.org.za",
    operatingHours: "24 hours helpline",
    officials: [
      {
        name: "Area Manager",
        title: "Sedibeng Area Manager",
        role: "manager",
        isPrimary: true,
        phone: "016 422 1116",
      },
      {
        name: "Social Worker",
        title: "Registered Social Worker",
        role: "frontline",
        phone: "016 422 1116",
      },
    ],
  },
  {
    name: "FAMSA Sedibeng — Vanderbijlpark",
    type: "counsellor",
    address: "12 General Hertzog Street",
    suburb: "Vanderbijlpark",
    municipality: "Emfuleni",
    area: "Sedibeng",
    province: PROVINCE,
    contactNumber: "016 933 4466",
    email: "sedibeng@famsa.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      {
        name: "Branch Director",
        title: "Branch Director",
        role: "director",
        isPrimary: true,
        phone: "016 933 4466",
      },
      {
        name: "Youth Counsellor",
        title: "Youth Counsellor",
        role: "frontline",
        phone: "016 933 4466",
      },
    ],
  },
  {
    name: "Sedibeng Community Advice Centre",
    type: "legal_clinic",
    address: "Cnr Frikkie Meyer & Kock Streets",
    suburb: "Vereeniging",
    municipality: "Emfuleni",
    area: "Sedibeng",
    province: PROVINCE,
    contactNumber: "016 454 0111",
    operatingHours: "Mon–Fri 08:00–16:00",
    officials: [
      {
        name: "Manager",
        title: "Advice Centre Manager",
        role: "manager",
        isPrimary: true,
        phone: "016 454 0111",
      },
      {
        name: "Paralegal",
        title: "Paralegal Advisor",
        role: "frontline",
        phone: "016 454 0111",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL GAUTENG CSOs — Johannesburg South, East Rand, Tshwane
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Afrika Tikkun — Alexandra Hub",
    type: "ngo",
    address: "4 5th Avenue",
    suburb: "Alexandra",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 443 1800",
    email: "info@afrikatikkun.org",
    website: "https://www.afrikatikkun.org",
    operatingHours: "Mon–Fri 08:00–17:00",
    officials: [
      { name: "Hub Director", title: "Alexandra Hub Director", role: "director", isPrimary: true },
      { name: "Child & Youth Programme Manager", title: "Child & Youth Programme Manager", role: "manager" },
      { name: "Social Worker", title: "Registered Social Worker", role: "frontline" },
      { name: "Youth Facilitator", title: "Youth Development Facilitator", role: "frontline" },
    ],
  },
  {
    name: "SANCA Tshwane — Addiction & Trauma",
    type: "counsellor",
    address: "240 Pretorius Street",
    suburb: "Pretoria Central",
    municipality: "City of Tshwane",
    area: "Tshwane",
    province: PROVINCE,
    contactNumber: "012 325 2440",
    email: "tshwane@sanca.co.za",
    website: "https://www.sanca.co.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      { name: "Centre Manager", title: "Centre Manager", role: "manager", isPrimary: true },
      { name: "Trauma Counsellor", title: "Senior Trauma Counsellor", role: "supervisor" },
      { name: "Substance Abuse Counsellor", title: "Certified Substance Abuse Counsellor", role: "frontline" },
    ],
  },
  {
    name: "Childline Ekurhuleni",
    type: "ngo",
    address: "18 Daveyton Road",
    suburb: "Benoni",
    municipality: "Ekurhuleni Metropolitan",
    area: "Ekurhuleni",
    province: PROVINCE,
    contactNumber: "116",
    email: "ekurhuleni@childlinesa.org.za",
    operatingHours: "24 hours helpline",
    officials: [
      { name: "Area Manager", title: "Ekurhuleni Area Manager", role: "manager", isPrimary: true },
      { name: "Child Protection Officer", title: "Child Protection Officer", role: "frontline" },
    ],
  },
  {
    name: "Ekurhuleni Women's Organisation (EWO)",
    type: "shelter",
    address: "5 Angus Avenue",
    suburb: "Germiston",
    municipality: "Ekurhuleni Metropolitan",
    area: "Ekurhuleni",
    province: PROVINCE,
    contactNumber: "011 873 2360",
    email: "info@ewo.org.za",
    operatingHours: "Mon–Fri 08:00–17:00; Emergency 24hrs",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", isPrimary: true },
      { name: "Shelter Manager", title: "Shelter Manager", role: "supervisor" },
      { name: "Social Worker", title: "Registered Social Worker", role: "frontline" },
    ],
  },
  {
    name: "Khulanathi Centre for Survivors — Soweto",
    type: "counsellor",
    address: "3207 Mooki Street",
    suburb: "Orlando West",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 936 4000",
    operatingHours: "Mon–Fri 08:00–17:00",
    officials: [
      { name: "Centre Coordinator", title: "Centre Coordinator", role: "manager", isPrimary: true },
      { name: "Social Auxiliary Worker", title: "Social Auxiliary Worker", role: "frontline" },
    ],
  },
  {
    name: "Lawyers for Human Rights — Johannesburg",
    type: "legal_aid",
    address: "131 Bree Street, 4th Floor",
    suburb: "Johannesburg CBD",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 339 1960",
    email: "joburg@lhr.org.za",
    website: "https://www.lhr.org.za",
    operatingHours: "Mon–Fri 08:30–16:30",
    officials: [
      { name: "Regional Director", title: "Regional Director", role: "director", isPrimary: true },
      { name: "Supervising Attorney", title: "Supervising Attorney", role: "supervisor" },
      { name: "Paralegal", title: "Paralegal Advisor", role: "frontline" },
    ],
  },
  {
    name: "Centre for the Study of Violence and Reconciliation (CSVR)",
    type: "ngo",
    address: "52 Marine Drive, Plein Park",
    suburb: "Braamfontein",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 403 5650",
    email: "info@csvr.org.za",
    website: "https://www.csvr.org.za",
    operatingHours: "Mon–Fri 08:30–17:00",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", isPrimary: true },
      { name: "Trauma Healing Programme Manager", title: "Programme Manager: Trauma Healing", role: "manager" },
      { name: "Community Psychologist", title: "Community Psychologist", role: "frontline" },
    ],
  },
  {
    name: "People Opposing Women Abuse — Tshwane",
    type: "shelter",
    address: "16 De Villebois Mareuil Drive",
    suburb: "Pretoria West",
    municipality: "City of Tshwane",
    area: "Tshwane",
    province: PROVINCE,
    contactNumber: "012 327 7420",
    email: "tshwane@powa.co.za",
    operatingHours: "Mon–Fri 08:00–17:00; Emergency 24hrs",
    officials: [
      { name: "Area Director", title: "Tshwane Area Director", role: "director", isPrimary: true },
      { name: "Legal Officer", title: "Legal Officer", role: "supervisor" },
      { name: "Social Worker", title: "Registered Social Worker", role: "frontline" },
    ],
  },
  {
    name: "Gender Links — Johannesburg Office",
    type: "ngo",
    address: "9 Derrick Avenue",
    suburb: "Cyrildene",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 622 2877",
    email: "johannesburg@genderlinks.org.za",
    website: "https://www.genderlinks.org.za",
    operatingHours: "Mon–Fri 08:30–17:00",
    officials: [
      { name: "Regional Director", title: "Regional Director", role: "director", isPrimary: true },
      { name: "GBV Programme Coordinator", title: "GBV Programme Coordinator", role: "supervisor" },
      { name: "Community Liaison Officer", title: "Community Liaison Officer", role: "frontline" },
    ],
  },
  {
    name: "Tshwaranang Women's Organisation — Soweto",
    type: "ngo",
    address: "45 Mohale Street",
    suburb: "Diepkloof",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 988 5103",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      { name: "Regional Manager", title: "Soweto Regional Manager", role: "manager", isPrimary: true },
      { name: "Community Development Worker", title: "Community Development Worker", role: "frontline" },
    ],
  },
  {
    name: "Jesuit Refugee Service — Pretoria",
    type: "legal_aid",
    address: "19 Troye Street",
    suburb: "Pretoria CBD",
    municipality: "City of Tshwane",
    area: "Tshwane",
    province: PROVINCE,
    contactNumber: "012 320 4690",
    email: "pretoria@jrs.net",
    website: "https://www.jrs.net",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      { name: "Country Director", title: "Country Director", role: "director", isPrimary: true },
      { name: "Legal Officer", title: "Refugee Legal Officer", role: "supervisor" },
      { name: "Social Worker", title: "Social Worker", role: "frontline" },
    ],
  },
  {
    name: "Youth for Christ — Johannesburg",
    type: "counsellor",
    address: "Plot 12 Olympia Road",
    suburb: "Northcliff",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 476 1111",
    email: "joburg@yfc.co.za",
    operatingHours: "Mon–Sat 08:00–18:00",
    officials: [
      { name: "Regional Director", title: "Regional Director", role: "director", isPrimary: true },
      { name: "Youth Counsellor", title: "Youth Counsellor", role: "frontline" },
    ],
  },
  {
    name: "Association of Persons with Physical Disabilities Gauteng",
    type: "ngo",
    address: "72 Bram Fischer Drive",
    suburb: "Ferndale",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 789 1202",
    email: "info@appd.org.za",
    operatingHours: "Mon–Fri 08:30–16:00",
    officials: [
      { name: "CEO", title: "Chief Executive Officer", role: "director", isPrimary: true },
      { name: "Disability Rights Advisor", title: "Disability Rights Advisor", role: "frontline" },
    ],
  },
  {
    name: "Molo Songololo — Gauteng Office",
    type: "ngo",
    address: "10 Rissik Street",
    suburb: "Marshalltown",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 838 0440",
    email: "gauteng@molosongololo.org.za",
    operatingHours: "Mon–Fri 08:00–17:00",
    officials: [
      { name: "Regional Coordinator", title: "Gauteng Regional Coordinator", role: "manager", isPrimary: true },
      { name: "Child Trafficking Officer", title: "Child Trafficking Officer", role: "frontline" },
    ],
  },
  {
    name: "FAMSA Ekurhuleni — Boksburg",
    type: "counsellor",
    address: "22 Trichardts Road",
    suburb: "Boksburg North",
    municipality: "Ekurhuleni Metropolitan",
    area: "Ekurhuleni",
    province: PROVINCE,
    contactNumber: "011 892 3948",
    email: "ekurhuleni@famsa.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      { name: "Branch Director", title: "Branch Director", role: "director", isPrimary: true },
      { name: "Family Therapist", title: "Family Therapist", role: "supervisor" },
      { name: "Counsellor", title: "Registered Counsellor", role: "frontline" },
    ],
  },
  {
    name: "Leratong Hospital Social Work Services",
    type: "social_worker",
    address: "1 Adcock Street",
    suburb: "Kagiso",
    municipality: "Mogale City",
    area: "West Rand",
    province: PROVINCE,
    contactNumber: "011 411 3500",
    operatingHours: "Mon–Fri 07:30–16:00",
    officials: [
      { name: "Head Social Worker", title: "Head: Social Work Department", role: "manager", isPrimary: true, phone: "011 411 3500" },
      { name: "Senior Social Worker", title: "Senior Social Worker: Trauma", role: "supervisor" },
      { name: "Social Worker", title: "Social Worker", role: "frontline" },
    ],
  },
  {
    name: "Wits Reproductive Health and HIV Institute (WRHI)",
    type: "srhr_practitioner",
    address: "22 Esselen Street",
    suburb: "Hillbrow",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 358 5400",
    email: "info@wrhi.ac.za",
    website: "https://www.wrhi.ac.za",
    operatingHours: "Mon–Fri 08:00–17:00",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", isPrimary: true },
      { name: "SRHR Programme Manager", title: "SRHR Programme Manager", role: "manager" },
      { name: "Clinical Nurse Practitioner", title: "Clinical Nurse Practitioner", role: "frontline" },
    ],
  },
  {
    name: "Petra Child & Family Care",
    type: "ngo",
    address: "7 Jansen Street",
    suburb: "Randburg",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 787 2855",
    email: "info@petra.org.za",
    operatingHours: "Mon–Fri 08:00–17:00",
    officials: [
      { name: "Director", title: "Director", role: "director", isPrimary: true },
      { name: "Therapeutic Services Manager", title: "Therapeutic Services Manager", role: "manager" },
      { name: "Child & Family Therapist", title: "Child & Family Therapist", role: "frontline" },
    ],
  },
  {
    name: "NICRO Pretoria — National Institute for Crime Prevention",
    type: "ngo",
    address: "214 Steve Biko Street",
    suburb: "Arcadia",
    municipality: "City of Tshwane",
    area: "Tshwane",
    province: PROVINCE,
    contactNumber: "012 325 5710",
    email: "pretoria@nicro.org.za",
    website: "https://www.nicro.org.za",
    operatingHours: "Mon–Fri 08:30–16:30",
    officials: [
      { name: "Branch Manager", title: "Pretoria Branch Manager", role: "manager", isPrimary: true },
      { name: "Diversion Officer", title: "Diversion Programme Officer", role: "supervisor" },
      { name: "Victim Support Counsellor", title: "Victim Support Counsellor", role: "frontline" },
    ],
  },
  {
    name: "Johannesburg Child Welfare Society",
    type: "ngo",
    address: "50 Wanderers Street",
    suburb: "Illovo",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: PROVINCE,
    contactNumber: "011 484 1734",
    email: "info@jcw.org.za",
    operatingHours: "Mon–Fri 08:00–17:00",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", isPrimary: true },
      { name: "Child Protection Manager", title: "Child Protection Programme Manager", role: "manager" },
      { name: "Social Worker", title: "Registered Social Worker", role: "frontline" },
      { name: "Place of Safety Manager", title: "Place of Safety Manager", role: "supervisor" },
    ],
  },
];

export async function seedCSOs() {
  // Check if already seeded — look for providers with type 'ngo' or 'cso' with area set
  const existing = await db
    .select({ id: providersTable.id })
    .from(providersTable)
    .where(and(eq(providersTable.province, "Gauteng"), isNotNull(providersTable.area)))
    .limit(1);

  if (existing.length > 0) {
    // Only skip if CSOs specifically are already there
    const csosExist = await db
      .select({ id: providersTable.id })
      .from(providersTable)
      .where(and(eq(providersTable.province, "Gauteng"), eq(providersTable.type, "ngo")))
      .limit(1);

    const [{ csoCount }] = await db
      .select({ csoCount: count(providersTable.id) })
      .from(providersTable)
      .where(and(eq(providersTable.province, "Gauteng"), eq(providersTable.type, "ngo")));

    if (Number(csoCount) >= CSO_PROVIDERS.length) {
      console.log("⏭️  CSO providers already seeded — skipping");
      return;
    }
  }

  console.log(`🌱 Seeding ${CSO_PROVIDERS.length} civil society organisations...`);

  let providerCount = 0;
  let officialCount = 0;

  for (const p of CSO_PROVIDERS) {
    const [inserted] = await db
      .insert(providersTable)
      .values({
        name: p.name,
        type: p.type,
        address: p.address,
        suburb: p.suburb,
        municipality: p.municipality,
        area: p.area,
        province: p.province,
        contactNumber: p.contactNumber,
        email: p.email,
        website: p.website,
        operatingHours: p.operatingHours,
      })
      .returning({ id: providersTable.id });

    providerCount++;

    if (p.officials) {
      for (const o of p.officials) {
        await db.insert(officialsTable).values({
          providerId: inserted.id,
          name: o.name,
          title: o.title,
          role: o.role,
          unit: o.unit,
          phone: o.phone,
          email: o.email,
          isPrimary: o.isPrimary ?? false,
          badgeNumber: o.badgeNumber,
        });
        officialCount++;
      }
    }
  }

  console.log(`✅ CSO seed complete: ${providerCount} organisations, ${officialCount} officials`);
}
