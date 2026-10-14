import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "../i18n/translations";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "https://rankingcoru.onrender.com";

export const Login = () => {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

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

  const changeLanguage = (newLanguage) => {
    localStorage.setItem("language", newLanguage);
    setLanguage(newLanguage);
    window.dispatchEvent(new Event("languageChanged"));
  };

  const toggleLanguage = () => {
    const newLanguage = language === "es" ? "en" : "es";
    changeLanguage(newLanguage);
  };

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

      let data = null;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        await response.text();

        throw new Error(
          `${t.login.noJson} ${backendUrl}/api/login. Status: ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(data.msg || t.login.loginFailed);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user?.profile) {
        localStorage.setItem("profile", JSON.stringify(data.user.profile));
      }

      navigate("/profile");
    } catch (error) {
      console.error(error);
      setError(error.message || t.login.errorDefault);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <div className="login-info">
          <div className="login-top-row">
            <Link to="/" className="login-brand-link">
              {t.login.brand}
            </Link>

            <button
              type="button"
              className="login-language-btn"
              onClick={toggleLanguage}
            >
              {language === "es" ? "EN" : "ES"}
            </button>
          </div>

          <h1>{t.login.title}</h1>

          <p>{t.login.description}</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-form-header">
            <h2>{t.login.formTitle}</h2>
            <p>{t.login.formSubtitle}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>{t.login.email}</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t.login.emailPlaceholder}
              required
            />
          </div>

          <div className="form-group">
            <label>{t.login.password}</label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t.login.passwordPlaceholder}
              required
            />
          </div>

          <button className="login-submit" disabled={loading}>
            {loading ? t.login.loading : t.login.submit}
          </button>

          <p className="login-register-link">
            {t.login.noAccount}{" "}
            <Link to="/register">{t.login.registerHere}</Link>
          </p>
        </form>
      </div>
    </section>
  );
};