import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Healthcare App</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Hello, {user?.name}</span>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Healthcare Assistant
          </h2>
          <p className="text-xl text-gray-600">
            AI-powered health management and appointment booking
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div
            onClick={() => navigate("/chat")}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-xl font-bold mb-2">💬 AI Triage</h3>
            <p className="text-gray-600">
              Chat with our AI assistant about your symptoms
            </p>
          </div>

          <div
            onClick={() => navigate("/appointments")}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-xl font-bold mb-2">📅 Appointments</h3>
            <p className="text-gray-600">Book and manage your appointments</p>
          </div>

          {user?.role === "admin" && (
            <div
              onClick={() => navigate("/admin")}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <h3 className="text-xl font-bold mb-2">⚙️ Admin</h3>
              <p className="text-gray-600">Manage all appointments and users</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
