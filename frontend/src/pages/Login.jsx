import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to log in. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-center">
      <div className="card">
        <h1>Welcome back</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>
          <div className="checkbox-row">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={form.rememberMe}
              onChange={handleChange}
            />
            <label htmlFor="rememberMe">Remember me</label>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="helper-text">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}