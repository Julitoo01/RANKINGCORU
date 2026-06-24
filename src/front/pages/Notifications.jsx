import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  const handleMarkAsRead = async (notificationId) => {
    try {
      setActionLoadingId(notificationId);
      setMessage("");
      setError("");

      const data = await authFetch(
        `${backendUrl}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
        }
      );

      if (!data) return;

      setNotifications((currentNotifications) =>
        currentNotifications.filter(
          (notification) => notification.id !== notificationId
        )
      );

      window.dispatchEvent(new Event("notificationsUpdated"));

      setMessage("Notificación marcada como leída.");
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al marcar la notificación como leída");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleJoinOpenMatch = async (notification) => {
    try {
      const openMatchId = notification.open_match_id;

      if (!openMatchId) {
        setError("No se ha encontrado el partido asociado a esta notificación.");
        return;
      }

      setActionLoadingId(notification.id);
      setMessage("");
      setError("");

      const data = await authFetch(
        `${backendUrl}/api/open-matches/${openMatchId}/join`,
        {
          method: "POST",
        }
      );

      if (!data) return;

      // Marcamos también la notificación como leída después de apuntarse.
      await authFetch(
        `${backendUrl}/api/notifications/${notification.id}/read`,
        {
          method: "PUT",
        }
      );

      setNotifications((currentNotifications) =>
        currentNotifications.filter((item) => item.id !== notification.id)
      );

      window.dispatchEvent(new Event("notificationsUpdated"));

      setMessage("Te has apuntado al partido correctamente.");
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al apuntarte al partido");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getNotificationLabel = (notificationType) => {
    if (notificationType === "open_match_created") {
      return "Nuevo partido";
    }

    if (notificationType === "open_match_joined") {
      return "Jugador apuntado";
    }

    if (notificationType === "open_match_closed") {
      return "Partido cerrado";
    }

    return "Notificación";
  };

  const formatOpenMatchDate = (openMatch) => {
    if (!openMatch?.match_date) return "-";

    const date = new Date(openMatch.match_date);

    if (Number.isNaN(date.getTime())) {
      return openMatch.match_date;
    }

    return date.toLocaleDateString("es-ES");
  };

  const renderTeams = (team) => {
    if (!team || team.length === 0) return "-";

    const names = team
      .filter(Boolean)
      .map((player) => player.nickname)
      .filter(Boolean);

    return names.length > 0 ? names.join(" / ") : "-";
  };

  const canJoinFromNotification = (notification) => {
    const openMatch = notification.open_match;

    if (!openMatch) return false;

    return (
      notification.notification_type === "open_match_created" &&
      openMatch.status === "open" &&
      !openMatch.has_result &&
      openMatch.players_count < openMatch.max_players
    );
  };

  return (
    <section className="notifications-page">
      <div className="notifications-hero">
        <div>
          <span className="notifications-kicker">Avisos de partidos</span>
          <h1>Notificaciones</h1>
          <p>
            Aquí verás avisos cuando se abra un partido de tu nivel, cuando
            alguien se apunte o cuando el partido se cierre con 4 jugadores.
          </p>
        </div>

        <div className="notifications-counter-card">
          <strong>{notifications.length}</strong>
          <span>Pendientes</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="notifications-empty">
          <h2>Cargando notificaciones...</h2>
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="notifications-empty">
          <h2>No tienes notificaciones pendientes</h2>
          <p>
            Cuando haya movimientos en partidos de tu nivel, aparecerán aquí.
          </p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="notifications-list">
          {notifications.map((notification) => {
            const openMatch = notification.open_match;
            const canJoin = canJoinFromNotification(notification);

            return (
              <article key={notification.id} className="notification-card">
                <div className="notification-card-header">
                  <div>
                    <span>
                      {getNotificationLabel(notification.notification_type)}
                    </span>

                    <h2>{notification.title}</h2>
                  </div>

                  {openMatch?.level && (
                    <strong className="notification-score">
                      {openMatch.level}
                    </strong>
                  )}
                </div>

                <p className="notification-message">
                  {notification.message}
                </p>

                {openMatch && (
                  <div className="notification-meta">
                    <span>
                      Club: <strong>{openMatch.club || "-"}</strong>
                    </span>

                    <span>
                      Fecha:{" "}
                      <strong>{formatOpenMatchDate(openMatch)}</strong>
                    </span>

                    <span>
                      Hora: <strong>{openMatch.match_time || "-"}</strong>
                    </span>

                    <span>
                      Jugadores:{" "}
                      <strong>
                        {openMatch.players_count || 0}/
                        {openMatch.max_players || 4}
                      </strong>
                    </span>
                  </div>
                )}

                {openMatch?.status === "closed" && (
                  <div className="notification-match-teams">
                    <div className="notification-team">
                      <span>Equipo A</span>
                      <strong>{renderTeams(openMatch.team_a)}</strong>
                    </div>

                    <div className="notification-team">
                      <span>Equipo B</span>
                      <strong>{renderTeams(openMatch.team_b)}</strong>
                    </div>
                  </div>
                )}

                <div className="notification-actions">
                  {canJoin ? (
                    <button
                      className="notification-btn confirm"
                      onClick={() => handleJoinOpenMatch(notification)}
                      disabled={actionLoadingId === notification.id}
                    >
                      {actionLoadingId === notification.id
                        ? "Apuntando..."
                        : "Apuntarme"}
                    </button>
                  ) : (
                    <Link
                      to="/open-matches"
                      className="notification-btn confirm"
                    >
                      Ver partidos
                    </Link>
                  )}

                  <button
                    className="notification-btn reject"
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={actionLoadingId === notification.id}
                  >
                    {actionLoadingId === notification.id
                      ? "Procesando..."
                      : "Marcar como leída"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};