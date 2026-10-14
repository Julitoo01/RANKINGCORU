import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { translations } from "../i18n/translations";

export const Home = () => {
  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

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

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

  if (isLogged) {
    return <Navigate to="/ranking" replace />;
  }

  return (
    <section className="fdp-home">
      <div className="fdp-hero">
        <div className="fdp-hero-overlay"></div>
        <div className="fdp-shape fdp-shape-left"></div>
        <div className="fdp-shape fdp-shape-right"></div>

        <div className="fdp-hero-content">
          <span className="fdp-kicker">{t.home.kicker}</span>

          <h1>{t.home.title}</h1>

          <p>{t.home.description}</p>

          <div className="fdp-hero-buttons">
            <Link to="/register" className="fdp-btn fdp-btn-primary">
              {t.home.createAccount}
            </Link>

            <Link to="/login" className="home-premium-btn secondary">
              {t.home.login}
            </Link>
          </div>
        </div>
      </div>

      <div className="fdp-content">
        <section className="fdp-intro">
          <span>{t.home.introKicker}</span>

          <h2>{t.home.introTitle}</h2>

          <p>{t.home.introText}</p>
        </section>

        <section className="fdp-cards">
          <article className="fdp-card">
            <div className="fdp-card-number">01</div>

            <h3>{t.home.card1Title}</h3>

            <p>{t.home.card1Text}</p>
          </article>

          <article className="fdp-card">
            <div className="fdp-card-number">02</div>

            <h3>{t.home.card2Title}</h3>

            <p>{t.home.card2Text}</p>
          </article>

          <article className="fdp-card">
            <div className="fdp-card-number">03</div>

            <h3>{t.home.card3Title}</h3>

            <p>{t.home.card3Text}</p>
          </article>
        </section>

        <section className="fdp-how">
          <div className="fdp-how-title">
            <span>{t.home.howKicker}</span>

            <h2>{t.home.howTitle}</h2>
          </div>

          <div className="fdp-steps">
            <div className="fdp-step">
              <strong>1</strong>
              <p>{t.home.step1}</p>
            </div>

            <div className="fdp-step">
              <strong>2</strong>
              <p>{t.home.step2}</p>
            </div>

            <div className="fdp-step">
              <strong>3</strong>
              <p>{t.home.step3}</p>
            </div>

            <div className="fdp-step">
              <strong>4</strong>
              <p>{t.home.step4}</p>
            </div>

            <div className="fdp-step">
              <strong>5</strong>
              <p>{t.home.step5}</p>
            </div>
          </div>
        </section>

        <section className="fdp-extra">
          <div className="fdp-extra-card">
            <span>{t.home.playersKicker}</span>

            <h3>{t.home.playersTitle}</h3>

            <p>{t.home.playersText}</p>
          </div>

          <div className="fdp-extra-card">
            <span>{t.home.competeKicker}</span>

            <h3>{t.home.competeTitle}</h3>

            <p>{t.home.competeText}</p>
          </div>
        </section>

        <section className="fdp-final">
          <span>{t.home.finalKicker}</span>

          <h2>{t.home.finalTitle}</h2>

          <p>{t.home.finalText}</p>

          <div className="fdp-final-actions">
            <Link to="/register" className="fdp-btn fdp-btn-primary">
              {t.home.createAccount}
            </Link>

            <Link to="/login" className="fdp-btn fdp-btn-secondary">
              {t.home.alreadyAccount}
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
};