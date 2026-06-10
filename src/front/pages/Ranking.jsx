import { useEffect, useState } from "react";

export const Ranking = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [ranking, setRanking] = useState([]);
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const levels = ["", "Iniciación", "Bronce", "Plata", "Oro", "Diamante"];

  const loadRanking = async () => {
    try {
      setLoading(true);
      setError("");

      const url = level
        ? `${backendUrl}/api/ranking?level=${encodeURIComponent(level)}`
        : `${backendUrl}/api/ranking`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo cargar el ranking");
      }

      setRanking(data);
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar el ranking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking();
  }, [level]);

  const topThree = ranking.slice(0, 3);
  const restRanking = ranking.slice(3);

  const getPositionLabel = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return index + 1;
  };

  return (
    <section className="ranking-page">
      <div className="ranking-hero">
        <div>
          <span className="ranking-kicker">Fuera de Pista</span>
          <h1>Ranking</h1>
          <p>
            Clasificación individual por niveles. Los partidos se juegan por
            parejas, pero cada jugador suma sus propios puntos.
          </p>
        </div>

        <div className="ranking-hero-card">
          <strong>{ranking.length}</strong>
          <span>Jugadores en ranking</span>
        </div>
      </div>

      <div className="ranking-filters">
        {levels.map((item) => (
          <button
            key={item || "Todos"}
            className={`ranking-filter-btn ${level === item ? "active" : ""}`}
            onClick={() => setLevel(item)}
          >
            {item || "Todos"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="ranking-state">
          <p>Cargando ranking...</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && ranking.length === 0 && (
        <div className="ranking-empty">
          <h2>Todavía no hay jugadores aprobados</h2>
          <p>
            Cuando los jugadores se registren y sean aprobados por el admin,
            aparecerán en esta clasificación.
          </p>
        </div>
      )}

      {!loading && !error && ranking.length > 0 && (
        <>
          <div className="ranking-top">
            {topThree.map((player, index) => (
              <article
                key={player.id}
                className={`ranking-podium-card ranking-podium-${index + 1}`}
              >
                <div className="ranking-medal">{getPositionLabel(index)}</div>

                <div>
                  <h3>{player.nickname}</h3>
                  <span>{player.level}</span>
                </div>

                <strong>{player.points} pts</strong>

                <div className="ranking-mini-stats">
                  <p>
                    <b>{player.matches_played}</b>
                    <span>PJ</span>
                  </p>

                  <p>
                    <b>{player.wins}</b>
                    <span>PG</span>
                  </p>

                  <p>
                    <b>{player.losses}</b>
                    <span>PP</span>
                  </p>

                  <p>
                    <b>{player.win_percentage}%</b>
                    <span>Vict.</span>
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="ranking-table-card">
            <div className="ranking-table-header">
              <div>
                <h2>Clasificación general</h2>
                <p>
                  {level
                    ? `Mostrando jugadores de nivel ${level}`
                    : "Mostrando todos los niveles"}
                </p>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="ranking-table ranking-table-premium">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Jugador</th>
                    <th>Nivel</th>
                    <th>PJ</th>
                    <th>PG</th>
                    <th>PP</th>
                    <th>Puntos</th>
                    <th>% Victorias</th>
                  </tr>
                </thead>

                <tbody>
                  {ranking.map((player, index) => (
                    <tr key={player.id}>
                      <td>
                        <span className="ranking-position">
                          {index < 3 ? getPositionLabel(index) : index + 1}
                        </span>
                      </td>

                      <td>
                        <div className="ranking-player-cell">
                          <div className="ranking-avatar">
                            {player.nickname?.charAt(0)?.toUpperCase() || "J"}
                          </div>

                          <strong>{player.nickname}</strong>
                        </div>
                      </td>

                      <td>
                        <span className="ranking-level-pill">
                          {player.level}
                        </span>
                      </td>

                      <td>{player.matches_played}</td>
                      <td>{player.wins}</td>
                      <td>{player.losses}</td>

                      <td>
                        <strong className="ranking-points">
                          {player.points}
                        </strong>
                      </td>

                      <td>{player.win_percentage}%</td>
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