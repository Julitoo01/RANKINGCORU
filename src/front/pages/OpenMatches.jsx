import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

export const OpenMatches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [user, setUser] = useState(null);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [openMatches, setOpenMatches] = useState([]);
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
      setError("No se pudieron cargar los partidos abiertos.");
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
      setError(
        "Tu perfil todavía no está aprobado. Podrás apuntarte a partidos cuando el admin apruebe tu inscripción."
      );
      return;
    }

    try {
      setActionLoadingId(openMatchId);
      setMessage("");
      setError("");

      await authFetch(`${backendUrl}/api/open-matches/${openMatchId}/join`, {
        method: "POST",
      });

      setMessage("Te has unido al partido correctamente.");
      setSelectedMatchToJoin(null);

      window.dispatchEvent(new Event("notificationsUpdated"));

      await loadOpenMatches();
    } catch (error) {
      console.error("Error uniéndose al partido:", error);
      setError(error.message || "No se pudo unir al partido.");
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

      setMessage("Has salido del partido correctamente.");
      setSelectedMatchToLeave(null);

      window.dispatchEvent(new Event("notificationsUpdated"));

      await loadOpenMatches();
    } catch (error) {
      console.error("Error saliendo del partido:", error);
      setError(error.message || "No se pudo salir del partido.");
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

    if (!player) return "Jugador";

    return (
      player.nickname ||
      `${player.name || ""} ${player.last_name || ""}`.trim() ||
      "Jugador"
    );
  };

  const getTeamPlayerName = (player) => {
    if (!player) return "Jugador";

    return (
      player.nickname ||
      `${player.name || ""} ${player.last_name || ""}`.trim() ||
      "Jugador"
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

  const formatDate = (date) => {
    if (!date) return "";

    const dateObject = new Date(`${date}T00:00:00`);

    if (Number.isNaN(dateObject.getTime())) {
      return date;
    }

    return dateObject.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusText = (status) => {
    if (status === "open") return "Abierto";
    if (status === "closed") return "Cerrado";
    if (status === "cancelled") return "Cancelado";

    return status;
  };

  const profileIsPending =
    playerProfile && playerProfile.status && playerProfile.status !== "approved";

  return (
    <section className="open-matches-page">
      <div className="open-matches-hero">
        <span className="section-kicker">Jugar</span>

        <h1>Partidos abiertos</h1>

        <p>
          Apúntate a partidos de tu nivel. Cuando haya 4 jugadores, el partido
          se cierra automáticamente, se crean las parejas y uno de los jugadores
          podrá subir el resultado.
        </p>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="open-matches-list">
          <p className="open-match-empty">Cargando partidos abiertos...</p>
        </div>
      )}

      {!loading && !playerProfile && (
        <div className="open-matches-pending-card">
          <div className="open-matches-pending-icon">!</div>

          <span>Perfil no encontrado</span>

          <h2>No hemos podido cargar tu perfil de jugador</h2>

          <p>
            Vuelve a iniciar sesión o revisa tu cuenta para poder acceder a los
            partidos abiertos.
          </p>

          <Link to="/profile" className="primary-button">
            Ir a mi perfil
          </Link>
        </div>
      )}

      {!loading && profileIsPending && (
        <div className="open-matches-pending-card">
          <div className="open-matches-pending-icon">⏳</div>

          <span>Inscripción pendiente</span>

          <h2>Tu perfil todavía no está aprobado</h2>

          <p>
            Podrás apuntarte a partidos cuando el admin apruebe tu inscripción.
          </p>

          <div className="open-matches-pending-steps">
            <div>
              <strong>1</strong>
              <span>Registro enviado</span>
            </div>

            <div>
              <strong>2</strong>
              <span>Revisión del admin</span>
            </div>

            <div>
              <strong>3</strong>
              <span>Acceso a partidos</span>
            </div>
          </div>

          <Link to="/profile" className="primary-button">
            Ver mi perfil
          </Link>
        </div>
      )}

      {!loading && playerProfile?.status === "approved" && (
        <div className="open-matches-list">
          <div className="open-matches-list-header">
            <div>
              <span className="section-kicker">Disponibles</span>
              <h2>Partidos para jugar</h2>
            </div>
          </div>

          {openMatches.length === 0 && (
            <div className="open-matches-empty-card">
              <div className="open-matches-pending-icon">🎾</div>

              <span>Sin partidos ahora mismo</span>

              <h2>No hay partidos disponibles para tu nivel</h2>

              <p>
                Cuando el admin abra un partido de tu nivel, aparecerá aquí y te
                llegará un aviso.
              </p>
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

                return (
                  <article key={openMatch.id} className="open-match-card">
                    <div className="open-match-card-header">
                      <div>
                        <h3>{openMatch.level}</h3>

                        <p>
                          {openMatch.club} · {formatDate(openMatch.match_date)} ·{" "}
                          {openMatch.match_time}
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
                      {openMatch.players_count}/{openMatch.max_players} jugadores
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
                          Todavía no hay jugadores apuntados.
                        </p>
                      )}
                    </div>

                    {isClosed && (
                      <div className="open-match-teams">
                        <div className="open-match-team-card">
                          <h4>Equipo A</h4>

                          <p>{getTeamPlayerName(openMatch.team_a?.[0])}</p>
                          <p>{getTeamPlayerName(openMatch.team_a?.[1])}</p>
                        </div>

                        <div className="open-match-vs">VS</div>

                        <div className="open-match-team-card">
                          <h4>Equipo B</h4>

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
                          Apuntarme
                        </button>
                      )}

                      {isOpen && joined && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setSelectedMatchToLeave(openMatch)}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? "Saliendo..." : "Salir del partido"}
                        </button>
                      )}

                      {uploadAllowed && (
                        <Link
                          to={`/upload-result?open_match_id=${openMatch.id}`}
                          className="primary-button"
                        >
                          Subir resultado
                        </Link>
                      )}

                      {isClosed && !joined && !openMatch.has_result && (
                        <span className="open-match-closed-text">
                          Partido completo
                        </span>
                      )}

                      {isClosed && joined && openMatch.has_result && (
                        <span className="open-match-closed-text">
                          Resultado enviado
                        </span>
                      )}

                      {isOpen && isFull && !joined && (
                        <span className="open-match-closed-text">
                          Partido completo
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

            <span>Confirmar inscripción</span>

            <h2>¿Quieres apuntarte a este partido?</h2>

            <div className="join-modal-details">
              <div>
                <strong>Nivel</strong>
                <span>{selectedMatchToJoin.level}</span>
              </div>

              <div>
                <strong>Club</strong>
                <span>{selectedMatchToJoin.club}</span>
              </div>

              <div>
                <strong>Fecha</strong>
                <span>{formatDate(selectedMatchToJoin.match_date)}</span>
              </div>

              <div>
                <strong>Hora</strong>
                <span>{selectedMatchToJoin.match_time}</span>
              </div>
            </div>

            <p>
              Si confirmas, quedarás apuntado a este partido. Cuando haya 4
              jugadores, se cerrará automáticamente y se crearán las parejas.
            </p>

            <div className="join-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedMatchToJoin(null)}
                disabled={actionLoadingId === selectedMatchToJoin.id}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={confirmJoinMatch}
                disabled={actionLoadingId === selectedMatchToJoin.id}
              >
                {actionLoadingId === selectedMatchToJoin.id
                  ? "Apuntando..."
                  : "Sí, apuntarme"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMatchToLeave && (
        <div className="join-modal-overlay">
          <div className="join-modal-card leave-modal-card">
            <div className="join-modal-icon leave-modal-icon">⚠️</div>

            <span>Confirmar salida</span>

            <h2>¿Seguro que quieres salirte de este partido?</h2>

            <div className="join-modal-details">
              <div>
                <strong>Nivel</strong>
                <span>{selectedMatchToLeave.level}</span>
              </div>

              <div>
                <strong>Club</strong>
                <span>{selectedMatchToLeave.club}</span>
              </div>

              <div>
                <strong>Fecha</strong>
                <span>{formatDate(selectedMatchToLeave.match_date)}</span>
              </div>

              <div>
                <strong>Hora</strong>
                <span>{selectedMatchToLeave.match_time}</span>
              </div>
            </div>

            <p>
              Recuerda que solo puedes salirte si faltan más de 24 horas para el
              inicio del partido. Si faltan 24 horas o menos, la app no permitirá
              abandonar el partido.
            </p>

            <div className="join-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedMatchToLeave(null)}
                disabled={actionLoadingId === selectedMatchToLeave.id}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="primary-button leave-confirm-button"
                onClick={confirmLeaveMatch}
                disabled={actionLoadingId === selectedMatchToLeave.id}
              >
                {actionLoadingId === selectedMatchToLeave.id
                  ? "Saliendo..."
                  : "Sí, salir del partido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};