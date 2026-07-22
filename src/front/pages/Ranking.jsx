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
      setError(error.message || t.seasonsLoadError || "Error al cargar temporadas");
    } finally {
      setSeasonsLoading(false);
    }
  };

  const loadRanking = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

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
      setError(error.message || t.rankingLoadError || "Error al cargar el ranking");
    } finally {
      if (!silent) {
        setLoading(false);
      }
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

  useEffect(() => {
    const handleRankingRefresh = () => {
      if (!seasonsLoading) {
        loadRanking({ silent: true });
      }
    };

    window.addEventListener("focus", handleRankingRefresh);
    window.addEventListener("notificationsUpdated", handleRankingRefresh);
    window.addEventListener("profileUpdated", handleRankingRefresh);

    return () => {
      window.removeEventListener("focus", handleRankingRefresh);
      window.removeEventListener("notificationsUpdated", handleRankingRefresh);
      window.removeEventListener("profileUpdated", handleRankingRefresh);
    };
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

  const getPlayerName = (player) => {
    return player.nickname || player.name || t.playerFallback;
  };

  const getPlayerInitial = (player) => {
    const name = getPlayerName(player);
    return name?.charAt(0)?.toUpperCase() || t.playerFallback.charAt(0);
  };

  const getWinPercentage = (player) => {
    if (player.win_percentage !== undefined && player.win_percentage !== null) {
      return player.win_percentage;
    }

    const matchesPlayed = player.matches_played || 0;
    const wins = player.wins || 0;

    if (matchesPlayed === 0) return 0;

    return Math.round((wins / matchesPlayed) * 100);
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
                    {ranking.map((player, index) => {
                      const winPercentage = getWinPercentage(player);

                      return (
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
                                    alt={getPlayerName(player)}
                                  />
                                ) : (
                                  getPlayerInitial(player)
                                )}
                              </div>

                              <strong>{getPlayerName(player)}</strong>
                            </div>
                          </td>

                          <td>
                            <span className="ranking-level-pill">
                              {player.level || "-"}
                            </span>
                          </td>

                          <td>{player.matches_played ?? 0}</td>
                          <td>{player.wins ?? 0}</td>
                          <td>{player.losses ?? 0}</td>
                          <td>{winPercentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ranking-mobile-cards">
                {ranking.map((player, index) => {
                  const winPercentage = getWinPercentage(player);

                  return (
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
                                alt={getPlayerName(player)}
                              />
                            ) : (
                              getPlayerInitial(player)
                            )}
                          </div>

                          <div>
                            <strong>{getPlayerName(player)}</strong>
                            <span className="ranking-mobile-subtitle">
                              {player.level || "-"}
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
                          <strong>{player.matches_played ?? 0}</strong>
                        </div>

                        <div>
                          <span>{t.winsShort}</span>
                          <strong>{player.wins ?? 0}</strong>
                        </div>

                        <div>
                          <span>{t.lossesShort}</span>
                          <strong>{player.losses ?? 0}</strong>
                        </div>

                        <div>
                          <span>%</span>
                          <strong>{winPercentage}%</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};