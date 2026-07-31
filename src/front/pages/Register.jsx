import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "../i18n/translations";

export const Register = () => {
  const navigate = useNavigate();

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL &&
    import.meta.env.VITE_BACKEND_URL !== "undefined"
      ? import.meta.env.VITE_BACKEND_URL
      : window.location.origin;

  const stcPhoneDisplay = "+966 54 421 0879";
  const stcPhoneCopy = "+966544210879";

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language];

  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    nickname: "",
    email: "",
    password: "",
    phone: "",
    terms_accepted: false,
    privacy_accepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [registeredNickname, setRegisteredNickname] = useState("");

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

  const copyToClipboard = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(successMessage);
    } catch (error) {
      console.error(error);
      setError(t.copyError);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (!formData.terms_accepted || !formData.privacy_accepted) {
      setError(t.termsRequired);
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
          ...formData,
          level: "No lo sé / quiero que me valoréis",
          position: "Ambas",
        }),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(t.registerGenericError);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || t.registerError);
      }

      const user = data.user;
      const profile = data.profile || data.user?.profile || null;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(user));

      if (profile) {
        localStorage.setItem("profile", JSON.stringify(profile));
      } else {
        localStorage.removeItem("profile");
      }

      setRegisteredNickname(formData.nickname.trim());
      setMessage(t.registerSuccess);
      setShowPendingModal(true);
    } catch (error) {
      console.error(error);
      setError(error.message || t.registerGenericError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRanking = () => {
    setShowPendingModal(false);
    navigate("/ranking");
  };

  return (
    <>
      <section className="register-page">
        <div className="register-hero">
          <span>{t.registerKicker}</span>
          <h1>{t.registerTitle}</h1>

          <p className="desktop-text">{t.registerText}</p>
          <p className="mobile-text">{t.registerTextMobile}</p>
        </div>

        <div className="register-layout">
          <aside className="register-info">
            <h2>{t.playerProfileTitle}</h2>

            <p className="desktop-text">{t.playerProfileText}</p>
            <p className="mobile-text">{t.playerProfileTextMobile}</p>

            <div className="register-info-list">
              <div>
                <strong>{t.registerInfoRankingTitle}</strong>
                <span>{t.registerInfoRankingText}</span>
              </div>

              <div>
                <strong>{t.registerInfoLevelTitle}</strong>
                <span>{t.registerInfoLevelText}</span>
              </div>

              <div>
                <strong>{t.registerInfoApprovalTitle}</strong>
                <span>{t.registerInfoApprovalText}</span>
              </div>
            </div>

            <p className="register-login-text">
              {t.alreadyRegistered} <Link to="/login">{t.loginHere}</Link>
            </p>
          </aside>

          <form className="register-form" onSubmit={handleRegister}>
            <div className="register-form-header">
              <h2>{t.registerFormTitle}</h2>
              <p>{t.registerFormSubtitle}</p>
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="register-form-grid">
              <div className="form-group">
                <label>{t.nameLabel}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t.namePlaceholder}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.lastNameLabel}</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder={t.lastNamePlaceholder}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.nicknameLabel}</label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder={t.nicknamePlaceholder}
                  required
                />
                <small>{t.nicknameHelp}</small>
              </div>

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

              <div className="form-group">
                <label>{t.phoneLabel}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t.phonePlaceholder}
                  required
                />
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
                  {t.termsText}{" "}
                  <Link to="/terms" target="_blank">
                    {t.termsLink}
                  </Link>
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
                  {t.privacyText}{" "}
                  <Link to="/privacy" target="_blank">
                    {t.privacyLink}
                  </Link>
                  .
                </span>
              </label>
            </div>

            <button
              className="register-submit"
              disabled={
                loading ||
                !formData.terms_accepted ||
                !formData.privacy_accepted
              }
            >
              {loading ? t.creatingAccount : t.sendRegistration}
            </button>
          </form>
        </div>
      </section>

      {showPendingModal && (
        <div className="register-modal-overlay">
          <div className="register-modal-card">
            <div className="register-modal-icon">✓</div>

            <span>{t.registrationCompleted}</span>

            <h2>{t.stcPaymentPendingTitle}</h2>

            <p>
              {t.stcPaymentIntro} <strong>{t.stcPaymentAmount}</strong>{" "}
              {t.stcPaymentByStcPay}
            </p>

            <div
              style={{
                margin: "1rem 0",
                padding: "1rem",
                borderRadius: "18px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                textAlign: "left",
              }}
            >
              <p style={{ margin: "0 0 0.35rem" }}>
                <strong>{t.stcPaymentSendTo}</strong>
              </p>

              <p
                style={{
                  margin: "0 0 0.9rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                {t.stcPaymentName}
              </p>

              <p style={{ margin: "0 0 0.35rem" }}>
                <strong>{t.stcPaymentPhoneLabel}</strong>
              </p>

              <p
                style={{
                  margin: "0 0 0.6rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                {stcPhoneDisplay}
              </p>

              <button
                type="button"
                onClick={() => copyToClipboard(stcPhoneCopy, t.phoneCopied)}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "999px",
                  padding: "0.75rem 1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: "0.9rem",
                  background: "#e5e7eb",
                  color: "#111827",
                }}
              >
                {t.copyPhone}
              </button>

              <p style={{ margin: "0 0 0.35rem" }}>
                <strong>{t.stcPaymentQuantityLabel}</strong>
              </p>

              <p
                style={{
                  margin: "0 0 0.9rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                {t.stcPaymentAmount}
              </p>

              <p style={{ margin: "0 0 0.35rem" }}>
                <strong>{t.stcPaymentReferenceLabel}</strong>
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                {registeredNickname || formData.nickname}
              </p>
            </div>

            <p>{t.stcPaymentFinalText}</p>

            <button
              type="button"
              className="register-modal-btn"
              onClick={handleGoToRanking}
            >
              {t.understood}
            </button>
          </div>
        </div>
      )}
    </>
  );
};