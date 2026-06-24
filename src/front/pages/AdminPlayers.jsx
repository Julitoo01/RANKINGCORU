import { useEffect, useMemo, useState } from "react";
import { authFetch } from "../../utils/authFetch";

export const AdminPlayers = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [players, setPlayers] = useState([]);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const levels = ["Iniciación", "Bronce", "Plata", "Oro", "Diamante"];
  const positions = ["Derecha", "Revés", "Ambos"];
  const statuses = ["pending", "approved", "rejected"];

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/admin/players`);

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
  }, []);

  const getStatusText = (status) => {
    if (status === "approved") return "Pagado";
    if (status === "pending") return "Pendiente de pago";
    if (status === "rejected") return "Rechazado";
    return status || "-";
  };

  const getStatusDescription = (status) => {
    if (status === "approved") return "Jugador activo";
    if (status === "pending") return "Esperando verificación";
    if (status === "rejected") return "No activo";
    return "-";
  };

  const filteredPlayers = useMemo(() => {
    if (statusFilter === "Todos") return players;

    return players.filter((player) => player.status === statusFilter);
  }, [players, statusFilter]);

  const counters = useMemo(() => {
    return {
      total: players.length,
      pending: players.filter((player) => player.status === "pending").length,
      approved: players.filter((player) => player.status === "approved").length,
      rejected: players.filter((player) => player.status === "rejected").length,
    };
  }, [players]);

  const startEditing = (player) => {
    setMessage("");
    setError("");
    setEditingPlayerId(player.id);

    setEditForm({
      name: player.name || "",
      last_name: player.last_name || "",
      nickname: player.nickname || "",
      email: player.email || "",
      phone: player.phone || "",
      instagram: player.instagram || "",
      level: player.level || "Bronce",
      position: player.position || "Ambos",
      status: player.status || "pending",
    });
  };

  const cancelEditing = () => {
    setEditingPlayerId(null);
    setEditForm({});
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  const savePlayer = async (profileId) => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const data = await authFetch(`${backendUrl}/api/admin/players/${profileId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!data) return;

      setMessage("Jugador actualizado correctamente.");
      setEditingPlayerId(null);
      setEditForm({});
      loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al actualizar jugador");
    } finally {
      setSaving(false);
    }
  };

  const updatePlayerStatus = async (player, newStatus) => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const data = await authFetch(`${backendUrl}/api/admin/players/${player.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!data) return;

      if (newStatus === "approved") {
        setMessage(`${player.nickname} marcado como pagado y aprobado.`);
      } else if (newStatus === "pending") {
        setMessage(`${player.nickname} marcado como pendiente de pago.`);
      } else {
        setMessage(`${player.nickname} marcado como rechazado.`);
      }

      loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cambiar el estado del jugador");
    } finally {
      setSaving(false);
    }
  };

  const deletePlayer = async (profileId, nickname) => {
    const confirmDelete = window.confirm(
      `¿Seguro que quieres eliminar a ${nickname}? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      setMessage("");
      setError("");

      const data = await authFetch(`${backendUrl}/api/admin/players/${profileId}`, {
        method: "DELETE",
      });

      if (!data) return;

      setMessage("Jugador eliminado correctamente.");
      loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al eliminar jugador");
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span>Panel admin</span>
          <h1>Jugadores y pagos</h1>
          <p>
            Verifica el pago de cada jugador, activa su perfil y modifica sus
            datos si hay algún error.
          </p>
        </div>

        <div className="admin-hero-card">
          <strong>{players.length}</strong>
          <span>Jugadores</span>
        </div>
      </div>

      <div className="admin-payment-summary">
        <button
          className={
            statusFilter === "Todos"
              ? "admin-payment-card active"
              : "admin-payment-card"
          }
          onClick={() => setStatusFilter("Todos")}
        >
          <strong>{counters.total}</strong>
          <span>Todos</span>
        </button>

        <button
          className={
            statusFilter === "pending"
              ? "admin-payment-card pending active"
              : "admin-payment-card pending"
          }
          onClick={() => setStatusFilter("pending")}
        >
          <strong>{counters.pending}</strong>
          <span>Pendientes de pago</span>
        </button>

        <button
          className={
            statusFilter === "approved"
              ? "admin-payment-card approved active"
              : "admin-payment-card approved"
          }
          onClick={() => setStatusFilter("approved")}
        >
          <strong>{counters.approved}</strong>
          <span>Pagados</span>
        </button>

        <button
          className={
            statusFilter === "rejected"
              ? "admin-payment-card rejected active"
              : "admin-payment-card rejected"
          }
          onClick={() => setStatusFilter("rejected")}
        >
          <strong>{counters.rejected}</strong>
          <span>Rechazados</span>
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="admin-state">
          <p>Cargando jugadores...</p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="admin-empty">
          <h2>No hay jugadores en este estado</h2>
          <p>
            Cambia el filtro superior para ver otros jugadores registrados.
          </p>
        </div>
      ) : (
        <div className="admin-table-card">
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Contacto</th>
                  <th>Nivel</th>
                  <th>Posición</th>
                  <th>Pago / Estado</th>
                  <th>Puntos</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredPlayers.map((player) => (
                  <tr key={player.id}>
                    <td>
                      {editingPlayerId === player.id ? (
                        <div className="admin-edit-mini-grid">
                          <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleEditChange}
                            placeholder="Nombre"
                          />

                          <input
                            type="text"
                            name="last_name"
                            value={editForm.last_name}
                            onChange={handleEditChange}
                            placeholder="Apellidos"
                          />

                          <input
                            type="text"
                            name="nickname"
                            value={editForm.nickname}
                            onChange={handleEditChange}
                            placeholder="Nickname"
                          />
                        </div>
                      ) : (
                        <div className="admin-player-data">
                          <strong>{player.nickname}</strong>
                          <span>
                            {player.name} {player.last_name}
                          </span>
                        </div>
                      )}
                    </td>

                    <td>
                      {editingPlayerId === player.id ? (
                        <div className="admin-edit-mini-grid">
                          <input
                            type="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleEditChange}
                            placeholder="Email"
                          />

                          <input
                            type="text"
                            name="phone"
                            value={editForm.phone}
                            onChange={handleEditChange}
                            placeholder="Teléfono"
                          />

                          <input
                            type="text"
                            name="instagram"
                            value={editForm.instagram}
                            onChange={handleEditChange}
                            placeholder="Instagram"
                          />
                        </div>
                      ) : (
                        <div className="admin-player-data">
                          <span>{player.email}</span>
                          <span>{player.phone || "-"}</span>
                          <span>{player.instagram || "-"}</span>
                        </div>
                      )}
                    </td>

                    <td>
                      {editingPlayerId === player.id ? (
                        <select
                          className="admin-edit-select"
                          name="level"
                          value={editForm.level}
                          onChange={handleEditChange}
                        >
                          {levels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="ranking-level-pill">
                          {player.level}
                        </span>
                      )}
                    </td>

                    <td>
                      {editingPlayerId === player.id ? (
                        <select
                          className="admin-edit-select"
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
                      ) : (
                        player.position || "-"
                      )}
                    </td>

                    <td>
                      {editingPlayerId === player.id ? (
                        <select
                          className="admin-edit-select"
                          name="status"
                          value={editForm.status}
                          onChange={handleEditChange}
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {getStatusText(status)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="admin-payment-status-cell">
                          <span
                            className={`admin-status-pill status-${player.status}`}
                          >
                            {getStatusText(player.status)}
                          </span>

                          <small>{getStatusDescription(player.status)}</small>
                        </div>
                      )}
                    </td>

                    <td>
                      <strong>{player.points ?? 0}</strong>
                    </td>

                    <td>
                      <div className="admin-actions">
                        {editingPlayerId === player.id ? (
                          <>
                            <button
                              className="admin-action-btn approve"
                              onClick={() => savePlayer(player.id)}
                              disabled={saving}
                            >
                              {saving ? "Guardando..." : "Guardar"}
                            </button>

                            <button
                              className="admin-action-btn reject"
                              onClick={cancelEditing}
                              disabled={saving}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            {player.status !== "approved" && (
                              <button
                                className="admin-action-btn approve"
                                onClick={() =>
                                  updatePlayerStatus(player, "approved")
                                }
                                disabled={saving}
                              >
                                Marcar pagado
                              </button>
                            )}

                            {player.status !== "pending" && (
                              <button
                                className="admin-action-btn neutral"
                                onClick={() =>
                                  updatePlayerStatus(player, "pending")
                                }
                                disabled={saving}
                              >
                                Pendiente
                              </button>
                            )}

                            <button
                              className="admin-action-btn edit"
                              onClick={() => startEditing(player)}
                            >
                              Editar
                            </button>

                            <button
                              className="admin-action-btn delete"
                              onClick={() =>
                                deletePlayer(player.id, player.nickname)
                              }
                            >
                              Eliminar
                            </button>
                          </>
                        )}
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