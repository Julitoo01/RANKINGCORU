import { useEffect, useState } from "react";
import { authFetch } from "../../utils/authFetch";
import { translations } from "../../i18n/translations";

export const AdminPlayers = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

  const [players, setPlayers] = useState([]);
  const [filters, setFilters] = useState({
    status: "Todos",
    level: "Todos",
  });

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editForm, setEditForm] = useState({
    level: "",
    position: "",
    status: "",
  });

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const playerLevels = ["Iniciación", "Bronce", "Plata", "Oro", "Diamante"];
  const levels = ["Todos", ...playerLevels];

  const positions = ["Derecha", "Revés", "Ambas", "No lo sé"];

  const playerStatuses = ["pending", "approved", "rejected"];
  const statuses = ["Todos", ...playerStatuses];

  const statusLabels = {
    pending: t.adminPlayers.pendingPayment,
    approved: t.adminPlayers.paidStatus,
    rejected: t.adminPlayers.rejected,
  };

  const levelLabels = {
    Todos: t.adminPlayers.all,
    Iniciación: t.adminPlayers.levelInitiation,
    Bronce: t.adminPlayers.levelBronze,
    Plata: t.adminPlayers.levelSilver,
    Oro: t.adminPlayers.levelGold,
    Diamante: t.adminPlayers.levelDiamond,
  };

  const positionLabels = {
    Derecha: t.adminPlayers.positionRight,
    Revés: t.adminPlayers.positionBackhand,
    Ambas: t.adminPlayers.positionBoth,
    "No lo sé": t.adminPlayers.positionUnknown,
  };

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (filters.status !== "Todos") {
        params.append("status", filters.status);
      }

      if (filters.level !== "Todos") {
        params.append("level", filters.level);
      }

      const queryString = params.toString();

      const url = queryString
        ? `${backendUrl}/api/admin/players?${queryString}`
        : `${backendUrl}/api/admin/players`;

      const data = await authFetch(url);

      if (!data) return;

      setPlayers(data);
    } catch (error) {
      console.error(error);
      setError(error.message || t.adminPlayers.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [filters]);

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setStatusFilter = (status) => {
    setFilters((prev) => ({
      ...prev,
      status,
    }));
  };

  const updatePlayer = async (profileId, payload) => {
    setMessage("");
    setError("");

    try {
      setActionLoadingId(profileId);

      const data = await authFetch(
        `${backendUrl}/api/admin/players/${profileId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!data) return;

      setMessage(
        payload.status === "approved"
          ? t.adminPlayers.paidSuccess
          : t.adminPlayers.updateSuccess
      );

      setEditingPlayerId(null);

      await loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || t.adminPlayers.updateError);
    } finally {
      setActionLoadingId(null);
    }
  };

  const approvePlayer = (profileId) => {
    updatePlayer(profileId, { status: "approved" });
  };

  const rejectPlayer = (profileId) => {
    updatePlayer(profileId, { status: "rejected" });
  };

  const startEditing = (player) => {
    setEditingPlayerId(player.id);

    setEditForm({
      level: player.level || "Bronce",
      position: player.position || "Derecha",
      status: player.status || "pending",
    });

    setMessage("");
    setError("");
  };

  const cancelEditing = () => {
    setEditingPlayerId(null);

    setEditForm({
      level: "",
      position: "",
      status: "",
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveEditing = (profileId) => {
    updatePlayer(profileId, {
      level: editForm.level,
      position: editForm.position,
      status: editForm.status,
    });
  };

  const deletePlayer = async (profileId, nickname) => {
    const confirmDelete = window.confirm(
      `${t.adminPlayers.deleteConfirmStart} ${nickname}? ${t.adminPlayers.deleteConfirmEnd}`
    );

    if (!confirmDelete) return;

    setMessage("");
    setError("");

    try {
      setActionLoadingId(profileId);

      const data = await authFetch(
        `${backendUrl}/api/admin/players/${profileId}`,
        {
          method: "DELETE",
        }
      );

      if (!data) return;

      setMessage(t.adminPlayers.deleteSuccess);
      setEditingPlayerId(null);

      await loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || t.adminPlayers.deleteError);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusClass = (status) => {
    if (status === "approved") return "approved";
    if (status === "rejected") return "rejected";

    return "pending";
  };

  const getStatusLabel = (status) => {
    return statusLabels[status] || t.adminPlayers.pendingPayment;
  };

  const getLevelLabel = (level) => {
    return levelLabels[level] || level || "-";
  };

  const getPositionLabel = (position) => {
    return positionLabels[position] || position || "-";
  };

  const getFullName = (player) => {
    const fullName = `${player.name || ""} ${player.last_name || ""}`.trim();

    return fullName || "-";
  };

  const getCounter = (status) => {
    if (status === "Todos") return players.length;

    return players.filter((player) => player.status === status).length;
  };

  return (
    <section className="admin-players-page">
      <div className="admin-players-hero">
        <div>
          <span>{t.adminPlayers.heroKicker}</span>

          <h1>{t.adminPlayers.title}</h1>

          <p>{t.adminPlayers.description}</p>
        </div>

        <div className="admin-players-hero-card">
          <strong>{players.length}</strong>
          <span>{t.adminPlayers.visiblePlayers}</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admin-players-summary-grid">
        <button
          type="button"
          className={`admin-players-summary-card ${
            filters.status === "Todos" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("Todos")}
        >
          <span>{t.adminPlayers.totalVisible}</span>
          <strong>{getCounter("Todos")}</strong>
        </button>

        <button
          type="button"
          className={`admin-players-summary-card pending ${
            filters.status === "pending" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("pending")}
        >
          <span>{t.adminPlayers.pendingPayments}</span>
          <strong>{getCounter("pending")}</strong>
        </button>

        <button
          type="button"
          className={`admin-players-summary-card approved ${
            filters.status === "approved" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("approved")}
        >
          <span>{t.adminPlayers.paid}</span>
          <strong>{getCounter("approved")}</strong>
        </button>

        <button
          type="button"
          className={`admin-players-summary-card rejected ${
            filters.status === "rejected" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("rejected")}
        >
          <span>{t.adminPlayers.rejectedPlural}</span>
          <strong>{getCounter("rejected")}</strong>
        </button>
      </div>

      <div className="admin-players-filters-card">
        <div>
          <h2>{t.adminPlayers.filters}</h2>

          <p>{t.adminPlayers.filtersText}</p>
        </div>

        <div className="admin-players-filters">
          <div className="form-group">
            <label>{t.adminPlayers.payment}</label>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "Todos" ? t.adminPlayers.all : getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t.adminPlayers.level}</label>

            <select
              name="level"
              value={filters.level}
              onChange={handleFilterChange}
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {getLevelLabel(level)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="admin-players-state">
          <p>{t.adminPlayers.loading}</p>
        </div>
      )}

      {!loading && players.length === 0 && (
        <div className="admin-players-empty">
          <h2>{t.adminPlayers.noPlayers}</h2>

          <p>{t.adminPlayers.noPlayersText}</p>
        </div>
      )}

      {!loading && players.length > 0 && (
        <div className="admin-players-table-card">
          <div className="admin-players-table-header">
            <div>
              <h2>{t.adminPlayers.listTitle}</h2>

              <p>{t.adminPlayers.listText}</p>
            </div>
          </div>

          <div className="admin-players-simple-list">
            {players.map((player) => {
              const isEditing = editingPlayerId === player.id;
              const isActionLoading = actionLoadingId === player.id;

              return (
                <article key={player.id} className="admin-player-simple-card">
                  <div className="admin-player-simple-main">
                    <div>
                      <h3>{player.nickname || t.adminPlayers.player}</h3>

                      {!isEditing && (
                        <>
                          <p className="admin-player-simple-name">
                            {getFullName(player)}
                          </p>

                          <div className="admin-player-simple-meta">
                            <span className="admin-player-level-pill">
                              {getLevelLabel(player.level)}
                            </span>

                            <span
                              className={`status-badge ${getStatusClass(
                                player.status
                              )}`}
                            >
                              {getStatusLabel(player.status)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="admin-player-actions compact">
                        <button
                          className="admin-action-btn neutral"
                          onClick={() => startEditing(player)}
                          disabled={isActionLoading}
                        >
                          {t.adminPlayers.edit}
                        </button>

                        {player.status !== "approved" && (
                          <button
                            className="admin-action-btn approve"
                            onClick={() => approvePlayer(player.id)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading
                              ? t.adminPlayers.marking
                              : t.adminPlayers.markPaid}
                          </button>
                        )}

                        {player.status !== "rejected" && (
                          <button
                            className="admin-action-btn reject"
                            onClick={() => rejectPlayer(player.id)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading
                              ? t.adminPlayers.rejecting
                              : t.adminPlayers.reject}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="admin-player-edit-panel">
                      <div className="admin-player-edit-details">
                        <div>
                          <span>{t.adminPlayers.nickname}</span>
                          <strong>{player.nickname || "-"}</strong>
                        </div>

                        <div>
                          <span>{t.adminPlayers.fullName}</span>
                          <strong>{getFullName(player)}</strong>
                        </div>

                        <div>
                          <span>{t.adminPlayers.email}</span>
                          <strong>{player.email || "-"}</strong>
                        </div>

                        <div>
                          <span>{t.adminPlayers.phone}</span>
                          <strong>{player.phone || "-"}</strong>
                        </div>
                      </div>

                      <div className="admin-player-edit-form">
                        <div className="form-group">
                          <label>{t.adminPlayers.level}</label>

                          <select
                            name="level"
                            value={editForm.level}
                            onChange={handleEditChange}
                          >
                            {playerLevels.map((level) => (
                              <option key={level} value={level}>
                                {getLevelLabel(level)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>{t.adminPlayers.position}</label>

                          <select
                            name="position"
                            value={editForm.position}
                            onChange={handleEditChange}
                          >
                            {positions.map((position) => (
                              <option key={position} value={position}>
                                {getPositionLabel(position)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>{t.adminPlayers.payment}</label>

                          <select
                            name="status"
                            value={editForm.status}
                            onChange={handleEditChange}
                          >
                            {playerStatuses.map((status) => (
                              <option key={status} value={status}>
                                {getStatusLabel(status)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="admin-player-edit-stats">
                        <div>
                          <span>{t.adminPlayers.matchesPlayedShort}</span>
                          <strong>{player.matches_played ?? 0}</strong>
                        </div>

                        <div>
                          <span>{t.adminPlayers.winsShort}</span>
                          <strong>{player.wins ?? 0}</strong>
                        </div>

                        <div>
                          <span>{t.adminPlayers.lossesShort}</span>
                          <strong>{player.losses ?? 0}</strong>
                        </div>

                        <div>
                          <span>{t.adminPlayers.winPercentage}</span>
                          <strong>{player.win_percentage ?? 0}%</strong>
                        </div>
                      </div>

                      <div className="admin-player-actions edit-panel">
                        <button
                          className="admin-action-btn approve"
                          onClick={() => saveEditing(player.id)}
                          disabled={isActionLoading}
                        >
                          {isActionLoading
                            ? t.adminPlayers.saving
                            : t.adminPlayers.saveChanges}
                        </button>

                        <button
                          className="admin-action-btn neutral"
                          onClick={cancelEditing}
                          disabled={isActionLoading}
                        >
                          {t.adminPlayers.cancel}
                        </button>

                        <button
                          className="admin-action-btn delete"
                          onClick={() => deletePlayer(player.id, player.nickname)}
                          disabled={isActionLoading}
                        >
                          {isActionLoading
                            ? t.adminPlayers.deleting
                            : t.adminPlayers.deletePlayer}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};