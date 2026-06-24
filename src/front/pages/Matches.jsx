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
    if (!team || team.length === 0) return "-";

    const names = team
      .filter(Boolean)
      .map((player) => player.nickname)
      .filter(Boolean);

    return names.length > 0 ? names.join(" / ") : "-";
  };

  const selectedSeason = seasons.find(
    (season) => String(season.id) === String(selectedSeasonId)
  );

  return (
    <section className="matches-page">
      <div className="matches-hero">
        <div>
          <span>Fuera de Pista</span>
          <h1>Partidos</h1>
          <p>
            Consulta los resultados registrados en el ranking y el historial de
            partidos de cada temporada.
          </p>
        </div>

        <div className="matches-hero-card">
          <strong>{matches.length}</strong>
          <span>Partidos registrados</span>
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

      {loading && (
        <div className="matches-state">
          <p>Cargando partidos...</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && matches.length === 0 && (
        <div className="matches-empty">
          <h2>No hay partidos registrados</h2>
          <p>
            Cuando los jugadores suban resultados, aparecerán aquí dentro de su
            temporada correspondiente.
          </p>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="matches-list">
          {matches.map((match) => (
            <article className="match-card" key={match.id}>
              <div className="match-card-header">
                <div>
                  <span>{formatDate(match.played_at)}</span>
                  <h2>{match.level || "Nivel no indicado"}</h2>
                </div>

                <div className="match-score">{match.score || "-"}</div>
              </div>

              <div className="match-status-row">
                <span className="match-status-badge confirmed">
                  Confirmado
                </span>

                <span>
                  Ganador: <strong>{getWinnerText(match.winner_team)}</strong>
                </span>
              </div>

              <div className="match-teams">
                <div
                  className={`match-team ${
                    match.winner_team === "A" ? "winner" : ""
                  }`}
                >
                  <span>Equipo A</span>
                  <strong>{renderTeam(match.team_a)}</strong>
                </div>

                <div className="match-vs">vs</div>

                <div
                  className={`match-team ${
                    match.winner_team === "B" ? "winner" : ""
                  }`}
                >
                  <span>Equipo B</span>
                  <strong>{renderTeam(match.team_b)}</strong>
                </div>
              </div>

              <div className="match-card-footer">
                <span>
                  Club: <strong>{match.club || "-"}</strong>
                </span>

                <span>
                  Temporada:{" "}
                  <strong>{match.season || selectedSeason?.name || "-"}</strong>
                </span>

                <span>
                  Subido por: <strong>{match.submitted_by || "-"}</strong>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};