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

export default function Admin() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    today: 0,
    upcoming: 0,
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/");
      return;
    }
    loadAppointments();
  }, [user, navigate]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, statusFilter, searchTerm]);

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

  const calculateStats = (appointments: Appointment[]) => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const stats = {
      total: appointments.length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      cancelled: appointments.filter((a) => a.status === "cancelled").length,
      completed: appointments.filter((a) => a.status === "completed").length,
      today: appointments.filter((a) => {
        const aptDate = new Date(a.datetime);
        return aptDate >= todayStart && aptDate < todayEnd;
      }).length,
      upcoming: appointments.filter((a) => {
        return new Date(a.datetime) > now && a.status === "confirmed";
      }).length,
    };

    setStats(stats);
  };

  const filterAppointments = () => {
    let filtered = appointments;

    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredAppointments(filtered);
  };

  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      loadAppointments();

      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-slideIn";
      toast.innerHTML = `✓ Appointment ${newStatus}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error) {
      alert("Failed to update appointment");
    }
  };

  const formatDate = (datetime: string) => {
    return new Date(datetime).toLocaleDateString("en-FI", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString("en-FI", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Appointments",
      value: stats.total,
      icon: "📊",
      gradient: "from-blue-500 to-cyan-500",
      change: "+12%",
    },
    {
      label: "Today's Schedule",
      value: stats.today,
      icon: "📅",
      gradient: "from-purple-500 to-pink-500",
      change: "8 scheduled",
    },
    {
      label: "Upcoming",
      value: stats.upcoming,
      icon: "⏰",
      gradient: "from-green-500 to-emerald-500",
      change: "Next 7 days",
    },
    {
      label: "Confirmed",
      value: stats.confirmed,
      icon: "✅",
      gradient: "from-teal-500 to-cyan-500",
      change: `${Math.round((stats.confirmed / stats.total) * 100)}%`,
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: "🎉",
      gradient: "from-indigo-500 to-purple-500",
      change: "All time",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      icon: "❌",
      gradient: "from-red-500 to-pink-500",
      change: `${Math.round((stats.cancelled / stats.total) * 100)}%`,
    },
  ];

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
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-500">
                  Manage appointments & patients
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-full border border-purple-100">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="card p-6 relative overflow-hidden group hover:scale-105 transition-transform duration-300"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
              ></div>

              <div className="relative">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500">{stat.change}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by patient name, email, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="md:w-48 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="confirmed">✅ Confirmed</option>
              <option value="completed">🎉 Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="inline-flex flex-col items-center">
                        <svg
                          className="w-16 h-16 text-gray-300 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-gray-500 font-medium">
                          No appointments found
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Try adjusting your filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt, index) => (
                    <tr
                      key={apt.id}
                      className="hover:bg-blue-50/50 transition-colors"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                            {apt.user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {apt.user.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {apt.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {apt.doctorName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatDate(apt.datetime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(apt.datetime)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {apt.serviceType}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${
                            apt.status === "confirmed"
                              ? "badge-success"
                              : apt.status === "cancelled"
                              ? "badge-danger"
                              : "badge-info"
                          }`}
                        >
                          {apt.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={apt.status}
                          onChange={(e) =>
                            updateAppointmentStatus(apt.id, e.target.value)
                          }
                          className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white hover:border-blue-400"
                        >
                          <option value="confirmed">✅ Confirmed</option>
                          <option value="completed">🎉 Completed</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-bold text-gray-900">
              {filteredAppointments.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-gray-900">
              {appointments.length}
            </span>{" "}
            appointments
          </p>
        </div>
      </div>
    </div>
  );
}
