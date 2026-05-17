import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: (
        <svg className="w-5 h-5 text-[#006B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      title: t("home.feature.triage.title"),
      description: t("home.feature.triage.description"),
      badge: t("home.feature.triage.badge"),
      path: "/chat",
      adminOnly: false,
    },
    {
      icon: (
        <svg className="w-5 h-5 text-[#006B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: t("home.feature.appointments.title"),
      description: t("home.feature.appointments.description"),
      badge: t("home.feature.appointments.badge"),
      path: "/appointments",
      adminOnly: false,
    },
    {
      icon: (
        <svg className="w-5 h-5 text-[#006B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: t("home.feature.admin.title"),
      description: t("home.feature.admin.description"),
      badge: t("home.feature.admin.badge"),
      path: "/admin",
      adminOnly: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ── Header ─────────────────────────────────── */}
      <header className="bg-white border-b border-[#E4E7EC] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#006B6B] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 2v4m0 12v4M2 12h4m12 0h4M6.34 6.34l2.83 2.83m5.66 5.66l2.83 2.83M6.34 17.66l2.83-2.83m5.66-5.66l2.83-2.83" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#111827] leading-none">{t("login.appName")}</p>
              <p className="text-[11px] text-[#9CA3AF] leading-none mt-0.5">{t("home.subtitle")}</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#E4E7EC]">
              <div className="w-7 h-7 bg-[#006B6B] rounded flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="leading-none">
                <p className="text-[13px] font-semibold text-[#111827]">{user?.name}</p>
                <p className="text-[11px] text-[#9CA3AF] capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="hds-btn-ghost text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
            >
              {t("common.logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-10">

        {/* ── Hero ────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-[#22C55E] rounded-full"></span>
            <span className="text-[12px] font-medium text-[#6B7280]">{t("home.systemOnline")}</span>
          </div>
          <h2 className="text-[28px] sm:text-[32px] font-bold text-[#111827] mb-2 leading-tight">
            {t("home.hero.title", { name: user?.name ?? "" })}
          </h2>
          <p className="text-[15px] text-[#6B7280] max-w-xl leading-relaxed">
            {t("home.hero.description")}
          </p>
        </div>

        {/* ── Feature cards ────────────────────────── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {features.map((feature, i) => {
            if (feature.adminOnly && user?.role !== "admin") return null;
            return (
              <button
                key={i}
                onClick={() => navigate(feature.path)}
                className="hds-card text-left hover:border-[#006B6B] transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 bg-[#F0F9F9] border border-[#99D0D0] rounded-lg flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <span className="text-[11px] font-semibold text-[#006B6B] bg-[#F0F9F9] border border-[#99D0D0] px-2.5 py-1 rounded-full">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-[#111827] mb-1.5">{feature.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-relaxed mb-4">{feature.description}</p>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#006B6B] group-hover:gap-2.5 transition-all">
                  {t("home.feature.cta")}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Info banner ─────────────────────────── */}
        <div className="hds-card border-[#99D0D0] bg-[#F0F9F9]">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-[#006B6B] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#006B6B] mb-1">{t("home.banner.title")}</h3>
              <p className="text-[13px] text-[#374151] leading-relaxed">{t("home.banner.body")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
