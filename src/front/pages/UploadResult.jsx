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
    const playerFromRanking = players.find(
      (item) => String(item.id) === String(playerId)
    );
    const teamPlayers = [...(openMatch?.team_a || []), ...(openMatch?.team_b || [])];
    const player =
      playerFromRanking ||
      teamPlayers.find((item) => String(item.id) === String(playerId));

    if (!player) return t.uploadResult.player;
    return (
      player.nickname ||
      `${player.name || ""} ${player.last_name || ""}`.trim() ||
      t.uploadResult.player
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

  const teamFields = {
    A: ["team_a_player_1_id", "team_a_player_2_id"],
    B: ["team_b_player_1_id", "team_b_player_2_id"],
  };

  const renderTeam = (teamKey) => (
    <div className={`result-simple-team ${formData.winner_team === teamKey ? "is-winner" : ""}`}>
      <div className="result-simple-team-heading">
        <strong>{teamKey === "A" ? t.uploadResult.teamA : t.uploadResult.teamB}</strong>
        {formData.winner_team === teamKey && (
          <span className="result-simple-selected" aria-hidden="true">✓</span>
        )}
      </div>
      {teamFields[teamKey].map((fieldName) => (
        <div className="result-simple-player" key={fieldName}>
          {isAutoFilled ? (
            <span>{getPlayerName(formData[fieldName])}</span>
          ) : (
            <select
              aria-label={`${teamKey === "A" ? t.uploadResult.teamA : t.uploadResult.teamB} ${fieldName.endsWith("1_id") ? t.uploadResult.player1 : t.uploadResult.player2}`}
              name={fieldName}
              value={formData[fieldName]}
              onChange={handleChange}
              required
            >
              <option value="">{t.uploadResult.selectPlayer}</option>
              {renderPlayerOptions()}
            </select>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <section className="upload-result-page result-simple-page">
      <div className="result-simple-container">
        <div className="result-simple-header">
          <span className="section-kicker">{t.uploadResult.kicker}</span>
          <h1>{t.uploadResult.title}</h1>
          {isAutoFilled && openMatch && (
            <p>
              {getLevelLabel(openMatch.level)} · {openMatch.club} ·{" "}
              {openMatch.match_date} · {getMatchTimeRange(openMatch.match_time)}
            </p>
          )}
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div className="result-simple-loading">{t.uploadResult.loadingData}</div>
        ) : openMatchId && !isAutoFilled ? (
          <div className="result-simple-loading">{t.uploadResult.openMatchLoadError}</div>
        ) : (
          <form className="result-simple-card" onSubmit={openConfirmModal}>
            <div className="result-simple-teams">
              {renderTeam("A")}
              {renderTeam("B")}
            </div>

            <div className="result-simple-fields">
              <div className="result-simple-field">
                <label htmlFor="winning-team">{t.uploadResult.winnerTeam}</label>
                <select
                  id="winning-team"
                  name="winner_team"
                  value={formData.winner_team}
                  onChange={handleChange}
                >
                  <option value="A">{t.uploadResult.teamA}</option>
                  <option value="B">{t.uploadResult.teamB}</option>
                </select>
              </div>
              <div className="result-simple-field">
                <label htmlFor="match-score">{t.uploadResult.result}</label>
                <input
                  id="match-score"
                  name="score"
                  type="text"
                  value={formData.score}
                  onChange={handleChange}
                  placeholder={t.uploadResult.scorePlaceholder}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {!isAutoFilled && (
              <div className="result-simple-manual-details">
                <div className="result-simple-field">
                  <label htmlFor="match-level">{t.uploadResult.level}</label>
                  <select id="match-level" name="level" value={formData.level} onChange={handleChange}>
                    {levels.map((level) => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div className="result-simple-field">
                  <label htmlFor="match-club">{t.uploadResult.club}</label>
                  <input id="match-club" name="club" value={formData.club} onChange={handleChange} placeholder={t.uploadResult.clubPlaceholder} />
                </div>
                <div className="result-simple-field">
                  <label htmlFor="match-date">{t.uploadResult.matchDate}</label>
                  <input id="match-date" type="date" name="played_at" value={formData.played_at} onChange={handleChange} />
                </div>
              </div>
            )}

            <button type="submit" className="result-simple-submit" disabled={sending}>
              {sending ? t.uploadResult.preparing : t.uploadResult.reviewSubmit}
            </button>
          </form>
        )}
      </div>

      {showConfirmModal && (
        <div className="result-modal-overlay">
          <div className="result-simple-confirm" role="dialog" aria-modal="true" aria-labelledby="result-confirm-title">
            <span className="section-kicker">{t.uploadResult.confirmKicker}</span>
            <h2 id="result-confirm-title">{t.uploadResult.confirmTitle}</h2>
            <div className="result-simple-confirm-teams">
              <div>
                <strong>{t.uploadResult.teamA}</strong>
                <span>{getPlayerName(formData.team_a_player_1_id)}</span>
                <span>{getPlayerName(formData.team_a_player_2_id)}</span>
              </div>
              <div>
                <strong>{t.uploadResult.teamB}</strong>
                <span>{getPlayerName(formData.team_b_player_1_id)}</span>
                <span>{getPlayerName(formData.team_b_player_2_id)}</span>
              </div>
            </div>
            <div className="result-simple-confirm-score">
              <span>{t.uploadResult.winner}: <strong>{getWinnerLabel()}</strong></span>
              <span>{t.uploadResult.result}: <strong>{formData.score}</strong></span>
            </div>
            <div className="result-simple-confirm-actions">
              <button type="button" className="result-simple-cancel" onClick={() => setShowConfirmModal(false)} disabled={sending}>
                {t.uploadResult.cancel}
              </button>
              <button type="button" className="result-simple-submit" onClick={submitResult} disabled={sending}>
                {sending ? t.uploadResult.sending : t.uploadResult.confirmSubmit}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
