import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { translations } from "../i18n/translations";

export const Terms = () => {
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
        <span>{t.terms.kicker}</span>
        <h1>{t.terms.title}</h1>
        <p>{t.terms.description}</p>
      </div>

      <div className="legal-card">
        <div className="legal-updated">{t.terms.updated}</div>

        <div className="legal-section">
          <h2>{t.terms.section1Title}</h2>
          <p>{t.terms.section1Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.terms.section2Title}</h2>
          <p>{t.terms.section2Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.terms.section3Title}</h2>
          <p>{t.terms.section3Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.terms.section4Title}</h2>
          <p>{t.terms.section4Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.terms.section5Title}</h2>
          <p>{t.terms.section5Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.terms.section6Title}</h2>
          <p>{t.terms.section6Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.terms.section7Title}</h2>
          <p>{t.terms.section7Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.terms.section8Title}</h2>
          <p>{t.terms.section8Text}</p>
        </div>

        <div className="legal-section">
          <h2>{t.terms.section9Title}</h2>
          <p>{t.terms.section9Text}</p>
        </div>

        <div className="legal-actions">
          <Link to="/register" className="legal-back-btn">
            {t.terms.backToRegister}
          </Link>
        </div>
      </div>
    </section>
  );
};