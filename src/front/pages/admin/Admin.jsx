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
          <span className="section-kicker">Fuera de Pista</span>

          <h1>Panel admin</h1>

          <p>
            Controla el funcionamiento del ranking desde un único sitio:
            jugadores, partidos abiertos, resultados, normas y temporadas.
          </p>
        </div>

        <div className="admin-hero-card">
          <span>Administrador</span>
          <strong>{user?.nickname || user?.name || "Admin"}</strong>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admin-dashboard-grid">
        <Link to="/admin/players" className="admin-dashboard-card">
          <div className="admin-card-top">
            <div className="admin-card-icon">👥</div>
            <span>Jugadores</span>
          </div>

          <h2>Gestionar jugadores</h2>

          <p>
            Aprueba nuevos usuarios, cambia niveles, revisa estados y controla
            quién puede participar en el ranking.
          </p>

          <strong>Entrar →</strong>
        </Link>

        <Link to="/admin/open-matches" className="admin-dashboard-card">
          <div className="admin-card-top">
            <div className="admin-card-icon">📅</div>
            <span>Partidos abiertos</span>
          </div>

          <h2>Abrir partidos</h2>

          <p>
            Crea partidos por nivel, revisa jugadores apuntados y gestiona los
            partidos disponibles para la comunidad.
          </p>

          <strong>Entrar →</strong>
        </Link>

        <Link to="/admin/matches" className="admin-dashboard-card">
          <div className="admin-card-top">
            <div className="admin-card-icon">🎾</div>
            <span>Resultados</span>
          </div>

          <h2>Gestionar resultados</h2>

          <p>
            Revisa resultados subidos, elimina partidos incorrectos y recalcula
            el ranking cuando sea necesario.
          </p>

          <strong>Entrar →</strong>
        </Link>

        <Link to="/admin/rules" className="admin-dashboard-card">
          <div className="admin-card-top">
            <div className="admin-card-icon">📋</div>
            <span>Normas</span>
          </div>

          <h2>Editar normas</h2>

          <p>
            Actualiza las normas públicas, el funcionamiento del ranking y la
            información que ven los jugadores.
          </p>

          <strong>Entrar →</strong>
        </Link>
      </div>

      <div className="admin-control-grid">
        <div className="admin-season-card">
          <div className="admin-season-content">
            <div className="admin-season-icon">🏆</div>

            <div>
              <span className="section-kicker">Temporadas</span>

              <h2>Cerrar cuatrimestre</h2>

              <p>
                Guarda el ranking actual como histórico, crea una nueva
                temporada y reinicia las estadísticas para empezar el siguiente
                cuatrimestre.
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
          <span className="section-kicker">Checklist MVP</span>

          <h2>Qué revisar cada semana</h2>

          <div className="admin-checklist">
            <p>✅ Aprobar jugadores pendientes</p>
            <p>✅ Abrir partidos por nivel</p>
            <p>✅ Revisar resultados subidos</p>
            <p>✅ Eliminar partidos incorrectos</p>
            <p>✅ Comprobar que el ranking se actualiza bien</p>
          </div>
        </div>
      </div>
    </section>
  );
};