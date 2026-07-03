import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";

export const Matches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [matches, setMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSeasons = async () => {
    try {
      setSeasonsLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/seasons`);

      if (!data) return;

      setSeasons(data);

      const activeSeason = data.find((season) => season.is_active);

      if (activeSeason && !selectedSeasonId) {
        setSelectedSeasonId(String(activeSeason.id));
      }
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar temporadas");
    } finally {
      setSeasonsLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (selectedSeasonId) {
        params.append("season_id", selectedSeasonId);
      }

      const queryString = params.toString();

      const url = queryString
        ? `${backendUrl}/api/matches?${queryString}`
        : `${backendUrl}/api/matches`;

      const data = await authFetch(url);

      if (!data) return;

      setMatches(data);
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar partidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (!seasonsLoading) {
      loadMatches();
    }
  }, [selectedSeasonId, seasonsLoading]);

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("es-ES", {
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

  const renderTeam = (team) => {
    if (!team || team.length === 0) return ["-"];

    const names = team
      .filter(Boolean)
      .map((player) => {
        return (
          player.nickname ||
          `${player.name || ""} ${player.last_name || ""}`.trim()
        );
      })
      .filter(Boolean);

    return names.length > 0 ? names : ["-"];
  };

  const selectedSeason = seasons.find(
    (season) => String(season.id) === String(selectedSeasonId)
  );

  const totalMatches = matches.length;

  return (
    <section className="matches-page">
      <div className="matches-hero">
        <div>
          <span>Fuera de Pista</span>

          <h1>Partidos</h1>

          <p>
            Consulta el historial de partidos jugados, resultados registrados,
            parejas, ganadores y temporada correspondiente.
          </p>
        </div>

        <div className="matches-hero-card">
          <strong>{totalMatches}</strong>
          <span>{totalMatches === 1 ? "Partido registrado" : "Partidos registrados"}</span>
        </div>
      </div>

      <div className="matches-season-card">
        <div>
          <span>Temporada</span>

          <h2>{selectedSeason?.name || "Temporada actual"}</h2>

          <p>
            {selectedSeason?.is_closed
              ? "Estás viendo partidos de una temporada cerrada."
              : "Estás viendo los partidos de la temporada activa."}
          </p>
        </div>

        <div className="matches-season-select-box">
          <label>Ver temporada</label>

          <select
            value={selectedSeasonId}
            onChange={(event) => setSelectedSeasonId(event.target.value)}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} {season.is_active ? "· Actual" : "· Histórico"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="matches-state">
          <p>Cargando partidos...</p>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="matches-empty">
          <div className="matches-empty-icon">🎾</div>

          <span>Sin partidos todavía</span>

          <h2>No hay partidos registrados</h2>

          <p>
            Cuando los jugadores suban resultados, aparecerán aquí con sus
            equipos, marcador, ganador y temporada.
          </p>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="matches-list">
          {matches.map((match) => {
            const teamAPlayers = renderTeam(match.team_a);
            const teamBPlayers = renderTeam(match.team_b);
            const teamAWon = match.winner_team === "A";
            const teamBWon = match.winner_team === "B";

            return (
              <article className="match-card" key={match.id}>
                <div className="match-card-header">
                  <div>
                    <span>{formatDate(match.played_at)}</span>

                    <h2>{match.level || "Nivel no indicado"}</h2>

                    <p>{match.club || "Club no indicado"}</p>
                  </div>

                  <div className="match-score-box">
                    <span>Resultado</span>
                    <strong>{match.score || "-"}</strong>
                  </div>
                </div>

                <div className="match-status-row">
                  <span className="match-status-badge confirmed">
                    Resultado registrado
                  </span>

                  <span>
                    Ganador: <strong>{getWinnerText(match.winner_team)}</strong>
                  </span>
                </div>

                <div className="match-teams">
                  <div className={`match-team ${teamAWon ? "winner" : ""}`}>
                    <span>Equipo A</span>

                    {teamAPlayers.map((playerName, index) => (
                      <strong key={`${match.id}-team-a-${index}`}>
                        {playerName}
                      </strong>
                    ))}

                    {teamAWon && <small>Ganador</small>}
                  </div>

                  <div className="match-vs">VS</div>

                  <div className={`match-team ${teamBWon ? "winner" : ""}`}>
                    <span>Equipo B</span>

                    {teamBPlayers.map((playerName, index) => (
                      <strong key={`${match.id}-team-b-${index}`}>
                        {playerName}
                      </strong>
                    ))}

                    {teamBWon && <small>Ganador</small>}
                  </div>
                </div>

                <div className="match-card-footer">
                  <span>
                    Temporada:{" "}
                    <strong>{match.season || selectedSeason?.name || "-"}</strong>
                  </span>

                  <span>
                    Subido por: <strong>{match.submitted_by || "-"}</strong>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};