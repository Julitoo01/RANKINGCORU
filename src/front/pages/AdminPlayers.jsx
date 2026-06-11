import { useEffect, useState } from "react";

export const AdminPlayers = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

  const [players, setPlayers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    last_name: "",
    nickname: "",
    email: "",
    phone: "",
    instagram: "",
    level: "",
    position: "",
    status: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const levels = [
    "Iniciación",
    "Bronce",
    "Plata",
    "Oro",
    "Diamante",
    "No lo sé / quiero que me valoréis",
  ];

  const positions = ["Derecha", "Revés", "Ambas", "No lo sé"];

  const statuses = ["pending", "approved", "rejected"];

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

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      if (levelFilter) {
        params.append("level", levelFilter);
      }

      const url = params.toString()
        ? `${backendUrl}/api/admin/players?${params.toString()}`
        : `${backendUrl}/api/admin/players`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
  }, [statusFilter, levelFilter]);

  const getStatusText = (status) => {
    if (status === "approved") return "Aprobado";
    if (status === "pending") return "Pendiente";
    if (status === "rejected") return "Rechazado";
    return status;
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

  const startEditing = (player) => {
    setEditingPlayerId(player.id);

    setEditForm({
      name: player.name || "",
      last_name: player.last_name || "",
      nickname: player.nickname || "",
      email: player.email || "",
      phone: player.phone || "",
      instagram: player.instagram || "",
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
      name: "",
      last_name: "",
      nickname: "",
      email: "",
      phone: "",
      instagram: "",
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
      name: editForm.name,
      last_name: editForm.last_name,
      nickname: editForm.nickname,
      email: editForm.email,
      phone: editForm.phone,
      instagram: editForm.instagram,
      level: editForm.level,
      position: editForm.position,
      status: editForm.status,
    });
  };

  return (
    <section className="admin-players-page">
      <div className="admin-players-hero">
        <div>
          <span>Panel admin</span>
          <h1>Gestión de jugadores</h1>
          <p>
            Aprueba usuarios, edita datos personales, cambia niveles y controla
            qué jugadores aparecen en el ranking.
          </p>
        </div>

        <div className="admin-players-hero-card">
          <strong>{players.length}</strong>
          <span>Jugadores encontrados</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admin-players-filters-card">
        <div className="admin-players-filters-header">
          <h2>Filtros</h2>
          <p>Filtra los jugadores por estado o nivel.</p>
        </div>

        <div className="admin-players-filters">
          <div className="form-group">
            <label>Estado</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>

          <div className="form-group">
            <label>Nivel</label>
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
            >
              <option value="">Todos</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="admin-clear-filters-btn"
            onClick={() => {
              setStatusFilter("");
              setLevelFilter("");
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {loading && (
        <div className="admin-players-state">
          <p>Cargando jugadores...</p>
        </div>
      )}

      {!loading && players.length === 0 && (
        <div className="admin-players-empty">
          <h2>No hay jugadores con esos filtros</h2>
          <p>
            Prueba a limpiar los filtros o espera a que nuevos usuarios se
            registren.
          </p>
        </div>
      )}

      {!loading && players.length > 0 && (
        <div className="admin-players-table-card">
          <div className="admin-players-table-header">
            <div>
              <h2>Listado de jugadores</h2>
              <p>
                Pulsa editar para modificar datos personales, nivel, posición o
                estado.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="ranking-table admin-players-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Datos</th>
                  <th>Nivel</th>
                  <th>Posición</th>
                  <th>Estado</th>
                  <th>PJ</th>
                  <th>PG</th>
                  <th>PP</th>
                  <th>Pts</th>
                  <th>%</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {players.map((player) => {
                  const isEditing = editingPlayerId === player.id;

                  return (
                    <tr key={player.id}>
                      <td>
                        <div className="admin-player-cell">
                          <div className="admin-player-avatar">
                            {player.nickname?.charAt(0)?.toUpperCase() || "J"}
                          </div>

                          <div>
                            {isEditing ? (
                              <div className="admin-edit-mini-grid">
                                <input
                                  name="nickname"
                                  value={editForm.nickname}
                                  onChange={handleEditChange}
                                  placeholder="Nickname"
                                />

                                <input
                                  name="name"
                                  value={editForm.name}
                                  onChange={handleEditChange}
                                  placeholder="Nombre"
                                />

                                <input
                                  name="last_name"
                                  value={editForm.last_name}
                                  onChange={handleEditChange}
                                  placeholder="Apellidos"
                                />
                              </div>
                            ) : (
                              <>
                                <strong>{player.nickname}</strong>
                                <span>
                                  {player.name} {player.last_name}
                                </span>
                                <span>ID perfil: {player.id}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        {isEditing ? (
                          <div className="admin-edit-mini-grid">
                            <input
                              name="email"
                              value={editForm.email}
                              onChange={handleEditChange}
                              placeholder="Email"
                            />

                            <input
                              name="phone"
                              value={editForm.phone}
                              onChange={handleEditChange}
                              placeholder="Teléfono"
                            />

                            <input
                              name="instagram"
                              value={editForm.instagram}
                              onChange={handleEditChange}
                              placeholder="Instagram"
                            />
                          </div>
                        ) : (
                          <div className="admin-player-data">
                            <span>{player.email || "-"}</span>
                            <span>{player.phone || "-"}</span>
                            <span>{player.instagram || "-"}</span>
                          </div>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
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
                          player.level
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
                            {statuses.map((status) => (
                              <option key={status} value={status}>
                                {statusLabels[status]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`status-badge status-${player.status}`}
                          >
                            {getStatusText(player.status)}
                          </span>
                        )}
                      </td>

                      <td>{player.matches_played}</td>
                      <td>{player.wins}</td>
                      <td>{player.losses}</td>

                      <td>
                        <strong className="admin-player-points">
                          {player.points}
                        </strong>
                      </td>

                      <td>{player.win_percentage}%</td>

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
                                  onClick={() =>
                                    updatePlayer(player.id, {
                                      status: "approved",
                                    })
                                  }
                                >
                                  Aprobar
                                </button>
                              )}

                              {player.status !== "rejected" && (
                                <button
                                  className="admin-action-btn reject"
                                  onClick={() =>
                                    updatePlayer(player.id, {
                                      status: "rejected",
                                    })
                                  }
                                >
                                  Rechazar
                                </button>
                              )}

                              {player.status !== "pending" && (
                                <button
                                  className="admin-action-btn neutral"
                                  onClick={() =>
                                    updatePlayer(player.id, {
                                      status: "pending",
                                    })
                                  }
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