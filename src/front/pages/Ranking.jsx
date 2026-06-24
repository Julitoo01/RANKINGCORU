import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";

export const Ranking = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [ranking, setRanking] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [level, setLevel] = useState("");

  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [error, setError] = useState("");

  const levels = ["", "Iniciación", "Bronce", "Plata", "Oro", "Diamante"];

  const selectedSeason = seasons.find(
    (season) => String(season.id) === String(selectedSeasonId)
  );

  const activeSeason = seasons.find((season) => season.is_active);
  const isHistoricalSeason = selectedSeason?.is_closed === true;

  const loadSeasons = async () => {
    try {
      setSeasonsLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/seasons`);

      if (!data) return;

      setSeasons(data);

      const currentActiveSeason = data.find((season) => season.is_active);

      if (currentActiveSeason && !selectedSeasonId) {
        setSelectedSeasonId(String(currentActiveSeason.id));
      }
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar temporadas");
    } finally {
      setSeasonsLoading(false);
    }
  };

  const loadRanking = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (level) {
        params.append("level", level);
      }

      if (selectedSeasonId) {
        params.append("season_id", selectedSeasonId);
      }

      const queryString = params.toString();

      const url = queryString
        ? `${backendUrl}/api/ranking?${queryString}`
        : `${backendUrl}/api/ranking`;

      const data = await authFetch(url);

      if (!data) return;

      setRanking(data);
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar el ranking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (!seasonsLoading) {
      loadRanking();
    }
  }, [level, selectedSeasonId, seasonsLoading]);

  const getPositionLabel = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";

    return index + 1;
  };

  const getMobilePositionLabel = (player, index) => {
    if (isHistoricalSeason && player.final_position) {
      return `#${player.final_position}`;
    }

    return `#${index + 1}`;
  };

  const getSeasonLabel = () => {
    if (!selectedSeason && activeSeason) {
      return activeSeason.name;
    }

    if (!selectedSeason) {
      return "Temporada actual";
    }

    return selectedSeason.name;
  };

  return (
    <section className="ranking-page">
      <div className="ranking-hero">
        <div>
          <span className="ranking-kicker">Fuera de Pista</span>
          <h1>Ranking</h1>
          <p>
            Clasificación individual por temporadas cuatrimestrales. Los
            partidos se juegan por parejas, pero las estadísticas son
            individuales para cada jugador.
          </p>
        </div>

        <div className="ranking-hero-card">
          <strong>{ranking.length}</strong>
          <span>
            {isHistoricalSeason
              ? "Jugadores en histórico"
              : "Jugadores en ranking"}
          </span>
        </div>
      </div>

      <div className="ranking-season-card">
        <div>
          <span>Temporada</span>
          <h2>{getSeasonLabel()}</h2>
          <p>
            {isHistoricalSeason
              ? "Estás viendo una clasificación histórica cerrada."
              : "Estás viendo la temporada activa actual."}
          </p>
        </div>

        <div className="ranking-selects-row">
          <div className="ranking-season-select-box">
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

          <div className="ranking-season-select-box">
            <label>Ver nivel</label>

            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            >
              {levels.map((item) => (
                <option key={item || "Todos"} value={item}>
                  {item || "Todos"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="ranking-state">
          <p>Cargando ranking...</p>
        </div>
      )}

      {!loading && !error && ranking.length === 0 && (
        <div className="ranking-empty">
          <h2>
            {isHistoricalSeason
              ? "No hay histórico guardado para esta temporada"
              : "Todavía no hay jugadores aprobados"}
          </h2>

          <p>
            {isHistoricalSeason
              ? "Cuando se cierre una temporada con jugadores aprobados, se guardará aquí su clasificación final."
              : "Cuando los jugadores se registren y sean aprobados por el admin, aparecerán en esta clasificación."}
          </p>
        </div>
      )}

      {!loading && !error && ranking.length > 0 && (
        <div className="ranking-table-card">
          <div className="ranking-table-header">
            <div>
              <h2>
                {isHistoricalSeason
                  ? "Clasificación histórica"
                  : "Clasificación actual"}
              </h2>

              <p>
                {level
                  ? `Mostrando jugadores de nivel ${level}`
                  : "Mostrando todos los niveles"}
              </p>
            </div>

            {isHistoricalSeason && (
              <div className="ranking-history-badge">Histórico cerrado</div>
            )}
          </div>

          <div className="table-wrapper ranking-desktop-table">
            <table className="ranking-table ranking-table-premium">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Jugador</th>
                  <th>Nivel</th>
                  <th>PJ</th>
                  <th>PG</th>
                  <th>PP</th>
                  <th>% Victorias</th>
                </tr>
              </thead>

              <tbody>
                {ranking.map((player, index) => (
                  <tr key={`${player.id}-${player.profile_id || index}`}>
                    <td>
                      <span className="ranking-position">
                        {isHistoricalSeason && player.final_position
                          ? player.final_position
                          : index < 3
                          ? getPositionLabel(index)
                          : index + 1}
                      </span>
                    </td>

                    <td>
                      <div className="ranking-player-cell">
                        <div className="ranking-avatar">
                          {player.profile_image ? (
                            <img
                              src={player.profile_image}
                              alt={player.nickname || "Jugador"}
                            />
                          ) : (
                            player.nickname?.charAt(0)?.toUpperCase() || "J"
                          )}
                        </div>

                        <strong>{player.nickname}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="ranking-level-pill">{player.level}</span>
                    </td>

                    <td>{player.matches_played}</td>
                    <td>{player.wins}</td>
                    <td>{player.losses}</td>
                    <td>{player.win_percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ranking-mobile-cards">
            {ranking.map((player, index) => (
              <article
                key={`mobile-${player.id}-${player.profile_id || index}`}
                className={`ranking-mobile-card ${
                  index === 0 ? "ranking-mobile-card-first" : ""
                }`}
              >
                <div className="ranking-mobile-card-top">
                  <div className="ranking-player-cell">
                    <div className="ranking-avatar ranking-mobile-avatar">
                      {player.profile_image ? (
                        <img
                          src={player.profile_image}
                          alt={player.nickname || "Jugador"}
                        />
                      ) : (
                        player.nickname?.charAt(0)?.toUpperCase() || "J"
                      )}
                    </div>

                    <div>
                      <strong>{player.nickname}</strong>
                      <span className="ranking-mobile-subtitle">
                        {player.level}
                      </span>
                    </div>
                  </div>

                  <div className="ranking-mobile-position">
                    {index < 3 && !isHistoricalSeason
                      ? getPositionLabel(index)
                      : getMobilePositionLabel(player, index)}
                  </div>
                </div>

                <div className="ranking-mobile-stats">
                  <div>
                    <span>PJ</span>
                    <strong>{player.matches_played}</strong>
                  </div>

                  <div>
                    <span>PG</span>
                    <strong>{player.wins}</strong>
                  </div>

                  <div>
                    <span>PP</span>
                    <strong>{player.losses}</strong>
                  </div>

                  <div>
                    <span>%</span>
                    <strong>{player.win_percentage}%</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};