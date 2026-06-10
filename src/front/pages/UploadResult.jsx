import { useEffect, useMemo, useState } from "react";

export const UploadResult = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

  const [players, setPlayers] = useState([]);

  const [formData, setFormData] = useState({
    level: "",
    team_a_player_1_id: "",
    team_a_player_2_id: "",
    team_b_player_1_id: "",
    team_b_player_2_id: "",
    score: "",
    winner_team: "",
    club: "",
    played_at: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const levels = ["Iniciación", "Bronce", "Plata", "Oro", "Diamante"];

  const selectedPlayerIds = [
    formData.team_a_player_1_id,
    formData.team_a_player_2_id,
    formData.team_b_player_1_id,
    formData.team_b_player_2_id,
  ].filter(Boolean);

  const filteredPlayers = useMemo(() => {
    if (!formData.level) return players;
    return players.filter((player) => player.level === formData.level);
  }, [players, formData.level]);

  const loadPlayers = async () => {
    try {
      setLoadingPlayers(true);
      setError("");

      const response = await fetch(`${backendUrl}/api/players`, {
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
      setLoadingPlayers(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      const updatedForm = {
        ...prev,
        [name]: value,
      };

      if (name === "level") {
        updatedForm.team_a_player_1_id = "";
        updatedForm.team_a_player_2_id = "";
        updatedForm.team_b_player_1_id = "";
        updatedForm.team_b_player_2_id = "";
      }

      return updatedForm;
    });
  };

  const getAvailablePlayers = (currentFieldValue) => {
    return filteredPlayers.filter((player) => {
      const playerId = String(player.id);

      if (playerId === String(currentFieldValue)) {
        return true;
      }

      return !selectedPlayerIds.includes(playerId);
    });
  };

  const validatePlayers = () => {
    const ids = [
      formData.team_a_player_1_id,
      formData.team_a_player_2_id,
      formData.team_b_player_1_id,
      formData.team_b_player_2_id,
    ];

    const uniqueIds = new Set(ids);

    return uniqueIds.size === ids.length;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (!validatePlayers()) {
      setError("No puedes repetir jugadores en el mismo partido.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "No se pudo subir el resultado");
      }

      setMessage("Resultado subido correctamente. El ranking se ha actualizado.");

      setFormData({
        level: "",
        team_a_player_1_id: "",
        team_a_player_2_id: "",
        team_b_player_1_id: "",
        team_b_player_2_id: "",
        score: "",
        winner_team: "",
        club: "",
        played_at: "",
      });
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al subir resultado");
    } finally {
      setLoading(false);
    }
  };

  const renderPlayerOptions = (currentFieldValue) => {
    return getAvailablePlayers(currentFieldValue).map((player) => (
      <option key={player.id} value={player.id}>
        {player.nickname} · {player.level}
      </option>
    ));
  };

  return (
    <section className="upload-page">
      <div className="upload-hero">
        <div>
          <span>Fuera de Pista</span>
          <h1>Subir resultado</h1>
          <p>
            Registra el marcador del partido y actualiza automáticamente el
            ranking individual de los cuatro jugadores.
          </p>
        </div>

        <div className="upload-hero-card">
          <strong>+3</strong>
          <span>puntos por victoria</span>
        </div>
      </div>

      <div className="upload-layout">
        <aside className="upload-info">
          <h2>Antes de subir el resultado</h2>

          <div className="upload-info-list">
            <div>
              <strong>1. Selecciona el nivel</strong>
              <span>
                Al elegir nivel, se mostrarán jugadores de esa categoría.
              </span>
            </div>

            <div>
              <strong>2. Elige los cuatro jugadores</strong>
              <span>
                No puedes repetir el mismo jugador dentro del partido.
              </span>
            </div>

            <div>
              <strong>3. Indica ganador y marcador</strong>
              <span>
                El sistema suma puntos automáticamente al guardar el resultado.
              </span>
            </div>
          </div>

          <div className="upload-points-box">
            <div>
              <strong>+3</strong>
              <span>Victoria</span>
            </div>

            <div>
              <strong>+1</strong>
              <span>Derrota</span>
            </div>
          </div>
        </aside>

        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="upload-form-header">
            <h2>Datos del partido</h2>
            <p>Completa todos los campos para guardar el resultado.</p>
          </div>

          {loadingPlayers && <div className="info-message">Cargando jugadores...</div>}
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <div className="upload-section">
            <h3>Información general</h3>

            <div className="upload-form-grid">
              <div className="form-group">
                <label>Nivel del partido</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona nivel</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Fecha del partido</label>
                <input
                  type="date"
                  name="played_at"
                  value={formData.played_at}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Club</label>
                <input
                  type="text"
                  name="club"
                  value={formData.club}
                  onChange={handleChange}
                  placeholder="Ej: Pádel Feans"
                />
              </div>
            </div>
          </div>

          <div className="upload-teams-grid">
            <div className="upload-team-card team-a">
              <h3>Equipo A</h3>

              <div className="form-group">
                <label>Jugador 1</label>
                <select
                  name="team_a_player_1_id"
                  value={formData.team_a_player_1_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.level}
                >
                  <option value="">
                    {formData.level ? "Selecciona jugador" : "Primero elige nivel"}
                  </option>
                  {renderPlayerOptions(formData.team_a_player_1_id)}
                </select>
              </div>

              <div className="form-group">
                <label>Jugador 2</label>
                <select
                  name="team_a_player_2_id"
                  value={formData.team_a_player_2_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.level}
                >
                  <option value="">
                    {formData.level ? "Selecciona jugador" : "Primero elige nivel"}
                  </option>
                  {renderPlayerOptions(formData.team_a_player_2_id)}
                </select>
              </div>
            </div>

            <div className="upload-team-card team-b">
              <h3>Equipo B</h3>

              <div className="form-group">
                <label>Jugador 1</label>
                <select
                  name="team_b_player_1_id"
                  value={formData.team_b_player_1_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.level}
                >
                  <option value="">
                    {formData.level ? "Selecciona jugador" : "Primero elige nivel"}
                  </option>
                  {renderPlayerOptions(formData.team_b_player_1_id)}
                </select>
              </div>

              <div className="form-group">
                <label>Jugador 2</label>
                <select
                  name="team_b_player_2_id"
                  value={formData.team_b_player_2_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.level}
                >
                  <option value="">
                    {formData.level ? "Selecciona jugador" : "Primero elige nivel"}
                  </option>
                  {renderPlayerOptions(formData.team_b_player_2_id)}
                </select>
              </div>
            </div>
          </div>

          <div className="upload-section">
            <h3>Resultado</h3>

            <div className="upload-form-grid">
              <div className="form-group">
                <label>Marcador</label>
                <input
                  type="text"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  placeholder="Ej: 6-4 / 6-3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ganador</label>
                <select
                  name="winner_team"
                  value={formData.winner_team}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona ganador</option>
                  <option value="A">Equipo A</option>
                  <option value="B">Equipo B</option>
                </select>
              </div>
            </div>
          </div>

          <button className="upload-submit" disabled={loading || loadingPlayers}>
            {loading ? "Subiendo..." : "Subir resultado"}
          </button>
        </form>
      </div>
    </section>
  );
};