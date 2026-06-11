import { useEffect, useState } from "react";

export const Matches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

  const [matches, setMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSeasons = async () => {
    try {
      setSeasonsLoading(true);

      const response = await fetch(`${backendUrl}/api/seasons`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudieron cargar las temporadas");
      }

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

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudieron cargar los partidos");
      }

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
            Consulta los resultados registrados en el ranking y revisa el
            historial de partidos de cada temporada.
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
                  <h2>{match.level}</h2>
                </div>

                <div className="match-score">{match.score}</div>
              </div>

              <div className="match-teams">
                <div
                  className={`match-team ${
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
                  className={`match-team ${
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

              <div className="match-card-footer">
                <span>Ganador: {getWinnerText(match.winner_team)}</span>
                <span>Club: {match.club || "-"}</span>
                <span>Temporada: {match.season || selectedSeason?.name || "-"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};