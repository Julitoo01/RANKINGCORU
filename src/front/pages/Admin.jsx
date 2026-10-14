import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../../utils/authFetch";
import { translations } from "../../i18n/translations";

export const Admin = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Error leyendo user de localStorage:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("profile");
    user = null;
  }

  const [nextSeasonName, setNextSeasonName] = useState("");
  const [closingSeason, setClosingSeason] = useState(false);
  const [message, setMessage] = useState("");
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

  const closeSeason = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!nextSeasonName.trim()) {
      setError(t.admin.seasonNameRequired);
      return;
    }

    const confirmClose = window.confirm(
      `${t.admin.closeSeasonConfirmStart} "${nextSeasonName}"? ${t.admin.closeSeasonConfirmEnd}`
    );

    if (!confirmClose) return;

    try {
      setClosingSeason(true);

      const data = await authFetch(`${backendUrl}/api/admin/seasons/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          next_season_name: nextSeasonName.trim(),
        }),
      });

      if (!data) return;

      setMessage(
        `${t.admin.closeSeasonSuccess} ${
          data.new_season?.name || nextSeasonName
        }`
      );

      setNextSeasonName("");
    } catch (error) {
      console.error(error);
      setError(error.message || t.admin.closeSeasonError);
    } finally {
      setClosingSeason(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">{t.admin.kicker}</span>

          <h1>{t.admin.title}</h1>

          <p>{t.admin.description}</p>
        </div>

        <div className="admin-hero-card">
          <span>{t.admin.administrator}</span>
          <strong>{user?.nickname || user?.name || t.admin.defaultAdmin}</strong>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admin-dashboard-grid">
        <Link to="/admin/players" className="admin-dashboard-card">
          <div className="admin-card-top">
            <div className="admin-card-icon">👥</div>
            <span>{t.admin.playersKicker}</span>
          </div>

          <h2>{t.admin.playersTitle}</h2>

          <p>{t.admin.playersText}</p>

          <strong>{t.admin.enter}</strong>
        </Link>

        <Link to="/admin/open-matches" className="admin-dashboard-card">
          <div className="admin-card-top">
            <div className="admin-card-icon">📅</div>
            <span>{t.admin.openMatchesKicker}</span>
          </div>

          <h2>{t.admin.openMatchesTitle}</h2>

          <p>{t.admin.openMatchesText}</p>

          <strong>{t.admin.enter}</strong>
        </Link>

        <Link to="/admin/matches" className="admin-dashboard-card">
          <div className="admin-card-top">
            <div className="admin-card-icon">🎾</div>
            <span>{t.admin.resultsKicker}</span>
          </div>

          <h2>{t.admin.resultsTitle}</h2>

          <p>{t.admin.resultsText}</p>

          <strong>{t.admin.enter}</strong>
        </Link>

        <Link to="/admin/rules" className="admin-dashboard-card">
          <div className="admin-card-top">
            <div className="admin-card-icon">📋</div>
            <span>{t.admin.rulesKicker}</span>
          </div>

          <h2>{t.admin.rulesTitle}</h2>

          <p>{t.admin.rulesText}</p>

          <strong>{t.admin.enter}</strong>
        </Link>
      </div>

      <div className="admin-control-grid">
        <div className="admin-season-card">
          <div className="admin-season-content">
            <div className="admin-season-icon">🏆</div>

            <div>
              <span className="section-kicker">{t.admin.seasonsKicker}</span>

              <h2>{t.admin.closeQuarterTitle}</h2>

              <p>{t.admin.closeQuarterText}</p>
            </div>
          </div>

          <form className="admin-season-form" onSubmit={closeSeason}>
            <label>{t.admin.newSeasonName}</label>

            <input
              type="text"
              value={nextSeasonName}
              onChange={(event) => setNextSeasonName(event.target.value)}
              placeholder={t.admin.newSeasonPlaceholder}
            />

            <button type="submit" disabled={closingSeason}>
              {closingSeason ? t.admin.closing : t.admin.closeSeason}
            </button>
          </form>
        </div>

        <div className="admin-help-card">
          <span className="section-kicker">{t.admin.checklistKicker}</span>

          <h2>{t.admin.checklistTitle}</h2>

          <div className="admin-checklist">
            <p>{t.admin.checklist1}</p>
            <p>{t.admin.checklist2}</p>
            <p>{t.admin.checklist3}</p>
            <p>{t.admin.checklist4}</p>
            <p>{t.admin.checklist5}</p>
          </div>
        </div>
      </div>
    </section>
  );
};