import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { getMatchTimeRange } from "../utils/time";
import { translations } from "../i18n/translations";

export const OpenMatches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

  // Fallbacks para que las etiquetas del modal nunca queden vacías
  // aunque falte alguna clave en translations.js.
  const joinCopy = language === "en"
    ? {
        kicker: "CONFIRM REGISTRATION",
        title: "Join this match?",
        level: "Level",
        club: "Club",
        date: "Date",
        time: "Time",
        players: "Players",
        cancel: "Cancel",
        join: "Join match",
        joining: "Joining...",
      }
    : {
        kicker: "CONFIRMAR INSCRIPCIÓN",
        title: "¿Quieres apuntarte a este partido?",
        level: "Nivel",
        club: "Club",
        date: "Fecha",
        time: "Horario",
        players: "Jugadores",
        cancel: "Cancelar",
        join: "Apuntarme",
        joining: "Apuntando...",
      };


  const [user, setUser] = useState(null);
  const [playerProfile, setPlayerProfile] = useState(null);

  const [openMatches, setOpenMatches] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [selectedMatchToJoin, setSelectedMatchToJoin] = useState(null);
  const [selectedMatchToLeave, setSelectedMatchToLeave] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      const data = await authFetch(`${backendUrl}/api/profile`);

      if (!data) {
        setUser(null);
        setPlayerProfile(null);
        return null;
      }

      setUser(data);
      setPlayerProfile(data.profile || null);

      return data.profile || null;
    } catch (error) {
      console.error("Error cargando perfil:", error);
      setUser(null);
      setPlayerProfile(null);
      return null;
    }
  };

  const loadOpenMatches = async () => {
    try {
      setError("");

      const data = await authFetch(`${backendUrl}/api/open-matches`);

      if (!data) {
        setOpenMatches([]);
        return;
      }

      setOpenMatches(data);
    } catch (error) {
      console.error("Error cargando partidos abiertos:", error);
      setError(t.openMatches.loadError);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await authFetch(`${backendUrl}/api/notifications`);

      if (!data) {
        setNotifications([]);
        return;
      }

      const safeData = Array.isArray(data) ? data : [];

      setNotifications(safeData);

      const newMatchNotifications = safeData.filter(
        (notification) => notification.notification_type === "open_match_created"
      );

      if (newMatchNotifications.length > 0) {
        await Promise.all(
          newMatchNotifications.map((notification) =>
            authFetch(`${backendUrl}/api/notifications/${notification.id}/read`, {
              method: "PUT",
            })
          )
        );

        window.dispatchEvent(new Event("notificationsUpdated"));
      }
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
      setNotifications([]);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError("");

    const profile = await loadProfile();

    if (!profile || profile.status !== "approved") {
      setOpenMatches([]);
      setNotifications([]);
      setLoading(false);
      return;
    }

    await Promise.all([loadOpenMatches(), loadNotifications()]);

    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
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

  const handleJoin = async (openMatchId) => {
    if (!playerProfile || playerProfile.status !== "approved") {
      setError(t.openMatches.profileNotApprovedError);
      return;
    }

    try {
      setActionLoadingId(openMatchId);
      setMessage("");
      setError("");

      await authFetch(`${backendUrl}/api/open-matches/${openMatchId}/join`, {
        method: "POST",
      });

      setMessage(t.openMatches.joinSuccess);
      setSelectedMatchToJoin(null);

      window.dispatchEvent(new Event("notificationsUpdated"));

      await Promise.all([loadOpenMatches(), loadNotifications()]);
    } catch (error) {
      console.error("Error uniéndose al partido:", error);
      setError(error.message || t.openMatches.joinError);
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmJoinMatch = async () => {
    if (!selectedMatchToJoin) return;

    await handleJoin(selectedMatchToJoin.id);
  };

  const handleLeave = async (openMatchId) => {
    try {
      setActionLoadingId(openMatchId);
      setMessage("");
      setError("");

      await authFetch(`${backendUrl}/api/open-matches/${openMatchId}/leave`, {
        method: "DELETE",
      });

      setMessage(t.openMatches.leaveSuccess);
      setSelectedMatchToLeave(null);

      window.dispatchEvent(new Event("notificationsUpdated"));

      await Promise.all([loadOpenMatches(), loadNotifications()]);
    } catch (error) {
      console.error("Error saliendo del partido:", error);
      setError(error.message || t.openMatches.leaveError);
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmLeaveMatch = async () => {
    if (!selectedMatchToLeave) return;

    await handleLeave(selectedMatchToLeave.id);
  };

  const getPlayerName = (playerItem) => {
    const player = playerItem?.player;

    if (!player) return t.openMatches.player;

    return (
      player.nickname ||
      `${player.name || ""} ${player.last_name || ""}`.trim() ||
      t.openMatches.player
    );
  };

  const getTeamPlayerName = (player) => {
    if (!player) return t.openMatches.player;

    return (
      player.nickname ||
      `${player.name || ""} ${player.last_name || ""}`.trim() ||
      t.openMatches.player
    );
  };

  const isPlayerJoined = (openMatch) => {
    if (!playerProfile) return false;

    return openMatch.players?.some(
      (item) => Number(item.player_profile_id) === Number(playerProfile.id)
    );
  };

  const canUploadResult = (openMatch) => {
    const joined = isPlayerJoined(openMatch);

    return (
      openMatch.status === "closed" &&
      joined &&
      !openMatch.has_result &&
      !openMatch.result_match_id
    );
  };

  const isNewOpenMatch = (openMatch) => {
    if (
      openMatch.status !== "open" ||
      openMatch.has_result ||
      openMatch.result_match_id
    ) {
      return false;
    }

    return notifications.some(
      (notification) =>
        notification.notification_type === "open_match_created" &&
        Number(notification.open_match_id) === Number(openMatch.id)
    );
  };

  const formatDate = (date) => {
    if (!date) return "";

    const dateObject = new Date(`${date}T00:00:00`);

    if (Number.isNaN(dateObject.getTime())) {
      return date;
    }

    return dateObject.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusText = (status) => {
    if (status === "open") return t.openMatches.open;
    if (status === "closed") return t.openMatches.closed;
    if (status === "cancelled") return t.openMatches.cancelled;

    return status;
  };

  const profileIsPending =
    playerProfile && playerProfile.status && playerProfile.status !== "approved";

  return (
    <section className="open-matches-page">
      <div className="open-matches-hero">
        <span className="section-kicker">{t.openMatches.kicker}</span>

        <h1>{t.openMatches.title}</h1>

        <p>{t.openMatches.description}</p>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="open-matches-list">
          <p className="open-match-empty">{t.openMatches.loading}</p>
        </div>
      )}

      {!loading && !playerProfile && (
        <div className="open-matches-pending-card">
          <div className="open-matches-pending-icon">!</div>

          <span>{t.openMatches.profileNotFoundKicker}</span>

          <h2>{t.openMatches.profileNotFoundTitle}</h2>

          <p>{t.openMatches.profileNotFoundText}</p>

          <Link to="/profile" className="primary-button">
            {t.openMatches.goToProfile}
          </Link>
        </div>
      )}

      {!loading && profileIsPending && (
        <div className="open-matches-pending-card">
          <div className="open-matches-pending-icon">⏳</div>

          <span>{t.openMatches.pendingKicker}</span>

          <h2>{t.openMatches.pendingTitle}</h2>

          <p>{t.openMatches.pendingText}</p>

          <div className="open-matches-pending-steps">
            <div>
              <strong>1</strong>
              <span>{t.openMatches.pendingStep1}</span>
            </div>

            <div>
              <strong>2</strong>
              <span>{t.openMatches.pendingStep2}</span>
            </div>

            <div>
              <strong>3</strong>
              <span>{t.openMatches.pendingStep3}</span>
            </div>
          </div>

          <Link to="/profile" className="primary-button">
            {t.openMatches.viewProfile}
          </Link>
        </div>
      )}

      {!loading && playerProfile?.status === "approved" && (
        <div className="open-matches-list">
          <div className="open-matches-list-header">
            <div>
              <span className="section-kicker">{t.openMatches.available}</span>
              <h2>{t.openMatches.matchesToPlay}</h2>
            </div>
          </div>

          {openMatches.length === 0 && (
            <div className="open-matches-empty-card">
              <div className="open-matches-pending-icon">🎾</div>

              <span>{t.openMatches.noMatchesKicker}</span>

              <h2>{t.openMatches.noMatchesTitle}</h2>

              <p>{t.openMatches.noMatchesText}</p>
            </div>
          )}

          {openMatches.length > 0 && (
            <div className="open-match-grid">
              {openMatches.map((openMatch) => {
                const joined = isPlayerJoined(openMatch);
                const isOpen = openMatch.status === "open";
                const isClosed = openMatch.status === "closed";
                const isFull =
                  openMatch.players_count >= openMatch.max_players;
                const isActionLoading = actionLoadingId === openMatch.id;
                const uploadAllowed = canUploadResult(openMatch);
                const isNewMatch = isNewOpenMatch(openMatch);

                return (
                  <article
                    key={openMatch.id}
                    className={`open-match-card ${
                      isNewMatch ? "new-open-match-card" : ""
                    }`}
                  >
                    <div className="open-match-card-header">
                      <div>
                        <div className="open-match-title-row">
                          <h3>{openMatch.level}</h3>

                          {isNewMatch && (
                            <span className="open-match-new-badge">
                              <span className="open-match-new-dot"></span>
                              {t.openMatches.new}
                            </span>
                          )}
                        </div>

                        <p>
                          {openMatch.club} · {formatDate(openMatch.match_date)} ·{" "}
                          {getMatchTimeRange(openMatch.match_time)}
                        </p>
                      </div>

                      <span className={`open-match-status ${openMatch.status}`}>
                        {getStatusText(openMatch.status)}
                      </span>
                    </div>

                    {openMatch.description && (
                      <p className="open-match-description">
                        {openMatch.description}
                      </p>
                    )}

                    <div className="open-match-count">
                      {openMatch.players_count}/{openMatch.max_players}{" "}
                      {t.openMatches.players}
                    </div>

                    <div className="open-match-players">
                      {openMatch.players?.length > 0 ? (
                        openMatch.players.map((playerItem) => (
                          <span
                            key={playerItem.id}
                            className={`open-match-player-pill ${
                              Number(playerItem.player_profile_id) ===
                              Number(playerProfile?.id)
                                ? "current-player"
                                : ""
                            }`}
                          >
                            {getPlayerName(playerItem)}
                          </span>
                        ))
                      ) : (
                        <p className="open-match-empty">
                          {t.openMatches.noPlayersYet}
                        </p>
                      )}
                    </div>

                    {isClosed && (
                      <div className="open-match-teams">
                        <div className="open-match-team-card">
                          <h4>{t.openMatches.teamA}</h4>

                          <p>{getTeamPlayerName(openMatch.team_a?.[0])}</p>
                          <p>{getTeamPlayerName(openMatch.team_a?.[1])}</p>
                        </div>

                        <div className="open-match-vs">
                          {t.openMatches.vs}
                        </div>

                        <div className="open-match-team-card">
                          <h4>{t.openMatches.teamB}</h4>

                          <p>{getTeamPlayerName(openMatch.team_b?.[0])}</p>
                          <p>{getTeamPlayerName(openMatch.team_b?.[1])}</p>
                        </div>
                      </div>
                    )}

                    <div className="open-match-actions">
                      {isOpen && !joined && !isFull && (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => setSelectedMatchToJoin(openMatch)}
                          disabled={isActionLoading}
                        >
                          {t.openMatches.join}
                        </button>
                      )}

                      {isOpen && joined && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setSelectedMatchToLeave(openMatch)}
                          disabled={isActionLoading}
                        >
                          {isActionLoading
                            ? t.openMatches.leaving
                            : t.openMatches.leave}
                        </button>
                      )}

                      {uploadAllowed && (
                        <Link
                          to={`/upload-result?open_match_id=${openMatch.id}`}
                          className="primary-button"
                        >
                          {t.openMatches.uploadResult}
                        </Link>
                      )}

                      {isClosed && !joined && !openMatch.has_result && (
                        <span className="open-match-closed-text">
                          {t.openMatches.matchFull}
                        </span>
                      )}

                      {isClosed && joined && openMatch.has_result && (
                        <span className="open-match-closed-text">
                          {t.openMatches.resultSent}
                        </span>
                      )}

                      {isOpen && isFull && !joined && (
                        <span className="open-match-closed-text">
                          {t.openMatches.matchFull}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedMatchToJoin && (
        <div
          className="join-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              actionLoadingId !== selectedMatchToJoin.id
            ) {
              setSelectedMatchToJoin(null);
            }
          }}
        >
          <div
            className="join-modal-card join-modal-simple"
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-match-heading"
          >
            <span className="section-kicker">
              {t.openMatches?.joinModalKicker || joinCopy.kicker}
            </span>

            <h2 id="join-match-heading">
              {t.openMatches?.joinModalTitle || joinCopy.title}
            </h2>

            <div className="join-modal-details">
              <div>
                <strong>{t.openMatches?.level || joinCopy.level}</strong>
                <span>{selectedMatchToJoin.level}</span>
              </div>
              <div>
                <strong>{t.openMatches?.club || joinCopy.club}</strong>
                <span>{selectedMatchToJoin.club}</span>
              </div>
              <div>
                <strong>{t.openMatches?.date || joinCopy.date}</strong>
                <span>{formatDate(selectedMatchToJoin.match_date)}</span>
              </div>
              <div>
                <strong>{t.openMatches?.time || joinCopy.time}</strong>
                <span>{getMatchTimeRange(selectedMatchToJoin.match_time)}</span>
              </div>
              <div className="join-modal-players-detail">
                <strong>{t.openMatches?.players || joinCopy.players}</strong>
                <span>
                  {selectedMatchToJoin.players_count ??
                    selectedMatchToJoin.players?.length ??
                    0}
                  /{selectedMatchToJoin.max_players ?? 4}
                </span>
              </div>
            </div>

            <div className="join-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedMatchToJoin(null)}
                disabled={actionLoadingId === selectedMatchToJoin.id}
              >
                {t.openMatches?.cancel || joinCopy.cancel}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={confirmJoinMatch}
                disabled={actionLoadingId === selectedMatchToJoin.id}
              >
                {actionLoadingId === selectedMatchToJoin.id
                  ? t.openMatches?.joining || joinCopy.joining
                  : t.openMatches?.confirmJoin || joinCopy.join}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMatchToLeave && (
        <div className="join-modal-overlay">
          <div className="join-modal-card leave-modal-card">
            <div className="join-modal-icon leave-modal-icon">⚠️</div>

            <span>{t.openMatches.leaveModalKicker}</span>

            <h2>{t.openMatches.leaveModalTitle}</h2>

            <div className="join-modal-details">
              <div>
                <strong>{t.openMatches.level}</strong>
                <span>{selectedMatchToLeave.level}</span>
              </div>

              <div>
                <strong>{t.openMatches.club}</strong>
                <span>{selectedMatchToLeave.club}</span>
              </div>

              <div>
                <strong>{t.openMatches.date}</strong>
                <span>{formatDate(selectedMatchToLeave.match_date)}</span>
              </div>

              <div>
                <strong>{t.openMatches.time}</strong>
                <span>{getMatchTimeRange(selectedMatchToLeave.match_time)}</span>
              </div>
            </div>

            <p>{t.openMatches.leaveModalText}</p>

            <div className="join-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedMatchToLeave(null)}
                disabled={actionLoadingId === selectedMatchToLeave.id}
              >
                {t.openMatches.cancel}
              </button>

              <button
                type="button"
                className="primary-button leave-confirm-button"
                onClick={confirmLeaveMatch}
                disabled={actionLoadingId === selectedMatchToLeave.id}
              >
                {actionLoadingId === selectedMatchToLeave.id
                  ? t.openMatches.leaving
                  : t.openMatches.confirmLeave}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};