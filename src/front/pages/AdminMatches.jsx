import { useEffect, useState } from "react";
import { authFetch } from "../../utils/authFetch";
import { translations } from "../../i18n/translations";

export const AdminMatches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

  const [matches, setMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [message, setMessage] = useState("");
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
      setError(error.message || t.adminMatches.seasonsLoadError);
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
        ? `${backendUrl}/api/admin/matches?${queryString}`
        : `${backendUrl}/api/admin/matches`;

      const data = await authFetch(url);

      if (!data) return;

      setMatches(data);
    } catch (error) {
      console.error(error);
      setError(error.message || t.adminMatches.matchesLoadError);
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

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getWinnerText = (winnerTeam) => {
    if (winnerTeam === "A") return t.adminMatches.teamA;
    if (winnerTeam === "B") return t.adminMatches.teamB;

    return "-";
  };

  const deleteMatch = async (matchId) => {
    const confirmDelete = window.confirm(t.adminMatches.deleteMatchConfirm);

    if (!confirmDelete) return;

    try {
      setMessage("");
      setError("");

      const data = await authFetch(`${backendUrl}/api/admin/matches/${matchId}`, {
        method: "DELETE",
      });

      if (!data) return;

      setMessage(t.adminMatches.deleteMatchSuccess);
      loadMatches();
    } catch (error) {
      console.error(error);
      setError(error.message || t.adminMatches.deleteMatchError);
    }
  };

  const selectedSeason = seasons.find(
    (season) => String(season.id) === String(selectedSeasonId)
  );

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span>{t.adminMatches.heroKicker}</span>

          <h1>{t.adminMatches.matchesTitle}</h1>

          <p>{t.adminMatches.matchesDescription}</p>
        </div>

        <div className="admin-hero-card">
          <strong>{matches.length}</strong>
          <span>{t.adminMatches.matchesCountLabel}</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="matches-season-card">
        <div>
          <span>{t.adminMatches.season}</span>

          <h2>{selectedSeason?.name || t.adminMatches.currentSeason}</h2>

          <p>
            {selectedSeason?.is_closed
              ? t.adminMatches.closedSeasonText
              : t.adminMatches.activeSeasonText}
          </p>
        </div>

        <div className="matches-season-select-box">
          <label>{t.adminMatches.viewSeason}</label>

          <select
            value={selectedSeasonId}
            onChange={(event) => setSelectedSeasonId(event.target.value)}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}{" "}
                {season.is_active
                  ? `· ${t.adminMatches.current}`
                  : `· ${t.adminMatches.historical}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-state">
          <p>{t.adminMatches.loadingMatches}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="admin-empty">
          <h2>{t.adminMatches.noRegisteredMatches}</h2>

          <p>{t.adminMatches.noRegisteredMatchesText}</p>
        </div>
      ) : (
        <div className="admin-table-card">
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.adminMatches.date}</th>
                  <th>{t.adminMatches.teamA}</th>
                  <th>{t.adminMatches.teamB}</th>
                  <th>{t.adminMatches.result}</th>
                  <th>{t.adminMatches.winner}</th>
                  <th>{t.adminMatches.level || "Nivel"}</th>
                  <th>{t.adminMatches.club || "Club"}</th>
                  <th>{t.adminMatches.actions}</th>
                </tr>
              </thead>

              <tbody>
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td>{formatDate(match.played_at)}</td>

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

                    <td>{match.score}</td>

                    <td>{getWinnerText(match.winner_team)}</td>

                    <td>
                      <span className="ranking-level-pill">{match.level}</span>
                    </td>

                    <td>{match.club || "-"}</td>

                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-action-btn delete"
                          type="button"
                          onClick={() => deleteMatch(match.id)}
                        >
                          {t.adminMatches.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};