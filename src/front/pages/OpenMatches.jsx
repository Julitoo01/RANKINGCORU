import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { getMatchTimeRange } from "../utils/time";
import { translations } from "../i18n/translations";

export const OpenMatches = () => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL &&
    import.meta.env.VITE_BACKEND_URL !== "undefined"
      ? import.meta.env.VITE_BACKEND_URL
      : window.location.origin;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language];

  const [user, setUser] = useState(null);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [openMatches, setOpenMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedMatchToJoin, setSelectedMatchToJoin] = useState(null);
  const [selectedMatchToLeave, setSelectedMatchToLeave] = useState(null);
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
      setLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/open-matches`);

      if (!data) {
        setOpenMatches([]);
        return;
      }

      setOpenMatches(data);
    } catch (error) {
      console.error("Error cargando partidos abiertos:", error);
      setError(t.openMatchesLoadError);
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    const profile = await loadProfile();

    if (!profile || profile.status !== "approved") {
      setOpenMatches([]);
      setLoading(false);
      return;
    }

    await loadOpenMatches();
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleJoin = async (openMatchId) => {
    if (!playerProfile || playerProfile.status !== "approved") {
      setError(t.profilePendingJoinError);
      return;
    }

    try {
      setActionLoadingId(openMatchId);
      setMessage("");
      setError("");

      await authFetch(`${backendUrl}/api/open-matches/${openMatchId}/join`, {
        method: "POST",
      });

      setMessage(t.joinedOpenMatchSuccess);
      setSelectedMatchToJoin(null);

      window.dispatchEvent(new Event("notificationsUpdated"));

      await loadOpenMatches();
    } catch (error) {
      console.error("Error uniéndose al partido:", error);
      setError(error.message || t.joinOpenMatchError);
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

      setMessage(t.leftOpenMatchSuccess);
      setSelectedMatchToLeave(null);

      window.dispatchEvent(new Event("notificationsUpdated"));

      await loadOpenMatches();
    } catch (error) {
      console.error("Error saliendo del partido:", error);
      setError(error.message || t.leaveOpenMatchError);
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

    if (!player) return t.playerFallback;

    return (
      player.nickname ||
      `${player.name || ""} ${player.last_name || ""}`.trim() ||
      t.playerFallback
    );
  };

  const getTeamPlayerName = (player) => {
    if (!player) return t.playerFallback;

    return (
      player.nickname ||
      `${player.name || ""} ${player.last_name || ""}`.trim() ||
      t.playerFallback
    );
  };

  const isCurrentPlayer = (playerItem) => {
    return (
      Number(playerItem?.player_profile_id) === Number(playerProfile?.id)
    );
  };

  const isPlayerJoined = (openMatch) => {
    if (!playerProfile) return false;

    return openMatch.players?.some((item) => isCurrentPlayer(item));
  };

  const hasResult = (openMatch) => {
    return Boolean(openMatch.has_result || openMatch.result_match_id);
  };

  const canUploadResult = (openMatch) => {
    const joined = isPlayerJoined(openMatch);

    return (
      openMatch.status === "closed" &&
      joined &&
      !hasResult(openMatch)
    );
  };

  const formatDate = (date) => {
    if (!date) return "";

    const dateObject = new Date(`${date}T00:00:00`);

    if (Number.isNaN(dateObject.getTime())) {
      return date;
    }

    return dateObject.toLocaleDateString(language === "es" ? "es-ES" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusText = (openMatch) => {
    if (hasResult(openMatch)) return t.resultRegistered;
    if (openMatch.status === "open") return t.statusOpen;
    if (openMatch.status === "closed") return t.statusClosed;
    if (openMatch.status === "cancelled") return t.statusCancelled;

    return openMatch.status;
  };

  const profileIsPending =
    playerProfile && playerProfile.status && playerProfile.status !== "approved";

  return (
    <section className="open-matches-page">
      <div className="open-matches-hero">
        <span className="section-kicker">{t.openMatchesKicker}</span>

        <h1>{t.openMatchesTitle}</h1>

        <p className="desktop-text">{t.openMatchesHeroText}</p>
        <p className="mobile-text">{t.openMatchesHeroTextMobile}</p>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="open-matches-list">
          <p className="open-match-empty">{t.loadingOpenMatches}</p>
        </div>
      )}

      {!loading && !playerProfile && (
        <div className="open-matches-pending-card">
          <div className="open-matches-pending-icon">!</div>

          <span>{t.profileNotFound}</span>

          <h2>{t.profileNotFoundTitle}</h2>

          <p>{t.profileNotFoundText}</p>

          <Link to="/profile" className="primary-button">
            {t.goToProfile}
          </Link>
        </div>
      )}

      {!loading && profileIsPending && (
        <div className="open-matches-pending-card">
          <div className="open-matches-pending-icon">⏳</div>

          <span>{t.pendingRegistration}</span>

          <h2>{t.profileStillPending}</h2>

          <p>{t.profilePendingText}</p>

          <div className="open-matches-pending-steps">
            <div>
              <strong>1</strong>
              <span>{t.registrationSentStep}</span>
            </div>

            <div>
              <strong>2</strong>
              <span>{t.adminReviewStep}</span>
            </div>

            <div>
              <strong>3</strong>
              <span>{t.matchAccessStep}</span>
            </div>
          </div>

          <Link to="/profile" className="primary-button">
            {t.viewMyProfile}
          </Link>
        </div>
      )}

      {!loading && playerProfile?.status === "approved" && (
        <div className="open-matches-list">
          <div className="open-matches-list-header">
            <div>
              <span className="section-kicker">{t.available}</span>
              <h2>{t.matchesToPlay}</h2>
            </div>
          </div>

          {openMatches.length === 0 && (
            <div className="open-matches-empty-card">
              <div className="open-matches-pending-icon">🎾</div>

              <span>{t.noMatchesNow}</span>

              <h2>{t.noMatchesForLevel}</h2>

              <p>{t.noMatchesForLevelText}</p>
            </div>
          )}

          {openMatches.length > 0 && (
            <div className="open-match-grid">
              {openMatches.map((openMatch) => {
                const joined = isPlayerJoined(openMatch);
                const isOpen = openMatch.status === "open";
                const isClosed = openMatch.status === "closed";
                const isFull = openMatch.players_count >= openMatch.max_players;
                const isActionLoading = actionLoadingId === openMatch.id;
                const uploadAllowed = canUploadResult(openMatch);
                const resultRegistered = hasResult(openMatch);
                const spotsLeft =
                  (openMatch.max_players || 4) - (openMatch.players_count || 0);

                return (
                  <article
                    key={openMatch.id}
                    className={`open-match-card ${
                      joined ? "open-match-card-joined" : ""
                    }`}
                  >
                    <div className="open-match-card-header">
                      <div>
                        <h3>
                          {openMatch.level}
                          {joined && (
                            <span className="open-match-inline-badge">
                              {t.alreadyJoined}
                            </span>
                          )}
                        </h3>

                        <p>
                          {openMatch.club} · {formatDate(openMatch.match_date)} ·{" "}
                          {getMatchTimeRange(openMatch.match_time)}
                        </p>
                      </div>

                      <span
                        className={`open-match-status ${
                          resultRegistered ? "result" : openMatch.status
                        }`}
                      >
                        {getStatusText(openMatch)}
                      </span>
                    </div>

                    {openMatch.description && (
                      <p className="open-match-description">
                        {openMatch.description}
                      </p>
                    )}

                    <div className="open-match-count">
                      <strong>{t.playersCountLabel}:</strong>{" "}
                      {openMatch.players_count}/{openMatch.max_players}
                      {isOpen && !isFull && (
                        <span>
                          {" "}
                          · {spotsLeft} {t.spotsAvailable}
                        </span>
                      )}
                    </div>

                    <div className="open-match-players">
                      {openMatch.players?.length > 0 ? (
                        openMatch.players.map((playerItem) => (
                          <span
                            key={playerItem.id}
                            className={`open-match-player-pill ${
                              isCurrentPlayer(playerItem)
                                ? "current-player"
                                : ""
                            }`}
                          >
                            {getPlayerName(playerItem)}
                            {isCurrentPlayer(playerItem) && (
                              <small> · {t.youLabel}</small>
                            )}
                          </span>
                        ))
                      ) : (
                        <p className="open-match-empty">
                          {t.noPlayersJoined}
                        </p>
                      )}
                    </div>

                    {isClosed && (
                      <div className="open-match-teams">
                        <div className="open-match-team-card">
                          <h4>{t.teamA}</h4>

                          <p>{getTeamPlayerName(openMatch.team_a?.[0])}</p>
                          <p>{getTeamPlayerName(openMatch.team_a?.[1])}</p>
                        </div>

                        <div className="open-match-vs">VS</div>

                        <div className="open-match-team-card">
                          <h4>{t.teamB}</h4>

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
                          {t.joinMatch}
                        </button>
                      )}

                      {isOpen && joined && (
                        <>
                          <span className="open-match-joined-text">
                            {t.alreadyJoined}
                          </span>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setSelectedMatchToLeave(openMatch)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading
                              ? t.leaving
                              : t.cancelRegistration}
                          </button>
                        </>
                      )}

                      {uploadAllowed && (
                        <Link
                          to={`/upload-result?open_match_id=${openMatch.id}`}
                          className="primary-button"
                        >
                          {t.uploadResult}
                        </Link>
                      )}

                      {isClosed && joined && !resultRegistered && (
                        <span className="open-match-closed-text">
                          {t.closedWaitingResult}
                        </span>
                      )}

                      {isClosed && !joined && !resultRegistered && (
                        <span className="open-match-closed-text">
                          {t.matchFull}
                        </span>
                      )}

                      {resultRegistered && (
                        <span className="open-match-closed-text">
                          {t.resultRegistered}
                        </span>
                      )}

                      {isOpen && isFull && !joined && (
                        <span className="open-match-closed-text">
                          {t.matchFull}
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
        <div className="join-modal-overlay">
          <div className="join-modal-card">
            <div className="join-modal-icon">🎾</div>

            <span>{t.confirmJoin}</span>

            <h2>{t.joinQuestion}</h2>

            <div className="join-modal-details">
              <div>
                <strong>{t.levelLabelShort}</strong>
                <span>{selectedMatchToJoin.level}</span>
              </div>

              <div>
                <strong>{t.clubLabel}</strong>
                <span>{selectedMatchToJoin.club}</span>
              </div>

              <div>
                <strong>{t.dateLabel}</strong>
                <span>{formatDate(selectedMatchToJoin.match_date)}</span>
              </div>

              <div>
                <strong>{t.timeLabel}</strong>
                <span>{getMatchTimeRange(selectedMatchToJoin.match_time)}</span>
              </div>
            </div>

            {selectedMatchToJoin.players?.length > 0 && (
              <div className="join-modal-players">
                <strong>{t.playersInMatch}</strong>

                <div className="open-match-players">
                  {selectedMatchToJoin.players.map((playerItem) => (
                    <span
                      key={playerItem.id}
                      className="open-match-player-pill"
                    >
                      {getPlayerName(playerItem)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p>{t.joinModalText}</p>

            <div className="join-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedMatchToJoin(null)}
                disabled={actionLoadingId === selectedMatchToJoin.id}
              >
                {t.cancel}
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={confirmJoinMatch}
                disabled={actionLoadingId === selectedMatchToJoin.id}
              >
                {actionLoadingId === selectedMatchToJoin.id
                  ? t.joining
                  : t.yesJoin}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMatchToLeave && (
        <div className="join-modal-overlay">
          <div className="join-modal-card leave-modal-card">
            <div className="join-modal-icon leave-modal-icon">⚠️</div>

            <span>{t.confirmLeave}</span>

            <h2>{t.leaveQuestion}</h2>

            <div className="join-modal-details">
              <div>
                <strong>{t.levelLabelShort}</strong>
                <span>{selectedMatchToLeave.level}</span>
              </div>

              <div>
                <strong>{t.clubLabel}</strong>
                <span>{selectedMatchToLeave.club}</span>
              </div>

              <div>
                <strong>{t.dateLabel}</strong>
                <span>{formatDate(selectedMatchToLeave.match_date)}</span>
              </div>

              <div>
                <strong>{t.timeLabel}</strong>
                <span>{getMatchTimeRange(selectedMatchToLeave.match_time)}</span>
              </div>
            </div>

            <p>{t.leaveModalText}</p>

            <div className="join-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedMatchToLeave(null)}
                disabled={actionLoadingId === selectedMatchToLeave.id}
              >
                {t.cancel}
              </button>

              <button
                type="button"
                className="primary-button leave-confirm-button"
                onClick={confirmLeaveMatch}
                disabled={actionLoadingId === selectedMatchToLeave.id}
              >
                {actionLoadingId === selectedMatchToLeave.id
                  ? t.leaving
                  : t.yesLeave}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};