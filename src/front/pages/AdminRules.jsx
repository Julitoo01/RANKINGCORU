import { useEffect, useState } from "react";
import { authFetch } from "../../utils/authFetch";

export const AdminRules = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRules = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/rules`);

      if (!data) return;

      setFormData({
        title: data.title || "",
        content: data.content || "",
      });
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const saveRules = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!formData.title.trim()) {
      setError("El título de las normas es obligatorio.");
      return;
    }

    if (!formData.content.trim()) {
      setError("El contenido de las normas es obligatorio.");
      return;
    }

    try {
      setSaving(true);

      const data = await authFetch(`${backendUrl}/api/admin/rules`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
        }),
      });

      if (!data) return;

      setMessage("Normas actualizadas correctamente.");
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al guardar normas");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span>Panel admin</span>
          <h1>Normas</h1>
          <p>
            Escribe las normas que verán los jugadores en la sección de
            normativa.
          </p>
        </div>

        <div className="admin-hero-card">
          <strong>📋</strong>
          <span>Normativa</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="admin-state">
          <p>Cargando normas...</p>
        </div>
      ) : (
        <form className="admin-rules-form-card" onSubmit={saveRules}>
          <div className="admin-rules-form-header">
            <div>
              <h2>Editar normativa</h2>
              <p>
                Escribe cada norma empezando por un número: 1., 2., 3. Cada
                punto aparecerá como una card independiente para los jugadores.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>Título</label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej: Normas de Fuera de Pista"
            />
          </div>

          <div className="form-group">
            <label>Contenido</label>

            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder={`Ejemplo:

1. Los jugadores deberán apuntarse desde la sección Jugar.

2. Cuando haya 4 jugadores, el partido se cerrará automáticamente.

3. Uno de los jugadores deberá subir el resultado al terminar.`}
              rows="18"
            />
          </div>

          <div className="admin-rules-help-card">
            <h3>Formato recomendado</h3>

            <div>
              <span>1. Primera norma</span>
              <span>2. Segunda norma</span>
              <span>3. Tercera norma</span>
              <span>Cada punto será una card</span>
            </div>
          </div>

          <button className="upload-result-submit-btn" disabled={saving}>
            {saving ? "Guardando normas..." : "Guardar normas"}
          </button>
        </form>
      )}
    </section>
  );
};