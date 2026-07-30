import { useEffect, useState } from "react";
import { authFetch } from "../../utils/authFetch";

export const AdminPlayers = () => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL &&
    import.meta.env.VITE_BACKEND_URL !== "undefined"
      ? import.meta.env.VITE_BACKEND_URL
      : window.location.origin;

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
    payment_status: "",
    payment_reference: "",
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

  const paymentStatuses = ["unpaid", "paid"];

  const statusLabels = {
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
  };

  const paymentLabels = {
    unpaid: "Pendiente de pago",
    paid: "Pagado STC",
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
      setError(error.message || "Error al cargar jugadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [filters]);

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

      setMessage("Jugador actualizado correctamente.");
      setEditingPlayerId(null);

      await loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al actualizar jugador");
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectPlayer = (profileId) => {
    updatePlayer(profileId, { status: "rejected" });
  };

  const togglePaymentStatus = (player) => {
    const isPaid = player.payment_status === "paid";

    if (isPaid) {
      updatePlayer(player.id, {
        payment_status: "unpaid",
      });

      return;
    }

    updatePlayer(player.id, {
      status: "approved",
      payment_status: "paid",
      payment_method: "stc_manual",
    });
  };

  const startEditing = (player) => {
    setEditingPlayerId(player.id);

    setEditForm({
      level: player.level || "Bronce",
      position: player.position || "Derecha",
      status: player.status || "pending",
      payment_status: player.payment_status || "unpaid",
      payment_reference: player.payment_reference || "",
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
      payment_status: "",
      payment_reference: "",
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
    const payload = {
      level: editForm.level,
      position: editForm.position,
      status: editForm.status,
      payment_status: editForm.payment_status,
      payment_reference: editForm.payment_reference,
    };

    if (editForm.payment_status === "paid") {
      payload.payment_method = "stc_manual";
    }

    updatePlayer(profileId, payload);
  };

  const deletePlayer = async (profileId, nickname) => {
    const confirmDelete = window.confirm(
      `¿Seguro que quieres eliminar a ${nickname}? Esta acción borra el usuario y también sus partidos asociados.`
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

      setMessage("Jugador eliminado correctamente.");
      setEditingPlayerId(null);

      await loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al eliminar jugador");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusClass = (status) => {
    if (status === "approved") return "approved";
    if (status === "rejected") return "rejected";

    return "pending";
  };

  const getPaymentClass = (paymentStatus) => {
    if (paymentStatus === "paid") return "approved";

    return "pending";
  };

  const getStatusLabel = (status) => {
    return statusLabels[status] || "Pendiente";
  };

  const getPaymentLabel = (paymentStatus) => {
    return paymentLabels[paymentStatus || "unpaid"] || "Pendiente de pago";
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
          <span>Panel admin</span>

          <h1>Gestión de jugadores</h1>

          <p>
            Revisa solicitudes, confirma pagos STC, ajusta nivel y posición, o
            rechaza perfiles que no deban entrar al ranking.
          </p>
        </div>

        <div className="admin-players-hero-card">
          <strong>{players.length}</strong>
          <span>Jugadores visibles</span>
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
          <span>Total visible</span>
          <strong>{getCounter("Todos")}</strong>
        </button>

        <button
          type="button"
          className={`admin-players-summary-card pending ${
            filters.status === "pending" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("pending")}
        >
          <span>Pendientes</span>
          <strong>{getCounter("pending")}</strong>
        </button>

        <button
          type="button"
          className={`admin-players-summary-card approved ${
            filters.status === "approved" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("approved")}
        >
          <span>Aprobados</span>
          <strong>{getCounter("approved")}</strong>
        </button>

        <button
          type="button"
          className={`admin-players-summary-card rejected ${
            filters.status === "rejected" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("rejected")}
        >
          <span>Rechazados</span>
          <strong>{getCounter("rejected")}</strong>
        </button>
      </div>

      <div className="admin-players-filters-card">
        <div>
          <h2>Filtros</h2>

          <p>
            Filtra por estado o nivel para encontrar más rápido a cada jugador.
          </p>
        </div>

        <div className="admin-players-filters">
          <div className="form-group">
            <label>Estado</label>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "Todos" ? "Todos" : getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Nivel</label>

            <select
              name="level"
              value={filters.level}
              onChange={handleFilterChange}
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="admin-players-state">
          <p>Cargando jugadores...</p>
        </div>
      )}

      {!loading && players.length === 0 && (
        <div className="admin-players-empty">
          <h2>No hay jugadores</h2>

          <p>No hay jugadores que coincidan con los filtros seleccionados.</p>
        </div>
      )}

      {!loading && players.length > 0 && (
        <div className="admin-players-table-card">
          <div className="admin-players-table-header">
            <div>
              <h2>Listado de jugadores</h2>

              <p>
                Pulsa editar para ver la ficha completa, cambiar nivel, posición,
                estado o referencia de pago STC.
              </p>
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
                      <h3>{player.nickname || "Jugador"}</h3>

                      {!isEditing && (
                        <>
                          <p className="admin-player-simple-name">
                            {getFullName(player)}
                          </p>

                          <div className="admin-player-simple-meta">
                            <span className="admin-player-level-pill">
                              {player.level || "-"}
                            </span>

                            <span
                              className={`status-badge ${getStatusClass(
                                player.status
                              )}`}
                            >
                              {getStatusLabel(player.status)}
                            </span>

                            <button
                              type="button"
                              className={`status-badge ${getPaymentClass(
                                player.payment_status
                              )}`}
                              onClick={() => togglePaymentStatus(player)}
                              disabled={isActionLoading}
                              style={{
                                border: "none",
                                cursor: isActionLoading ? "not-allowed" : "pointer",
                              }}
                            >
                              {isActionLoading
                                ? "Actualizando..."
                                : getPaymentLabel(player.payment_status)}
                            </button>
                          </div>

                          {player.payment_reference && (
                            <p className="admin-player-simple-name">
                              Ref. STC: {player.payment_reference}
                            </p>
                          )}
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
                          Editar
                        </button>

                        {player.status !== "rejected" && (
                          <button
                            className="admin-action-btn reject"
                            onClick={() => rejectPlayer(player.id)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? "Rechazando..." : "Rechazar"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="admin-player-edit-panel">
                      <div className="admin-player-edit-details">
                        <div>
                          <span>Nickname</span>
                          <strong>{player.nickname || "-"}</strong>
                        </div>

                        <div>
                          <span>Nombre completo</span>
                          <strong>{getFullName(player)}</strong>
                        </div>

                        <div>
                          <span>Email</span>
                          <strong>{player.email || "-"}</strong>
                        </div>

                        <div>
                          <span>Teléfono</span>
                          <strong>{player.phone || "-"}</strong>
                        </div>
                      </div>

                      <div className="admin-player-edit-form">
                        <div className="form-group">
                          <label>Nivel</label>

                          <select
                            name="level"
                            value={editForm.level}
                            onChange={handleEditChange}
                          >
                            {playerLevels.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Posición</label>

                          <select
                            name="position"
                            value={editForm.position}
                            onChange={handleEditChange}
                          >
                            {positions.map((position) => (
                              <option key={position} value={position}>
                                {position}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Estado perfil</label>

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

                        <div className="form-group">
                          <label>Pago STC</label>

                          <select
                            name="payment_status"
                            value={editForm.payment_status}
                            onChange={handleEditChange}
                          >
                            {paymentStatuses.map((paymentStatus) => (
                              <option key={paymentStatus} value={paymentStatus}>
                                {getPaymentLabel(paymentStatus)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Referencia STC</label>

                          <input
                            type="text"
                            name="payment_reference"
                            value={editForm.payment_reference}
                            onChange={handleEditChange}
                            placeholder="Referencia opcional"
                          />
                        </div>
                      </div>

                      <div className="admin-player-edit-stats">
                        <div>
                          <span>PJ</span>
                          <strong>{player.matches_played ?? 0}</strong>
                        </div>

                        <div>
                          <span>PG</span>
                          <strong>{player.wins ?? 0}</strong>
                        </div>

                        <div>
                          <span>PP</span>
                          <strong>{player.losses ?? 0}</strong>
                        </div>

                        <div>
                          <span>% Victorias</span>
                          <strong>{player.win_percentage ?? 0}%</strong>
                        </div>
                      </div>

                      <div className="admin-player-actions edit-panel">
                        <button
                          className="admin-action-btn approve"
                          onClick={() => saveEditing(player.id)}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? "Guardando..." : "Guardar cambios"}
                        </button>

                        <button
                          className="admin-action-btn neutral"
                          onClick={cancelEditing}
                          disabled={isActionLoading}
                        >
                          Cancelar
                        </button>

                        <button
                          className="admin-action-btn delete"
                          onClick={() =>
                            deletePlayer(player.id, player.nickname)
                          }
                          disabled={isActionLoading}
                        >
                          {isActionLoading
                            ? "Eliminando..."
                            : "Eliminar jugador"}
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