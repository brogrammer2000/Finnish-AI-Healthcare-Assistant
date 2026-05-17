import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Language = "en" | "fi" | "sv";

type TranslationDict = Record<string, string>;

interface TranslationContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(
  undefined,
);

const translations: Record<Language, TranslationDict> = {
  en: {
    // Common
    "common.loading": "Loading...",
    "common.logout": "Logout",
    "common.error": "Something went wrong",
    "lang.label": "Language",
    "lang.english": "English",
    "lang.finnish": "Finnish",
    "lang.swedish": "Swedish",
    "auth.error.generic": "Authentication failed",

    // Login
    "login.appName": "SisuCare",
    "login.subtitle.login": "Welcome back! Sign in to continue",
    "login.subtitle.register": "Create your account to get started",
    "login.fullName.label": "Full Name",
    "login.fullName.placeholder": "Enter your full name",
    "login.email.label": "Email Address",
    "login.email.placeholder": "you@example.com",
    "login.password.label": "Password",
    "login.password.hint": "Minimum 6 characters",
    "login.button.processing": "Processing...",
    "login.button.signIn": "Sign In",
    "login.button.createAccount": "Create Account",
    "login.toggle.toRegister.prefix": "Don't have an account?",
    "login.toggle.toRegister.link": "Create one",
    "login.toggle.toLogin.prefix": "Already have an account?",
    "login.toggle.toLogin.link": "Sign in",
    "login.demo.heading": "Quick Test Access",
    "login.demo.patient": "Patient",
    "login.demo.admin": "Admin",

    // Home
    "home.subtitle": "Finnish Health Assistant",
    "home.systemOnline": "System Online & Ready",
    "home.hero.title": "Welcome back, {name}!",
    "home.hero.description":
      "Your intelligent healthcare companion powered by AI. Get instant medical advice and manage your appointments seamlessly.",
    "home.stats.activeUsers": "Active Users",
    "home.stats.appointments": "Appointments",
    "home.stats.successRate": "Success Rate",
    "home.stats.responseTime": "Avg. Response",
    "home.feature.triage.title": "AI Health Triage",
    "home.feature.triage.description":
      "Get instant symptom assessment and care recommendations",
    "home.feature.triage.badge": "24/7 Available",
    "home.feature.appointments.title": "Book Appointments",
    "home.feature.appointments.description":
      "Schedule visits with available healthcare providers",
    "home.feature.appointments.badge": "Real-time Slots",
    "home.feature.admin.title": "Admin Dashboard",
    "home.feature.admin.description":
      "Comprehensive appointment and patient management",
    "home.feature.admin.badge": "Admin Only",
    "home.feature.cta": "Get Started",
    "home.banner.title": "🇫🇮 Built for Finland's Healthcare System",
    "home.banner.body":
      "This platform addresses real challenges in Finnish healthcare: reducing wait times, improving patient routing, and supporting multilingual care. Designed with GDPR compliance and integration-ready for national health systems.",

    // Chat
    "chat.title": "AI Health Assistant",
    "chat.subtitle": "Powered by GPT-4",
    "chat.clear": "Clear",
    "chat.loadingHistory": "Loading your conversation...",
    "chat.empty.title": "Hello! I'm your AI health assistant 👋",
    "chat.empty.description":
      "Describe your symptoms and I'll provide personalized health guidance and care recommendations.",
    "chat.empty.tryAsking": "Try asking:",
    "chat.prompt.1": "I have a headache and fever",
    "chat.prompt.2": "I've been coughing for 3 days",
    "chat.prompt.3": "I need a general checkup",
    "chat.prompt.4": "My back hurts when I sit",
    "chat.input.placeholder": "Describe your symptoms...",
    "chat.emergencyNotice":
      "For emergencies, always call 112 immediately",

    // Appointments
    "appointments.loading": "Loading appointments...",
    "appointments.header.title": "My Appointments",
    "appointments.header.subtitle": "Manage your healthcare visits",
    "appointments.view.list": "My Appointments",
    "appointments.view.book": "Book New",
    "appointments.empty.title": "No appointments yet",
    "appointments.empty.description":
      "Get started by booking your first appointment",
    "appointments.empty.cta": "Book Your First Appointment",
    "appointments.book.title": "Book an Appointment",
    "appointments.book.subtitle":
      "Select your preferred doctor, date, and time slot",
    "appointments.book.providerLabel": "Select Healthcare Provider",
    "appointments.book.dateLabel": "Select Date",
    "appointments.book.loadingSlots": "Loading available times...",
    "appointments.book.availableSlotsLabel":
      "Available Time Slots ({count} available)",
    "appointments.book.noSlots.title":
      "No available slots for this date",
    "appointments.book.noSlots.description":
      "Please try another date",
    "appointments.book.serviceTypeLabel": "Service Type",
    "appointments.book.serviceTypePlaceholder":
      "Choose service type...",
    "appointments.book.button.booking": "Booking...",
    "appointments.book.button.confirm": "Confirm Appointment",
    "appointments.book.validation.missingFields":
      "Please fill all fields",
    "appointments.book.error.generic":
      "Failed to book appointment",
    "appointments.cancel.confirm": "Cancel this appointment?",
    "appointments.cancel.error": "Failed to cancel appointment",

    // Admin
    "admin.loading": "Loading dashboard...",
    "admin.title": "Admin Dashboard",
    "admin.subtitle": "Manage appointments & patients",
    "admin.stats.total": "Total Appointments",
    "admin.stats.today": "Today's Schedule",
    "admin.stats.upcoming": "Upcoming",
    "admin.stats.confirmed": "Confirmed",
    "admin.stats.completed": "Completed",
    "admin.stats.cancelled": "Cancelled",
    "admin.filters.searchPlaceholder":
      "Search by patient name, email, or doctor...",
    "admin.filters.allStatus": "All Status",
    "admin.filters.status.confirmed": "✅ Confirmed",
    "admin.filters.status.completed": "🎉 Completed",
    "admin.filters.status.cancelled": "❌ Cancelled",
    "admin.table.header.patient": "Patient",
    "admin.table.header.doctor": "Doctor",
    "admin.table.header.datetime": "Date & Time",
    "admin.table.header.service": "Service",
    "admin.table.header.status": "Status",
    "admin.table.header.actions": "Actions",
    "admin.table.empty.title": "No appointments found",
    "admin.table.empty.description":
      "Try adjusting your filters",
    "admin.table.results":
      "Showing {count} of {total} appointments",
  },
  fi: {
    // Common
    "common.loading": "Ladataan...",
    "common.logout": "Kirjaudu ulos",
    "common.error": "Jotain meni pieleen",
    "lang.label": "Kieli",
    "lang.english": "Englanti",
    "lang.finnish": "Suomi",
    "lang.swedish": "Ruotsi",
    "auth.error.generic": "Tunnistautuminen epäonnistui",

    // Login
    "login.appName": "SisuCare",
    "login.subtitle.login":
      "Tervetuloa takaisin! Kirjaudu jatkaaksesi",
    "login.subtitle.register":
      "Luo tili päästäksesi palveluun",
    "login.fullName.label": "Koko nimi",
    "login.fullName.placeholder": "Kirjoita koko nimesi",
    "login.email.label": "Sähköpostiosoite",
    "login.email.placeholder": "sinä@esimerkki.fi",
    "login.password.label": "Salasana",
    "login.password.hint": "Vähintään 6 merkkiä",
    "login.button.processing": "Käsitellään...",
    "login.button.signIn": "Kirjaudu sisään",
    "login.button.createAccount": "Luo tili",
    "login.toggle.toRegister.prefix": "Eikö sinulla ole tiliä?",
    "login.toggle.toRegister.link": "Luo uusi",
    "login.toggle.toLogin.prefix": "Onko sinulla jo tili?",
    "login.toggle.toLogin.link": "Kirjaudu sisään",
    "login.demo.heading": "Nopea testikirjautuminen",
    "login.demo.patient": "Potilas",
    "login.demo.admin": "Ylläpitäjä",

    // Home
    "home.subtitle": "Suomalainen terveysavustaja",
    "home.systemOnline": "Järjestelmä käytettävissä",
    "home.hero.title": "Tervetuloa takaisin, {name}!",
    "home.hero.description":
      "Älykäs terveydenhuollon kumppanisi. Saat nopeasti neuvoja ja hallitset ajanvarauksiasi helposti.",
    "home.stats.activeUsers": "Aktiivisia käyttäjiä",
    "home.stats.appointments": "Ajanvarauksia",
    "home.stats.successRate": "Onnistumisprosentti",
    "home.stats.responseTime": "Keskim. vastausaika",
    "home.feature.triage.title": "AI-oirearvio",
    "home.feature.triage.description":
      "Saat pikaisen arvion oireistasi ja hoitosuositukset",
    "home.feature.triage.badge": "Auki 24/7",
    "home.feature.appointments.title": "Varaa aika",
    "home.feature.appointments.description":
      "Varaa aikoja vapaille terveydenhuollon ammattilaisille",
    "home.feature.appointments.badge": "Reaaliaikaiset ajat",
    "home.feature.admin.title": "Ylläpitäjän näkymä",
    "home.feature.admin.description":
      "Monipuolinen ajanvarausten ja potilaiden hallinta",
    "home.feature.admin.badge": "Vain ylläpitäjille",
    "home.feature.cta": "Aloita",
    "home.banner.title":
      "🇫🇮 Suunniteltu Suomen terveydenhuoltoon",
    "home.banner.body":
      "Alusta vastaa suomalaisen terveydenhuollon haasteisiin: jonojen lyhentäminen, oikea hoitoonohjaus ja monikielinen palvelu. Suunniteltu GDPR-vaatimusten mukaisesti ja integroitavaksi kansallisiin järjestelmiin.",

    // Chat
    "chat.title": "AI-terveysavustaja",
    "chat.subtitle": "Perustuu GPT-4-tekoälyyn",
    "chat.clear": "Tyhjennä",
    "chat.loadingHistory": "Ladataan keskusteluhistoriaa...",
    "chat.empty.title":
      "Hei! Olen sinun AI-terveysavustajasi 👋",
    "chat.empty.description":
      "Kuvaile oireesi, niin annan henkilökohtaista terveysneuvontaa ja hoitosuosituksia.",
    "chat.empty.tryAsking": "Kokeile kysyä:",
    "chat.prompt.1": "Minulla on päänsärky ja kuumetta",
    "chat.prompt.2": "Olen yskinyt 3 päivää",
    "chat.prompt.3": "Tarvitsen yleisen terveystarkastuksen",
    "chat.prompt.4": "Selkäni särkee istuessa",
    "chat.input.placeholder": "Kuvaile oireesi...",
    "chat.emergencyNotice":
      "Hätätilanteessa soita aina numeroon 112",

    // Appointments
    "appointments.loading": "Ladataan ajanvarauksia...",
    "appointments.header.title": "Ajanvaraukseni",
    "appointments.header.subtitle": "Hallinnoi vastaanottoaikojasi",
    "appointments.view.list": "Ajanvaraukset",
    "appointments.view.book": "Varaa uusi",
    "appointments.empty.title": "Ei ajanvarauksia",
    "appointments.empty.description":
      "Aloita varaamalla ensimmäinen aikasi",
    "appointments.empty.cta": "Varaa ensimmäinen aika",
    "appointments.book.title": "Varaa aika",
    "appointments.book.subtitle":
      "Valitse sopiva ammattilainen, päivä ja aika",
    "appointments.book.providerLabel": "Valitse ammattilainen",
    "appointments.book.dateLabel": "Valitse päivä",
    "appointments.book.loadingSlots": "Ladataan vapaita aikoja...",
    "appointments.book.availableSlotsLabel":
      "Vapaat ajat ({count} kpl)",
    "appointments.book.noSlots.title":
      "Tälle päivälle ei ole vapaita aikoja",
    "appointments.book.noSlots.description":
      "Kokeile toista päivää",
    "appointments.book.serviceTypeLabel": "Palvelutyyppi",
    "appointments.book.serviceTypePlaceholder":
      "Valitse palvelutyyppi...",
    "appointments.book.button.booking": "Vahvistetaan varausta...",
    "appointments.book.button.confirm": "Vahvista ajanvaraus",
    "appointments.book.validation.missingFields":
      "Täytä kaikki kentät",
    "appointments.book.error.generic":
      "Ajanvaraus epäonnistui",
    "appointments.cancel.confirm": "Perutaanko tämä ajanvaraus?",
    "appointments.cancel.error":
      "Ajanvarauksen peruminen epäonnistui",

    // Admin
    "admin.loading": "Ladataan hallintapaneelia...",
    "admin.title": "Ylläpidon hallintapaneeli",
    "admin.subtitle": "Hallinnoi ajanvarauksia ja potilaita",
    "admin.stats.total": "Ajanvarauksia yhteensä",
    "admin.stats.today": "Tämän päivän ajat",
    "admin.stats.upcoming": "Tulevat ajat",
    "admin.stats.confirmed": "Vahvistetut",
    "admin.stats.completed": "Valmiit",
    "admin.stats.cancelled": "Perutut",
    "admin.filters.searchPlaceholder":
      "Hae potilaan nimellä, sähköpostilla tai lääkärillä...",
    "admin.filters.allStatus": "Kaikki tilat",
    "admin.filters.status.confirmed": "✅ Vahvistettu",
    "admin.filters.status.completed": "🎉 Valmis",
    "admin.filters.status.cancelled": "❌ Peruttu",
    "admin.table.header.patient": "Potilas",
    "admin.table.header.doctor": "Lääkäri",
    "admin.table.header.datetime": "Päivä ja aika",
    "admin.table.header.service": "Palvelu",
    "admin.table.header.status": "Tila",
    "admin.table.header.actions": "Toiminnot",
    "admin.table.empty.title": "Ajanvarauksia ei löytynyt",
    "admin.table.empty.description":
      "Kokeile muuttaa suodattimia",
    "admin.table.results":
      "Näytetään {count} / {total} ajanvarausta",
  },
  sv: {
    // Common
    "common.loading": "Laddar...",
    "common.logout": "Logga ut",
    "common.error": "Något gick fel",
    "lang.label": "Språk",
    "lang.english": "Engelska",
    "lang.finnish": "Finska",
    "lang.swedish": "Svenska",
    "auth.error.generic": "Autentisering misslyckades",

    // Login
    "login.appName": "SisuCare",
    "login.subtitle.login":
      "Välkommen tillbaka! Logga in för att fortsätta",
    "login.subtitle.register":
      "Skapa ett konto för att börja",
    "login.fullName.label": "Fullständigt namn",
    "login.fullName.placeholder": "Ange ditt fullständiga namn",
    "login.email.label": "E-postadress",
    "login.email.placeholder": "du@example.se",
    "login.password.label": "Lösenord",
    "login.password.hint": "Minst 6 tecken",
    "login.button.processing": "Bearbetar...",
    "login.button.signIn": "Logga in",
    "login.button.createAccount": "Skapa konto",
    "login.toggle.toRegister.prefix": "Har du inget konto?",
    "login.toggle.toRegister.link": "Skapa ett",
    "login.toggle.toLogin.prefix": "Har du redan ett konto?",
    "login.toggle.toLogin.link": "Logga in",
    "login.demo.heading": "Snabb testinloggning",
    "login.demo.patient": "Patient",
    "login.demo.admin": "Administratör",

    // Home
    "home.subtitle": "Finsk hälsovårdsassistent",
    "home.systemOnline": "Systemet är online",
    "home.hero.title": "Välkommen tillbaka, {name}!",
    "home.hero.description":
      "Din intelligenta hälsovårdspartner. Få snabba råd och hantera dina bokningar enkelt.",
    "home.stats.activeUsers": "Aktiva användare",
    "home.stats.appointments": "Bokningar",
    "home.stats.successRate": "Lyckandefrekvens",
    "home.stats.responseTime": "Genomsnittlig svarstid",
    "home.feature.triage.title": "AI-symtomcheck",
    "home.feature.triage.description":
      "Få en snabb bedömning av dina symtom och vårdrekommendationer",
    "home.feature.triage.badge": "Öppet dygnet runt",
    "home.feature.appointments.title": "Boka tid",
    "home.feature.appointments.description":
      "Boka tider hos tillgängliga vårdgivare",
    "home.feature.appointments.badge": "Tider i realtid",
    "home.feature.admin.title": "Adminpanel",
    "home.feature.admin.description":
      "Omfattande hantering av bokningar och patienter",
    "home.feature.admin.badge": "Endast administratörer",
    "home.feature.cta": "Kom igång",
    "home.banner.title":
      "🇫🇮 Byggd för Finlands hälsovårdssystem",
    "home.banner.body":
      "Plattformen adresserar verkliga utmaningar i finländsk hälsovård: kortare köer, bättre styrning till rätt vårdnivå och flerspråkig service. Utformad enligt GDPR och redo att integreras med nationella system.",

    // Chat
    "chat.title": "AI-hälsorådgivare",
    "chat.subtitle": "Drivs av GPT-4",
    "chat.clear": "Rensa",
    "chat.loadingHistory": "Laddar din konversation...",
    "chat.empty.title":
      "Hej! Jag är din AI-hälsorådgivare 👋",
    "chat.empty.description":
      "Beskriv dina symtom så ger jag personliga hälsoråd och vårdrekommendationer.",
    "chat.empty.tryAsking": "Försök fråga:",
    "chat.prompt.1": "Jag har huvudvärk och feber",
    "chat.prompt.2": "Jag har hostat i 3 dagar",
    "chat.prompt.3": "Jag behöver en allmän hälsokontroll",
    "chat.prompt.4": "Jag har ont i ryggen när jag sitter",
    "chat.input.placeholder": "Beskriv dina symtom...",
    "chat.emergencyNotice":
      "Vid nödsituation, ring alltid 112",

    // Appointments
    "appointments.loading": "Laddar bokningar...",
    "appointments.header.title": "Mina bokningar",
    "appointments.header.subtitle": "Hantera dina vårdbesök",
    "appointments.view.list": "Bokningar",
    "appointments.view.book": "Boka ny",
    "appointments.empty.title": "Inga bokningar ännu",
    "appointments.empty.description":
      "Börja med att boka din första tid",
    "appointments.empty.cta": "Boka din första tid",
    "appointments.book.title": "Boka tid",
    "appointments.book.subtitle":
      "Välj vårdgivare, datum och tid",
    "appointments.book.providerLabel": "Välj vårdgivare",
    "appointments.book.dateLabel": "Välj datum",
    "appointments.book.loadingSlots": "Laddar lediga tider...",
    "appointments.book.availableSlotsLabel":
      "Lediga tider ({count} st)",
    "appointments.book.noSlots.title":
      "Inga lediga tider detta datum",
    "appointments.book.noSlots.description":
      "Försök med ett annat datum",
    "appointments.book.serviceTypeLabel": "Tjänstetyp",
    "appointments.book.serviceTypePlaceholder":
      "Välj tjänstetyp...",
    "appointments.book.button.booking":
      "Bekräftar bokningen...",
    "appointments.book.button.confirm": "Bekräfta bokning",
    "appointments.book.validation.missingFields":
      "Fyll i alla fält",
    "appointments.book.error.generic":
      "Det gick inte att boka tiden",
    "appointments.cancel.confirm": "Avbryta denna bokning?",
    "appointments.cancel.error":
      "Det gick inte att avbryta bokningen",

    // Admin
    "admin.loading": "Laddar adminpanel...",
    "admin.title": "Adminpanel",
    "admin.subtitle": "Hantera bokningar och patienter",
    "admin.stats.total": "Totalt antal bokningar",
    "admin.stats.today": "Dagens tider",
    "admin.stats.upcoming": "Kommande tider",
    "admin.stats.confirmed": "Bekräftade",
    "admin.stats.completed": "Avslutade",
    "admin.stats.cancelled": "Avbokade",
    "admin.filters.searchPlaceholder":
      "Sök på patient, e-post eller läkare...",
    "admin.filters.allStatus": "Alla statusar",
    "admin.filters.status.confirmed": "✅ Bekräftad",
    "admin.filters.status.completed": "🎉 Avslutad",
    "admin.filters.status.cancelled": "❌ Avbokad",
    "admin.table.header.patient": "Patient",
    "admin.table.header.doctor": "Läkare",
    "admin.table.header.datetime": "Datum och tid",
    "admin.table.header.service": "Tjänst",
    "admin.table.header.status": "Status",
    "admin.table.header.actions": "Åtgärder",
    "admin.table.empty.title": "Inga bokningar hittades",
    "admin.table.empty.description":
      "Försök ändra filtren",
    "admin.table.results":
      "Visar {count} av {total} bokningar",
  },
};

function resolveLanguage(initial?: string | null): Language {
  const fromStorage =
    (typeof window !== "undefined" &&
      window.localStorage.getItem("language")) ||
    undefined;

  const raw = (initial || fromStorage) as Language | undefined;
  if (raw === "fi" || raw === "sv" || raw === "en") return raw;

  if (typeof navigator !== "undefined") {
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith("fi")) return "fi";
    if (nav.startsWith("sv")) return "sv";
  }

  return "en";
}

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    resolveLanguage(undefined),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = useMemo(
    () =>
      (key: string, vars?: Record<string, string | number>) => {
        const dict = translations[language] || translations.en;
        const fallbackDict =
          language === "en" ? translations.fi : translations.en;
        const template =
          dict[key] ?? fallbackDict[key] ?? translations.en[key] ?? key;
        return interpolate(template, vars);
      },
    [language],
  );

  const value: TranslationContextValue = {
    language,
    setLanguage,
    t,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return ctx;
}

