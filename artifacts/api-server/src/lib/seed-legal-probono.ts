/**
 * Pro-Bono & Legal Aid Service Providers Seed
 * Real South African organisations offering free/subsidised legal services
 * for children, youth and families — human rights, criminal & civil matters
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */
import { db, providersTable, officialsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

type OfficialSeed = {
  name: string;
  title: string;
  role: "frontline" | "supervisor" | "manager" | "director";
  unit?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
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

const LEGAL_PROVIDERS: ProviderSeed[] = [

  // ════════════════════════════════════════════════════════════════
  // LEGAL AID SOUTH AFRICA — Gauteng Offices
  // ════════════════════════════════════════════════════════════════
  {
    name: "Legal Aid South Africa — Johannesburg Justice Centre",
    type: "legal_aid",
    address: "Cnr Pritchard & Harrison Streets, Johannesburg Magistrates Court, Ground Floor",
    suburb: "Johannesburg CBD",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 870 3600",
    email: "johannesburg@legal-aid.org.za",
    website: "https://www.legal-aid.org.za",
    operatingHours: "Mon–Fri 07:45–16:00",
    officials: [
      { name: "Centre Manager", title: "Justice Centre Manager", role: "manager", unit: "Management", phone: "011 870 3600", isPrimary: true },
      { name: "Child Justice Practitioner", title: "Children's Court Representative", role: "frontline", unit: "Child Justice", phone: "011 870 3600", email: "child.jhb@legal-aid.org.za" },
      { name: "Criminal Law Practitioner", title: "Legal Aid Practitioner – Criminal", role: "frontline", unit: "Criminal Law" },
      { name: "Family Law Practitioner", title: "Legal Aid Practitioner – Family", role: "frontline", unit: "Family Law" },
    ],
  },
  {
    name: "Legal Aid South Africa — Pretoria Justice Centre",
    type: "legal_aid",
    address: "240 Pretorius Street, Justice Building, Ground Floor",
    suburb: "Pretoria CBD",
    municipality: "City of Tshwane",
    area: "City of Tshwane",
    province: "Gauteng",
    contactNumber: "012 357 1200",
    email: "pretoria@legal-aid.org.za",
    website: "https://www.legal-aid.org.za",
    operatingHours: "Mon–Fri 07:45–16:00",
    officials: [
      { name: "Centre Manager", title: "Justice Centre Manager", role: "manager", isPrimary: true, phone: "012 357 1200" },
      { name: "Children's Court Practitioner", title: "Legal Aid Practitioner – Children's Court", role: "frontline", unit: "Child Justice" },
      { name: "Domestic Violence Practitioner", title: "Legal Aid Practitioner – Domestic Violence", role: "frontline", unit: "Civil Law" },
    ],
  },
  {
    name: "Legal Aid South Africa — Soweto Justice Centre",
    type: "legal_aid",
    address: "Ipelegeng Community Centre, Cnr Mooki & Khumalo Streets",
    suburb: "Soweto",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg South",
    province: "Gauteng",
    contactNumber: "011 933 1414",
    email: "soweto@legal-aid.org.za",
    website: "https://www.legal-aid.org.za",
    operatingHours: "Mon–Fri 07:45–16:00",
    officials: [
      { name: "Centre Manager", title: "Justice Centre Manager", role: "manager", isPrimary: true },
      { name: "Legal Aid Practitioner", title: "Legal Aid Practitioner", role: "frontline" },
    ],
  },
  {
    name: "Legal Aid South Africa — Ekurhuleni Justice Centre",
    type: "legal_aid",
    address: "75 Commissioner Street, Germiston Magistrates Court",
    suburb: "Germiston",
    municipality: "Ekurhuleni",
    area: "Ekurhuleni",
    province: "Gauteng",
    contactNumber: "011 827 1114",
    email: "ekurhuleni@legal-aid.org.za",
    website: "https://www.legal-aid.org.za",
    operatingHours: "Mon–Fri 07:45–16:00",
    officials: [
      { name: "Centre Manager", title: "Justice Centre Manager", role: "manager", isPrimary: true, phone: "011 827 1114" },
      { name: "Legal Aid Practitioner", title: "Legal Aid Practitioner – Criminal", role: "frontline" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // CENTRE FOR CHILD LAW — University of Pretoria
  // ════════════════════════════════════════════════════════════════
  {
    name: "Centre for Child Law — University of Pretoria",
    type: "legal_clinic",
    address: "Faculty of Law, University of Pretoria, Lynnwood Road",
    suburb: "Hatfield",
    municipality: "City of Tshwane",
    area: "City of Tshwane",
    province: "Gauteng",
    contactNumber: "012 420 4502",
    email: "ccl@up.ac.za",
    website: "https://www.up.ac.za/centre-for-child-law",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      { name: "Prof Annette Lansink", title: "Director", role: "director", email: "ccl@up.ac.za", isPrimary: true, phone: "012 420 4502" },
      { name: "Legal Researcher / Practitioner", title: "Children's Rights Advocate", role: "frontline", unit: "Litigation" },
      { name: "Child Justice Programme Manager", title: "Child Justice Specialist", role: "manager", unit: "Child Justice" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // LAWYERS FOR HUMAN RIGHTS (LHR)
  // ════════════════════════════════════════════════════════════════
  {
    name: "Lawyers for Human Rights — Johannesburg Office",
    type: "pro_bono_legal",
    address: "5 Harries Road, Illovo",
    suburb: "Illovo",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 339 1960",
    email: "info@lhr.org.za",
    website: "https://www.lhr.org.za",
    operatingHours: "Mon–Fri 08:30–17:00",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", email: "info@lhr.org.za", isPrimary: true, phone: "011 339 1960" },
      { name: "Children's Rights Programme Attorney", title: "Attorney – Children & Youth", role: "frontline", unit: "Children's Rights" },
      { name: "Refugee & Asylum Programme Attorney", title: "Attorney – Refugee Law", role: "frontline", unit: "Refugee Programme" },
      { name: "Strategic Litigation Manager", title: "Strategic Litigation Lead", role: "manager", unit: "Litigation" },
    ],
  },
  {
    name: "Lawyers for Human Rights — Pretoria Office",
    type: "pro_bono_legal",
    address: "357 Visagie Street",
    suburb: "Pretoria CBD",
    municipality: "City of Tshwane",
    area: "City of Tshwane",
    province: "Gauteng",
    contactNumber: "012 320 2943",
    email: "pretoria@lhr.org.za",
    website: "https://www.lhr.org.za",
    operatingHours: "Mon–Fri 08:30–17:00",
    officials: [
      { name: "Regional Manager", title: "Regional Manager – Pretoria", role: "manager", isPrimary: true, phone: "012 320 2943" },
      { name: "Statelessness Programme Attorney", title: "Attorney – Statelessness & Children", role: "frontline", unit: "Statelessness" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // SECTION27
  // ════════════════════════════════════════════════════════════════
  {
    name: "SECTION27 — Public Interest Law Centre",
    type: "pro_bono_legal",
    address: "Randall Street, Braamfontein, 2nd Floor, Avalon Building",
    suburb: "Braamfontein",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 356 4100",
    email: "info@section27.org.za",
    website: "https://www.section27.org.za",
    operatingHours: "Mon–Fri 08:30–17:00",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", email: "info@section27.org.za", isPrimary: true, phone: "011 356 4100" },
      { name: "Health & Education Rights Attorney", title: "Senior Attorney – Children's Education Rights", role: "frontline", unit: "Education Programme" },
      { name: "Strategic Litigation Attorney", title: "Attorney – Strategic Litigation", role: "frontline", unit: "Litigation" },
      { name: "Communications Director", title: "Communications and Advocacy Director", role: "manager", unit: "Advocacy" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // SOCIO-ECONOMIC RIGHTS INSTITUTE (SERI)
  // ════════════════════════════════════════════════════════════════
  {
    name: "Socio-Economic Rights Institute of South Africa (SERI)",
    type: "pro_bono_legal",
    address: "Cnr Smit & Hoofd Streets, Braamfontein, 1st Floor",
    suburb: "Braamfontein",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 356 5860",
    email: "admin@seri-sa.org",
    website: "https://www.seri-sa.org",
    operatingHours: "Mon–Fri 08:30–17:00",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", email: "admin@seri-sa.org", isPrimary: true, phone: "011 356 5860" },
      { name: "Housing Rights Attorney", title: "Attorney – Housing & Eviction", role: "frontline", unit: "Housing Programme" },
      { name: "Women & Children's Rights Attorney", title: "Attorney – Gender & Child Rights", role: "frontline", unit: "Gender Programme" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // CENTRE FOR APPLIED LEGAL STUDIES (CALS) — Wits University
  // ════════════════════════════════════════════════════════════════
  {
    name: "Centre for Applied Legal Studies (CALS) — Wits University",
    type: "legal_clinic",
    address: "Wits University, East Campus, School of Law Building, Jorissen Street",
    suburb: "Braamfontein",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 717 8600",
    email: "cals@wits.ac.za",
    website: "https://www.wits.ac.za/cals",
    operatingHours: "Mon–Fri 08:30–16:30",
    officials: [
      { name: "Director", title: "Director, CALS", role: "director", email: "cals@wits.ac.za", isPrimary: true, phone: "011 717 8600" },
      { name: "Gender Programme Researcher", title: "Gender & LGBTQIA+ Rights Researcher", role: "frontline", unit: "Gender Programme" },
      { name: "Children's Rights Researcher", title: "Children & Youth Rights Researcher", role: "frontline", unit: "Child Rights" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // WITS LAW CLINIC
  // ════════════════════════════════════════════════════════════════
  {
    name: "Wits Law Clinic",
    type: "legal_clinic",
    address: "Wits University, East Campus, Old Law Building, Room 101",
    suburb: "Braamfontein",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 717 8490",
    email: "lawclinic@wits.ac.za",
    website: "https://www.wits.ac.za/law/law-clinic",
    operatingHours: "Mon–Fri 08:30–16:00",
    officials: [
      { name: "Clinic Director", title: "Law Clinic Director", role: "director", email: "lawclinic@wits.ac.za", isPrimary: true, phone: "011 717 8490" },
      { name: "Criminal Law Supervising Attorney", title: "Supervising Attorney – Criminal", role: "supervisor", unit: "Criminal Law" },
      { name: "Family Law Supervising Attorney", title: "Supervising Attorney – Family & Children", role: "supervisor", unit: "Family Law" },
      { name: "Clinical Law Student", title: "Candidate Attorney / Law Student", role: "frontline", unit: "General" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // UNIVERSITY OF PRETORIA LAW CLINIC
  // ════════════════════════════════════════════════════════════════
  {
    name: "University of Pretoria Law Clinic",
    type: "legal_clinic",
    address: "Faculty of Law, University of Pretoria, Lynnwood Road",
    suburb: "Hatfield",
    municipality: "City of Tshwane",
    area: "City of Tshwane",
    province: "Gauteng",
    contactNumber: "012 420 4556",
    email: "lawclinic@up.ac.za",
    website: "https://www.up.ac.za/law-clinic",
    operatingHours: "Mon–Fri 08:00–16:00",
    officials: [
      { name: "Clinic Director", title: "Law Clinic Director", role: "director", email: "lawclinic@up.ac.za", isPrimary: true, phone: "012 420 4556" },
      { name: "Children's Court Practitioner", title: "Supervising Attorney – Children's Court", role: "supervisor", unit: "Children's Court" },
      { name: "Family Law Practitioner", title: "Supervising Attorney – Family Law", role: "supervisor", unit: "Family Law" },
      { name: "Candidate Attorney", title: "Candidate Attorney", role: "frontline", unit: "General" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // UNIVERSITY OF JOHANNESBURG LAW CLINIC
  // ════════════════════════════════════════════════════════════════
  {
    name: "University of Johannesburg Law Clinic (Auckland Park)",
    type: "legal_clinic",
    address: "Auckland Park Kingsway Campus, UJ Law Faculty, University Road",
    suburb: "Auckland Park",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 559 3744",
    email: "lawclinic@uj.ac.za",
    website: "https://www.uj.ac.za/faculties/law/law-clinic",
    operatingHours: "Mon–Fri 08:00–16:00",
    officials: [
      { name: "Clinic Director", title: "Law Clinic Director", role: "director", email: "lawclinic@uj.ac.za", isPrimary: true, phone: "011 559 3744" },
      { name: "Supervising Attorney — Criminal", title: "Supervising Attorney – Criminal Law", role: "supervisor", unit: "Criminal Law" },
      { name: "Supervising Attorney — Children", title: "Supervising Attorney – Children & Family", role: "supervisor", unit: "Children & Family Law" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // EQUAL EDUCATION LAW CENTRE
  // ════════════════════════════════════════════════════════════════
  {
    name: "Equal Education Law Centre",
    type: "pro_bono_legal",
    address: "3rd Floor, Owl House, 272 Main Road, Observatory, Cape Town (national litigation)",
    suburb: "National (Johannesburg consultations available)",
    municipality: "City of Johannesburg",
    area: "National",
    province: "Gauteng",
    contactNumber: "021 447 1647",
    email: "info@eelawcentre.org.za",
    website: "https://www.eelawcentre.org.za",
    operatingHours: "Mon–Fri 09:00–17:00",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", email: "info@eelawcentre.org.za", isPrimary: true, phone: "021 447 1647" },
      { name: "Education Rights Attorney", title: "Attorney – School Violence & Education Rights", role: "frontline", unit: "Education Litigation" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // WOMEN'S LEGAL CENTRE (WLC)
  // ════════════════════════════════════════════════════════════════
  {
    name: "Women's Legal Centre — National Office",
    type: "pro_bono_legal",
    address: "4th Floor, Greenmarket Place, 54 Shortmarket Street, Cape Town (national intake)",
    suburb: "National (Gauteng referrals)",
    municipality: "City of Johannesburg",
    area: "National",
    province: "Gauteng",
    contactNumber: "021 424 5660",
    email: "info@wlce.co.za",
    website: "https://www.wlce.co.za",
    operatingHours: "Mon–Fri 08:30–16:30",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", email: "info@wlce.co.za", isPrimary: true, phone: "021 424 5660" },
      { name: "Gender-Based Violence Attorney", title: "Attorney – GBV & SRGBV Cases", role: "frontline", unit: "GBV Litigation" },
      { name: "Family Law Attorney", title: "Attorney – Women, Children & Families", role: "frontline", unit: "Family Law" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // GENDER DynamiX — LGBTQIA+ Rights
  // ════════════════════════════════════════════════════════════════
  {
    name: "Gender DynamiX — Transgender & Gender-Diverse Rights",
    type: "pro_bono_legal",
    address: "Suite 19, The Armoury, 40 Mint Road, Paarden Eiland, Cape Town (national legal support)",
    suburb: "National (Gauteng outreach)",
    municipality: "City of Johannesburg",
    area: "National",
    province: "Gauteng",
    contactNumber: "021 510 0790",
    email: "info@genderdynamix.org.za",
    website: "https://www.genderdynamix.org.za",
    operatingHours: "Mon–Fri 09:00–17:00",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", email: "info@genderdynamix.org.za", isPrimary: true, phone: "021 510 0790" },
      { name: "Legal Officer", title: "Legal Officer – Trans & Non-Binary Rights", role: "frontline", unit: "Legal Programme" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // SONKE GENDER JUSTICE
  // ════════════════════════════════════════════════════════════════
  {
    name: "Sonke Gender Justice — Johannesburg Office",
    type: "ngo",
    address: "122 Longmarket Street, Johannesburg",
    suburb: "Johannesburg CBD",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 339 3589",
    email: "info@genderjustice.org.za",
    website: "https://www.genderjustice.org.za",
    operatingHours: "Mon–Fri 08:30–17:00",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", email: "info@genderjustice.org.za", isPrimary: true, phone: "011 339 3589" },
      { name: "Advocacy Programme Manager", title: "GBV Advocacy & Legal Programme Manager", role: "manager", unit: "Advocacy" },
      { name: "Community Engagement Officer", title: "Community Legal Education Officer", role: "frontline", unit: "Community" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // CORRUPTION WATCH — Accountability & Integrity
  // ════════════════════════════════════════════════════════════════
  {
    name: "Corruption Watch",
    type: "ngo",
    address: "87 De Korte Street, Braamfontein",
    suburb: "Braamfontein",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 242 3900",
    email: "info@corruptionwatch.org.za",
    website: "https://www.corruptionwatch.org.za",
    operatingHours: "Mon–Fri 08:30–17:00",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", email: "info@corruptionwatch.org.za", isPrimary: true, phone: "011 242 3900" },
      { name: "Tip-off Hotline Manager", title: "Intake & Investigations Manager", role: "manager", unit: "Investigations" },
      { name: "Child & Education Corruption Officer", title: "Education Sector Corruption Specialist", role: "frontline", unit: "Education Integrity" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // SOUTH AFRICAN HUMAN RIGHTS COMMISSION (SAHRC) — Gauteng
  // ════════════════════════════════════════════════════════════════
  {
    name: "SA Human Rights Commission — Gauteng Provincial Office",
    type: "pro_bono_legal",
    address: "The Harlequins Office Park, 339 Witch-Hazel Avenue, Highveld Techno Park",
    suburb: "Centurion",
    municipality: "City of Tshwane",
    area: "City of Tshwane",
    province: "Gauteng",
    contactNumber: "012 663 2779",
    email: "gaunortheast@sahrc.org.za",
    website: "https://www.sahrc.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      { name: "Provincial Manager", title: "Provincial Manager – Gauteng", role: "manager", email: "gaunortheast@sahrc.org.za", isPrimary: true, phone: "012 663 2779" },
      { name: "Human Rights Officer – Children", title: "Senior Human Rights Officer – Child Rights", role: "frontline", unit: "Child Rights" },
      { name: "Human Rights Officer – GBV", title: "Human Rights Officer – GBV & Sexual Offences", role: "frontline", unit: "GBV" },
    ],
  },
  {
    name: "SA Human Rights Commission — Johannesburg Office",
    type: "pro_bono_legal",
    address: "29 Princess of Wales Terrace, Parktown",
    suburb: "Parktown",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 877 3600",
    email: "gausouth@sahrc.org.za",
    website: "https://www.sahrc.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      { name: "Provincial Representative", title: "Human Rights Officer – Johannesburg", role: "frontline", email: "gausouth@sahrc.org.za", isPrimary: true, phone: "011 877 3600" },
      { name: "Complaints Intake Officer", title: "Complaints Registration Officer", role: "frontline", unit: "Complaints" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // PEOPLE OPPOSING WOMEN ABUSE (POWA)
  // ════════════════════════════════════════════════════════════════
  {
    name: "People Opposing Women Abuse (POWA)",
    type: "ngo",
    address: "214 Bree Street, Johannesburg",
    suburb: "Johannesburg CBD",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 642 4345",
    email: "powa@powa.co.za",
    website: "https://www.powa.co.za",
    operatingHours: "Mon–Fri 08:00–16:00 (24hr crisis line: 011 642 4345)",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", email: "powa@powa.co.za", isPrimary: true, phone: "011 642 4345" },
      { name: "Legal Services Manager", title: "Legal Advice Manager – GBV", role: "manager", unit: "Legal Services" },
      { name: "Paralegal / Social Worker", title: "Paralegal – Domestic Violence & Child Abuse", role: "frontline", unit: "Legal Services" },
      { name: "Crisis Counsellor", title: "Crisis Counsellor & Court Support", role: "frontline", unit: "Counselling" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // FAMSA (Families South Africa) — Gauteng
  // ════════════════════════════════════════════════════════════════
  {
    name: "Families South Africa (FAMSA) — Johannesburg",
    type: "ngo",
    address: "8 Brunswick Road, Wynberg",
    suburb: "Wynberg",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 788 4784",
    email: "famsajhb@famsa.org.za",
    website: "https://www.famsa.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      { name: "Executive Director", title: "Executive Director – Johannesburg", role: "director", email: "famsajhb@famsa.org.za", isPrimary: true, phone: "011 788 4784" },
      { name: "Family Law Social Worker", title: "Social Worker – Family Law & Child Protection", role: "frontline", unit: "Family Services" },
      { name: "Trauma Counsellor", title: "Trauma Counsellor – SRGBV", role: "frontline", unit: "Counselling" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // AFRICA CRIMINAL JUSTICE REFORM (ACJR)
  // ════════════════════════════════════════════════════════════════
  {
    name: "Africa Criminal Justice Reform (ACJR) — UWC / National",
    type: "legal_clinic",
    address: "Community Law Centre, UWC (national advocacy and amicus briefs)",
    suburb: "National (Gauteng cases)",
    municipality: "City of Johannesburg",
    area: "National",
    province: "Gauteng",
    contactNumber: "021 959 2950",
    email: "acjr@uwc.ac.za",
    website: "https://www.acjr.org.za",
    operatingHours: "Mon–Fri 08:30–16:30",
    officials: [
      { name: "Director", title: "Director – ACJR", role: "director", email: "acjr@uwc.ac.za", isPrimary: true, phone: "021 959 2950" },
      { name: "Child Justice Researcher", title: "Researcher – Child Justice & Sentencing", role: "frontline", unit: "Child Justice" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // PUBLIC PROTECTOR SOUTH AFRICA — Gauteng
  // ════════════════════════════════════════════════════════════════
  {
    name: "Public Protector South Africa — Gauteng Office",
    type: "pro_bono_legal",
    address: "175 Lunnon Street, Hillcrest, Pretoria",
    suburb: "Hillcrest",
    municipality: "City of Tshwane",
    area: "City of Tshwane",
    province: "Gauteng",
    contactNumber: "0800 11 20 40",
    email: "complaints@ppsa.org.za",
    website: "https://www.pprotect.org",
    operatingHours: "Mon–Fri 08:00–16:30 | Hotline: 0800 11 20 40 (free)",
    officials: [
      { name: "Provincial Representative", title: "Provincial Representative – Gauteng", role: "manager", email: "complaints@ppsa.org.za", isPrimary: true, phone: "0800 11 20 40" },
      { name: "Complaints Officer", title: "Complaints Registration Officer", role: "frontline", unit: "Complaints" },
      { name: "Investigator – Child Cases", title: "Senior Investigator – Child-Related Complaints", role: "frontline", unit: "Investigations" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // COMMISSIONER FOR CHILDREN — Commission for Gender Equality
  // ════════════════════════════════════════════════════════════════
  {
    name: "Commission for Gender Equality (CGE) — Johannesburg",
    type: "pro_bono_legal",
    address: "2 Kotze Street, Braamfontein",
    suburb: "Braamfontein",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 403 7182",
    email: "cge@cge.org.za",
    website: "https://www.cge.org.za",
    operatingHours: "Mon–Fri 08:00–16:30",
    officials: [
      { name: "Chief Executive Officer", title: "CEO – Commission for Gender Equality", role: "director", email: "cge@cge.org.za", isPrimary: true, phone: "011 403 7182" },
      { name: "Legal Officer – GBV", title: "Legal Officer – Gender-Based Violence", role: "frontline", unit: "Legal" },
      { name: "Community Education Officer", title: "Community Education – Child Rights", role: "frontline", unit: "Education" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // BLACK SASH
  // ════════════════════════════════════════════════════════════════
  {
    name: "Black Sash — National Advice Office (Johannesburg)",
    type: "ngo",
    address: "Rivonia Road, Johannesburg (advice by appointment)",
    suburb: "Sandton",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "072 663 3739",
    email: "national@blacksash.org.za",
    website: "https://www.blacksash.org.za",
    operatingHours: "Mon–Fri 09:00–13:00 (Helpline: 072 663 3739)",
    officials: [
      { name: "National Director", title: "National Director", role: "director", email: "national@blacksash.org.za", isPrimary: true, phone: "072 663 3739" },
      { name: "Paralegal Advice Office Manager", title: "Paralegal – Social Grants & Child Rights", role: "frontline", unit: "Advice Office" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // RAPCAN — Prevention of Child Abuse
  // ════════════════════════════════════════════════════════════════
  {
    name: "RAPCAN — Resources Aimed at the Prevention of Child Abuse",
    type: "ngo",
    address: "National — Cape Town HQ (referrals to Gauteng partners)",
    suburb: "National (Gauteng referrals)",
    municipality: "City of Johannesburg",
    area: "National",
    province: "Gauteng",
    contactNumber: "021 762 2330",
    email: "info@rapcan.org.za",
    website: "https://www.rapcan.org.za",
    operatingHours: "Mon–Fri 08:30–16:30",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", email: "info@rapcan.org.za", isPrimary: true, phone: "021 762 2330" },
      { name: "Child Advocacy Officer", title: "Child Rights Advocacy Officer", role: "frontline", unit: "Advocacy" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // CENTRE FOR THE STUDY OF VIOLENCE AND RECONCILIATION (CSVR)
  // ════════════════════════════════════════════════════════════════
  {
    name: "Centre for the Study of Violence and Reconciliation (CSVR)",
    type: "ngo",
    address: "4th Floor, Braampark Forum 3, 33 Hoofd Street, Braamfontein",
    suburb: "Braamfontein",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 403 5650",
    email: "info@csvr.org.za",
    website: "https://www.csvr.org.za",
    operatingHours: "Mon–Fri 08:30–17:00",
    officials: [
      { name: "Executive Director", title: "Executive Director", role: "director", email: "info@csvr.org.za", isPrimary: true, phone: "011 403 5650" },
      { name: "Gender Violence Programme Manager", title: "GBV & Children Programme Manager", role: "manager", unit: "GBV Programme" },
      { name: "Psychosocial Support Practitioner", title: "Trauma Counsellor – Children & Youth", role: "frontline", unit: "Psychosocial" },
      { name: "Justice Reform Researcher", title: "Researcher – Child Justice & GBV", role: "frontline", unit: "Research" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ARTS FOR HUMANITY — Paralegal Education
  // ════════════════════════════════════════════════════════════════
  {
    name: "Community Advice Offices SA (CAOSA) — Gauteng Hub",
    type: "pro_bono_legal",
    address: "26 Rhodes Avenue, Kensington",
    suburb: "Kensington",
    municipality: "City of Johannesburg",
    area: "City of Johannesburg",
    province: "Gauteng",
    contactNumber: "011 614 2990",
    email: "info@caosa.co.za",
    website: "https://www.caosa.co.za",
    operatingHours: "Mon–Fri 08:00–16:00",
    officials: [
      { name: "Gauteng Coordinator", title: "Gauteng Hub Coordinator", role: "manager", email: "info@caosa.co.za", isPrimary: true, phone: "011 614 2990" },
      { name: "Paralegal Advice Officer", title: "Paralegal – Family, Child & Criminal Matters", role: "frontline", unit: "Advice" },
    ],
  },
];

export async function seedLegalProBono() {
  const existing = await db
    .select({ count: count() })
    .from(providersTable)
    .where(eq(providersTable.type, "pro_bono_legal"));

  if (Number(existing[0]?.count ?? 0) >= 5) {
    console.log("⏭️  Pro-bono legal providers already seeded — skipping");
    return;
  }

  console.log("⚖️  Seeding pro-bono and legal aid service providers...");

  for (const p of LEGAL_PROVIDERS) {
    const { officials, ...provData } = p;

    const [inserted] = await db
      .insert(providersTable)
      .values(provData)
      .returning({ id: providersTable.id });

    if (officials && inserted) {
      await db.insert(officialsTable).values(
        officials.map(o => ({
          providerId: inserted.id,
          name: o.name,
          title: o.title,
          role: o.role,
          unit: o.unit ?? null,
          phone: o.phone ?? null,
          email: o.email ?? null,
          isPrimary: o.isPrimary ?? false,
          isOnDuty: false,
        }))
      );
    }
  }

  console.log(`✅ Seeded ${LEGAL_PROVIDERS.length} pro-bono/legal aid providers with officials`);
}
