import { useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../../utils/authFetch";

export const Admin = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Error leyendo user de localStorage:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("profile");
    user = null;
  }

  const [nextSeasonName, setNextSeasonName] = useState("");
  const [closingSeason, setClosingSeason] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const closeSeason = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!nextSeasonName.trim()) {
      setError("Tienes que escribir el nombre de la nueva temporada.");
      return;
    }

    const confirmClose = window.confirm(
      `¿Seguro que quieres cerrar la temporada actual y crear "${nextSeasonName}"? Se guardará el ranking histórico y el ranking actual se pondrá a 0.`
    );

    if (!confirmClose) return;

    try {
      setClosingSeason(true);

      const data = await authFetch(`${backendUrl}/api/admin/seasons/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          next_season_name: nextSeasonName.trim(),
        }),
      });

      if (!data) return;

      setMessage(
        `Temporada cerrada correctamente. Nueva temporada creada: ${
          data.new_season?.name || nextSeasonName
        }`
      );

      setNextSeasonName("");
    } catch (error) {
      console.error(error);
      setError(error.message || "No se pudo cerrar la temporada");
    } finally {
      setClosingSeason(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span>Fuera de Pista</span>
          <h1>Panel admin</h1>
          <p>
            Gestiona los jugadores, revisa los partidos registrados, actualiza
            las normas y controla las temporadas del ranking.
          </p>
        </div>

        <div className="admin-hero-card">
          <strong>{user?.nickname || "Admin"}</strong>
          <span>Administrador</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admin-dashboard-grid">
        <Link to="/admin/players" className="admin-dashboard-card">
          <div className="admin-card-icon">👥</div>

          <div>
            <span>Jugadores</span>
            <h2>Gestionar jugadores</h2>
            <p>
              Aprueba nuevos usuarios, cambia niveles, revisa estados y controla
              quién aparece en el ranking.
            </p>
          </div>

          <strong>Entrar →</strong>
        </Link>

        <Link to="/admin/matches" className="admin-dashboard-card">
          <div className="admin-card-icon">🎾</div>

          <div>
            <span>Partidos</span>
            <h2>Gestionar partidos</h2>
            <p>
              Revisa resultados subidos, elimina partidos incorrectos y recalcula
              el ranking cuando sea necesario.
            </p>
          </div>

          <strong>Entrar →</strong>
        </Link>

        <Link to="/admin/rules" className="admin-dashboard-card">
          <div className="admin-card-icon">📋</div>

          <div>
            <span>Normas</span>
            <h2>Editar normas</h2>
            <p>
              Actualiza el texto de las normas públicas, el funcionamiento del
              ranking y la información para jugadores.
            </p>
          </div>

          <strong>Entrar →</strong>
        </Link>
      </div>

      <div className="admin-season-card">
        <div className="admin-season-content">
          <div className="admin-season-icon">🏆</div>

          <div>
            <span>Temporadas</span>
            <h2>Cerrar cuatrimestre</h2>
            <p>
              Guarda el ranking actual como histórico, crea una nueva temporada
              y reinicia los puntos para empezar el siguiente cuatrimestre.
            </p>
          </div>
        </div>

        <form className="admin-season-form" onSubmit={closeSeason}>
          <label>Nombre de la nueva temporada</label>

          <input
            type="text"
            value={nextSeasonName}
            onChange={(event) => setNextSeasonName(event.target.value)}
            placeholder="Ej: Mayo - Agosto 2026"
          />

          <button type="submit" disabled={closingSeason}>
            {closingSeason ? "Cerrando..." : "Cerrar temporada"}
          </button>
        </form>
      </div>

      <div className="admin-help-card">
        <div>
          <span>Consejo de uso</span>
          <h2>Mantén el ranking limpio y actualizado.</h2>
          <p>
            Aprueba jugadores antes de que aparezcan en la clasificación, revisa
            los resultados y cierra cada cuatrimestre cuando termine la
            temporada.
          </p>
        </div>
      </div>
    </section>
  );
};