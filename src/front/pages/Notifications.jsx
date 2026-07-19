import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import { getMatchTimeRange } from "../utils/time";
import { translations } from "../i18n/translations";

export const Notifications = () => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL &&
    import.meta.env.VITE_BACKEND_URL !== "undefined"
      ? import.meta.env.VITE_BACKEND_URL
      : window.location.origin;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language];

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/notifications`);

      if (!data) {
        setNotifications([]);
        return;
      }

      setNotifications(data);
    } catch (error) {
      console.error(error);
      setError(error.message || t.notificationReadError);
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

      setMessage(t.notificationMarkedRead);
    } catch (error) {
      console.error(error);
      setError(error.message || t.notificationReadError);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleJoinOpenMatch = async (notification) => {
    try {
      const openMatchId = notification.open_match_id;

      if (!openMatchId) {
        setError(t.notificationMatchNotFound);
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

      setMessage(t.joinedMatchSuccess);
    } catch (error) {
      console.error(error);
      setError(error.message || t.joinMatchError);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getNotificationIcon = (notificationType) => {
    if (notificationType === "open_match_created") return "🎾";
    if (notificationType === "open_match_joined") return "👥";
    if (notificationType === "open_match_closed") return "✅";

    return "🔔";
  };

  const formatOpenMatchDate = (openMatch) => {
    if (!openMatch?.match_date) return "-";

    const date = new Date(`${openMatch.match_date}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return openMatch.match_date;
    }

    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  const getPlayersText = (openMatch) => {
    const playersCount = openMatch?.players_count ?? 0;
    const maxPlayers = openMatch?.max_players ?? 4;

    return `${playersCount}/${maxPlayers}`;
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
      <div className="notifications-hero minimal">
        <div>
          <span className="section-kicker">{t.notificationsKicker}</span>

          <h1>{t.notificationsTitle}</h1>

          <p className="desktop-text">{t.notificationsHeroText}</p>
          <p className="mobile-text">{t.notificationsHeroTextMobile}</p>
        </div>

        <div className="notifications-counter-card">
          <strong>{notifications.length}</strong>
          <span>{t.pending}</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="notifications-empty minimal">
          <h2>{t.loadingNotifications}</h2>
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="notifications-empty minimal">
          <div className="notifications-empty-icon">🔔</div>

          <h2>{t.noPendingNotifications}</h2>

          <p>{t.noPendingNotificationsText}</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="notifications-minimal-list">
          {notifications.map((notification) => {
            const openMatch = notification.open_match;
            const canJoin = canJoinFromNotification(notification);

            return (
              <article
                key={notification.id}
                className="notification-minimal-card"
              >
                <div className="notification-minimal-content">
                  <div className="notification-minimal-icon">
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  <div>
                    {openMatch ? (
                      <p className="notification-main-text">
                        {t.matchAt}{" "}
                        <strong>
                          {openMatch.club || t.clubNotProvided}
                        </strong>
                        . {t.day}{" "}
                        <strong>{formatOpenMatchDate(openMatch)}</strong>{" "}
                        {t.from}{" "}
                        <strong>
                          {getMatchTimeRange(openMatch.match_time)}
                        </strong>
                        . {t.playersJoined}{" "}
                        <strong>{getPlayersText(openMatch)}</strong>.
                      </p>
                    ) : (
                      <p className="notification-main-text">
                        {notification.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="notification-minimal-actions">
                  {canJoin && (
                    <button
                      className="notification-main-btn"
                      type="button"
                      onClick={() => handleJoinOpenMatch(notification)}
                      disabled={actionLoadingId === notification.id}
                    >
                      {actionLoadingId === notification.id
                        ? t.joining
                        : t.joinMe}
                    </button>
                  )}

                  {!canJoin && (
                    <button
                      className="notification-main-btn"
                      type="button"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={actionLoadingId === notification.id}
                    >
                      {actionLoadingId === notification.id
                        ? t.processing
                        : t.gotIt}
                    </button>
                  )}

                  {canJoin && (
                    <button
                      className="notification-light-btn"
                      type="button"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={actionLoadingId === notification.id}
                    >
                      {t.markAsRead}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};