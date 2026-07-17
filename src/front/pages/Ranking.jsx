import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import { translations } from "../i18n/translations";

export const Ranking = () => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL &&
    import.meta.env.VITE_BACKEND_URL !== "undefined"
      ? import.meta.env.VITE_BACKEND_URL
      : window.location.origin;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language];

  const [ranking, setRanking] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [level, setLevel] = useState("");

  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [error, setError] = useState("");

  const levels = [
    { value: "", label: t.allLevels },
    { value: "Iniciación", label: t.levelBeginner },
    { value: "Bronce", label: t.levelBronze },
    { value: "Plata", label: t.levelSilver },
    { value: "Oro", label: t.levelGold },
    { value: "Diamante", label: t.levelDiamond },
  ];

  const selectedSeason = seasons.find(
    (season) => String(season.id) === String(selectedSeasonId)
  );

  const activeSeason = seasons.find((season) => season.is_active);
  const isHistoricalSeason = selectedSeason?.is_closed === true;

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

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
      return t.currentSeason;
    }

    return selectedSeason.name;
  };

  const getSelectedLevelLabel = () => {
    const selectedLevel = levels.find((item) => item.value === level);
    return selectedLevel?.label || level;
  };

  return (
    <section className="ranking-page">
      <div className="ranking-hero">
        <div>
          <span className="ranking-kicker">{t.rankingKicker}</span>
          <h1>{t.rankingTitle}</h1>

          <p className="desktop-text">{t.rankingHeroText}</p>
          <p className="mobile-text">{t.rankingHeroTextMobile}</p>
        </div>

        <div className="ranking-hero-card">
          <strong>{ranking.length}</strong>
          <span>
            {isHistoricalSeason ? t.playersInHistorical : t.playersInRanking}
          </span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="ranking-state">
          <p>{t.loadingRanking}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="ranking-table-card ranking-combined-card">
          <div className="ranking-season-card ranking-season-card-inside">
            <div>
              <span>{t.season}</span>
              <h2>{getSeasonLabel()}</h2>

              <p className="desktop-text">
                {isHistoricalSeason
                  ? t.historicalSeasonText
                  : t.activeSeasonText}
              </p>
            </div>

            <div className="ranking-selects-row">
              <div className="ranking-season-select-box">
                <label>{t.viewSeason}</label>

                <select
                  value={selectedSeasonId}
                  onChange={(event) => setSelectedSeasonId(event.target.value)}
                >
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}{" "}
                      {season.is_active ? `· ${t.current}` : `· ${t.historical}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ranking-season-select-box">
                <label>{t.viewLevel}</label>

                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                >
                  {levels.map((item) => (
                    <option key={item.value || "all"} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="ranking-table-header ranking-table-header-inside">
            <div>
              <h2>
                {isHistoricalSeason ? t.historicalRanking : t.currentRanking}
              </h2>

              <p>
                {level
                  ? `${t.showingLevel} ${getSelectedLevelLabel()}`
                  : t.showingAllLevels}
              </p>
            </div>

            {isHistoricalSeason && (
              <div className="ranking-history-badge">
                {t.closedHistorical}
              </div>
            )}
          </div>

          {ranking.length === 0 && (
            <div className="ranking-empty ranking-empty-inside">
              <h2>
                {isHistoricalSeason
                  ? t.noHistoricalRanking
                  : t.noApprovedPlayers}
              </h2>

              <p>
                {isHistoricalSeason
                  ? t.noHistoricalRankingText
                  : t.noApprovedPlayersText}
              </p>
            </div>
          )}

          {ranking.length > 0 && (
            <>
              <div className="table-wrapper ranking-desktop-table">
                <table className="ranking-table ranking-table-premium">
                  <thead>
                    <tr>
                      <th>{t.positionShort}</th>
                      <th>{t.player}</th>
                      <th>{t.level}</th>
                      <th>{t.matchesPlayedShort}</th>
                      <th>{t.winsShort}</th>
                      <th>{t.lossesShort}</th>
                      <th>{t.winPercentage}</th>
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
                                  alt={player.nickname || t.playerFallback}
                                />
                              ) : (
                                player.nickname?.charAt(0)?.toUpperCase() ||
                                t.playerFallback.charAt(0)
                              )}
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
                              alt={player.nickname || t.playerFallback}
                            />
                          ) : (
                            player.nickname?.charAt(0)?.toUpperCase() ||
                            t.playerFallback.charAt(0)
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
                        <span>{t.matchesPlayedShort}</span>
                        <strong>{player.matches_played}</strong>
                      </div>

                      <div>
                        <span>{t.winsShort}</span>
                        <strong>{player.wins}</strong>
                      </div>

                      <div>
                        <span>{t.lossesShort}</span>
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
            </>
          )}
        </div>
      )}
    </section>
  );
};