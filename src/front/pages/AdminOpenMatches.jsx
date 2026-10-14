import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import { getMatchTimeRange } from "../utils/time";
import { translations } from "../i18n/translations";

export const AdminOpenMatches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

  const [openMatches, setOpenMatches] = useState([]);
  const [filteredOpenMatches, setFilteredOpenMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [levelFilter, setLevelFilter] = useState("Todos");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    level: "Bronce",
    club: "",
    match_date: "",
    match_time: "",
    description: "",
  });

  const levels = ["Iniciación", "Bronce", "Plata", "Oro", "Diamante"];
  const filterLevels = ["Todos", ...levels];
  const statusOptions = ["Todos", "open", "closed"];

  const levelLabels = {
    Todos: t.adminOpenMatches.all,
    Iniciación: t.adminOpenMatches.levelInitiation,
    Bronce: t.adminOpenMatches.levelBronze,
    Plata: t.adminOpenMatches.levelSilver,
    Oro: t.adminOpenMatches.levelGold,
    Diamante: t.adminOpenMatches.levelDiamond,
  };

  const loadOpenMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/open-matches`);

      if (!data) {
        setOpenMatches([]);
        return;
      }

      setOpenMatches(data);
    } catch (err) {
      console.error(err);
      setError(err.message || t.adminOpenMatches.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpenMatches();
  }, []);

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

  useEffect(() => {
    let result = [...openMatches];

    if (statusFilter !== "Todos") {
      result = result.filter((openMatch) => openMatch.status === statusFilter);
    }

    if (levelFilter !== "Todos") {
      result = result.filter((openMatch) => openMatch.level === levelFilter);
    }

    setFilteredOpenMatches(result);
  }, [openMatches, statusFilter, levelFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleCreateMatch = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setMessage("");
      setError("");

      if (!form.club.trim()) {
        setError(t.adminOpenMatches.clubRequired);
        return;
      }

      if (!form.match_date) {
        setError(t.adminOpenMatches.dateRequired);
        return;
      }

      if (!form.match_time) {
        setError(t.adminOpenMatches.timeRequired);
        return;
      }

      const data = await authFetch(`${backendUrl}/api/admin/open-matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: form.level,
          club: form.club.trim(),
          match_date: form.match_date,
          match_time: form.match_time,
          description: form.description.trim(),
        }),
      });

      if (!data) return;

      setMessage(t.adminOpenMatches.createdSuccess);

      setForm({
        level: "Bronce",
        club: "",
        match_date: "",
        match_time: "",
        description: "",
      });

      window.dispatchEvent(new Event("notificationsUpdated"));

      await loadOpenMatches();
    } catch (err) {
      console.error(err);
      setError(err.message || t.adminOpenMatches.createError);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMatch = async (openMatchId) => {
    const confirmDelete = window.confirm(t.adminOpenMatches.deleteConfirm);

    if (!confirmDelete) return;

    try {
      setDeletingId(openMatchId);
      setMessage("");
      setError("");

      const data = await authFetch(
        `${backendUrl}/api/admin/open-matches/${openMatchId}`,
        {
          method: "DELETE",
        }
      );

      if (!data) return;

      setMessage(t.adminOpenMatches.deletedSuccess);
      await loadOpenMatches();
    } catch (err) {
      console.error(err);
      setError(err.message || t.adminOpenMatches.deleteError);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusText = (status) => {
    if (status === "open") return t.adminOpenMatches.open;
    if (status === "closed") return t.adminOpenMatches.closed;
    if (status === "cancelled") return t.adminOpenMatches.cancelled;

    return status || "-";
  };

  const getLevelLabel = (level) => {
    return levelLabels[level] || level || "-";
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const dateObject = new Date(`${date}T00:00:00`);

    if (Number.isNaN(dateObject.getTime())) {
      return date;
    }

    return dateObject.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPlayerName = (playerData) => {
    if (!playerData) return t.adminOpenMatches.noPlayer;

    return (
      playerData.nickname ||
      `${playerData.name || ""} ${playerData.last_name || ""}`.trim() ||
      t.adminOpenMatches.player
    );
  };

  const renderPlayers = (openMatch) => {
    if (!openMatch.players || openMatch.players.length === 0) {
      return (
        <p className="admin-open-match-empty">
          {t.adminOpenMatches.noPlayersYet}
        </p>
      );
    }

    return (
      <div className="admin-open-match-players">
        {openMatch.players.map((item) => (
          <span key={item.id} className="admin-open-match-player-pill">
            {getPlayerName(item.player)}
          </span>
        ))}
      </div>
    );
  };

  const renderTeams = (openMatch) => {
    const teamA = openMatch.team_a || [];
    const teamB = openMatch.team_b || [];

    const hasTeams = teamA[0] && teamA[1] && teamB[0] && teamB[1];

    if (!hasTeams) return null;

    return (
      <div className="admin-open-match-teams">
        <div className="admin-open-match-team-card">
          <h4>{t.adminOpenMatches.teamA}</h4>
          <p>{getPlayerName(teamA[0])}</p>
          <p>{getPlayerName(teamA[1])}</p>
        </div>

        <div className="admin-open-match-vs">{t.adminOpenMatches.vs}</div>

        <div className="admin-open-match-team-card">
          <h4>{t.adminOpenMatches.teamB}</h4>
          <p>{getPlayerName(teamB[0])}</p>
          <p>{getPlayerName(teamB[1])}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-open-matches-page">
      <section className="admin-open-matches-hero">
        <div>
          <span className="section-kicker">{t.adminOpenMatches.heroKicker}</span>
          <h1>{t.adminOpenMatches.title}</h1>
          <p>{t.adminOpenMatches.description}</p>
        </div>
      </section>

      <section className="admin-open-matches-card">
        <h2>{t.adminOpenMatches.createTitle}</h2>

        <form className="admin-open-matches-form" onSubmit={handleCreateMatch}>
          <div className="form-group">
            <label>{t.adminOpenMatches.level}</label>
            <select name="level" value={form.level} onChange={handleChange}>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {getLevelLabel(level)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t.adminOpenMatches.club}</label>
            <input
              type="text"
              name="club"
              value={form.club}
              onChange={handleChange}
              placeholder={t.adminOpenMatches.clubPlaceholder}
            />
          </div>

          <div className="form-group">
            <label>{t.adminOpenMatches.date}</label>
            <input
              type="date"
              name="match_date"
              value={form.match_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>{t.adminOpenMatches.startTime}</label>
            <input
              type="time"
              name="match_time"
              value={form.match_time}
              onChange={handleChange}
            />

            {form.match_time ? (
              <small>
                {t.adminOpenMatches.courtSchedule}:{" "}
                {getMatchTimeRange(form.match_time)}
              </small>
            ) : (
              <small>{t.adminOpenMatches.courtDuration}</small>
            )}
          </div>

          <div className="form-group admin-open-matches-description">
            <label>{t.adminOpenMatches.optionalDescription}</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={t.adminOpenMatches.descriptionPlaceholder}
              rows="3"
            />
          </div>

          <button className="primary-button" type="submit" disabled={creating}>
            {creating
              ? t.adminOpenMatches.creating
              : t.adminOpenMatches.createMatch}
          </button>
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </section>

      <section className="admin-open-matches-list">
        <div className="admin-open-matches-list-header">
          <div>
            <span className="section-kicker">
              {t.adminOpenMatches.management}
            </span>
            <h2>{t.adminOpenMatches.createdMatches}</h2>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={loadOpenMatches}
            disabled={loading}
          >
            {loading ? t.adminOpenMatches.updating : t.adminOpenMatches.update}
          </button>
        </div>

        <div className="admin-open-matches-filters">
          <div className="form-group">
            <label>{t.adminOpenMatches.filterByStatus}</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "Todos"
                    ? t.adminOpenMatches.all
                    : getStatusText(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t.adminOpenMatches.filterByLevel}</label>
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
            >
              {filterLevels.map((level) => (
                <option key={level} value={level}>
                  {getLevelLabel(level)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="admin-open-match-empty">
            {t.adminOpenMatches.loadingMatches}
          </p>
        ) : filteredOpenMatches.length === 0 ? (
          <p className="admin-open-match-empty">
            {t.adminOpenMatches.noMatchesFiltered}
          </p>
        ) : (
          <div className="admin-open-match-grid">
            {filteredOpenMatches.map((openMatch) => (
              <article key={openMatch.id} className="admin-open-match-card">
                <div className="admin-open-match-card-header">
                  <div>
                    <h3>
                      {getLevelLabel(openMatch.level)} · {openMatch.club}
                    </h3>

                    <p>
                      {formatDate(openMatch.match_date)} ·{" "}
                      {getMatchTimeRange(openMatch.match_time)}
                    </p>
                  </div>

                  <span className={`open-match-status ${openMatch.status}`}>
                    {getStatusText(openMatch.status)}
                  </span>
                </div>

                {openMatch.description && (
                  <p className="admin-open-match-description">
                    {openMatch.description}
                  </p>
                )}

                <div className="admin-open-match-count">
                  {openMatch.players_count}/{openMatch.max_players}{" "}
                  {t.adminOpenMatches.players}
                </div>

                {openMatch.has_result && (
                  <div className="success-message">
                    {t.adminOpenMatches.resultUploaded}
                  </div>
                )}

                {renderPlayers(openMatch)}

                {renderTeams(openMatch)}

                <div className="admin-open-match-actions">
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => handleDeleteMatch(openMatch.id)}
                    disabled={deletingId === openMatch.id}
                  >
                    {deletingId === openMatch.id
                      ? t.adminOpenMatches.deleting
                      : t.adminOpenMatches.delete}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};