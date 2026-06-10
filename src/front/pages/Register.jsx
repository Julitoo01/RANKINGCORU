import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const Register = () => {
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

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
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${backendUrl}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo completar el registro");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("profile", JSON.stringify(data.profile));

      setMessage("Registro completado correctamente.");
      navigate("/profile");
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="register-page">
      <div className="register-hero">
        <span>Fuera de Pista · A Coruña</span>
        <h1>Únete al ranking</h1>
        <p>
          Crea tu perfil, entra en la comunidad y empieza a competir en partidos
          de pádel por niveles.
        </p>
      </div>

      <div className="register-layout">
        <aside className="register-info">
          <h2>Tu perfil de jugador</h2>

          <p>
            Estos datos nos ayudan a organizar partidos equilibrados y a mostrar
            tu perfil correctamente dentro del ranking.
          </p>

          <div className="register-info-list">
            <div>
              <strong>Ranking individual</strong>
              <span>Tu nickname será el nombre público en la clasificación.</span>
            </div>

            <div>
              <strong>Partidos por nivel</strong>
              <span>El nivel ayuda a crear partidos más igualados.</span>
            </div>

            <div>
              <strong>Aprobación admin</strong>
              <span>
                El perfil podrá ser revisado antes de aparecer en el ranking.
              </span>
            </div>
          </div>

          <p className="register-login-text">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </aside>

        <form className="register-form" onSubmit={handleRegister}>
          <div className="register-form-header">
            <h2>Inscripción</h2>
            <p>Rellena tus datos para crear tu cuenta.</p>
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
                placeholder="@usuario"
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

          <button className="register-submit" disabled={loading}>
            {loading ? "Creando cuenta..." : "Enviar inscripción"}
          </button>
        </form>
      </div>
    </section>
  );
};