import { useEffect, useState } from "react";

export const AdminPlayers = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const levels = ["Todos", "Bronce", "Plata", "Oro", "Platino", "Diamante"];
  const playerLevels = ["Bronce", "Plata", "Oro", "Platino", "Diamante"];
  const positions = ["Derecha", "Revés", "Ambas"];
  const statuses = ["Todos", "pending", "approved", "rejected"];
  const playerStatuses = ["pending", "approved", "rejected"];

  const statusLabels = {
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
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

      const response = await fetch(
        `${backendUrl}/api/admin/players?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudieron cargar los jugadores");
      }

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

  const updatePlayer = async (profileId, payload) => {
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${backendUrl}/api/admin/players/${profileId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo actualizar el jugador");
      }

      setMessage("Jugador actualizado correctamente.");
      setEditingPlayerId(null);
      loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al actualizar jugador");
    }
  };

  const approvePlayer = (profileId) => {
    updatePlayer(profileId, { status: "approved" });
  };

  const rejectPlayer = (profileId) => {
    updatePlayer(profileId, { status: "rejected" });
  };

  const pendingPlayer = (profileId) => {
    updatePlayer(profileId, { status: "pending" });
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
      `¿Seguro que quieres eliminar a ${nickname}? También se eliminarán sus partidos asociados.`
    );

    if (!confirmDelete) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${backendUrl}/api/admin/players/${profileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo eliminar el jugador");
      }

      setMessage("Jugador eliminado correctamente.");
      loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al eliminar jugador");
    }
  };

  const getStatusClass = (status) => {
    if (status === "approved") return "approved";
    if (status === "rejected") return "rejected";
    return "pending";
  };

  return (
    <section className="admin-players-page">
      <div className="admin-players-hero">
        <div>
          <span>Panel admin</span>
          <h1>Gestión de jugadores</h1>
          <p>
            Aprueba nuevos registros, edita nivel o posición y elimina jugadores
            de prueba o duplicados.
          </p>
        </div>

        <div className="admin-players-hero-card">
          <strong>{players.length}</strong>
          <span>Jugadores visibles</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admin-players-filters-card">
        <div>
          <h2>Filtros</h2>
          <p>Filtra por estado o nivel para gestionar mejor los registros.</p>
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
                  {status === "Todos" ? "Todos" : statusLabels[status]}
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
              <p>Gestiona el estado, nivel y posición de cada jugador.</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="ranking-table admin-players-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Instagram</th>
                  <th>Nivel</th>
                  <th>Posición</th>
                  <th>Estado</th>
                  <th>Puntos</th>
                  <th>Partidos</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {players.map((player) => {
                  const isEditing = editingPlayerId === player.id;

                  return (
                    <tr key={player.id}>
                      <td>
                        <div className="admin-player-name">
                          <strong>{player.nickname}</strong>
                          <span>
                            {player.name} {player.last_name}
                          </span>
                        </div>
                      </td>

                      <td>{player.email}</td>
                      <td>{player.phone || "-"}</td>
                      <td>{player.instagram || "-"}</td>

                      <td>
                        {isEditing ? (
                          <select
                            className="admin-edit-select"
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
                        ) : (
                          <span className="admin-player-level-pill">
                            {player.level}
                          </span>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
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
                          player.position
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <select
                            className="admin-edit-select"
                            name="status"
                            value={editForm.status}
                            onChange={handleEditChange}
                          >
                            {playerStatuses.map((status) => (
                              <option key={status} value={status}>
                                {statusLabels[status]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`status-badge ${getStatusClass(
                              player.status
                            )}`}
                          >
                            {statusLabels[player.status] || player.status}
                          </span>
                        )}
                      </td>

                      <td>{player.points}</td>
                      <td>{player.matches_played}</td>

                      <td>
                        <div className="admin-player-actions">
                          {isEditing ? (
                            <>
                              <button
                                className="admin-action-btn approve"
                                onClick={() => saveEditing(player.id)}
                              >
                                Guardar
                              </button>

                              <button
                                className="admin-action-btn neutral"
                                onClick={cancelEditing}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="admin-action-btn neutral"
                                onClick={() => startEditing(player)}
                              >
                                Editar
                              </button>

                              {player.status !== "approved" && (
                                <button
                                  className="admin-action-btn approve"
                                  onClick={() => approvePlayer(player.id)}
                                >
                                  Aprobar
                                </button>
                              )}

                              {player.status !== "rejected" && (
                                <button
                                  className="admin-action-btn reject"
                                  onClick={() => rejectPlayer(player.id)}
                                >
                                  Rechazar
                                </button>
                              )}

                              {player.status !== "pending" && (
                                <button
                                  className="admin-action-btn neutral"
                                  onClick={() => pendingPlayer(player.id)}
                                >
                                  Pendiente
                                </button>
                              )}

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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};