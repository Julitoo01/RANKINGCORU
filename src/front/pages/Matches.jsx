import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import { translations } from "../i18n/translations";

export const Matches = () => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL &&
    import.meta.env.VITE_BACKEND_URL !== "undefined"
      ? import.meta.env.VITE_BACKEND_URL
      : window.location.origin;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language];

  const [matches, setMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [error, setError] = useState("");

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

      const activeSeason = data.find((season) => season.is_active);

      if (activeSeason && !selectedSeasonId) {
        setSelectedSeasonId(String(activeSeason.id));
      }
    } catch (error) {
      console.error(error);
      setError(error.message || t.seasonsLoadError);
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
      setError(error.message || t.matchesLoadError);
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

    return parsedDate.toLocaleDateString(language === "es" ? "es-ES" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getWinnerText = (winnerTeam) => {
    if (winnerTeam === "A") return t.teamA;
    if (winnerTeam === "B") return t.teamB;

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
          <span>{t.appName}</span>

          <h1>{t.matchesTitle}</h1>

          <p className="desktop-text">{t.matchesHeroText}</p>
          <p className="mobile-text">{t.matchesHeroTextMobile}</p>
        </div>

        <div className="matches-hero-card">
          <strong>{totalMatches}</strong>
          <span>
            {totalMatches === 1 ? t.registeredMatch : t.registeredMatches}
          </span>
        </div>
      </div>

      <div className="matches-season-card">
        <div>
          <span>{t.season}</span>

          <h2>{selectedSeason?.name || t.currentSeason}</h2>

          <p className="desktop-text">
            {selectedSeason?.is_closed
              ? t.seasonClosedMatchesText
              : t.seasonActiveMatchesText}
          </p>
        </div>

        <div className="matches-season-select-box">
          <label>{t.viewSeason}</label>

          <select
            value={selectedSeasonId}
            onChange={(event) => setSelectedSeasonId(event.target.value)}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} {season.is_active ? `· ${t.current}` : `· ${t.historical}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="matches-state">
          <p>{t.loadingMatches}</p>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="matches-empty">
          <div className="matches-empty-icon">🎾</div>

          <span>{t.noMatchesYet}</span>

          <h2>{t.noRegisteredMatches}</h2>

          <p>{t.noRegisteredMatchesText}</p>
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

                    <h2>{match.level || t.levelNotProvided}</h2>

                    <p>{match.club || t.clubNotProvidedResult}</p>
                  </div>

                  <div className="match-score-box">
                    <span>{t.resultLabel}</span>
                    <strong>{match.score || "-"}</strong>
                  </div>
                </div>

                <div className="match-status-row">
                  <span className="match-status-badge confirmed">
                    {t.registeredResult}
                  </span>

                  <span>
                    {t.winner}:{" "}
                    <strong>{getWinnerText(match.winner_team)}</strong>
                  </span>
                </div>

                <div className="match-teams">
                  <div className={`match-team ${teamAWon ? "winner" : ""}`}>
                    <span>{t.teamA}</span>

                    {teamAPlayers.map((playerName, index) => (
                      <strong key={`${match.id}-team-a-${index}`}>
                        {playerName}
                      </strong>
                    ))}

                    {teamAWon && <small>{t.winner}</small>}
                  </div>

                  <div className="match-vs">VS</div>

                  <div className={`match-team ${teamBWon ? "winner" : ""}`}>
                    <span>{t.teamB}</span>

                    {teamBPlayers.map((playerName, index) => (
                      <strong key={`${match.id}-team-b-${index}`}>
                        {playerName}
                      </strong>
                    ))}

                    {teamBWon && <small>{t.winner}</small>}
                  </div>
                </div>

                <div className="match-card-footer">
                  <span>
                    {t.seasonFooter}:{" "}
                    <strong>{match.season || selectedSeason?.name || "-"}</strong>
                  </span>

                  <span>
                    {t.submittedBy}: <strong>{match.submitted_by || "-"}</strong>
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