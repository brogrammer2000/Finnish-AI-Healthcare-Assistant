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
    // Check if user is admin
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
      alert("Failed to load appointments. Are you logged in as admin?");
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

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Filter by search term
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
      alert(`Appointment ${newStatus}`);
    } catch (error) {
      alert("Failed to update appointment status");
    }
  };

  const formatDate = (datetime: string) => {
    return new Date(datetime).toLocaleDateString("en-FI", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
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
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Today</p>
            <p className="text-3xl font-bold text-blue-600">{stats.today}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Upcoming</p>
            <p className="text-3xl font-bold text-green-600">
              {stats.upcoming}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Confirmed</p>
            <p className="text-3xl font-bold text-green-600">
              {stats.confirmed}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-gray-600">
              {stats.completed}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Cancelled</p>
            <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by patient name, email, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No appointments found
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {apt.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {apt.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {apt.doctorName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(apt.datetime)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(apt.datetime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {apt.serviceType}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            apt.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : apt.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={apt.status}
                          onChange={(e) =>
                            updateAppointmentStatus(apt.id, e.target.value)
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
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
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {filteredAppointments.length} of {appointments.length}{" "}
          appointments
        </div>
      </div>
    </div>
  );
}
