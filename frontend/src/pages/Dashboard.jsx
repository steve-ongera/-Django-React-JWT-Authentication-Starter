import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <Navbar />
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <p>You're signed in as <strong>{user?.email}</strong>.</p>
        <div className="card" style={{ marginTop: 24 }}>
          <h1 style={{ fontSize: "1.1rem" }}>Account details</h1>
          <p><strong>Name:</strong> {user?.full_name || "—"}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p>
            <strong>Joined:</strong>{" "}
            {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}