import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "../i18n/translations";

export const Login = () => {
  const navigate = useNavigate();

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL &&
    import.meta.env.VITE_BACKEND_URL !== "undefined"
      ? import.meta.env.VITE_BACKEND_URL
      : window.location.origin;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language];

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${backendUrl}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(t.loginGenericError);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || t.loginError);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("profile", JSON.stringify(data.profile));

      navigate("/profile");
    } catch (error) {
      console.error(error);
      setError(error.message || t.loginGenericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <div className="login-info">
          <span>{t.appName}</span>

          <h1>{t.loginPageTitle}</h1>

          <p>{t.loginPageText}</p>

          <div className="login-info-box">
            <strong>{t.loginInfoTitle}</strong>
            <small>{t.loginInfoText}</small>
          </div>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-form-header">
            <h2>{t.loginFormTitle}</h2>
            <p>{t.loginFormSubtitle}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>{t.emailLabel}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t.emailPlaceholder}
              required
            />
          </div>

          <div className="form-group">
            <label>{t.passwordLabel}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t.passwordPlaceholder}
              required
            />
          </div>

          <button className="login-submit" disabled={loading}>
            {loading ? t.loginLoading : t.loginButton}
          </button>

          <p className="login-register-link">
            {t.noAccount} <Link to="/register">{t.signUpHere}</Link>
          </p>
        </form>
      </div>
    </section>
  );
};