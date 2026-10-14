import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "../i18n/translations";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;

export const Register = () => {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    nickname: "",
    email: "",
    password: "",
    phone: "",
    instagram: "",
    level: "",
    position: "",
    terms_accepted: false,
    privacy_accepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPendingModal, setShowPendingModal] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const levels = [
    {
      value: "Iniciación",
      label: t.register.levelInitiation,
    },
    {
      value: "Bronce",
      label: t.register.levelBronze,
    },
    {
      value: "Plata",
      label: t.register.levelSilver,
    },
    {
      value: "Oro",
      label: t.register.levelGold,
    },
    {
      value: "Diamante",
      label: t.register.levelDiamond,
    },
    {
      value: "No lo sé / quiero que me valoréis",
      label: t.register.levelUnknown,
    },
  ];

  const positions = [
    {
      value: "Derecha",
      label: t.register.positionRight,
    },
    {
      value: "Revés",
      label: t.register.positionBackhand,
    },
    {
      value: "Ambas",
      label: t.register.positionBoth,
    },
    {
      value: "No lo sé",
      label: t.register.positionUnknown,
    },
  ];

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
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (!backendUrl) {
      setError(t.register.backendMissing);
      setLoading(false);
      return;
    }

    if (!formData.terms_accepted || !formData.privacy_accepted) {
      setError(t.register.legalError);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          last_name: formData.last_name,
          nickname: formData.nickname,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          instagram: formData.instagram,
          level: formData.level,
          position: formData.position,
          terms_accepted: formData.terms_accepted,
          privacy_accepted: formData.privacy_accepted,
        }),
      });

      const contentType = response.headers.get("content-type");

      let data = null;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error(
          `${t.register.noJson} ${backendUrl}/api/register. Status: ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(data.msg || t.register.registerFailed);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user?.profile) {
        localStorage.setItem("profile", JSON.stringify(data.user.profile));
      }

      setMessage(t.register.success);
      setShowPendingModal(true);
    } catch (error) {
      console.error(error);
      setError(error.message || t.register.registerError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToProfile = () => {
    setShowPendingModal(false);
    navigate("/profile");
  };

  return (
    <>
      <section className="register-page">
        <div className="register-layout register-layout-clean">
          <form className="register-form register-form-clean" onSubmit={handleRegister}>
            <div className="register-form-header">
              <h2>{t.register.title}</h2>
              <p>{t.register.subtitle}</p>
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="register-form-grid">
              <div className="form-group">
                <label>{t.register.name}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t.register.namePlaceholder}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.register.lastName}</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder={t.register.lastNamePlaceholder}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.register.nickname}</label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder={t.register.nicknamePlaceholder}
                  required
                />
                <small>{t.register.nicknameHelp}</small>
              </div>

              <div className="form-group">
                <label>{t.register.email}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t.register.emailPlaceholder}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.register.password}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t.register.passwordPlaceholder}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.register.phone}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t.register.phonePlaceholder}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.register.instagram}</label>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder={t.register.instagramPlaceholder}
                />
              </div>

              <div className="form-group">
                <label>{t.register.level}</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t.register.levelPlaceholder}</option>
                  {levels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t.register.position}</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t.register.positionPlaceholder}</option>
                  {positions.map((position) => (
                    <option key={position.value} value={position.value}>
                      {position.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="register-legal-box">
              <label className="register-legal-check">
                <input
                  type="checkbox"
                  name="terms_accepted"
                  checked={formData.terms_accepted}
                  onChange={handleChange}
                  required
                />
                <span>
                  {t.register.termsPrefix}{" "}
                  <button
                    type="button"
                    className="register-legal-link"
                    onClick={() => setShowTermsModal(true)}
                  >
                    {t.register.termsLink}
                  </button>
                  .
                </span>
              </label>

              <label className="register-legal-check">
                <input
                  type="checkbox"
                  name="privacy_accepted"
                  checked={formData.privacy_accepted}
                  onChange={handleChange}
                  required
                />
                <span>
                  {t.register.privacyPrefix}{" "}
                  <button
                    type="button"
                    className="register-legal-link"
                    onClick={() => setShowPrivacyModal(true)}
                  >
                    {t.register.privacyLink}
                  </button>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="register-submit"
              disabled={
                loading ||
                !formData.terms_accepted ||
                !formData.privacy_accepted
              }
            >
              {loading ? t.register.loading : t.register.submit}
            </button>

            <p className="register-login-text register-login-text-clean">
              {t.register.alreadyAccount}{" "}
              <Link to="/login">{t.register.login}</Link>
            </p>
          </form>
        </div>
      </section>

      {showPendingModal && (
        <div className="register-modal-overlay">
          <div className="register-modal-card">
            <div className="register-modal-icon">✓</div>

            <span>{t.register.pendingKicker}</span>

            <h2>{t.register.pendingTitle}</h2>

            <p>{t.register.pendingText}</p>

            <button
              type="button"
              className="register-modal-btn"
              onClick={handleGoToProfile}
            >
              {t.register.understood}
            </button>
          </div>
        </div>
      )}

      {showTermsModal && (
        <div className="legal-modal-overlay">
          <div className="legal-modal-card">
            <div className="legal-modal-header">
              <h2>{t.register.termsTitle}</h2>

              <button
                type="button"
                className="legal-modal-close"
                onClick={() => setShowTermsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="legal-modal-body">
              <h3>{t.register.terms1Title}</h3>
              <p>{t.register.terms1Text}</p>

              <h3>{t.register.terms2Title}</h3>
              <p>{t.register.terms2Text}</p>

              <h3>{t.register.terms3Title}</h3>
              <p>{t.register.terms3Text}</p>

              <h3>{t.register.terms4Title}</h3>
              <p>{t.register.terms4Text}</p>

              <h3>{t.register.terms5Title}</h3>
              <p>{t.register.terms5Text}</p>

              <h3>{t.register.terms6Title}</h3>
              <p>{t.register.terms6Text}</p>
            </div>

            <button
              type="button"
              className="legal-modal-btn"
              onClick={() => setShowTermsModal(false)}
            >
              {t.register.understood}
            </button>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="legal-modal-overlay">
          <div className="legal-modal-card">
            <div className="legal-modal-header">
              <h2>{t.register.privacyTitle}</h2>

              <button
                type="button"
                className="legal-modal-close"
                onClick={() => setShowPrivacyModal(false)}
              >
                ×
              </button>
            </div>

            <div className="legal-modal-body">
              <h3>{t.register.privacy1Title}</h3>
              <p>{t.register.privacy1Text}</p>

              <h3>{t.register.privacy2Title}</h3>
              <p>{t.register.privacy2Text}</p>

              <h3>{t.register.privacy3Title}</h3>
              <p>{t.register.privacy3Text}</p>

              <h3>{t.register.privacy4Title}</h3>
              <p>{t.register.privacy4Text}</p>

              <h3>{t.register.privacy5Title}</h3>
              <p>{t.register.privacy5Text}</p>

              <h3>{t.register.privacy6Title}</h3>
              <p>{t.register.privacy6Text}</p>
            </div>

            <button
              type="button"
              className="legal-modal-btn"
              onClick={() => setShowPrivacyModal(false)}
            >
              {t.register.understood}
            </button>
          </div>
        </div>
      )}
    </>
  );
};