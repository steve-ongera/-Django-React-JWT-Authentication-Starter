import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password2: "",
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        // DRF returns field-level errors, e.g. { email: ["..."] }
        const flat = {};
        Object.entries(data).forEach(([key, val]) => {
          flat[key] = Array.isArray(val) ? val.join(" ") : String(val);
        });
        setErrors(flat);
      } else {
        setErrors({ non_field_errors: "Something went wrong. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-center">
      <div className="card">
        <h1>Create an account</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="first_name">First name</label>
            <input
              id="first_name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="last_name">Last name</label>
            <input
              id="last_name"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
            />
          </div>
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
            {errors.email && <p className="error-text">{errors.email}</p>}
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
              autoComplete="new-password"
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          <div className="field">
            <label htmlFor="password2">Confirm password</label>
            <input
              id="password2"
              name="password2"
              type="password"
              required
              value={form.password2}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.password2 && <p className="error-text">{errors.password2}</p>}
          </div>

          {errors.non_field_errors && (
            <p className="error-text">{errors.non_field_errors}</p>
          )}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="helper-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}