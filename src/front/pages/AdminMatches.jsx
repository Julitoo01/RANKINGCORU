import { useEffect, useState } from "react";
import { authFetch } from "../../utils/authFetch";

export const AdminMatches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [matches, setMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSeasons = async () => {
    try {
      setSeasonsLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/seasons`);

      if (!data) return;

      setSeasons(data);

      const activeSeason = data.find((season) => season.is_active);

      if (activeSeason && !selectedSeasonId) {
        setSelectedSeasonId(String(activeSeason.id));
      }
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar temporadas");
    } finally {
      setSeasonsLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (selectedSeasonId) {
        params.append("season_id", selectedSeasonId);
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
    loadSeasons();
  }, []);

  useEffect(() => {
    if (!seasonsLoading) {
      loadMatches();
    }
  }, [selectedSeasonId, seasonsLoading]);

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
      "¿Seguro que quieres eliminar este partido? El ranking se recalculará automáticamente."
    );

    if (!confirmDelete) return;

    try {
      setMessage("");
      setError("");

      const data = await authFetch(`${backendUrl}/api/admin/matches/${matchId}`, {
        method: "DELETE",
      });

      if (!data) return;

      setMessage("Partido eliminado correctamente. Ranking recalculado.");
      loadMatches();
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al eliminar partido");
    }
  };

  const selectedSeason = seasons.find(
    (season) => String(season.id) === String(selectedSeasonId)
  );

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span>Panel admin</span>
          <h1>Partidos</h1>
          <p>
            Revisa los resultados registrados, elimina partidos incorrectos y
            controla el historial por temporada.
          </p>
        </div>

        <div className="admin-hero-card">
          <strong>{matches.length}</strong>
          <span>Partidos</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="matches-season-card">
        <div>
          <span>Temporada</span>
          <h2>{selectedSeason?.name || "Temporada actual"}</h2>
          <p>
            {selectedSeason?.is_closed
              ? "Estás viendo partidos de una temporada cerrada."
              : "Estás viendo los partidos de la temporada activa."}
          </p>
        </div>

        <div className="matches-season-select-box">
          <label>Ver temporada</label>

          <select
            value={selectedSeasonId}
            onChange={(event) => setSelectedSeasonId(event.target.value)}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} {season.is_active ? "· Actual" : "· Histórico"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-state">
          <p>Cargando partidos...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="admin-empty">
          <h2>No hay partidos registrados</h2>
          <p>
            Cuando los jugadores suban resultados, aparecerán aquí para ser
            revisados.
          </p>
        </div>
      ) : (
        <div className="admin-table-card">
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Equipo A</th>
                  <th>Equipo B</th>
                  <th>Resultado</th>
                  <th>Ganador</th>
                  <th>Nivel</th>
                  <th>Club</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td>{formatDate(match.played_at)}</td>

                    <td>
                      <strong>
                        {match.team_a?.[0]?.nickname || "-"} /{" "}
                        {match.team_a?.[1]?.nickname || "-"}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {match.team_b?.[0]?.nickname || "-"} /{" "}
                        {match.team_b?.[1]?.nickname || "-"}
                      </strong>
                    </td>

                    <td>{match.score}</td>

                    <td>{getWinnerText(match.winner_team)}</td>

                    <td>
                      <span className="ranking-level-pill">{match.level}</span>
                    </td>

                    <td>{match.club || "-"}</td>

                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-action-btn delete"
                          onClick={() => deleteMatch(match.id)}
                        >
                          Eliminar
                        </button>
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