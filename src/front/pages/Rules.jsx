import { useEffect, useState } from "react";

export const Rules = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRules = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${backendUrl}/api/rules`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  const formatContent = (content) => {
    if (!content) return [];

    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  };

  return (
    <section className="rules-page">
      <div className="rules-hero">
        <div>
          <span>Fuera de Pista</span>
          <h1>Normas</h1>
          <p>
            Consulta las reglas del ranking, el sistema de puntuación y el
            funcionamiento general de la competición.
          </p>
        </div>

        <div className="rules-hero-card">
          <strong>2 vs 2</strong>
          <span>Ranking individual</span>
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
            <span>Normativa oficial</span>
            <h2>{rules.title || "Normas de Fuera de Pista"}</h2>
          </div>

          <div className="rules-text">
            {formatContent(rules.content).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="rules-points-card">
            <h3>Sistema de puntos</h3>

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
        </div>
      )}
    </section>
  );
};