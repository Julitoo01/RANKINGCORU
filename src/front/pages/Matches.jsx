import { useEffect, useState } from "react";

export const Matches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${backendUrl}/api/matches`);
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
    loadMatches();
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

  const lastThreeMatches = matches.slice(0, 3);

  return (
    <section className="matches-page">
      <div className="matches-hero">
        <div>
          <span>Fuera de Pista</span>
          <h1>Partidos</h1>
          <p>
            Consulta los últimos resultados subidos por los jugadores y sigue la
            actividad del ranking.
          </p>
        </div>

        <div className="matches-hero-card">
          <strong>{matches.length}</strong>
          <span>Partidos registrados</span>
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
          <h2>Todavía no hay partidos registrados</h2>
          <p>
            Cuando los jugadores suban resultados, aparecerán en esta página.
          </p>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <>
          <div className="matches-section-header">
            <div>
              <span>Últimos resultados</span>
              <h2>Actividad reciente</h2>
            </div>
          </div>

          <div className="matches-cards-grid">
            {lastThreeMatches.map((match) => (
              <article key={match.id} className="match-card">
                <div className="match-card-top">
                  <span className="match-level">{match.level}</span>
                  <span className="match-date">{formatDate(match.played_at)}</span>
                </div>

                <div className="match-teams">
                  <div
                    className={
                      match.winner_team === "A"
                        ? "match-team winner"
                        : "match-team"
                    }
                  >
                    <span>Equipo A</span>
                    <strong>
                      {match.team_a?.[0]?.nickname || "-"} /{" "}
                      {match.team_a?.[1]?.nickname || "-"}
                    </strong>
                  </div>

                  <div
                    className={
                      match.winner_team === "B"
                        ? "match-team winner"
                        : "match-team"
                    }
                  >
                    <span>Equipo B</span>
                    <strong>
                      {match.team_b?.[0]?.nickname || "-"} /{" "}
                      {match.team_b?.[1]?.nickname || "-"}
                    </strong>
                  </div>
                </div>

                <div className="match-score-box">
                  <span>Resultado</span>
                  <strong>{match.score}</strong>
                </div>

                <div className="match-card-footer">
                  <span>Ganador: {getWinnerText(match.winner_team)}</span>
                  <span>{match.club || "Club no indicado"}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="matches-table-card">
            <div className="matches-table-header">
              <div>
                <h2>Historial de partidos</h2>
                <p>Todos los resultados registrados en Fuera de Pista.</p>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="ranking-table matches-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Nivel</th>
                    <th>Equipo A</th>
                    <th>Equipo B</th>
                    <th>Resultado</th>
                    <th>Ganador</th>
                    <th>Club</th>
                  </tr>
                </thead>

                <tbody>
                  {matches.map((match) => (
                    <tr key={match.id}>
                      <td>{formatDate(match.played_at)}</td>

                      <td>
                        <span className="match-level-pill">{match.level}</span>
                      </td>

                      <td>
                        <strong>
                          {match.team_a?.[0]?.nickname || "-"} /{" "}
                          {match.team_a?.[1]?.nickname || "-"}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {match.team_b?.[0]?.nickname || "-"} /{" "}
                          {match.team_b?.[1]?.nickname || "-"}
                        </strong>
                      </td>

                      <td>
                        <span className="match-score-pill">{match.score}</span>
                      </td>

                      <td>{getWinnerText(match.winner_team)}</td>

                      <td>{match.club || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};