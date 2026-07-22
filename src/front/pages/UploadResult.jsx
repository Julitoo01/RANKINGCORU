import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

  const [openMatch, setOpenMatch] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formData, setFormData] = useState({
    winner_team: "A",
    score: "",
  });

  const [loadingOpenMatch, setLoadingOpenMatch] = useState(Boolean(openMatchId));
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadOpenMatch = async () => {
    if (!openMatchId) {
      setLoadingOpenMatch(false);
      return;
    }

    try {
      setLoadingOpenMatch(true);
      setError("");

      const data = await authFetch(`${backendUrl}/api/open-matches`);

      if (!data) return;

      const selectedOpenMatch = data.find(
        (match) => String(match.id) === String(openMatchId)
      );

      if (!selectedOpenMatch) {
        setError(
          t.openMatchNotFound ||
            "No se ha encontrado este partido. Puede que ya tenga resultado registrado."
        );
        return;
      }

      if (selectedOpenMatch.status !== "closed") {
        setError(t.openMatchNotClosed || "Este partido todavía no está cerrado.");
        return;
      }

      if (selectedOpenMatch.has_result || selectedOpenMatch.result_match_id) {
        setError(t.resultRegistered || "Este partido ya tiene resultado registrado.");
        return;
      }

      const teamA = selectedOpenMatch.team_a || [];
      const teamB = selectedOpenMatch.team_b || [];

      const hasTeams = teamA[0] && teamA[1] && teamB[0] && teamB[1];

      if (!hasTeams) {
        setError(
          t.openMatchTeamsMissing ||
            "Este partido todavía no tiene las parejas creadas."
        );
        return;
      }

      setOpenMatch(selectedOpenMatch);
    } catch (error) {
      console.error(error);
      setError(error.message || t.openMatchLoadError);
    } finally {
      setLoadingOpenMatch(false);
    }
  };

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

  const getTeamPlayerName = (player) => {
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

  const formatDate = (date) => {
    if (!date) return "-";

    const dateObject = new Date(`${date}T00:00:00`);

    if (Number.isNaN(dateObject.getTime())) {
      return date;
    }

    return dateObject.toLocaleDateString(language === "es" ? "es-ES" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const validateForm = () => {
    if (!openMatch) {
      return (
        t.openMatchNotFound ||
        "Selecciona un partido desde la sección Jugar para subir el resultado."
      );
    }

    if (!formData.score.trim()) {
      return t.scoreRequired || "Introduce el resultado del partido.";
    }

    if (!["A", "B"].includes(formData.winner_team)) {
      return t.winnerCouldNotBeCalculated || "Selecciona el equipo ganador.";
    }

    const teamA = openMatch.team_a || [];
    const teamB = openMatch.team_b || [];

    if (!teamA[0]?.id || !teamA[1]?.id || !teamB[0]?.id || !teamB[1]?.id) {
      return (
        t.openMatchTeamsMissing ||
        "Este partido no tiene las parejas correctamente creadas."
      );
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
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setShowConfirmModal(false);
      return;
    }

    try {
      setSending(true);
      setMessage("");
      setError("");

      const teamA = openMatch.team_a || [];
      const teamB = openMatch.team_b || [];

      const payload = {
        team_a_player_1_id: Number(teamA[0].id),
        team_a_player_2_id: Number(teamA[1].id),
        team_b_player_1_id: Number(teamB[0].id),
        team_b_player_2_id: Number(teamB[1].id),
        winner_team: formData.winner_team,
        score: formData.score.trim(),
        level: openMatch.level,
        club: openMatch.club || "",
        played_at: openMatch.match_date || null,
        open_match_id: Number(openMatch.id),
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
      window.dispatchEvent(new Event("profileUpdated"));

      setTimeout(() => {
        navigate("/matches");
      }, 1000);
    } catch (error) {
      console.error(error);
      setError(error.message || t.uploadResultError);
    } finally {
      setSending(false);
    }
  };

  const isLoading = loadingOpenMatch;

  if (!openMatchId) {
    return (
      <section className="upload-result-page">
        <div className="upload-result-hero">
          <div>
            <span>{t.uploadResultKicker}</span>
            <h1>{t.uploadResultTitle}</h1>

            <p>
              Selecciona un partido desde la sección Jugar para subir el
              resultado.
            </p>
          </div>

          <div className="upload-result-hero-card">
            <strong>2v2</strong>
            <span>{t.resultLabel}</span>
          </div>
        </div>

        <div className="upload-result-state">
          <p>
            Para evitar errores, los resultados solo se pueden subir desde un
            partido cerrado.
          </p>

          <Link to="/open-matches" className="primary-button">
            Ir a Jugar
          </Link>
        </div>
      </section>
    );
  }

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

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="upload-result-state">
          <p>{t.loadingData}</p>
        </div>
      ) : !openMatch ? (
        <div className="upload-result-state">
          <p>
            {error ||
              "No se ha podido cargar este partido. Puede que ya tenga resultado registrado."}
          </p>

          <Link to="/open-matches" className="primary-button">
            Volver a Jugar
          </Link>
        </div>
      ) : (
        <form className="upload-result-form-card" onSubmit={openConfirmModal}>
          <div className="upload-result-match-summary">
            <span>{t.selectedMatch}</span>

            <h2>
              {openMatch.level} · {openMatch.club}
            </h2>

            <p>
              {formatDate(openMatch.match_date)} ·{" "}
              {getMatchTimeRange(openMatch.match_time)}
            </p>
          </div>

          <div className="upload-teams-preview">
            <div className="upload-team-preview-card">
              <span>{t.teamA}</span>

              <strong>{getTeamPlayerName(openMatch.team_a?.[0])}</strong>
              <strong>{getTeamPlayerName(openMatch.team_a?.[1])}</strong>
            </div>

            <div className="upload-vs-badge">VS</div>

            <div className="upload-team-preview-card">
              <span>{t.teamB}</span>

              <strong>{getTeamPlayerName(openMatch.team_b?.[0])}</strong>
              <strong>{getTeamPlayerName(openMatch.team_b?.[1])}</strong>
            </div>
          </div>

          <div className="upload-form-section">
            <div className="upload-form-section-title">
              <span>{t.resultLabel}</span>
              <h2>{t.matchData}</h2>
            </div>

            <div className="upload-form-grid">
              <div className="form-group">
                <label>{t.resultLabel}</label>
                <input
                  type="text"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  placeholder={t.scorePlaceholder || "Ej: 6-4 6-3"}
                  required
                />
                <small>{t.scoreHelp || "Ejemplo: 6-4 6-3"}</small>
              </div>

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
            </div>
          </div>

          <div className="upload-result-locked-info">
            <div>
              <span>{t.levelLabel}</span>
              <strong>{openMatch.level}</strong>
            </div>

            <div>
              <span>{t.clubLabel}</span>
              <strong>{openMatch.club || "-"}</strong>
            </div>

            <div>
              <span>{t.dateLabel}</span>
              <strong>{formatDate(openMatch.match_date)}</strong>
            </div>

            <div>
              <span>{t.timeLabel}</span>
              <strong>{getMatchTimeRange(openMatch.match_time)}</strong>
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
                <strong>{getTeamPlayerName(openMatch.team_a?.[0])}</strong>
                <strong>{getTeamPlayerName(openMatch.team_a?.[1])}</strong>
              </div>

              <div className="result-modal-vs">VS</div>

              <div className="result-modal-team-card">
                <span>{t.teamB}</span>
                <strong>{getTeamPlayerName(openMatch.team_b?.[0])}</strong>
                <strong>{getTeamPlayerName(openMatch.team_b?.[1])}</strong>
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
                <span>{openMatch.level}</span>
              </div>

              <div>
                <strong>{t.clubLabel}</strong>
                <span>{openMatch.club || t.clubNotProvidedResult}</span>
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