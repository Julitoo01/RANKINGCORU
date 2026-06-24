import { useEffect, useState } from "react";
import { authFetch } from "../../utils/authFetch";

export const AdminMatches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

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

      if (!data) return;

      setMatches(data);
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar partidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [statusFilter]);

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getWinnerText = (winnerTeam) => {
    if (winnerTeam === "A") return "Equipo A";
    if (winnerTeam === "B") return "Equipo B";
    return "-";
  };

  const getStatusText = (status) => {
    if (status === "confirmed") return "Confirmado";
    if (status === "pending") return "Pendiente";
    if (status === "rejected") return "Rechazado";
    return status || "-";
  };

  const renderTeam = (team) => {
    if (!team || team.length === 0) return "-";

    const names = team
      .filter(Boolean)
      .map((player) => player.nickname)
      .filter(Boolean);

    return names.length > 0 ? names.join(" / ") : "-";
  };

  const deleteMatch = async (matchId) => {
    const confirmDelete = window.confirm(
      "¿Seguro que quieres eliminar este partido? El ranking se recalculará automáticamente."
    );

    if (!confirmDelete) return;

    setMessage("");
    setError("");

    try {
      setActionLoadingId(matchId);

      const data = await authFetch(`${backendUrl}/api/admin/matches/${matchId}`, {
        method: "DELETE",
      });

      if (!data) return;

      setMessage("Partido eliminado correctamente. Ranking recalculado.");
      await loadMatches();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al eliminar partido");
    } finally {
      setActionLoadingId(null);
    }
  };

  const recalculateRanking = async () => {
    const confirmRecalculate = window.confirm(
      "¿Seguro que quieres recalcular todo el ranking?"
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

      setMessage("Ranking recalculado correctamente.");
      await loadMatches();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al recalcular ranking");
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <section className="admin-matches-page">
      <div className="admin-matches-hero">
        <div>
          <span>Panel admin</span>
          <h1>Gestión de resultados</h1>
          <p>
            Revisa los resultados subidos, elimina partidos incorrectos y
            recalcula el ranking cuando sea necesario.
          </p>
        </div>

        <div className="admin-matches-hero-card">
          <strong>{matches.length}</strong>
          <span>Resultados</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admin-matches-actions-card">
        <div>
          <h2>Acciones rápidas</h2>
          <p>
            Usa estas acciones para mantener limpio el ranking si hay un
            resultado mal subido.
          </p>
        </div>

        <div className="admin-matches-actions-row">
          <div className="admin-matches-filter-box">
            <label>Estado</label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="confirmed">Confirmados</option>
              <option value="pending">Pendientes</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>

          <button
            type="button"
            className="admin-recalculate-btn"
            onClick={recalculateRanking}
            disabled={recalculating}
          >
            {recalculating ? "Recalculando..." : "Recalcular ranking"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="admin-matches-state">
          <p>Cargando partidos...</p>
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="admin-matches-empty">
          <h2>No hay resultados registrados</h2>
          <p>
            Cuando los jugadores suban resultados, aparecerán aquí para poder
            gestionarlos.
          </p>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <div className="admin-matches-table-card">
          <div className="admin-matches-table-header">
            <div>
              <h2>Historial de resultados</h2>
              <p>
                Elimina cualquier resultado incorrecto para mantener limpio el
                ranking.
              </p>
            </div>
          </div>

          <div className="table-wrapper admin-matches-desktop-table">
            <table className="ranking-table admin-matches-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Nivel</th>
                  <th>Equipo A</th>
                  <th>Equipo B</th>
                  <th>Resultado</th>
                  <th>Ganador</th>
                  <th>Club</th>
                  <th>Subido por</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td>{formatDate(match.played_at)}</td>

                    <td>
                      <span className={`admin-match-status ${match.status}`}>
                        {getStatusText(match.status)}
                      </span>
                    </td>

                    <td>
                      <span className="admin-match-level-pill">
                        {match.level}
                      </span>
                    </td>

                    <td>
                      <div className="admin-match-team">
                        <strong>{renderTeam(match.team_a)}</strong>
                      </div>
                    </td>

                    <td>
                      <div className="admin-match-team">
                        <strong>{renderTeam(match.team_b)}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="admin-match-score">
                        {match.score || "-"}
                      </span>
                    </td>

                    <td>{getWinnerText(match.winner_team)}</td>

                    <td>{match.club || "-"}</td>

                    <td>{match.submitted_by || "-"}</td>

                    <td>
                      <button
                        className="admin-delete-match-btn"
                        onClick={() => deleteMatch(match.id)}
                        disabled={actionLoadingId === match.id}
                      >
                        {actionLoadingId === match.id
                          ? "Eliminando..."
                          : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-matches-mobile-cards">
            {matches.map((match) => (
              <article key={`mobile-${match.id}`} className="admin-match-card">
                <div className="admin-match-card-header">
                  <div>
                    <span>{formatDate(match.played_at)}</span>
                    <h3>{match.level}</h3>
                  </div>

                  <span className={`admin-match-status ${match.status}`}>
                    {getStatusText(match.status)}
                  </span>
                </div>

                <div className="admin-match-card-score">
                  {match.score || "-"}
                </div>

                <div className="admin-match-card-teams">
                  <div
                    className={
                      match.winner_team === "A"
                        ? "admin-match-card-team winner"
                        : "admin-match-card-team"
                    }
                  >
                    <span>Equipo A</span>
                    <strong>{renderTeam(match.team_a)}</strong>
                  </div>

                  <div
                    className={
                      match.winner_team === "B"
                        ? "admin-match-card-team winner"
                        : "admin-match-card-team"
                    }
                  >
                    <span>Equipo B</span>
                    <strong>{renderTeam(match.team_b)}</strong>
                  </div>
                </div>

                <div className="admin-match-card-meta">
                  <span>
                    Ganador: <strong>{getWinnerText(match.winner_team)}</strong>
                  </span>

                  <span>
                    Club: <strong>{match.club || "-"}</strong>
                  </span>

                  <span>
                    Subido por: <strong>{match.submitted_by || "-"}</strong>
                  </span>
                </div>

                <button
                  className="admin-delete-match-btn"
                  onClick={() => deleteMatch(match.id)}
                  disabled={actionLoadingId === match.id}
                >
                  {actionLoadingId === match.id
                    ? "Eliminando..."
                    : "Eliminar resultado"}
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};