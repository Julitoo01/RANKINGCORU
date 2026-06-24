import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

export const UploadResult = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [searchParams] = useSearchParams();

  const openMatchId = searchParams.get("open_match_id");

  const [players, setPlayers] = useState([]);
  const [openMatch, setOpenMatch] = useState(null);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

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
  const [loadingOpenMatch, setLoadingOpenMatch] = useState(false);
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

  const loadOpenMatch = async () => {
    if (!openMatchId) return;

    try {
      setLoadingOpenMatch(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/open-matches`);

      if (!data) return;

      const selectedOpenMatch = data.find(
        (match) => String(match.id) === String(openMatchId)
      );

      if (!selectedOpenMatch) {
        setError("No se encontró el partido abierto.");
        return;
      }

      if (selectedOpenMatch.status !== "closed") {
        setError("Este partido todavía no está cerrado.");
        return;
      }

      const teamA = selectedOpenMatch.team_a || [];
      const teamB = selectedOpenMatch.team_b || [];

      const hasTeams = teamA[0] && teamA[1] && teamB[0] && teamB[1];

      if (!hasTeams) {
        setError("Este partido no tiene las parejas creadas todavía.");
        return;
      }

      setOpenMatch(selectedOpenMatch);
      setIsAutoFilled(true);

      setFormData((previousFormData) => ({
        ...previousFormData,
        team_a_player_1_id: String(teamA[0].id),
        team_a_player_2_id: String(teamA[1].id),
        team_b_player_1_id: String(teamB[0].id),
        team_b_player_2_id: String(teamB[1].id),
        level: selectedOpenMatch.level || "Bronce",
        club: selectedOpenMatch.club || "",
        played_at: selectedOpenMatch.match_date || "",
      }));
    } catch (error) {
      console.error(error);
      setError(error.message || "Error al cargar el partido abierto");
    } finally {
      setLoadingOpenMatch(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    loadOpenMatch();
  }, [openMatchId]);

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
  open_match_id: openMatchId ? Number(openMatchId) : null,
};

      const data = await authFetch(`${backendUrl}/api/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!data) return;

      setMessage(
        "Resultado enviado correctamente. Está pendiente de validación por la pareja rival."
      );

      if (!isAutoFilled) {
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
      } else {
        setFormData({
          ...formData,
          winner_team: "A",
          score: "",
        });
      }
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

  const getPlayerName = (playerId) => {
    const player = players.find((item) => String(item.id) === String(playerId));

    if (!player) return "Jugador";

    return player.nickname || `${player.name || ""} ${player.last_name || ""}`.trim();
  };

  const isLoading = loadingPlayers || loadingOpenMatch;

  return (
    <section className="upload-result-page">
      <div className="upload-result-hero">
        <div>
          <span>Fuera de Pista</span>
          <h1>Subir resultado</h1>
          <p>
            Registra un partido 2 vs 2. El resultado quedará pendiente de
            validación por la pareja rival antes de actualizar el ranking.
          </p>
        </div>

        <div className="upload-result-hero-card">
          <strong>2v2</strong>
          <span>Resultado</span>
        </div>
      </div>

      {isAutoFilled && openMatch && (
        <div className="success-message">
          Partido cargado automáticamente: {openMatch.level} · {openMatch.club} ·{" "}
          {openMatch.match_date} · {openMatch.match_time}
        </div>
      )}

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="upload-result-state">
          <p>Cargando datos...</p>
        </div>
      ) : (
        <form className="upload-result-form-card" onSubmit={handleSubmit}>
          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>Equipo A</span>
              <h2>Jugadores del equipo A</h2>
            </div>

            {isAutoFilled ? (
              <div className="upload-form-grid">
                <div className="form-group">
                  <label>Jugador 1</label>
                  <input
                    type="text"
                    value={getPlayerName(formData.team_a_player_1_id)}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Jugador 2</label>
                  <input
                    type="text"
                    value={getPlayerName(formData.team_a_player_2_id)}
                    disabled
                  />
                </div>
              </div>
            ) : (
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
            )}
          </div>

          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>Equipo B</span>
              <h2>Jugadores del equipo B</h2>
            </div>

            {isAutoFilled ? (
              <div className="upload-form-grid">
                <div className="form-group">
                  <label>Jugador 1</label>
                  <input
                    type="text"
                    value={getPlayerName(formData.team_b_player_1_id)}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Jugador 2</label>
                  <input
                    type="text"
                    value={getPlayerName(formData.team_b_player_2_id)}
                    disabled
                  />
                </div>
              </div>
            ) : (
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
            )}
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
                {isAutoFilled ? (
                  <input type="text" value={formData.level} disabled />
                ) : (
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
                )}
              </div>

              <div className="form-group">
                <label>Club</label>
                <input
                  type="text"
                  name="club"
                  value={formData.club}
                  onChange={handleChange}
                  placeholder="Ej: Coruña Sport Centre"
                  disabled={isAutoFilled}
                />
              </div>

              <div className="form-group">
                <label>Fecha del partido</label>
                <input
                  type="date"
                  name="played_at"
                  value={formData.played_at}
                  onChange={handleChange}
                  disabled={isAutoFilled}
                />
              </div>
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