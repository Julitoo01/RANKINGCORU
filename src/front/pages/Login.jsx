import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "https://rankingcoru.onrender.com";

export const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${backendUrl}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type");

      let data = null;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        await response.text();

        throw new Error(
          `El servidor no devolvió JSON. URL llamada: ${backendUrl}/api/login. Status: ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo iniciar sesión");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user?.profile) {
        localStorage.setItem("profile", JSON.stringify(data.user.profile));
      }

      navigate("/profile");
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <div className="login-info">
          <span>Fuera de Pista</span>

          <h1>Bienvenido de nuevo</h1>

          <p>
            Accede a tu cuenta para ver tu perfil, subir resultados y seguir tu
            posición dentro del ranking.
          </p>

          <div className="login-info-box">
            <strong>Ranking individual</strong>
            <small>
              Los partidos se juegan por parejas, pero cada jugador suma sus
              propios puntos.
            </small>
          </div>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-form-header">
            <h2>Iniciar sesión</h2>
            <p>Introduce tus datos para acceder.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

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
              placeholder="Tu contraseña"
              required
            />
          </div>

          <button className="login-submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="login-register-link">
            ¿No tienes cuenta? <Link to="/register">Inscríbete aquí</Link>
          </p>
        </form>
      </div>
    </section>
  );
};