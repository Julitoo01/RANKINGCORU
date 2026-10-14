import { useEffect, useState } from "react";
import { authFetch } from "../../utils/authFetch";
import { translations } from "../../i18n/translations";

export const AdminRules = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

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
      setError(error.message || t.adminRules.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
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
      setError(t.adminRules.titleRequired);
      return;
    }

    if (!formData.content.trim()) {
      setError(t.adminRules.contentRequired);
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

      setMessage(t.adminRules.saveSuccess);
    } catch (error) {
      console.error(error);
      setError(error.message || t.adminRules.saveError);
    } finally {
      setSaving(false);
    }
  };

  const rulesPreview = getRulesPreview();

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">{t.adminRules.heroKicker}</span>

          <h1>{t.adminRules.title}</h1>

          <p>{t.adminRules.description}</p>
        </div>

        <div className="admin-hero-card">
          <span>{t.adminRules.heroCardTitle}</span>
          <strong>📋</strong>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="admin-state">
          <p>{t.adminRules.loading}</p>
        </div>
      ) : (
        <div className="admin-rules-layout">
          <form className="admin-rules-form-card" onSubmit={saveRules}>
            <div className="admin-rules-form-header">
              <div>
                <span className="section-kicker">{t.adminRules.editKicker}</span>

                <h2>{t.adminRules.editTitle}</h2>

                <p>{t.adminRules.editDescription}</p>
              </div>
            </div>

            <div className="form-group">
              <label>{t.adminRules.titleLabel}</label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t.adminRules.titlePlaceholder}
              />
            </div>

            <div className="form-group">
              <label>{t.adminRules.contentLabel}</label>

              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder={t.adminRules.contentPlaceholder}
                rows="18"
              />
            </div>

            <div className="admin-rules-footer">
              <div>
                <span>
                  {formData.content.length} {t.adminRules.characters}
                </span>
                <span>
                  {rulesPreview.length} {t.adminRules.blocksDetected}
                </span>
              </div>

              <button
                className="upload-result-submit-btn"
                type="submit"
                disabled={saving}
              >
                {saving ? t.adminRules.saving : t.adminRules.save}
              </button>
            </div>
          </form>

          <aside className="admin-rules-side-panel">
            <div className="admin-rules-help-card">
              <span className="section-kicker">{t.adminRules.formatKicker}</span>

              <h3>{t.adminRules.formatTitle}</h3>

              <div>
                <span>{t.adminRules.formatLine1}</span>
                <span>{t.adminRules.formatLine2}</span>
                <span>{t.adminRules.formatLine3}</span>
                <span>{t.adminRules.formatLine4}</span>
              </div>
            </div>

            <div className="admin-rules-preview-card">
              <span className="section-kicker">{t.adminRules.previewKicker}</span>

              <h3>{formData.title || t.adminRules.previewTitleFallback}</h3>

              {rulesPreview.length === 0 ? (
                <p className="admin-rules-preview-empty">
                  {t.adminRules.previewEmpty}
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
                  + {rulesPreview.length - 5} {t.adminRules.moreRules}
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};