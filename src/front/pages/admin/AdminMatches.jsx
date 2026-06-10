import { useEffect, useState } from "react";

export const AdminMatches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${backendUrl}/api/admin/matches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudieron cargar los partidos");
      }

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
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("es-ES", {
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

  const deleteMatch = async (matchId) => {
    const confirmDelete = window.confirm(
      "¿Seguro que quieres eliminar este partido? El ranking se recalculará."
    );

    if (!confirmDelete) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${backendUrl}/api/admin/matches/${matchId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo eliminar el partido");
      }

      setMessage("Partido eliminado correctamente. Ranking recalculado.");
      loadMatches();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al eliminar partido");
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
      const response = await fetch(
        `${backendUrl}/api/admin/recalculate-ranking`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo recalcular el ranking");
      }

      setMessage("Ranking recalculado correctamente.");
      loadMatches();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al recalcular ranking");
    }
  };

  return (
    <section className="admin-matches-page">
      <div className="admin-matches-hero">
        <div>
          <span>Panel admin</span>
          <h1>Gestión de partidos</h1>
          <p>
            Revisa los resultados subidos, elimina partidos incorrectos y
            recalcula el ranking cuando sea necesario.
          </p>
        </div>

        <div className="admin-matches-hero-card">
          <strong>{matches.length}</strong>
          <span>Partidos registrados</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admin-matches-actions-card">
        <div>
          <h2>Acciones rápidas</h2>
          <p>
            Usa estas acciones solo cuando hayas eliminado partidos incorrectos o
            necesites refrescar la clasificación.
          </p>
        </div>

        <button
          type="button"
          className="admin-recalculate-btn"
          onClick={recalculateRanking}
        >
          Recalcular ranking
        </button>
      </div>

      {loading && (
        <div className="admin-matches-state">
          <p>Cargando partidos...</p>
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="admin-matches-empty">
          <h2>No hay partidos registrados</h2>
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
              <h2>Historial de partidos</h2>
              <p>
                Elimina cualquier resultado incorrecto para mantener limpio el
                ranking.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="ranking-table admin-matches-table">
              <thead>
                <tr>
                  <th>Fecha</th>
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
                      <span className="admin-match-level-pill">
                        {match.level}
                      </span>
                    </td>

                    <td>
                      <div className="admin-match-team">
                        <strong>
                          {match.team_a?.[0]?.nickname || "-"} /{" "}
                          {match.team_a?.[1]?.nickname || "-"}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <div className="admin-match-team">
                        <strong>
                          {match.team_b?.[0]?.nickname || "-"} /{" "}
                          {match.team_b?.[1]?.nickname || "-"}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <span className="admin-match-score">{match.score}</span>
                    </td>

                    <td>{getWinnerText(match.winner_team)}</td>

                    <td>{match.club || "-"}</td>

                    <td>{match.submitted_by || "-"}</td>

                    <td>
                      <button
                        className="admin-delete-match-btn"
                        onClick={() => deleteMatch(match.id)}
                      >
                        Eliminar
                      </button>
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