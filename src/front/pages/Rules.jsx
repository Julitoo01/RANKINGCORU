import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import { translations } from "../i18n/translations";

export const Rules = () => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL &&
    import.meta.env.VITE_BACKEND_URL !== "undefined"
      ? import.meta.env.VITE_BACKEND_URL
      : window.location.origin;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language];

  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const loadRules = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/rules`);

      if (!data) return;

      setRules(data);
    } catch (error) {
      console.error(error);
      setError(error.message || t.rulesLoadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const parseRulesIntoCards = (content) => {
    if (!content) return [];

    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const cards = [];
    let currentCard = null;

    lines.forEach((line) => {
      const numberedMatch = line.match(/^(\d+)[.)]\s*(.*)$/);

      if (numberedMatch) {
        if (currentCard) {
          cards.push(currentCard);
        }

        currentCard = {
          number: numberedMatch[1],
          title: numberedMatch[2] || `${t.ruleFallbackTitle} ${numberedMatch[1]}`,
          content: [],
        };
      } else if (currentCard) {
        currentCard.content.push(line);
      } else {
        currentCard = {
          number: cards.length + 1,
          title: line,
          content: [],
        };
      }
    });

    if (currentCard) {
      cards.push(currentCard);
    }

    return cards;
  };

  const formatDate = (date) => {
    if (!date) return null;

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toLocaleDateString(language === "es" ? "es-ES" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const ruleCards = parseRulesIntoCards(rules?.content);
  const updatedAt = formatDate(rules?.updated_at);

  return (
    <section className="rules-page">
      <div className="rules-hero">
        <div>
          <span>{t.appName}</span>
          <h1>{t.rulesTitle}</h1>

          <p className="desktop-text">{t.rulesHeroText}</p>
          <p className="mobile-text">{t.rulesHeroTextMobile}</p>
        </div>

        <div className="rules-hero-card">
          <strong>{t.rulesHeroCardTitle}</strong>
          <span>{t.rulesHeroCardText}</span>
        </div>
      </div>

      {loading && (
        <div className="rules-state">
          <p>{t.loadingRules}</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && rules && (
        <div className="rules-content-card">
          <div className="rules-content-header">
            <div>
              <span>{t.officialRules}</span>
              <h2>{rules.title || t.rulesDefaultTitle}</h2>

              {updatedAt && (
                <p>
                  {t.lastUpdate}: {updatedAt}
                </p>
              )}
            </div>
          </div>

          {ruleCards.length > 0 ? (
            <div className="rules-cards-list">
              {ruleCards.map((rule) => (
                <article key={rule.number} className="rules-card-item">
                  <div className="rules-card-number">{rule.number}</div>

                  <div className="rules-card-content">
                    <h3>{rule.title}</h3>

                    {rule.content.length > 0 && (
                      <div>
                        {rule.content.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rules-empty">
              <h2>{t.noRulesYet}</h2>
              <p>{t.noRulesYetText}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};