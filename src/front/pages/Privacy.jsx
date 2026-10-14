import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { translations } from "../i18n/translations";

export const Privacy = () => {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

  return (
    <section className="legal-page">
      <div className="legal-hero">
        <span>{t.privacy.kicker}</span>
        <h1>{t.privacy.title}</h1>
        <p>{t.privacy.description}</p>
      </div>

      <div className="legal-card">
        <div className="legal-updated">{t.privacy.updated}</div>

        <div className="legal-section">
          <h2>{t.privacy.section1Title}</h2>
          <p>{t.privacy.section1Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.privacy.section2Title}</h2>
          <p>{t.privacy.section2Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.privacy.section3Title}</h2>
          <p>{t.privacy.section3Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.privacy.section4Title}</h2>
          <p>{t.privacy.section4Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.privacy.section5Title}</h2>
          <p>{t.privacy.section5Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.privacy.section6Title}</h2>
          <p>{t.privacy.section6Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.privacy.section7Title}</h2>
          <p>{t.privacy.section7Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.privacy.section8Title}</h2>
          <p>{t.privacy.section8Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.privacy.section9Title}</h2>
          <p>{t.privacy.section9Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.privacy.section10Title}</h2>
          <p>{t.privacy.section10Text}</p>
        </div>

        <div className="legal-actions">
          <Link to="/register" className="legal-back-btn">
            {t.privacy.backToRegister}
          </Link>
        </div>
      </div>
    </section>
  );
};