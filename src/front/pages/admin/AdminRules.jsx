import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const AdminRules = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    title: "Normas de Fuera de Pista",
    content: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
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

      setFormData({
        title: data.title || "Normas de Fuera de Pista",
        content: data.content || "",
      });
    } catch (error) {
      console.error(error);
      setError(
        "No se pudieron cargar las normas actuales, pero puedes escribir unas nuevas."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${backendUrl}/api/admin/rules`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudieron guardar las normas");
      }

      setMessage("Normas actualizadas correctamente.");
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al guardar normas");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-rules-page">
      <div className="admin-rules-hero">
        <div>
          <span>Panel admin</span>
          <h1>Editar normas</h1>
          <p>
            Escribe y actualiza las normas públicas del ranking. Este contenido
            aparecerá en la página de normas.
          </p>
        </div>

        <div className="admin-rules-hero-card">
          <strong>Rules</strong>
          <span>Contenido público</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admin-rules-layout">
        <aside className="admin-rules-info-card">
          <h2>Guía rápida</h2>

          <div className="admin-rules-info-list">
            <div>
              <strong>Formato</strong>
              <span>Explica cómo se juegan los partidos y cómo funciona el ranking.</span>
            </div>

            <div>
              <strong>Puntuación</strong>
              <span>Victoria +3, derrota +1 y no show -2.</span>
            </div>

            <div>
              <strong>Comunidad</strong>
              <span>Añade normas de respeto, puntualidad y comportamiento.</span>
            </div>
          </div>

          <div className="admin-rules-preview-link">
            <Link to="/rules">Ver página pública →</Link>
          </div>
        </aside>

        <form className="admin-rules-form-card" onSubmit={handleSave}>
          <div className="admin-rules-form-header">
            <h2>Contenido de las normas</h2>
            <p>
              Puedes escribir libremente. Cada salto de línea se mostrará como
              un párrafo separado.
            </p>
          </div>

          {loading && (
            <div className="info-message">
              Cargando normas actuales...
            </div>
          )}

          <div className="admin-rules-form-group">
            <label>Título</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Normas de Fuera de Pista"
              required
            />
          </div>

          <div className="admin-rules-form-group">
            <label>Contenido</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="18"
              placeholder={`Ejemplo:

1. Los partidos se juegan en formato 2 vs 2.
2. El ranking es individual.
3. Victoria: +3 puntos.
4. Derrota: +1 punto.
5. No show: -2 puntos.
6. Los jugadores deben respetar horarios, rivales y normas del club.`}
              required
            />
          </div>

          <div className="admin-rules-actions">
            <button className="admin-rules-save-btn" disabled={saving}>
              {saving ? "Guardando..." : "Guardar normas"}
            </button>

            <Link to="/rules" className="admin-rules-secondary-btn">
              Ver normas
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};