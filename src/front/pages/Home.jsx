import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { translations } from "../i18n/translations";

export const Home = () => {
  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language];

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

  const toggleLanguage = () => {
    const nextLanguage = language === "es" ? "en" : "es";
    setLanguage(nextLanguage);
    localStorage.setItem("language", nextLanguage);
    window.dispatchEvent(new Event("languageChanged"));
  };

  let user = null;

  try {
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("profile");
    user = null;
  }

  const isLogged = Boolean(storedToken) && Boolean(user);

  if (isLogged) {
    return <Navigate to="/ranking" replace />;
  }

  return (
    <section className="fdp-home">
      <button
        type="button"
        className="fdp-language-toggle"
        onClick={toggleLanguage}
        aria-label={t.changeLanguage}
        title={t.changeLanguage}
      >
        {language === "es" ? "EN" : "ES"}
      </button>

      <div className="fdp-hero">
        <div className="fdp-hero-overlay"></div>
        <div className="fdp-shape fdp-shape-left"></div>
        <div className="fdp-shape fdp-shape-right"></div>

        <div className="fdp-hero-content">
          <span className="fdp-kicker">{t.homeKicker}</span>

          <h1>{t.homeTitle}</h1>

          <p className="desktop-text">{t.homeHeroText}</p>
          <p className="mobile-text">{t.homeHeroTextMobile}</p>

          <div className="fdp-hero-buttons">
            <Link to="/register" className="fdp-btn fdp-btn-primary">
              {t.createAccount}
            </Link>

            <Link to="/login" className="home-premium-btn secondary">
              {t.login}
            </Link>
          </div>
        </div>
      </div>

      <div className="fdp-content">
        <section className="fdp-intro">
          <span>{t.whatIsTitle}</span>

          <h2>{t.whatIsSubtitle}</h2>

          <p className="desktop-text">{t.whatIsText}</p>
          <p className="mobile-text">{t.whatIsTextMobile}</p>
        </section>

        <section className="fdp-cards">
          <article className="fdp-card">
            <div className="fdp-card-number">01</div>

            <h3>{t.homeCard1Title}</h3>

            <p className="desktop-text">{t.homeCard1Text}</p>
            <p className="mobile-text">{t.homeCard1TextMobile}</p>
          </article>

          <article className="fdp-card">
            <div className="fdp-card-number">02</div>

            <h3>{t.homeCard2Title}</h3>

            <p className="desktop-text">{t.homeCard2Text}</p>
            <p className="mobile-text">{t.homeCard2TextMobile}</p>
          </article>

          <article className="fdp-card">
            <div className="fdp-card-number">03</div>

            <h3>{t.homeCard3Title}</h3>

            <p className="desktop-text">{t.homeCard3Text}</p>
            <p className="mobile-text">{t.homeCard3TextMobile}</p>
          </article>
        </section>

        <section className="fdp-how">
          <div className="fdp-how-title">
            <span>{t.howItWorks}</span>

            <h2>{t.howItWorksTitle}</h2>
          </div>

          <div className="fdp-steps">
            <div className="fdp-step">
              <strong>1</strong>
              <p>{t.step1}</p>
            </div>

            <div className="fdp-step">
              <strong>2</strong>
              <p>{t.step2}</p>
            </div>

            <div className="fdp-step">
              <strong>3</strong>
              <p>{t.step3}</p>
            </div>

            <div className="fdp-step">
              <strong>4</strong>
              <p>{t.step4}</p>
            </div>

            <div className="fdp-step">
              <strong>5</strong>
              <p>{t.step5}</p>
            </div>
          </div>
        </section>

        <section className="fdp-extra">
          <div className="fdp-extra-card">
            <span>{t.forPlayers}</span>
            <h3>{t.forPlayersTitle}</h3>

            <p className="desktop-text">{t.forPlayersText}</p>
            <p className="mobile-text">{t.forPlayersTextMobile}</p>
          </div>

          <div className="fdp-extra-card">
            <span>{t.forCompeting}</span>
            <h3>{t.forCompetingTitle}</h3>

            <p className="desktop-text">{t.forCompetingText}</p>
            <p className="mobile-text">{t.forCompetingTextMobile}</p>
          </div>
        </section>

        <section className="fdp-final">
          <span>{t.startNow}</span>

          <h2>{t.finalTitle}</h2>

          <p className="desktop-text">{t.finalText}</p>
          <p className="mobile-text">{t.finalTextMobile}</p>

          <div className="fdp-final-actions">
            <Link to="/register" className="fdp-btn fdp-btn-primary">
              {t.createAccount}
            </Link>

            <Link to="/login" className="fdp-btn fdp-btn-secondary">
              {t.alreadyHaveAccount}
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
};