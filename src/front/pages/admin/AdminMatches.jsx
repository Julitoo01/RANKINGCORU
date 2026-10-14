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
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (statusFilter && statusFilter !== "Todos") {
        params.append("status", statusFilter);
      }

      const queryString = params.toString();

      const url = queryString
        ? `${backendUrl}/api/admin/matches?${queryString}`
        : `${backendUrl}/api/admin/matches`;

      const data = await authFetch(url);

      if (!data) {
        setMatches([]);
        return;
      }

      setMatches(data);
    } catch (error) {
      console.error(error);
      setError(error.message || t.adminMatches.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [statusFilter]);

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

  const getStatusText = (status) => {
    if (status === "confirmed") return t.adminMatches.confirmed;
    if (status === "pending") return t.adminMatches.pending;
    if (status === "rejected") return t.adminMatches.rejected;

    return status || "-";
  };

  const getPlayerName = (player) => {
    if (!player) return t.adminMatches.player;

    return (
      player.nickname ||
      `${player.name || ""} ${player.last_name || ""}`.trim() ||
      t.adminMatches.player
    );
  };

  const renderTeam = (team) => {
    if (!team || team.length === 0) {
      return (
        <span className="admin-team-empty">{t.adminMatches.noPlayers}</span>
      );
    }

    return (
      <div className="admin-team-list">
        {team.filter(Boolean).map((player, index) => (
          <span key={`${player?.id || index}-${index}`}>
            {getPlayerName(player)}
          </span>
        ))}
      </div>
    );
  };

  const getCounter = (status) => {
    if (status === "Todos") return matches.length;

    return matches.filter((match) => match.status === status).length;
  };

  const deleteMatch = async (matchId) => {
    const confirmDelete = window.confirm(t.adminMatches.deleteConfirm);

    if (!confirmDelete) return;

    setMessage("");
    setError("");

    try {
      setActionLoadingId(matchId);

      const data = await authFetch(`${backendUrl}/api/admin/matches/${matchId}`, {
        method: "DELETE",
      });

      if (!data) return;

      setMessage(t.adminMatches.deleteSuccess);
      await loadMatches();
    } catch (error) {
      console.error(error);
      setError(error.message || t.adminMatches.deleteError);
    } finally {
      setActionLoadingId(null);
    }
  };

  const recalculateRanking = async () => {
    const confirmRecalculate = window.confirm(
      t.adminMatches.recalculateConfirm
    );

    if (!confirmRecalculate) return;

    setMessage("");
    setError("");

    try {
      setRecalculating(true);

      const data = await authFetch(
        `${backendUrl}/api/admin/recalculate-ranking`,
        {
          method: "POST",
        }
      );

      if (!data) return;

      setMessage(t.adminMatches.recalculateSuccess);
      await loadMatches();
    } catch (error) {
      console.error(error);
      setError(error.message || t.adminMatches.recalculateError);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <section className="admin-matches-page">
      <div className="admin-matches-hero">
        <div>
          <span className="section-kicker">{t.adminMatches.heroKicker}</span>

          <h1>{t.adminMatches.title}</h1>

          <p>{t.adminMatches.description}</p>
        </div>

        <div className="admin-matches-hero-card">
          <strong>{matches.length}</strong>
          <span>{t.adminMatches.visibleResults}</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admin-matches-summary-grid">
        <button
          type="button"
          className={`admin-matches-summary-card ${
            statusFilter === "Todos" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("Todos")}
        >
          <span>{t.adminMatches.total}</span>
          <strong>{getCounter("Todos")}</strong>
        </button>

        <button
          type="button"
          className={`admin-matches-summary-card confirmed ${
            statusFilter === "confirmed" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("confirmed")}
        >
          <span>{t.adminMatches.confirmedPlural}</span>
          <strong>{getCounter("confirmed")}</strong>
        </button>

        <button
          type="button"
          className={`admin-matches-summary-card pending ${
            statusFilter === "pending" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("pending")}
        >
          <span>{t.adminMatches.pendingPlural}</span>
          <strong>{getCounter("pending")}</strong>
        </button>

        <button
          type="button"
          className={`admin-matches-summary-card rejected ${
            statusFilter === "rejected" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("rejected")}
        >
          <span>{t.adminMatches.rejectedPlural}</span>
          <strong>{getCounter("rejected")}</strong>
        </button>
      </div>

      <div className="admin-matches-actions-card">
        <div>
          <span className="section-kicker">{t.adminMatches.actionsKicker}</span>

          <h2>{t.adminMatches.actionsTitle}</h2>

          <p>{t.adminMatches.actionsText}</p>
        </div>

        <div className="admin-matches-actions-row">
          <div className="admin-matches-filter-box">
            <label>{t.adminMatches.status}</label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="Todos">{t.adminMatches.all}</option>
              <option value="confirmed">{t.adminMatches.confirmedPlural}</option>
              <option value="pending">{t.adminMatches.pendingPlural}</option>
              <option value="rejected">{t.adminMatches.rejectedPlural}</option>
            </select>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadMatches}
            disabled={loading}
          >
            {loading ? t.adminMatches.updating : t.adminMatches.update}
          </button>

          <button
            type="button"
            className="admin-recalculate-btn"
            onClick={recalculateRanking}
            disabled={recalculating}
          >
            {recalculating
              ? t.adminMatches.recalculating
              : t.adminMatches.recalculateRanking}
          </button>
        </div>
      </div>

      {loading && (
        <div className="admin-matches-state">
          <p>{t.adminMatches.loading}</p>
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="admin-matches-empty">
          <h2>{t.adminMatches.emptyTitle}</h2>
          <p>{t.adminMatches.emptyText}</p>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <div className="admin-matches-table-card">
          <div className="admin-matches-table-header">
            <div>
              <span className="section-kicker">
                {t.adminMatches.historyKicker}
              </span>

              <h2>{t.adminMatches.registeredResults}</h2>

              <p>{t.adminMatches.historyText}</p>
            </div>
          </div>

          <div className="admin-matches-grid">
            {matches.map((match) => {
              const teamAWon = match.winner_team === "A";
              const teamBWon = match.winner_team === "B";

              return (
                <article key={match.id} className="admin-result-card">
                  <div className="admin-result-card-header">
                    <div>
                      <span className="admin-result-date">
                        {formatDate(match.played_at)}
                      </span>

                      <h3>{match.level || t.adminMatches.levelNotSet}</h3>

                      <p>{match.club || t.adminMatches.clubNotSet}</p>
                    </div>

                    <span className={`admin-match-status ${match.status}`}>
                      {getStatusText(match.status)}
                    </span>
                  </div>

                  <div className="admin-result-score-box">
                    <span>{t.adminMatches.result}</span>
                    <strong>{match.score || "-"}</strong>
                  </div>

                  <div className="admin-result-teams">
                    <div
                      className={`admin-result-team ${
                        teamAWon ? "winner" : ""
                      }`}
                    >
                      <div className="admin-result-team-title">
                        <span>{t.adminMatches.teamA}</span>
                        {teamAWon && <small>{t.adminMatches.winner}</small>}
                      </div>

                      {renderTeam(match.team_a)}
                    </div>

                    <div className="admin-result-vs">VS</div>

                    <div
                      className={`admin-result-team ${
                        teamBWon ? "winner" : ""
                      }`}
                    >
                      <div className="admin-result-team-title">
                        <span>{t.adminMatches.teamB}</span>
                        {teamBWon && <small>{t.adminMatches.winner}</small>}
                      </div>

                      {renderTeam(match.team_b)}
                    </div>
                  </div>

                  <div className="admin-result-meta">
                    <span>
                      {t.adminMatches.winner}:{" "}
                      <strong>{getWinnerText(match.winner_team)}</strong>
                    </span>

                    <span>
                      {t.adminMatches.submittedBy}:{" "}
                      <strong>{match.submitted_by || "-"}</strong>
                    </span>
                  </div>

                  <div className="admin-result-actions">
                    <button
                      className="admin-delete-match-btn"
                      type="button"
                      onClick={() => deleteMatch(match.id)}
                      disabled={actionLoadingId === match.id}
                    >
                      {actionLoadingId === match.id
                        ? t.adminMatches.deleting
                        : t.adminMatches.deleteResult}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};