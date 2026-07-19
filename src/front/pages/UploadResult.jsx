import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { getMatchTimeRange } from "../utils/time";
import { translations } from "../i18n/translations";

export const UploadResult = () => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL &&
    import.meta.env.VITE_BACKEND_URL !== "undefined"
      ? import.meta.env.VITE_BACKEND_URL
      : window.location.origin;

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const openMatchId = searchParams.get("open_match_id");

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language];

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

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

  const levels = [
    { value: "Iniciación", label: t.levelBeginner },
    { value: "Bronce", label: t.levelBronze },
    { value: "Plata", label: t.levelSilver },
    { value: "Oro", label: t.levelGold },
    { value: "Diamante", label: t.levelDiamond },
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
      setError(error.message || t.playersLoadError);
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
        setError(t.openMatchNotFound);
        return;
      }

      if (selectedOpenMatch.status !== "closed") {
        setError(t.openMatchNotClosed);
        return;
      }

      const teamA = selectedOpenMatch.team_a || [];
      const teamB = selectedOpenMatch.team_b || [];

      const hasTeams = teamA[0] && teamA[1] && teamB[0] && teamB[1];

      if (!hasTeams) {
        setError(t.openMatchTeamsMissing);
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
      setError(error.message || t.openMatchLoadError);
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
      return t.selectFourPlayers;
    }

    const uniquePlayers = new Set(selectedPlayers);

    if (uniquePlayers.size !== 4) {
      return t.duplicatePlayersError;
    }

    if (!formData.score.trim()) {
      return t.scoreRequired;
    }

    if (!formData.level) {
      return t.levelRequired;
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
      setMessage(t.resultSentSuccess);

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
      setError(error.message || t.uploadResultError);
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

    if (!player) return t.playerFallback;

    return (
      player.nickname ||
      `${player.name || ""} ${player.last_name || ""}`.trim() ||
      t.playerFallback
    );
  };

  const getWinnerLabel = () => {
    if (formData.winner_team === "A") return t.teamA;
    if (formData.winner_team === "B") return t.teamB;

    return t.winningTeamFallback;
  };

  const isLoading = loadingPlayers || loadingOpenMatch;

  return (
    <section className="upload-result-page">
      <div className="upload-result-hero">
        <div>
          <span>{t.uploadResultKicker}</span>
          <h1>{t.uploadResultTitle}</h1>

          <p className="desktop-text">{t.uploadResultHeroText}</p>
          <p className="mobile-text">{t.uploadResultHeroTextMobile}</p>
        </div>

        <div className="upload-result-hero-card">
          <strong>2v2</strong>
          <span>{t.resultLabel}</span>
        </div>
      </div>

      {isAutoFilled && openMatch && (
        <div className="success-message">
          {t.autoLoadedMatch}: {openMatch.level} · {openMatch.club} ·{" "}
          {openMatch.match_date} · {getMatchTimeRange(openMatch.match_time)}
        </div>
      )}

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="upload-result-state">
          <p>{t.loadingData}</p>
        </div>
      ) : (
        <form className="upload-result-form-card" onSubmit={openConfirmModal}>
          {isAutoFilled && openMatch && (
            <div className="upload-result-match-summary">
              <span>{t.selectedMatch}</span>

              <h2>
                {openMatch.level} · {openMatch.club}
              </h2>

              <p>
                {openMatch.match_date} · {getMatchTimeRange(openMatch.match_time)}
              </p>
            </div>
          )}

          <div className="upload-teams-preview">
            <div className="upload-team-preview-card">
              <span>{t.teamA}</span>

              <strong>{getPlayerName(formData.team_a_player_1_id)}</strong>
              <strong>{getPlayerName(formData.team_a_player_2_id)}</strong>
            </div>

            <div className="upload-vs-badge">VS</div>

            <div className="upload-team-preview-card">
              <span>{t.teamB}</span>

              <strong>{getPlayerName(formData.team_b_player_1_id)}</strong>
              <strong>{getPlayerName(formData.team_b_player_2_id)}</strong>
            </div>
          </div>

          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>{t.teamA}</span>
              <h2>{t.teamAPlayers}</h2>
            </div>

            {isAutoFilled ? (
              <div className="upload-form-grid">
                <div className="form-group">
                  <label>{t.playerOne}</label>
                  <input
                    type="text"
                    value={getPlayerName(formData.team_a_player_1_id)}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>{t.playerTwo}</label>
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
                  <label>{t.playerOne}</label>
                  <select
                    name="team_a_player_1_id"
                    value={formData.team_a_player_1_id}
                    onChange={handleChange}
                  >
                    <option value="">{t.selectPlayer}</option>
                    {renderPlayerOptions()}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.playerTwo}</label>
                  <select
                    name="team_a_player_2_id"
                    value={formData.team_a_player_2_id}
                    onChange={handleChange}
                  >
                    <option value="">{t.selectPlayer}</option>
                    {renderPlayerOptions()}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>{t.teamB}</span>
              <h2>{t.teamBPlayers}</h2>
            </div>

            {isAutoFilled ? (
              <div className="upload-form-grid">
                <div className="form-group">
                  <label>{t.playerOne}</label>
                  <input
                    type="text"
                    value={getPlayerName(formData.team_b_player_1_id)}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>{t.playerTwo}</label>
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
                  <label>{t.playerOne}</label>
                  <select
                    name="team_b_player_1_id"
                    value={formData.team_b_player_1_id}
                    onChange={handleChange}
                  >
                    <option value="">{t.selectPlayer}</option>
                    {renderPlayerOptions()}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.playerTwo}</label>
                  <select
                    name="team_b_player_2_id"
                    value={formData.team_b_player_2_id}
                    onChange={handleChange}
                  >
                    <option value="">{t.selectPlayer}</option>
                    {renderPlayerOptions()}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>{t.resultLabel}</span>
              <h2>{t.matchData}</h2>
            </div>

            <div className="upload-form-grid">
              <div className="form-group">
                <label>{t.winnerTeam}</label>
                <select
                  name="winner_team"
                  value={formData.winner_team}
                  onChange={handleChange}
                >
                  <option value="A">{t.teamA}</option>
                  <option value="B">{t.teamB}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t.resultLabel}</label>
                <input
                  type="text"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  placeholder={t.scorePlaceholder}
                />
                <small>{t.scoreHelp}</small>
              </div>

              <div className="form-group">
                <label>{t.levelLabel}</label>
                {isAutoFilled ? (
                  <input type="text" value={formData.level} disabled />
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
                <label>{t.clubLabel}</label>
                <input
                  type="text"
                  name="club"
                  value={formData.club}
                  onChange={handleChange}
                  placeholder={t.clubPlaceholder}
                  disabled={isAutoFilled}
                />
              </div>

              <div className="form-group">
                <label>{t.matchDate}</label>
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
            {sending ? t.preparingResult : t.reviewAndSendResult}
          </button>
        </form>
      )}

      {showConfirmModal && (
        <div className="result-modal-overlay">
          <div className="result-modal-card">
            <div className="result-modal-icon">🏆</div>

            <span>{t.confirmResult}</span>

            <h2>{t.confirmResultQuestion}</h2>

            <div className="result-modal-teams">
              <div className="result-modal-team-card">
                <span>{t.teamA}</span>
                <strong>{getPlayerName(formData.team_a_player_1_id)}</strong>
                <strong>{getPlayerName(formData.team_a_player_2_id)}</strong>
              </div>

              <div className="result-modal-vs">VS</div>

              <div className="result-modal-team-card">
                <span>{t.teamB}</span>
                <strong>{getPlayerName(formData.team_b_player_1_id)}</strong>
                <strong>{getPlayerName(formData.team_b_player_2_id)}</strong>
              </div>
            </div>

            <div className="result-modal-summary">
              <div>
                <strong>{t.winner}</strong>
                <span>{getWinnerLabel()}</span>
              </div>

              <div>
                <strong>{t.resultLabel}</strong>
                <span>{formData.score}</span>
              </div>

              <div>
                <strong>{t.levelLabel}</strong>
                <span>{formData.level}</span>
              </div>

              <div>
                <strong>{t.clubLabel}</strong>
                <span>{formData.club || t.clubNotProvidedResult}</span>
              </div>
            </div>

            <p>{t.confirmResultText}</p>

            <div className="result-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowConfirmModal(false)}
                disabled={sending}
              >
                {t.cancel}
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={submitResult}
                disabled={sending}
              >
                {sending ? t.sending : t.yesSendResult}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};