import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";

export const Rules = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL !== "undefined" ? import.meta.env.VITE_BACKEND_URL : window.location.origin;

  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRules = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/rules`);

      if (!data) return;

      setRules(data);
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar normas");
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
          title: numberedMatch[2] || `Norma ${numberedMatch[1]}`,
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

    return parsedDate.toLocaleDateString("es-ES", {
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
          <span>Fuera de Pista</span>
          <h1>Normativa</h1>
          <p>
            Consulta las reglas principales del ranking y el funcionamiento de
            los partidos.
          </p>
        </div>

        <div className="rules-hero-card">
          <strong>Ranking</strong>
          <span>Social de pádel</span>
        </div>
      </div>

      {loading && (
        <div className="rules-state">
          <p>Cargando normas...</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && rules && (
        <div className="rules-content-card">
          <div className="rules-content-header">
            <div>
              <span>Normas oficiales</span>
              <h2>{rules.title || "Normas de Fuera de Pista"}</h2>

              {updatedAt && <p>Última actualización: {updatedAt}</p>}
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
              <h2>Todavía no hay normas publicadas</h2>
              <p>
                Cuando el admin escriba las normas del ranking, aparecerán aquí.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};