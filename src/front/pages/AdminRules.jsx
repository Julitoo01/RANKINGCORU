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

  const getRulesPreview = () => {
    if (!formData.content.trim()) return [];

    return formData.content
      .split(/\n\s*\n/)
      .map((rule) => rule.trim())
      .filter(Boolean);
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

  const rulesPreview = getRulesPreview();

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Panel admin</span>

          <h1>Normas</h1>

          <p>
            Edita las normas que verán los jugadores en la sección pública de
            normativa. Mantén el texto claro, directo y fácil de entender.
          </p>
        </div>

        <div className="admin-hero-card">
          <span>Normativa</span>
          <strong>📋</strong>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="admin-state">
          <p>Cargando normas...</p>
        </div>
      ) : (
        <div className="admin-rules-layout">
          <form className="admin-rules-form-card" onSubmit={saveRules}>
            <div className="admin-rules-form-header">
              <div>
                <span className="section-kicker">Editar</span>

                <h2>Editar normativa</h2>

                <p>
                  Escribe cada norma separada por un espacio en blanco. Cada
                  bloque aparecerá como una card independiente para los
                  jugadores.
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

            <div className="admin-rules-footer">
              <div>
                <span>{formData.content.length} caracteres</span>
                <span>{rulesPreview.length} bloques detectados</span>
              </div>

              <button
                className="upload-result-submit-btn"
                type="submit"
                disabled={saving}
              >
                {saving ? "Guardando normas..." : "Guardar normas"}
              </button>
            </div>
          </form>

          <aside className="admin-rules-side-panel">
            <div className="admin-rules-help-card">
              <span className="section-kicker">Formato</span>

              <h3>Formato recomendado</h3>

              <div>
                <span>1. Primera norma</span>
                <span>2. Segunda norma</span>
                <span>3. Tercera norma</span>
                <span>Deja una línea en blanco entre normas</span>
              </div>
            </div>

            <div className="admin-rules-preview-card">
              <span className="section-kicker">Vista previa</span>

              <h3>{formData.title || "Título de las normas"}</h3>

              {rulesPreview.length === 0 ? (
                <p className="admin-rules-preview-empty">
                  Escribe normas para ver una vista previa.
                </p>
              ) : (
                <div className="admin-rules-preview-list">
                  {rulesPreview.slice(0, 5).map((rule, index) => (
                    <div key={`${rule}-${index}`}>
                      <strong>{index + 1}</strong>
                      <p>{rule}</p>
                    </div>
                  ))}
                </div>
              )}

              {rulesPreview.length > 5 && (
                <p className="admin-rules-preview-more">
                  + {rulesPreview.length - 5} normas más
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};