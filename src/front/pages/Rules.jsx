import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";

export const Rules = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

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
          <h1>Normativa</h1>
          <p>
            Consulta las reglas del ranking, el sistema de puntuación y el
            funcionamiento general de la competición.
          </p>
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
          </div>

          <div className="rules-text">
            {formatContent(rules.content).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="rules-points-card">
          

            
          </div>
        </div>
      )}
    </section>
  );
};