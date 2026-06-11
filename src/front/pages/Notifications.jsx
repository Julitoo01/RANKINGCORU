import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";

export const Notifications = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/notifications`);

      if (!data) return;

      setNotifications(data);
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getWinnerText = (winnerTeam) => {
    if (winnerTeam === "A") return "Equipo A";
    if (winnerTeam === "B") return "Equipo B";
    return "-";
  };

  const confirmMatch = async (matchId) => {
    try {
      setActionLoadingId(matchId);
      setMessage("");
      setError("");

      const data = await authFetch(`${backendUrl}/api/matches/${matchId}/confirm`, {
        method: "POST",
      });

      if (!data) return;

      setMessage("Resultado aceptado correctamente. El ranking se ha actualizado.");
      loadNotifications();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al aceptar resultado");
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectMatch = async (matchId) => {
    const confirmReject = window.confirm(
      "¿Seguro que quieres rechazar este resultado? No sumará puntos."
    );

    if (!confirmReject) return;

    try {
      setActionLoadingId(matchId);
      setMessage("");
      setError("");

      const data = await authFetch(`${backendUrl}/api/matches/${matchId}/reject`, {
        method: "POST",
      });

      if (!data) return;

      setMessage("Resultado rechazado correctamente.");
      loadNotifications();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al rechazar resultado");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section className="notifications-page">
      <div className="notifications-hero">
        <div>
          <span>Fuera de Pista</span>
          <h1>Notificaciones</h1>
          <p>
            Revisa los resultados pendientes de validación. Si un rival sube un
            resultado contra ti, puedes aceptarlo o rechazarlo.
          </p>
        </div>

        <div className="notifications-hero-card">
          <strong>{notifications.length}</strong>
          <span>Pendientes</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="notifications-state">
          <p>Cargando notificaciones...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="notifications-empty">
          <h2>No tienes notificaciones pendientes</h2>
          <p>
            Cuando una pareja rival suba un resultado contra ti, aparecerá aquí
            para que puedas validarlo.
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((match) => (
            <article className="notification-card" key={match.id}>
              <div className="notification-card-header">
                <div>
                  <span>Resultado pendiente</span>
                  <h2>{match.submitted_by} ha subido un resultado</h2>
                </div>

                <div className="notification-date">
                  {formatDate(match.played_at)}
                </div>
              </div>

              <div className="notification-match-grid">
                <div
                  className={`notification-team ${
                    match.winner_team === "A" ? "winner" : ""
                  }`}
                >
                  <span>Equipo A</span>
                  <strong>
                    {match.team_a?.[0]?.nickname || "-"} /{" "}
                    {match.team_a?.[1]?.nickname || "-"}
                  </strong>
                </div>

                <div
                  className={`notification-team ${
                    match.winner_team === "B" ? "winner" : ""
                  }`}
                >
                  <span>Equipo B</span>
                  <strong>
                    {match.team_b?.[0]?.nickname || "-"} /{" "}
                    {match.team_b?.[1]?.nickname || "-"}
                  </strong>
                </div>
              </div>

              <div className="notification-details">
                <span>Resultado: {match.score}</span>
                <span>Ganador: {getWinnerText(match.winner_team)}</span>
                <span>Nivel: {match.level}</span>
                <span>Club: {match.club || "-"}</span>
              </div>

              <div className="notification-actions">
                <button
                  className="notification-btn accept"
                  onClick={() => confirmMatch(match.id)}
                  disabled={actionLoadingId === match.id}
                >
                  {actionLoadingId === match.id ? "Procesando..." : "Aceptar"}
                </button>

                <button
                  className="notification-btn reject"
                  onClick={() => rejectMatch(match.id)}
                  disabled={actionLoadingId === match.id}
                >
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};