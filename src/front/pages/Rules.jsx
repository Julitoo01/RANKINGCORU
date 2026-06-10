import { useEffect, useState } from "react";

export const Rules = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRules = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${backendUrl}/api/rules`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudieron cargar las normas");
      }

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

  const formatDate = (date) => {
    if (!date) return null;

    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const renderRulesContent = (content) => {
    if (!content) return null;

    return content.split("\n").map((line, index) => {
      if (!line.trim()) {
        return <br key={index} />;
      }

      return <p key={index}>{line}</p>;
    });
  };

  return (
    <section className="rules-page">
      <div className="rules-hero">
        <div>
          <span>Fuera de Pista</span>
          <h1>Normas del ranking</h1>
          <p>
            Consulta el funcionamiento del ranking, el sistema de puntos y las
            reglas básicas para participar.
          </p>
        </div>

        <div className="rules-hero-card">
          <span>Ranking individual</span>
        </div>
      </div>

      <div className="rules-layout">
        <aside className="rules-side-card">
          <h2>Resumen rápido</h2>

          <div className="rules-summary-list">
           

            <div>
              <strong>Ranking</strong>
              <span>Clasificación individual</span>
            </div>

            <div>
              <strong>Niveles</strong>
              <span>Iniciación, Bronce, Plata, Oro y Diamante</span>
            </div>

            <div>
              <strong>Resultados</strong>
              <span>Los jugadores suben el marcador desde la web</span>
            </div>
          </div>

          <div className="rules-points-box">
            <h3>Puntuación</h3>

            <div className="rules-points-grid">
              <div>
                <strong>+3</strong>
                <span>Victoria</span>
              </div>

              <div>
                <strong>+1</strong>
                <span>Derrota</span>
              </div>

              <div>
                <strong>-2</strong>
                <span>No show</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="rules-main-card">
          {loading && (
            <div className="rules-state">
              <p>Cargando normas...</p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {!loading && !error && rules && (
            <>
              <div className="rules-content-header">
                <span>Normativa oficial</span>
                <h2>{rules.title || "Normas de Fuera de Pista"}</h2>

                {rules.updated_at && (
                  <p>Última actualización: {formatDate(rules.updated_at)}</p>
                )}
              </div>

              <div className="rules-content">
                {renderRulesContent(rules.content)}
              </div>
            </>
          )}

          {!loading && !error && !rules && (
            <div className="rules-empty">
              <h2>No hay normas publicadas todavía</h2>
              <p>
                Cuando el administrador añada las normas, aparecerán en esta
                página.
              </p>
            </div>
          )}
        </main>
      </div>

      <div className="rules-extra-grid">
        <article>
          <span>01</span>
          <h3>Respeto y puntualidad</h3>
          <p>
            El objetivo es competir, pero también crear una comunidad sana y
            agradable para todos los jugadores.
          </p>
        </article>

        <article>
          <span>02</span>
          <h3>Resultados claros</h3>
          <p>
            El marcador debe subirse correctamente para que el ranking refleje
            los puntos de cada jugador.
          </p>
        </article>

        <article>
          <span>03</span>
          <h3>Partidos equilibrados</h3>
          <p>
            Los niveles ayudan a que cada partido sea competitivo y justo para
            todos los participantes.
          </p>
        </article>
      </div>
    </section>
  );
};