import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";

export const UploadResult = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [players, setPlayers] = useState([]);
  const [formData, setFormData] = useState({
    team_a_player_1_id: "",
    team_a_player_2_id: "",
    team_b_player_1_id: "",
    team_b_player_2_id: "",
    winner_team: "A",
    score: "",
    level: "Bronce",
    club: "",
    played_at: "",
  });

  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const levels = ["Iniciación", "Bronce", "Plata", "Oro", "Diamante"];

  const loadPlayers = async () => {
    try {
      setLoadingPlayers(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/ranking`);

      if (!data) return;

      setPlayers(data);
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar jugadores");
    } finally {
      setLoadingPlayers(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const selectedPlayers = [
      formData.team_a_player_1_id,
      formData.team_a_player_2_id,
      formData.team_b_player_1_id,
      formData.team_b_player_2_id,
    ];

    if (selectedPlayers.some((playerId) => !playerId)) {
      return "Tienes que seleccionar los 4 jugadores.";
    }

    const uniquePlayers = new Set(selectedPlayers);

    if (uniquePlayers.size !== 4) {
      return "No puedes repetir jugadores en el mismo partido.";
    }

    if (!formData.score.trim()) {
      return "Tienes que escribir el resultado.";
    }

    if (!formData.level) {
      return "Tienes que seleccionar el nivel del partido.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSending(true);

      const payload = {
        team_a_player_1_id: Number(formData.team_a_player_1_id),
        team_a_player_2_id: Number(formData.team_a_player_2_id),
        team_b_player_1_id: Number(formData.team_b_player_1_id),
        team_b_player_2_id: Number(formData.team_b_player_2_id),
        winner_team: formData.winner_team,
        score: formData.score.trim(),
        level: formData.level,
        club: formData.club.trim(),
        played_at: formData.played_at || null,
      };

      const data = await authFetch(`${backendUrl}/api/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!data) return;

      setMessage("Resultado subido correctamente. El ranking se ha actualizado.");

      setFormData({
        team_a_player_1_id: "",
        team_a_player_2_id: "",
        team_b_player_1_id: "",
        team_b_player_2_id: "",
        winner_team: "A",
        score: "",
        level: "Bronce",
        club: "",
        played_at: "",
      });
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al subir resultado");
    } finally {
      setSending(false);
    }
  };

  const renderPlayerOptions = () => {
    return players.map((player) => (
      <option key={player.id} value={player.id}>
        {player.nickname} · {player.level}
      </option>
    ));
  };

  return (
    <section className="upload-result-page">
      <div className="upload-result-hero">
        <div>
          <span>Fuera de Pista</span>
          <h1>Subir resultado</h1>
          <p>
            Registra un partido 2 vs 2. El ranking es individual, por lo que
            cada jugador sumará puntos según el resultado del partido.
          </p>
        </div>

        <div className="upload-result-hero-card">
          <strong>+3</strong>
          <span>Victoria</span>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loadingPlayers ? (
        <div className="upload-result-state">
          <p>Cargando jugadores...</p>
        </div>
      ) : (
        <form className="upload-result-form-card" onSubmit={handleSubmit}>
          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>Equipo A</span>
              <h2>Jugadores del equipo A</h2>
            </div>

            <div className="upload-form-grid">
              <div className="form-group">
                <label>Jugador 1</label>
                <select
                  name="team_a_player_1_id"
                  value={formData.team_a_player_1_id}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar jugador</option>
                  {renderPlayerOptions()}
                </select>
              </div>

              <div className="form-group">
                <label>Jugador 2</label>
                <select
                  name="team_a_player_2_id"
                  value={formData.team_a_player_2_id}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar jugador</option>
                  {renderPlayerOptions()}
                </select>
              </div>
            </div>
          </div>

          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>Equipo B</span>
              <h2>Jugadores del equipo B</h2>
            </div>

            <div className="upload-form-grid">
              <div className="form-group">
                <label>Jugador 1</label>
                <select
                  name="team_b_player_1_id"
                  value={formData.team_b_player_1_id}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar jugador</option>
                  {renderPlayerOptions()}
                </select>
              </div>

              <div className="form-group">
                <label>Jugador 2</label>
                <select
                  name="team_b_player_2_id"
                  value={formData.team_b_player_2_id}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar jugador</option>
                  {renderPlayerOptions()}
                </select>
              </div>
            </div>
          </div>

          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>Resultado</span>
              <h2>Datos del partido</h2>
            </div>

            <div className="upload-form-grid">
              <div className="form-group">
                <label>Equipo ganador</label>
                <select
                  name="winner_team"
                  value={formData.winner_team}
                  onChange={handleChange}
                >
                  <option value="A">Equipo A</option>
                  <option value="B">Equipo B</option>
                </select>
              </div>

              <div className="form-group">
                <label>Resultado</label>
                <input
                  type="text"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  placeholder="Ej: 6-4 / 6-3"
                />
              </div>

              <div className="form-group">
                <label>Nivel</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                >
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
                  value={formData.club}
                  onChange={handleChange}
                  placeholder="Ej: Coruña Sport Centre"
                />
              </div>

              <div className="form-group">
                <label>Fecha del partido</label>
                <input
                  type="date"
                  name="played_at"
                  value={formData.played_at}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="upload-result-points-info">
            <div>
              <strong>+3</strong>
              <span>Victoria</span>
            </div>

            <div>
              <strong>+1</strong>
              <span>Derrota</span>
            </div>

            <div>
              <strong>-2</strong>
              <span>No show</span>
            </div>
          </div>

          <button className="upload-result-submit-btn" disabled={sending}>
            {sending ? "Subiendo resultado..." : "Subir resultado"}
          </button>
        </form>
      )}
    </section>
  );
};