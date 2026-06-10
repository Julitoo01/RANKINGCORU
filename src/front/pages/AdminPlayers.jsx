import { useEffect, useState } from "react";

export const AdminPlayers = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

  const [players, setPlayers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
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

  const approvePlayer = async (profileId) => {
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${backendUrl}/api/admin/players/${profileId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo aprobar el jugador");
      }

      setMessage("Jugador aprobado correctamente.");
      loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al aprobar jugador");
    }
  };

  const rejectPlayer = async (profileId) => {
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${backendUrl}/api/admin/players/${profileId}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo rechazar el jugador");
      }

      setMessage("Jugador rechazado correctamente.");
      loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al rechazar jugador");
    }
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
      loadPlayers();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al actualizar jugador");
    }
  };

  return (
    <section className="admin-players-page">
      <div className="admin-players-hero">
        <div>
          <span>Panel admin</span>
          <h1>Gestión de jugadores</h1>
          <p>
            Aprueba usuarios, cambia niveles, revisa estados y controla qué
            jugadores aparecen en el ranking.
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
                Cambia nivel, posición o estado directamente desde la tabla.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="ranking-table admin-players-table">
              <thead>
                <tr>
                  <th>Jugador</th>
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
                {players.map((player) => (
                  <tr key={player.id}>
                    <td>
                      <div className="admin-player-cell">
                        <div className="admin-player-avatar">
                          {player.nickname?.charAt(0)?.toUpperCase() || "J"}
                        </div>

                        <div>
                          <strong>{player.nickname}</strong>
                          <span>ID perfil: {player.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <select
                        value={player.level}
                        onChange={(event) =>
                          updatePlayer(player.id, { level: event.target.value })
                        }
                      >
                        {levels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <select
                        value={player.position}
                        onChange={(event) =>
                          updatePlayer(player.id, {
                            position: event.target.value,
                          })
                        }
                      >
                        {positions.map((position) => (
                          <option key={position} value={position}>
                            {position}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <span className={`status-badge status-${player.status}`}>
                        {getStatusText(player.status)}
                      </span>
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
                            onClick={() =>
                              updatePlayer(player.id, { status: "pending" })
                            }
                          >
                            Pendiente
                          </button>
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