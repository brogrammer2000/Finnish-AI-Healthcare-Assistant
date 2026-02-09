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

export default function Appointments() {
  const [view, setView] = useState<"list" | "book">("list");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
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
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    }
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
      loadAppointments();

      setSelectedDoctor("");
      setSelectedDate("");
      setSelectedTime("");
      setSelectedService("");

      // Success animation
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-slideIn";
      toast.innerHTML = "✓ Appointment booked successfully!";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error: any) {
      alert(
        error.response?.data?.error ||
          t("appointments.book.error.generic"),
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm(t("appointments.cancel.confirm"))) return;

    try {
      await api.patch(`/appointments/${id}/cancel`);
      loadAppointments();
    } catch (error) {
      alert(t("appointments.cancel.error"));
    }
  };

  const formatDate = (datetime: string) => {
    return new Date(datetime).toLocaleDateString("en-FI", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString("en-FI", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">
            {t("appointments.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-lg shadow-soft sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gradient">
                  {t("appointments.header.title")}
                </h1>
                <p className="text-xs text-gray-500">
                  {t("appointments.header.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <span className="text-gray-700 hidden sm:inline">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                {t("common.logout")}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Toggle */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setView("list")}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              view === "list"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
            }`}
            >
              📋 {t("appointments.view.list")}
          </button>
          <button
            onClick={() => setView("book")}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              view === "book"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
            }`}
            >
              ➕ {t("appointments.view.book")}
          </button>
        </div>

        {/* List View */}
        {view === "list" && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl mb-6">
                  <svg
                    className="w-10 h-10 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {t("appointments.empty.title")}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t("appointments.empty.description")}
                </p>
                <button
                  onClick={() => setView("book")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {t("appointments.empty.cta")}
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="card p-6 relative overflow-hidden group"
                  >
                    {/* Status indicator bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        apt.status === "confirmed"
                          ? "bg-green-500"
                          : apt.status === "cancelled"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    ></div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pl-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                            {apt.doctorName.split(" ")[1]?.charAt(0) ||
                              apt.doctorName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {apt.doctorName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {apt.serviceType}
                            </p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg
                              className="w-5 h-5 text-blue-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="font-medium">
                              {formatDate(apt.datetime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg
                              className="w-5 h-5 text-purple-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="font-medium">
                              {formatTime(apt.datetime)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                            apt.status === "confirmed"
                              ? "badge-success"
                              : apt.status === "cancelled"
                              ? "badge-danger"
                              : "badge-info"
                          }`}
                        >
                          {apt.status.charAt(0).toUpperCase() +
                            apt.status.slice(1)}
                        </span>

                        {apt.status === "confirmed" &&
                          new Date(apt.datetime) > new Date() && (
                            <button
                              onClick={() => cancelAppointment(apt.id)}
                              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors text-sm"
                            >
                              {t("appointments.cancel.confirm").split("?")[0]}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Book View */}
        {view === "book" && (
          <div className="max-w-3xl mx-auto">
            <div className="card p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gradient mb-2">
                  {t("appointments.book.title")}
                </h2>
                <p className="text-gray-600">
                  {t("appointments.book.subtitle")}
                </p>
              </div>

              <div className="space-y-6">
                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t("appointments.book.providerLabel")}
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {doctors.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedDoctor === doc.id
                            ? "border-blue-500 bg-blue-50 shadow-md transform scale-105"
                            : "border-gray-200 hover:border-blue-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {doc.name.split(" ")[1]?.charAt(0) ||
                              doc.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {doc.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {doc.specialty}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t("appointments.book.dateLabel")}
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={today}
                    max={maxDateStr}
                    className="input-field"
                  />
                </div>

                {/* Time Slots */}
                {loadingSlots && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600">
                      {t("appointments.book.loadingSlots")}
                    </p>
                  </div>
                )}

                {!loadingSlots && availableSlots.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        {t("appointments.book.availableSlotsLabel", {
                          count: availableSlots.length,
                        })}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                            selectedTime === slot
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                              : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400"
                          }`}
                        >
                          {formatTime(slot)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!loadingSlots &&
                  selectedDoctor &&
                  selectedDate &&
                  availableSlots.length === 0 && (
                    <div className="text-center py-8 bg-yellow-50 rounded-xl border border-yellow-200">
                      <svg
                        className="w-12 h-12 text-yellow-500 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-gray-700 font-medium">
                        {t("appointments.book.noSlots.title")}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {t("appointments.book.noSlots.description")}
                      </p>
                    </div>
                  )}

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t("appointments.book.serviceTypeLabel")}
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="input-field"
                  >
                    <option value="">
                      {t("appointments.book.serviceTypePlaceholder")}
                    </option>
                    {serviceTypes.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Book Button */}
                <button
                  onClick={bookAppointment}
                  disabled={
                    bookingLoading ||
                    !selectedDoctor ||
                    !selectedTime ||
                    !selectedService
                  }
                  className="btn-primary w-full text-lg py-4 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {bookingLoading ? (
                      <>
                        <svg
                          className="animate-spin h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {t("appointments.book.button.booking")}
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {t("appointments.book.button.confirm")}
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
