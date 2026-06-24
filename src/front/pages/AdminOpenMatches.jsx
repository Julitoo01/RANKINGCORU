import React, { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";

export const AdminOpenMatches = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [openMatches, setOpenMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    level: "Bronce",
    club: "",
    match_date: "",
    match_time: "",
    description: "",
  });

  const levels = ["Bronce", "Plata", "Oro", "Platino", "Diamante"];

  const loadOpenMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/open-matches`);

      if (data) {
        setOpenMatches(data);
      }
    } catch (err) {
      setError(err.message || "No se pudieron cargar los partidos abiertos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpenMatches();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleCreateMatch = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setMessage("");
      setError("");

      if (!form.club.trim()) {
        setError("El club es obligatorio");
        return;
      }

      if (!form.match_date) {
        setError("La fecha es obligatoria");
        return;
      }

      if (!form.match_time) {
        setError("La hora es obligatoria");
        return;
      }

      const data = await authFetch(`${backendUrl}/api/admin/open-matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: form.level,
          club: form.club,
          match_date: form.match_date,
          match_time: form.match_time,
          description: form.description,
        }),
      });

      if (data) {
        setMessage("Partido abierto creado correctamente");

        setForm({
          level: "Bronce",
          club: "",
          match_date: "",
          match_time: "",
          description: "",
        });

        loadOpenMatches();
      }
    } catch (err) {
      setError(err.message || "No se pudo crear el partido");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMatch = async (openMatchId) => {
    const confirmDelete = window.confirm(
      "¿Seguro que quieres eliminar este partido abierto?"
    );

    if (!confirmDelete) return;

    try {
      setMessage("");
      setError("");

      const data = await authFetch(
        `${backendUrl}/api/admin/open-matches/${openMatchId}`,
        {
          method: "DELETE",
        }
      );

      if (data) {
        setMessage("Partido eliminado correctamente");
        loadOpenMatches();
      }
    } catch (err) {
      setError(err.message || "No se pudo eliminar el partido");
    }
  };

  const getStatusText = (status) => {
    if (status === "open") return "Abierto";
    if (status === "closed") return "Cerrado";
    if (status === "cancelled") return "Cancelado";
    return status;
  };

  const getPlayerName = (playerData) => {
    if (!playerData) return "Sin jugador";

    return (
      playerData.nickname ||
      `${playerData.name || ""} ${playerData.last_name || ""}`.trim() ||
      "Jugador"
    );
  };

  const renderPlayers = (openMatch) => {
    if (!openMatch.players || openMatch.players.length === 0) {
      return <p className="admin-open-match-empty">Todavía no hay jugadores apuntados.</p>;
    }

    return (
      <div className="admin-open-match-players">
        {openMatch.players.map((item) => (
          <span key={item.id} className="admin-open-match-player-pill">
            {getPlayerName(item.player)}
          </span>
        ))}
      </div>
    );
  };

  const renderTeams = (openMatch) => {
    const teamA = openMatch.team_a || [];
    const teamB = openMatch.team_b || [];

    const hasTeams = teamA[0] && teamA[1] && teamB[0] && teamB[1];

    if (!hasTeams) return null;

    return (
      <div className="admin-open-match-teams">
        <div className="admin-open-match-team-card">
          <h4>Equipo A</h4>
          <p>{getPlayerName(teamA[0])}</p>
          <p>{getPlayerName(teamA[1])}</p>
        </div>

        <div className="admin-open-match-vs">VS</div>

        <div className="admin-open-match-team-card">
          <h4>Equipo B</h4>
          <p>{getPlayerName(teamB[0])}</p>
          <p>{getPlayerName(teamB[1])}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-open-matches-page">
      <section className="admin-open-matches-hero">
        <div>
          <span className="section-kicker">Admin</span>
          <h1>Partidos abiertos</h1>
          <p>
            Crea partidos para que los jugadores se apunten. Cuando se llenen con
            4 jugadores, se cerrarán automáticamente y se crearán las parejas por
            ranking: 1 + 3 vs 2 + 4.
          </p>
        </div>
      </section>

      <section className="admin-open-matches-card">
        <h2>Abrir nuevo partido</h2>

        <form className="admin-open-matches-form" onSubmit={handleCreateMatch}>
          <div className="form-group">
            <label>Nivel</label>
            <select name="level" value={form.level} onChange={handleChange}>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Club</label>
            <input
              type="text"
              name="club"
              value={form.club}
              onChange={handleChange}
              placeholder="Ej: Coruña Sport Centre"
            />
          </div>

          <div className="form-group">
            <label>Fecha</label>
            <input
              type="date"
              name="match_date"
              value={form.match_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Hora</label>
            <input
              type="time"
              name="match_time"
              value={form.match_time}
              onChange={handleChange}
            />
          </div>

          <div className="form-group admin-open-matches-description">
            <label>Descripción opcional</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Ej: Partido de ranking. Nivel medio-alto."
              rows="3"
            />
          </div>

          <button className="primary-button" type="submit" disabled={creating}>
            {creating ? "Creando..." : "Crear partido"}
          </button>
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </section>

      <section className="admin-open-matches-list">
        <div className="admin-open-matches-list-header">
          <div>
            <span className="section-kicker">Gestión</span>
            <h2>Partidos creados</h2>
          </div>

          <button className="secondary-button" type="button" onClick={loadOpenMatches}>
            Actualizar
          </button>
        </div>

        {loading ? (
          <p className="admin-open-match-empty">Cargando partidos...</p>
        ) : openMatches.length === 0 ? (
          <p className="admin-open-match-empty">
            Todavía no hay partidos abiertos creados.
          </p>
        ) : (
          <div className="admin-open-match-grid">
            {openMatches.map((openMatch) => (
              <article key={openMatch.id} className="admin-open-match-card">
                <div className="admin-open-match-card-header">
                  <div>
                    <h3>
                      {openMatch.level} · {openMatch.club}
                    </h3>
                    <p>
                      {openMatch.match_date} · {openMatch.match_time}
                    </p>
                  </div>

                  <span className={`open-match-status ${openMatch.status}`}>
                    {getStatusText(openMatch.status)}
                  </span>
                </div>

                {openMatch.description && (
                  <p className="admin-open-match-description">
                    {openMatch.description}
                  </p>
                )}

                <div className="admin-open-match-count">
                  {openMatch.players_count}/{openMatch.max_players} jugadores
                </div>

                {renderPlayers(openMatch)}

                {renderTeams(openMatch)}

                <div className="admin-open-match-actions">
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => handleDeleteMatch(openMatch.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};