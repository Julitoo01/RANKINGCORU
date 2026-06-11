import { useState } from "react";
import { Link } from "react-router-dom";

export const Admin = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

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

      const response = await fetch(`${backendUrl}/api/admin/seasons/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          next_season_name: nextSeasonName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo cerrar la temporada");
      }

      setMessage(
        `Temporada cerrada correctamente. Nueva temporada creada: ${
          data.new_season?.name || nextSeasonName
        }`
      );

      setNextSeasonName("");
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cerrar temporada");
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

      <div
        style={{
          background: "#ffffff",
          border: "2px solid #dc2626",
          borderRadius: "28px",
          padding: "28px",
          marginBottom: "28px",
          boxShadow: "0 14px 34px rgba(6, 27, 58, 0.08)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <span
            style={{
              color: "#dc2626",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "13px",
            }}
          >
            Temporadas
          </span>

          <h2
            style={{
              color: "#071f45",
              fontSize: "34px",
              margin: "10px 0 10px",
            }}
          >
            Cerrar cuatrimestre
          </h2>

          <p style={{ color: "#5d6b82", lineHeight: "1.6", margin: 0 }}>
            Al cerrar la temporada actual se guardará el ranking final en el
            histórico, se creará una nueva temporada y los puntos actuales
            volverán a 0.
          </p>
        </div>

        <form
          onSubmit={closeSeason}
          style={{
            display: "grid",
            gap: "12px",
            background: "#f8fbff",
            borderRadius: "20px",
            padding: "20px",
            border: "1px solid #dce8f6",
          }}
        >
          <label
            style={{
              color: "#071f45",
              fontWeight: "900",
              fontSize: "14px",
            }}
          >
            Nombre de la nueva temporada
          </label>

          <input
            type="text"
            value={nextSeasonName}
            onChange={(event) => setNextSeasonName(event.target.value)}
            placeholder="Ej: Mayo - Agosto 2026"
            style={{
              width: "100%",
              border: "1px solid #dce8f6",
              borderRadius: "14px",
              padding: "14px 16px",
              fontSize: "15px",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={closingSeason}
            style={{
              border: "none",
              background: "#dc2626",
              color: "#ffffff",
              borderRadius: "14px",
              padding: "15px 18px",
              fontWeight: "900",
              cursor: "pointer",
            }}
          >
            {closingSeason ? "Cerrando..." : "Cerrar temporada"}
          </button>
        </form>
      </div>

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