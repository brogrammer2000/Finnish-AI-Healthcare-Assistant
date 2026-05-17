import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useTranslation } from "../i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

interface Appointment {
  id: string;
  doctorName: string;
  serviceType: string;
  datetime: string;
  status: string;
  user: {
    name: string;
    email: string;
  };
}

interface Stats {
  total: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  today: number;
  upcoming: number;
}

type NavSection = "appointments" | "confirmed" | "completed" | "cancelled";

export default function Admin() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeNav, setActiveNav] = useState<NavSection>("appointments");
  const [stats, setStats] = useState<Stats>({
    total: 0, confirmed: 0, cancelled: 0, completed: 0, today: 0, upcoming: 0,
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/"); return; }
    loadAppointments();
  }, [user, navigate]);

  useEffect(() => { filterAppointments(); }, [appointments, statusFilter, searchTerm]);

  const loadAppointments = async () => {
    try {
      const { data } = await api.get("/appointments/all");
      setAppointments(data.appointments);
      calculateStats(data.appointments);
    } catch (error) {
      console.error("Failed to load appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apts: Appointment[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    setStats({
      total: apts.length,
      confirmed: apts.filter(a => a.status === "confirmed").length,
      cancelled: apts.filter(a => a.status === "cancelled").length,
      completed: apts.filter(a => a.status === "completed").length,
      today: apts.filter(a => { const d = new Date(a.datetime); return d >= todayStart && d < todayEnd; }).length,
      upcoming: apts.filter(a => new Date(a.datetime) > now && a.status === "confirmed").length,
    });
  };

  const filterAppointments = () => {
    let filtered = appointments;
    if (statusFilter !== "all") filtered = filtered.filter(a => a.status === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.user.name.toLowerCase().includes(q) ||
        a.user.email.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q),
      );
    }
    setFilteredAppointments(filtered);
  };

  const handleNavClick = (section: NavSection) => {
    setActiveNav(section);
    const map: Record<NavSection, string> = {
      appointments: "all",
      confirmed: "confirmed",
      completed: "completed",
      cancelled: "cancelled",
    };
    setStatusFilter(map[section]);
    setSearchTerm("");
  };

  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      loadAppointments();
    } catch {
      alert("Failed to update appointment");
    }
  };

  const formatDate = (datetime: string) =>
    new Date(datetime).toLocaleDateString("fi-FI", { weekday: "short", month: "short", day: "numeric" });

  const formatTime = (datetime: string) =>
    new Date(datetime).toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#D1D5DB] border-t-[#006B6B] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-[#6B7280]">{t("admin.loading")}</p>
        </div>
      </div>
    );
  }

  const navItems: { id: NavSection; label: string; count: number }[] = [
    { id: "appointments", label: t("admin.stats.total"), count: stats.total },
    { id: "confirmed", label: t("admin.stats.confirmed"), count: stats.confirmed },
    { id: "completed", label: t("admin.stats.completed"), count: stats.completed },
    { id: "cancelled", label: t("admin.stats.cancelled"), count: stats.cancelled },
  ];

  const statCards = [
    { label: t("admin.stats.total"), value: stats.total },
    { label: t("admin.stats.today"), value: stats.today },
    { label: t("admin.stats.upcoming"), value: stats.upcoming },
    { label: t("admin.stats.confirmed"), value: stats.confirmed },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">

      {/* ── Left Sidebar ────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 bg-white border-r border-[#E4E7EC] min-h-screen">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-[#E4E7EC]">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#006B6B] hover:text-[#005555] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-[13px] font-semibold">{t("login.appName")}</span>
          </button>
        </div>

        {/* Admin info */}
        <div className="px-5 py-4 border-b border-[#E4E7EC]">
          <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-2">Admin</p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#374151] rounded flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              A
            </div>
            <p className="text-[13px] font-semibold text-[#111827] truncate">{user?.name}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3">
          <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold px-3 mb-2">
            Appointments
          </p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`sidebar-nav-item ${activeNav === item.id ? "active" : ""}`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="flex-1">{item.label}</span>
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                activeNav === item.id ? "bg-[#006B6B] text-white" : "bg-[#F3F4F6] text-[#6B7280]"
              }`}>
                {item.count}
              </span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-[#E4E7EC] px-4 py-3">
          <button
            onClick={logout}
            className="hds-btn-ghost w-full justify-start text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t("common.logout")}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-[#E4E7EC] sticky top-0 z-40">
          <div className="px-5 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="lg:hidden p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
              >
                <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-[15px] font-semibold text-[#111827]">{t("admin.title")}</h1>
                <p className="text-[11px] text-[#9CA3AF] leading-none mt-0.5">{t("admin.subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={logout}
                className="lg:hidden hds-btn-ghost text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
              >
                {t("common.logout")}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 px-5 py-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((card, i) => (
              <div key={i} className="hds-card">
                <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-2">{card.label}</p>
                <p className="text-[28px] font-bold text-[#111827] leading-none">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Search + filter */}
          <div className="hds-card mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t("admin.filters.searchPlaceholder")}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="hds-input-bordered pl-9 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="hds-input-bordered sm:w-44 text-sm bg-white"
              >
                <option value="all">{t("admin.filters.allStatus")}</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="hds-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E4E7EC] bg-[#F9FAFB]">
                    {[
                      t("admin.table.header.patient"),
                      t("admin.table.header.doctor"),
                      t("admin.table.header.datetime"),
                      t("admin.table.header.service"),
                      t("admin.table.header.status"),
                      t("admin.table.header.actions"),
                    ].map(col => (
                      <th key={col} className="px-5 py-3 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <p className="text-[14px] font-medium text-[#374151] mb-1">{t("admin.table.empty.title")}</p>
                        <p className="text-sm text-[#9CA3AF]">{t("admin.table.empty.description")}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt, idx) => (
                      <tr
                        key={apt.id}
                        className={`border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors ${
                          idx % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-[#E4E7EC] rounded flex items-center justify-center text-[#374151] text-[11px] font-bold flex-shrink-0">
                              {apt.user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-[#111827] text-[13px]">{apt.user.name}</p>
                              <p className="text-[11px] text-[#9CA3AF]">{apt.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-[13px] font-medium text-[#374151]">{apt.doctorName}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-[13px] text-[#374151] font-medium">{formatDate(apt.datetime)}</p>
                          <p className="text-[11px] text-[#9CA3AF]">{formatTime(apt.datetime)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-[13px] text-[#6B7280]">{apt.serviceType}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={
                            apt.status === "confirmed" ? "badge-confirmed"
                            : apt.status === "cancelled" ? "badge-cancelled"
                            : "badge-completed"
                          }>
                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={apt.status}
                            onChange={e => updateAppointmentStatus(apt.id, e.target.value)}
                            className="hds-input-bordered text-[13px] py-1 px-2 w-36"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {filteredAppointments.length > 0 && (
              <div className="px-5 py-3 border-t border-[#E4E7EC] bg-[#F9FAFB]">
                <p className="text-[12px] text-[#9CA3AF]">
                  Showing <span className="font-semibold text-[#374151]">{filteredAppointments.length}</span> of{" "}
                  <span className="font-semibold text-[#374151]">{appointments.length}</span> appointments
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
