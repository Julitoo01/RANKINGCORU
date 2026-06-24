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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      const data = await authFetch(`${backendUrl}/api/profile`);

      if (!data) {
        setUser(null);
        setPlayerProfile(null);
        return;
      }

      setUser(data);
      setPlayerProfile(data.profile || null);
    } catch (error) {
      console.error("Error cargando perfil:", error);
      setUser(null);
      setPlayerProfile(null);
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
    await loadProfile();
    await loadOpenMatches();
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleJoin = async (openMatchId) => {
    try {
      setActionLoadingId(openMatchId);
      setMessage("");
      setError("");

      await authFetch(`${backendUrl}/api/open-matches/${openMatchId}/join`, {
        method: "POST",
      });

      setMessage("Te has unido al partido correctamente.");

      window.dispatchEvent(new Event("notificationsUpdated"));

      await loadOpenMatches();
    } catch (error) {
      console.error("Error uniéndose al partido:", error);
      setError(error.message || "No se pudo unir al partido.");
    } finally {
      setActionLoadingId(null);
    }
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

      window.dispatchEvent(new Event("notificationsUpdated"));

      await loadOpenMatches();
    } catch (error) {
      console.error("Error saliendo del partido:", error);
      setError(error.message || "No se pudo salir del partido.");
    } finally {
      setActionLoadingId(null);
    }
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

      {playerProfile?.status && playerProfile.status !== "approved" && (
        <div className="error-message">
          Tu perfil todavía no está aprobado. Podrás apuntarte a partidos cuando
          el admin apruebe tu inscripción.
        </div>
      )}

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="open-matches-list">
        <div className="open-matches-list-header">
          <div>
            <span className="section-kicker">Disponibles</span>
            <h2>Partidos para jugar</h2>
          </div>
        </div>

        {loading && (
          <p className="open-match-empty">Cargando partidos abiertos...</p>
        )}

        {!loading && openMatches.length === 0 && (
          <p className="open-match-empty">
            No hay partidos disponibles ahora mismo para tu nivel.
          </p>
        )}

        {!loading && openMatches.length > 0 && (
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
                        onClick={() => handleJoin(openMatch.id)}
                        disabled={
                          isActionLoading ||
                          !playerProfile ||
                          playerProfile.status !== "approved"
                        }
                      >
                        {isActionLoading ? "Apuntando..." : "Apuntarme"}
                      </button>
                    )}

                    {isOpen && joined && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleLeave(openMatch.id)}
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
    </section>
  );
};