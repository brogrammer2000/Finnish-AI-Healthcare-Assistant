import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

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

  // Booking form state
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      alert("Please fill all fields");
      return;
    }

    setBookingLoading(true);
    try {
      await api.post("/appointments", {
        doctorId: selectedDoctor,
        datetime: selectedTime,
        serviceType: selectedService,
      });

      alert("Appointment booked successfully!");
      setView("list");
      loadAppointments();

      // Reset form
      setSelectedDoctor("");
      setSelectedDate("");
      setSelectedTime("");
      setSelectedService("");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;

    try {
      await api.patch(`/appointments/${id}/cancel`);
      loadAppointments();
      alert("Appointment cancelled");
    } catch (error) {
      alert("Failed to cancel appointment");
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

  // Get min date (today) and max date (90 days from now)
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">Appointments</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.name}</span>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* View Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setView("list")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              view === "list"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            My Appointments
          </button>
          <button
            onClick={() => setView("book")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              view === "book"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Book New Appointment
          </button>
        </div>

        {/* List View */}
        {view === "list" && (
          <div>
            {appointments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-600 mb-4">No appointments yet</p>
                <button
                  onClick={() => setView("book")}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Book Your First Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-start"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {apt.doctorName}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            apt.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : apt.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">
                        📅 {formatDate(apt.datetime)} at{" "}
                        {formatTime(apt.datetime)}
                      </p>
                      <p className="text-gray-600">🏥 {apt.serviceType}</p>
                    </div>
                    {apt.status === "confirmed" &&
                      new Date(apt.datetime) > new Date() && (
                        <button
                          onClick={() => cancelAppointment(apt.id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Cancel
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Book View */}
        {view === "book" && (
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Book an Appointment</h2>

            <div className="space-y-4">
              {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Doctor
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} - {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  max={maxDateStr}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Slots */}
              {loadingSlots && (
                <div className="text-center py-4">
                  Loading available times...
                </div>
              )}

              {!loadingSlots && availableSlots.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Time Slots
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`px-3 py-2 rounded-lg border transition ${
                          selectedTime === slot
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
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
                  <div className="text-center py-4 text-gray-600">
                    No available slots for this date. Please try another date.
                  </div>
                )}

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose service type...</option>
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
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {bookingLoading ? "Booking..." : "Confirm Appointment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
