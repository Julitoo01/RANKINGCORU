import { useEffect, useState } from "react";
import { authFetch } from "../../utils/authFetch";

export const AdminMatches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL !== "undefined" ? import.meta.env.VITE_BACKEND_URL : window.location.origin;

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
      setError(error.message || "Error al cargar resultados");
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

  const getPlayerName = (player) => {
    if (!player) return "Jugador";

    return (
      player.nickname ||
      `${player.name || ""} ${player.last_name || ""}`.trim() ||
      "Jugador"
    );
  };

  const renderTeam = (team) => {
    if (!team || team.length === 0) {
      return <span className="admin-team-empty">Sin jugadores</span>;
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
    const confirmDelete = window.confirm(
      "¿Seguro que quieres eliminar este resultado? El ranking se recalculará automáticamente."
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

      setMessage("Resultado eliminado correctamente. Ranking recalculado.");
      await loadMatches();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al eliminar resultado");
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
          <span className="section-kicker">Panel admin</span>

          <h1>Gestión de resultados</h1>

          <p>
            Revisa los resultados subidos, elimina partidos incorrectos y
            recalcula el ranking cuando sea necesario.
          </p>
        </div>

        <div className="admin-matches-hero-card">
          <strong>{matches.length}</strong>
          <span>Resultados visibles</span>
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
          <span>Total</span>
          <strong>{getCounter("Todos")}</strong>
        </button>

        <button
          type="button"
          className={`admin-matches-summary-card confirmed ${
            statusFilter === "confirmed" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("confirmed")}
        >
          <span>Confirmados</span>
          <strong>{getCounter("confirmed")}</strong>
        </button>

        <button
          type="button"
          className={`admin-matches-summary-card pending ${
            statusFilter === "pending" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("pending")}
        >
          <span>Pendientes</span>
          <strong>{getCounter("pending")}</strong>
        </button>

        <button
          type="button"
          className={`admin-matches-summary-card rejected ${
            statusFilter === "rejected" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("rejected")}
        >
          <span>Rechazados</span>
          <strong>{getCounter("rejected")}</strong>
        </button>
      </div>

      <div className="admin-matches-actions-card">
        <div>
          <span className="section-kicker">Acciones</span>

          <h2>Acciones rápidas</h2>

          <p>
            Usa estas acciones solo cuando haya un resultado incorrecto o quieras
            forzar el recálculo completo del ranking.
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
            className="secondary-button"
            onClick={loadMatches}
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>

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
          <p>Cargando resultados...</p>
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
              <span className="section-kicker">Historial</span>

              <h2>Resultados registrados</h2>

              <p>
                Cada resultado afecta directamente al ranking. Elimina solo los
                que estén mal subidos.
              </p>
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

                      <h3>{match.level || "Nivel no indicado"}</h3>

                      <p>{match.club || "Club no indicado"}</p>
                    </div>

                    <span className={`admin-match-status ${match.status}`}>
                      {getStatusText(match.status)}
                    </span>
                  </div>

                  <div className="admin-result-score-box">
                    <span>Resultado</span>
                    <strong>{match.score || "-"}</strong>
                  </div>

                  <div className="admin-result-teams">
                    <div
                      className={`admin-result-team ${
                        teamAWon ? "winner" : ""
                      }`}
                    >
                      <div className="admin-result-team-title">
                        <span>Equipo A</span>
                        {teamAWon && <small>Ganador</small>}
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
                        <span>Equipo B</span>
                        {teamBWon && <small>Ganador</small>}
                      </div>

                      {renderTeam(match.team_b)}
                    </div>
                  </div>

                  <div className="admin-result-meta">
                    <span>
                      Ganador: <strong>{getWinnerText(match.winner_team)}</strong>
                    </span>

                    <span>
                      Subido por: <strong>{match.submitted_by || "-"}</strong>
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
                        ? "Eliminando..."
                        : "Eliminar resultado"}
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