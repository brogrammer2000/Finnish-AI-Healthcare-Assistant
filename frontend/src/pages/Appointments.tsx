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
  aiRecommendation?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

type MainView = "list" | "book";

export default function Appointments() {
  const [view, setView] = useState<MainView>("list");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    loadAppointments();
    loadDoctors();
    loadServiceTypes();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) loadAvailableSlots();
  }, [selectedDoctor, selectedDate]);

  const loadAppointments = async () => {
    try {
      const { data } = await api.get("/appointments/my-appointments");
      setAppointments(data.appointments);
    } catch (error) {
      console.error("Failed to load appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const { data } = await api.get("/appointments/doctors");
      setDoctors(data.doctors);
    } catch (error) {
      console.error("Failed to load doctors:", error);
    }
  };

  const loadServiceTypes = async () => {
    try {
      const { data } = await api.get("/appointments/service-types");
      setServiceTypes(data.serviceTypes);
    } catch (error) {
      console.error("Failed to load service types:", error);
    }
  };

  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    setSelectedTime("");
    try {
      const { data } = await api.get("/appointments/available-slots", {
        params: { date: selectedDate, doctorId: selectedDoctor },
      });
      setAvailableSlots(data.availableSlots);
    } catch (error) {
      console.error("Failed to load slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const bookAppointment = async () => {
    if (!selectedDoctor || !selectedTime || !selectedService) {
      alert(t("appointments.book.validation.missingFields"));
      return;
    }
    setBookingLoading(true);
    try {
      await api.post("/appointments", {
        doctorId: selectedDoctor,
        datetime: selectedTime,
        serviceType: selectedService,
      });
      setView("list");
      setStep(1);
      loadAppointments();
      setSelectedService("");
      setSelectedDoctor("");
      setSelectedDate("");
      setSelectedTime("");
    } catch (error: any) {
      alert(error.response?.data?.error || t("appointments.book.error.generic"));
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm(t("appointments.cancel.confirm"))) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      loadAppointments();
    } catch {
      alert(t("appointments.cancel.error"));
    }
  };

  const startBooking = () => {
    setStep(1);
    setSelectedService("");
    setSelectedDoctor("");
    setSelectedDate("");
    setSelectedTime("");
    setView("book");
  };

  const formatDate = (datetime: string) =>
    new Date(datetime).toLocaleDateString("fi-FI", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (datetime: string) =>
    new Date(datetime).toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });

  const selectedDoctorObj = doctors.find(d => d.id === selectedDoctor);

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#D1D5DB] border-t-[#006B6B] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-[#6B7280]">{t("appointments.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ── Header ─────────────────────────────────── */}
      <header className="bg-white border-b border-[#E4E7EC] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
            >
              <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-[15px] font-semibold text-[#111827]">{t("appointments.header.title")}</h1>
              <p className="text-[11px] text-[#9CA3AF] leading-none mt-0.5">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button onClick={logout} className="hds-btn-ghost text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]">
              {t("common.logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* ── View toggle ─────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-white border border-[#E4E7EC] rounded-[8px] p-1">
            <button
              onClick={() => setView("list")}
              className={`px-4 py-1.5 text-sm font-medium rounded-[6px] transition-colors ${
                view === "list"
                  ? "bg-[#006B6B] text-white"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {t("appointments.view.list")}
            </button>
            <button
              onClick={startBooking}
              className={`px-4 py-1.5 text-sm font-medium rounded-[6px] transition-colors ${
                view === "book"
                  ? "bg-[#006B6B] text-white"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {t("appointments.view.book")}
            </button>
          </div>
          {view === "list" && (
            <button onClick={startBooking} className="hds-btn-primary text-sm py-2 px-4">
              + {t("appointments.view.book")}
            </button>
          )}
        </div>

        {/* ════════════════════════════════════════════
            LIST VIEW
        ════════════════════════════════════════════ */}
        {view === "list" && (
          <div>
            {appointments.length === 0 ? (
              <div className="hds-card py-16 text-center">
                <div className="w-10 h-10 border border-[#E4E7EC] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-semibold text-[#111827] mb-1">{t("appointments.empty.title")}</h3>
                <p className="text-sm text-[#6B7280] mb-6">{t("appointments.empty.description")}</p>
                <button onClick={startBooking} className="hds-btn-primary text-sm">
                  {t("appointments.empty.cta")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <div key={apt.id} className="hds-card">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Status bar */}
                        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                          apt.status === "confirmed" ? "bg-[#006B6B]"
                          : apt.status === "cancelled" ? "bg-[#DC2626]"
                          : "bg-[#D1D5DB]"
                        }`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[15px] font-semibold text-[#111827]">{apt.doctorName}</p>
                            <span className={
                              apt.status === "confirmed" ? "badge-confirmed"
                              : apt.status === "cancelled" ? "badge-cancelled"
                              : "badge-completed"
                            }>
                              {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-[13px] text-[#6B7280] mb-2">{apt.serviceType}</p>
                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[#374151]">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(apt.datetime)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTime(apt.datetime)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {apt.status === "confirmed" && new Date(apt.datetime) > new Date() && (
                        <button
                          onClick={() => cancelAppointment(apt.id)}
                          className="hds-btn-ghost text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626] self-start sm:self-auto"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════
            BOOK VIEW — 3-step wizard
        ════════════════════════════════════════════ */}
        {view === "book" && (
          <div className="max-w-2xl mx-auto">

            {/* Step progress */}
            <div className="flex items-center gap-2 mb-8">
              {([1, 2, 3] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`step-bubble ${
                    step > s
                      ? "bg-[#006B6B] text-white"
                      : step === s
                      ? "bg-[#006B6B] text-white"
                      : "bg-[#E4E7EC] text-[#9CA3AF]"
                  }`}>
                    {step > s ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s}
                  </div>
                  <span className={`text-[12px] font-medium hidden sm:inline ${
                    step === s ? "text-[#111827]" : "text-[#9CA3AF]"
                  }`}>
                    {s === 1 ? "Service" : s === 2 ? "Provider & Time" : "Confirm"}
                  </span>
                  {i < 2 && <div className={`flex-1 h-px ${step > s ? "bg-[#006B6B]" : "bg-[#E4E7EC]"}`} />}
                </div>
              ))}
            </div>

            {/* ── Step 1: Service type ── */}
            {step === 1 && (
              <div className="hds-card animate-fadeIn">
                <h2 className="text-[16px] font-semibold text-[#111827] mb-1">
                  {t("appointments.book.serviceTypeLabel")}
                </h2>
                <p className="text-sm text-[#6B7280] mb-5">{t("appointments.book.subtitle")}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {serviceTypes.map(service => (
                    <button
                      key={service}
                      onClick={() => { setSelectedService(service); setStep(2); }}
                      className={`p-4 rounded-[8px] border text-left transition-colors ${
                        selectedService === service
                          ? "border-[#006B6B] bg-[#F0F9F9]"
                          : "border-[#E4E7EC] bg-white hover:border-[#006B6B] hover:bg-[#F0F9F9]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#F0F9F9] border border-[#99D0D0] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-[#006B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-[#111827]">{service}</p>
                          <p className="text-[12px] text-[#9CA3AF] mt-0.5">Available online</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 2: Doctor + Date + Slots ── */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="hds-card">
                  <h2 className="text-[16px] font-semibold text-[#111827] mb-1">
                    {t("appointments.book.providerLabel")}
                  </h2>
                  <p className="text-sm text-[#6B7280] mb-5">Service: <strong className="text-[#111827]">{selectedService}</strong></p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {doctors.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc.id)}
                        className={`p-4 rounded-[8px] border text-left transition-colors ${
                          selectedDoctor === doc.id
                            ? "border-[#006B6B] bg-[#F0F9F9]"
                            : "border-[#E4E7EC] bg-white hover:border-[#006B6B] hover:bg-[#F0F9F9]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#374151] rounded flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
                            {doc.name.split(" ")[1]?.charAt(0) || doc.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-[#111827] truncate">{doc.name}</p>
                            <p className="text-[12px] text-[#6B7280] truncate">{doc.specialty}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDoctor && (
                  <div className="hds-card animate-fadeIn">
                    <label className="block text-[12px] font-semibold text-[#374151] uppercase tracking-wider mb-3">
                      {t("appointments.book.dateLabel")}
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      min={today}
                      max={maxDateStr}
                      className="hds-input-bordered w-auto"
                    />
                  </div>
                )}

                {loadingSlots && (
                  <div className="hds-card text-center py-8 animate-fadeIn">
                    <div className="w-6 h-6 border-2 border-[#D1D5DB] border-t-[#006B6B] rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-[#6B7280]">{t("appointments.book.loadingSlots")}</p>
                  </div>
                )}

                {!loadingSlots && availableSlots.length > 0 && (
                  <div className="hds-card animate-fadeIn">
                    <label className="block text-[12px] font-semibold text-[#374151] uppercase tracking-wider mb-3">
                      {t("appointments.book.availableSlotsLabel", { count: availableSlots.length })}
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-52 overflow-y-auto">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={selectedTime === slot ? "cal-slot-available selected" : "cal-slot-available"}
                        >
                          {formatTime(slot)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!loadingSlots && selectedDoctor && selectedDate && availableSlots.length === 0 && (
                  <div className="hds-card text-center py-8 animate-fadeIn">
                    <p className="text-[14px] font-medium text-[#374151] mb-1">{t("appointments.book.noSlots.title")}</p>
                    <p className="text-sm text-[#6B7280]">{t("appointments.book.noSlots.description")}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="hds-btn-secondary flex-1 text-sm py-2.5">
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedDoctor || !selectedTime}
                    className="hds-btn-primary flex-1 text-sm py-2.5"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Summary + Confirm ── */}
            {step === 3 && (
              <div className="animate-fadeIn">
                <div className="hds-card mb-4">
                  <h2 className="text-[16px] font-semibold text-[#111827] mb-4">Review your appointment</h2>
                  <div className="space-y-3">
                    {[
                      { label: "Service", value: selectedService },
                      { label: "Doctor", value: selectedDoctorObj?.name ?? "" },
                      { label: "Specialty", value: selectedDoctorObj?.specialty ?? "" },
                      { label: "Date", value: selectedDate ? formatDate(selectedTime) : "" },
                      { label: "Time", value: selectedTime ? formatTime(selectedTime) : "" },
                    ].map(row => (
                      <div key={row.label} className="flex items-baseline justify-between py-2 border-b border-[#F3F4F6] last:border-0">
                        <span className="text-[12px] uppercase tracking-wider font-semibold text-[#9CA3AF]">{row.label}</span>
                        <span className="text-[14px] font-medium text-[#111827]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="hds-btn-secondary flex-1 text-sm py-2.5">
                    Back
                  </button>
                  <button
                    onClick={bookAppointment}
                    disabled={bookingLoading}
                    className="hds-btn-primary flex-1 text-sm py-2.5"
                  >
                    {bookingLoading ? t("appointments.book.button.booking") : t("appointments.book.button.confirm")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
