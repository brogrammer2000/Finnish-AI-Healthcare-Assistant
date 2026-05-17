import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation, type Language } from "../i18n";

const LANG_OPTIONS: { code: Language; label: string }[] = [
  { code: "fi", label: "Suomi" },
  { code: "sv", label: "Svenska" },
  { code: "en", label: "English" },
];

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const { login, register } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => { emailRef.current?.focus(); }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || t("auth.error.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-[42%] bg-[#006B6B] flex-col justify-between p-12 text-white">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 2v4m0 12v4M2 12h4m12 0h4M6.34 6.34l2.83 2.83m5.66 5.66l2.83 2.83M6.34 17.66l2.83-2.83m5.66-5.66l2.83-2.83" />
              </svg>
            </div>
            <span className="text-[17px] font-semibold tracking-tight">
              {t("login.appName")}
            </span>
          </div>

          <h1 className="text-[28px] font-bold leading-snug mb-4">
            {language === "fi"
              ? "Älykkäät terveyspalvelut kaikille suomalaisille"
              : language === "sv"
              ? "Smarta hälsotjänster för alla i Finland"
              : "Intelligent health services for everyone in Finland"}
          </h1>
          <p className="text-white/70 text-[15px] leading-relaxed">
            {language === "fi"
              ? "Saa oirearviosi, varaa aika ja hallinnoi terveyttäsi — turvallisesti ja nopeasti."
              : language === "sv"
              ? "Få en symtombedömning, boka tid och hantera din hälsa — säkert och snabbt."
              : "Get a symptom assessment, book appointments, and manage your health — securely and quickly."}
          </p>
        </div>

        {/* Language switcher */}
        <div>
          <p className="text-white/50 text-[11px] uppercase tracking-widest mb-3 font-medium">
            Kieli / Språk / Language
          </p>
          <div className="flex gap-1">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code)}
                className={`px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors ${
                  language === opt.code
                    ? "bg-white/20 text-white"
                    : "text-white/55 hover:text-white/80 hover:bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Mobile language bar */}
        <div className="lg:hidden flex justify-end px-6 pt-5">
          <div className="flex gap-1">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  language === opt.code
                    ? "bg-[#006B6B] text-white"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-[360px]">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-7 h-7 bg-[#006B6B] rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold text-[#111827]">{t("login.appName")}</span>
            </div>

            <h2 className="text-[22px] font-bold text-[#111827] mb-1">
              {isLogin ? t("login.button.signIn") : t("login.button.createAccount")}
            </h2>
            <p className="text-[#6B7280] text-sm mb-8">
              {isLogin ? t("login.subtitle.login") : t("login.subtitle.register")}
            </p>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[6px] text-sm text-[#DC2626]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wider mb-2">
                    {t("login.fullName.label")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="hds-input"
                    placeholder={t("login.fullName.placeholder")}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wider mb-2">
                  {t("login.email.label")}
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="hds-input"
                  placeholder={t("login.email.placeholder")}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wider mb-2">
                  {t("login.password.label")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="hds-input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                {!isLogin && (
                  <p className="mt-1.5 text-[12px] text-[#9CA3AF]">{t("login.password.hint")}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="hds-btn-primary w-full py-3 text-[15px]"
              >
                {loading ? t("login.button.processing") : isLogin ? t("login.button.signIn") : t("login.button.createAccount")}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="text-sm text-[#006B6B] hover:text-[#005555] font-medium transition-colors"
              >
                {isLogin
                  ? `${t("login.toggle.toRegister.prefix")} ${t("login.toggle.toRegister.link")}`
                  : `${t("login.toggle.toLogin.prefix")} ${t("login.toggle.toLogin.link")}`}
              </button>
            </div>

            {/* Demo credentials */}
            <div className="mt-8 p-4 bg-[#F0F9F9] border border-[#99D0D0] rounded-[8px]">
              <p className="text-[11px] font-semibold text-[#006B6B] uppercase tracking-wider mb-3">
                {t("login.demo.heading")}
              </p>
              <div className="space-y-3 text-[12px]">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 bg-[#006B6B] rounded text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">P</span>
                  <div>
                    <p className="font-semibold text-[#374151] mb-0.5">{t("login.demo.patient")}</p>
                    <p className="font-mono text-[#6B7280]">demo@test.com / demo123</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 bg-[#374151] rounded text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">A</span>
                  <div>
                    <p className="font-semibold text-[#374151] mb-0.5">{t("login.demo.admin")}</p>
                    <p className="font-mono text-[#6B7280]">admin@healthcare.com / admin123</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
