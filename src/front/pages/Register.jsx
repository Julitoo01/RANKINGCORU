import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL;

export const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    nickname: "",
    email: "",
    password: "",
    phone: "",
    instagram: "",
    level: "",
    position: "",
    terms_accepted: false,
    privacy_accepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPendingModal, setShowPendingModal] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const levels = [
    "Iniciación",
    "Bronce",
    "Plata",
    "Oro",
    "Diamante",
    "No lo sé / quiero que me valoréis",
  ];

  const positions = ["Derecha", "Revés", "Ambas", "No lo sé"];

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (!backendUrl) {
      setError("No se ha configurado la URL del backend en el archivo .env.");
      setLoading(false);
      return;
    }

    if (!formData.terms_accepted || !formData.privacy_accepted) {
      setError(
        "Debes aceptar los Términos y Condiciones y la Política de Privacidad para registrarte."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          last_name: formData.last_name,
          nickname: formData.nickname,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          instagram: formData.instagram,
          level: formData.level,
          position: formData.position,
          terms_accepted: formData.terms_accepted,
          privacy_accepted: formData.privacy_accepted,
        }),
      });

      const contentType = response.headers.get("content-type");

      let data = null;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error(
          `El servidor no devolvió JSON. URL llamada: ${backendUrl}/api/register. Status: ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo completar el registro");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user?.profile) {
        localStorage.setItem("profile", JSON.stringify(data.user.profile));
      }

      setMessage("Registro completado correctamente.");
      setShowPendingModal(true);
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToProfile = () => {
    setShowPendingModal(false);
    navigate("/profile");
  };

  return (
    <>
      <section className="register-page">
        <div className="register-layout register-layout-clean">
          <form className="register-form register-form-clean" onSubmit={handleRegister}>
            <div className="register-form-header">
              <h2>Crear cuenta</h2>
              <p>Rellena tus datos para enviar tu inscripción.</p>
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="register-form-grid">
              <div className="form-group">
                <label>Nombre real</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Julio"
                  required
                />
              </div>

              <div className="form-group">
                <label>Apellidos</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Ej. Lapuente"
                  required
                />
              </div>

              <div className="form-group">
                <label>Nickname</label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder="Ej. Julito10"
                  required
                />
                <small>Este será tu nombre público en el ranking.</small>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tuemail@gmail.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Crea una contraseña"
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ej. 600 000 000"
                  required
                />
              </div>

              <div className="form-group">
                <label>Instagram</label>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="Ej. @julito10"
                />
              </div>

              <div className="form-group">
                <label>Nivel aproximado</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona tu nivel</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Posición</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona tu posición</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="register-legal-box">
              <label className="register-legal-check">
                <input
                  type="checkbox"
                  name="terms_accepted"
                  checked={formData.terms_accepted}
                  onChange={handleChange}
                  required
                />
                <span>
                  He leído y acepto los{" "}
                  <button
                    type="button"
                    className="register-legal-link"
                    onClick={() => setShowTermsModal(true)}
                  >
                    Términos y Condiciones
                  </button>
                  .
                </span>
              </label>

              <label className="register-legal-check">
                <input
                  type="checkbox"
                  name="privacy_accepted"
                  checked={formData.privacy_accepted}
                  onChange={handleChange}
                  required
                />
                <span>
                  He leído y acepto la{" "}
                  <button
                    type="button"
                    className="register-legal-link"
                    onClick={() => setShowPrivacyModal(true)}
                  >
                    Política de Privacidad
                  </button>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="register-submit"
              disabled={
                loading ||
                !formData.terms_accepted ||
                !formData.privacy_accepted
              }
            >
              {loading ? "Creando cuenta..." : "Enviar inscripción"}
            </button>

            <p className="register-login-text register-login-text-clean">
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </form>
        </div>
      </section>

      {showPendingModal && (
        <div className="register-modal-overlay">
          <div className="register-modal-card">
            <div className="register-modal-icon">✓</div>

            <span>Inscripción enviada</span>

            <h2>Tu perfil todavía no está aprobado</h2>

            <p>
              Podrás apuntarte a partidos cuando el admin apruebe tu
              inscripción.
            </p>

            <button
              type="button"
              className="register-modal-btn"
              onClick={handleGoToProfile}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showTermsModal && (
        <div className="legal-modal-overlay">
          <div className="legal-modal-card">
            <div className="legal-modal-header">
              <h2>Términos y Condiciones</h2>

              <button
                type="button"
                className="legal-modal-close"
                onClick={() => setShowTermsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="legal-modal-body">
              <h3>1. Uso de la plataforma</h3>
              <p>
                Fuera de Pista permite a los jugadores registrarse, formar parte
                de una comunidad de pádel, participar en rankings, apuntarse a
                partidos y consultar resultados.
              </p>

              <h3>2. Registro de usuario</h3>
              <p>
                El usuario se compromete a proporcionar información real,
                actualizada y correcta durante el proceso de inscripción.
              </p>

              <h3>3. Perfil público</h3>
              <p>
                El nickname, nivel, posición y datos deportivos podrán mostrarse
                dentro de la plataforma para organizar partidos y rankings.
              </p>

              <h3>4. Ranking y resultados</h3>
              <p>
                Los resultados introducidos en la plataforma podrán afectar al
                ranking. La organización podrá revisar, corregir o eliminar
                resultados si detecta errores, conflictos o uso indebido.
              </p>

              <h3>5. Conducta</h3>
              <p>
                El usuario se compromete a mantener una actitud respetuosa con
                otros jugadores, administradores y miembros de la comunidad.
              </p>

              <h3>6. Aprobación del perfil</h3>
              <p>
                El perfil podrá quedar pendiente de revisión por parte del admin
                antes de aparecer en el ranking o poder apuntarse a partidos.
              </p>
            </div>

            <button
              type="button"
              className="legal-modal-btn"
              onClick={() => setShowTermsModal(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="legal-modal-overlay">
          <div className="legal-modal-card">
            <div className="legal-modal-header">
              <h2>Política de Privacidad</h2>

              <button
                type="button"
                className="legal-modal-close"
                onClick={() => setShowPrivacyModal(false)}
              >
                ×
              </button>
            </div>

            <div className="legal-modal-body">
              <h3>1. Datos recogidos</h3>
              <p>
                La plataforma puede recoger datos como nombre, apellidos,
                nickname, email, teléfono, Instagram, nivel de juego y posición
                preferida.
              </p>

              <h3>2. Finalidad</h3>
              <p>
                Estos datos se utilizan para gestionar la inscripción, el perfil
                de jugador, el ranking, los partidos, los resultados y las
                notificaciones internas.
              </p>

              <h3>3. Datos visibles</h3>
              <p>
                Algunos datos, como nickname, nivel, posición, resultados y
                posición en el ranking, podrán ser visibles para otros miembros
                de la comunidad.
              </p>

              <h3>4. Acceso de administradores</h3>
              <p>
                Los administradores podrán acceder a la información necesaria
                para gestionar usuarios, aprobar perfiles, organizar partidos y
                resolver incidencias.
              </p>

              <h3>5. Conservación de datos</h3>
              <p>
                Los datos podrán conservarse mientras el usuario forme parte de
                la comunidad o mientras sea necesario para mantener el historial
                deportivo y de participación.
              </p>

              <h3>6. Derechos del usuario</h3>
              <p>
                El usuario puede solicitar la modificación o eliminación de sus
                datos contactando con la organización de la plataforma.
              </p>
            </div>

            <button
              type="button"
              className="legal-modal-btn"
              onClick={() => setShowPrivacyModal(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};