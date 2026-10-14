import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { getMatchTimeRange } from "../utils/time";
import { translations } from "../i18n/translations";

export const UploadResult = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const openMatchId = searchParams.get("open_match_id");

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

  const [players, setPlayers] = useState([]);
  const [openMatch, setOpenMatch] = useState(null);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const levels = [
    {
      value: "Iniciación",
      label: t.uploadResult.levelInitiation,
    },
    {
      value: "Bronce",
      label: t.uploadResult.levelBronze,
    },
    {
      value: "Plata",
      label: t.uploadResult.levelSilver,
    },
    {
      value: "Oro",
      label: t.uploadResult.levelGold,
    },
    {
      value: "Diamante",
      label: t.uploadResult.levelDiamond,
    },
  ];

  const loadPlayers = async () => {
    try {
      setLoadingPlayers(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/ranking`);

      if (!data) return;

      setPlayers(data);
    } catch (error) {
      console.error(error);
      setError(error.message || t.uploadResult.loadingPlayersError);
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
        setError(t.uploadResult.openMatchNotFound);
        return;
      }

      if (selectedOpenMatch.status !== "closed") {
        setError(t.uploadResult.openMatchNotClosed);
        return;
      }

      const teamA = selectedOpenMatch.team_a || [];
      const teamB = selectedOpenMatch.team_b || [];

      const hasTeams = teamA[0] && teamA[1] && teamB[0] && teamB[1];

      if (!hasTeams) {
        setError(t.uploadResult.teamsNotReady);
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
      setError(error.message || t.uploadResult.openMatchLoadError);
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

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
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
      return t.uploadResult.validationPlayers;
    }

    const uniquePlayers = new Set(selectedPlayers);

    if (uniquePlayers.size !== 4) {
      return t.uploadResult.validationUniquePlayers;
    }

    if (!formData.score.trim()) {
      return t.uploadResult.validationScore;
    }

    if (!formData.level) {
      return t.uploadResult.validationLevel;
    }

    return "";
  };

  const openConfirmModal = (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setShowConfirmModal(true);
  };

  const submitResult = async () => {
    try {
      setSending(true);
      setMessage("");
      setError("");

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

      setShowConfirmModal(false);

      setMessage(t.uploadResult.success);

      window.dispatchEvent(new Event("notificationsUpdated"));

      setTimeout(() => {
        navigate("/matches");
      }, 1200);

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
      setError(error.message || t.uploadResult.submitError);
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

    if (!player) return t.uploadResult.player;

    return (
      player.nickname || `${player.name || ""} ${player.last_name || ""}`.trim()
    );
  };

  const getWinnerLabel = () => {
    if (formData.winner_team === "A") return t.uploadResult.teamA;
    if (formData.winner_team === "B") return t.uploadResult.teamB;

    return t.uploadResult.winningTeam;
  };

  const getLevelLabel = (levelValue) => {
    const foundLevel = levels.find((item) => item.value === levelValue);

    return foundLevel?.label || levelValue;
  };

  const isLoading = loadingPlayers || loadingOpenMatch;

  return (
    <section className="upload-result-page">
      <div className="upload-result-hero">
        <div>
          <span>{t.uploadResult.kicker}</span>
          <h1>{t.uploadResult.title}</h1>
          <p>{t.uploadResult.description}</p>
        </div>

        <div className="upload-result-hero-card">
          <strong>{t.uploadResult.heroCardTitle}</strong>
          <span>{t.uploadResult.heroCardText}</span>
        </div>
      </div>

      {isAutoFilled && openMatch && (
        <div className="success-message">
          {t.uploadResult.autoLoaded}: {getLevelLabel(openMatch.level)} ·{" "}
          {openMatch.club} · {openMatch.match_date} ·{" "}
          {getMatchTimeRange(openMatch.match_time)}
        </div>
      )}

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="upload-result-state">
          <p>{t.uploadResult.loadingData}</p>
        </div>
      ) : (
        <form className="upload-result-form-card" onSubmit={openConfirmModal}>
          {isAutoFilled && openMatch && (
            <div className="upload-result-match-summary">
              <span>{t.uploadResult.selectedMatch}</span>

              <h2>
                {getLevelLabel(openMatch.level)} · {openMatch.club}
              </h2>

              <p>
                {openMatch.match_date} ·{" "}
                {getMatchTimeRange(openMatch.match_time)}
              </p>
            </div>
          )}

          <div className="upload-teams-preview">
            <div className="upload-team-preview-card">
              <span>{t.uploadResult.teamA}</span>

              <strong>{getPlayerName(formData.team_a_player_1_id)}</strong>
              <strong>{getPlayerName(formData.team_a_player_2_id)}</strong>
            </div>

            <div className="upload-vs-badge">{t.uploadResult.vs}</div>

            <div className="upload-team-preview-card">
              <span>{t.uploadResult.teamB}</span>

              <strong>{getPlayerName(formData.team_b_player_1_id)}</strong>
              <strong>{getPlayerName(formData.team_b_player_2_id)}</strong>
            </div>
          </div>

          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>{t.uploadResult.teamA}</span>
              <h2>{t.uploadResult.teamAPlayers}</h2>
            </div>

            {isAutoFilled ? (
              <div className="upload-form-grid">
                <div className="form-group">
                  <label>{t.uploadResult.player1}</label>
                  <input
                    type="text"
                    value={getPlayerName(formData.team_a_player_1_id)}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>{t.uploadResult.player2}</label>
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
                  <label>{t.uploadResult.player1}</label>
                  <select
                    name="team_a_player_1_id"
                    value={formData.team_a_player_1_id}
                    onChange={handleChange}
                  >
                    <option value="">{t.uploadResult.selectPlayer}</option>
                    {renderPlayerOptions()}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.uploadResult.player2}</label>
                  <select
                    name="team_a_player_2_id"
                    value={formData.team_a_player_2_id}
                    onChange={handleChange}
                  >
                    <option value="">{t.uploadResult.selectPlayer}</option>
                    {renderPlayerOptions()}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>{t.uploadResult.teamB}</span>
              <h2>{t.uploadResult.teamBPlayers}</h2>
            </div>

            {isAutoFilled ? (
              <div className="upload-form-grid">
                <div className="form-group">
                  <label>{t.uploadResult.player1}</label>
                  <input
                    type="text"
                    value={getPlayerName(formData.team_b_player_1_id)}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>{t.uploadResult.player2}</label>
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
                  <label>{t.uploadResult.player1}</label>
                  <select
                    name="team_b_player_1_id"
                    value={formData.team_b_player_1_id}
                    onChange={handleChange}
                  >
                    <option value="">{t.uploadResult.selectPlayer}</option>
                    {renderPlayerOptions()}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.uploadResult.player2}</label>
                  <select
                    name="team_b_player_2_id"
                    value={formData.team_b_player_2_id}
                    onChange={handleChange}
                  >
                    <option value="">{t.uploadResult.selectPlayer}</option>
                    {renderPlayerOptions()}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>{t.uploadResult.result}</span>
              <h2>{t.uploadResult.matchData}</h2>
            </div>

            <div className="upload-form-grid">
              <div className="form-group">
                <label>{t.uploadResult.winnerTeam}</label>
                <select
                  name="winner_team"
                  value={formData.winner_team}
                  onChange={handleChange}
                >
                  <option value="A">{t.uploadResult.teamA}</option>
                  <option value="B">{t.uploadResult.teamB}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t.uploadResult.result}</label>
                <input
                  type="text"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  placeholder={t.uploadResult.scorePlaceholder}
                />
                <small>{t.uploadResult.scoreHelp}</small>
              </div>

              <div className="form-group">
                <label>{t.uploadResult.level}</label>
                {isAutoFilled ? (
                  <input
                    type="text"
                    value={getLevelLabel(formData.level)}
                    disabled
                  />
                ) : (
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                  >
                    {levels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>{t.uploadResult.club}</label>
                <input
                  type="text"
                  name="club"
                  value={formData.club}
                  onChange={handleChange}
                  placeholder={t.uploadResult.clubPlaceholder}
                  disabled={isAutoFilled}
                />
              </div>

              <div className="form-group">
                <label>{t.uploadResult.matchDate}</label>
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
            {sending ? t.uploadResult.preparing : t.uploadResult.reviewSubmit}
          </button>
        </form>
      )}

      {showConfirmModal && (
        <div className="result-modal-overlay">
          <div className="result-modal-card">
            <div className="result-modal-icon">🏆</div>

            <span>{t.uploadResult.confirmKicker}</span>

            <h2>{t.uploadResult.confirmTitle}</h2>

            <div className="result-modal-teams">
              <div className="result-modal-team-card">
                <span>{t.uploadResult.teamA}</span>
                <strong>{getPlayerName(formData.team_a_player_1_id)}</strong>
                <strong>{getPlayerName(formData.team_a_player_2_id)}</strong>
              </div>

              <div className="result-modal-vs">{t.uploadResult.vs}</div>

              <div className="result-modal-team-card">
                <span>{t.uploadResult.teamB}</span>
                <strong>{getPlayerName(formData.team_b_player_1_id)}</strong>
                <strong>{getPlayerName(formData.team_b_player_2_id)}</strong>
              </div>
            </div>

            <div className="result-modal-summary">
              <div>
                <strong>{t.uploadResult.winner}</strong>
                <span>{getWinnerLabel()}</span>
              </div>

              <div>
                <strong>{t.uploadResult.result}</strong>
                <span>{formData.score}</span>
              </div>

              <div>
                <strong>{t.uploadResult.level}</strong>
                <span>{getLevelLabel(formData.level)}</span>
              </div>

              <div>
                <strong>{t.uploadResult.club}</strong>
                <span>{formData.club || t.uploadResult.noClub}</span>
              </div>
            </div>

            <p>{t.uploadResult.confirmText}</p>

            <div className="result-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowConfirmModal(false)}
                disabled={sending}
              >
                {t.uploadResult.cancel}
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={submitResult}
                disabled={sending}
              >
                {sending
                  ? t.uploadResult.sending
                  : t.uploadResult.confirmSubmit}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};