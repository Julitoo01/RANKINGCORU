import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { translations } from "../i18n/translations";

export const Profile = () => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL &&
    import.meta.env.VITE_BACKEND_URL !== "undefined"
      ? import.meta.env.VITE_BACKEND_URL
      : window.location.origin;

  const navigate = useNavigate();

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language];

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);
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

  const loadProfile = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");
      setMessage("");

      const data = await authFetch(`${backendUrl}/api/profile`);

      if (!data) {
        setProfileData(null);
        return;
      }

      const userData = data.user || data;
      const playerProfile = data.profile || data.user?.profile || null;

      setProfileData({
        user: userData,
        profile: playerProfile,
      });

      localStorage.setItem("user", JSON.stringify(userData));

      if (playerProfile) {
        localStorage.setItem("profile", JSON.stringify(playerProfile));
      }
    } catch (error) {
      console.error(error);
      setError(error.message || t.profileLoadError);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      loadProfile({ silent: true });
    };

    const handleProfileUpdated = () => {
      loadProfile({ silent: true });
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("profileUpdated", handleProfileUpdated);
    window.addEventListener("notificationsUpdated", handleProfileUpdated);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("profileUpdated", handleProfileUpdated);
      window.removeEventListener("notificationsUpdated", handleProfileUpdated);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");

    navigate("/");
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setMessage("");
    setError("");

    if (!file.type.startsWith("image/")) {
      setError(t.imageFileError);
      return;
    }

    if (file.size > 1000000) {
      setError(t.imageSizeError);
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        setPhotoLoading(true);
        setError("");
        setMessage("");

        const data = await authFetch(`${backendUrl}/api/profile/photo`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile_image: reader.result,
          }),
        });

        if (!data) return;

        const updatedUser = data.user;
        const updatedProfile = updatedUser.profile || profileData?.profile;

        setProfileData({
          user: updatedUser,
          profile: updatedProfile,
        });

        localStorage.setItem("user", JSON.stringify(updatedUser));

        if (updatedProfile) {
          localStorage.setItem("profile", JSON.stringify(updatedProfile));
        }

        setMessage(t.profilePhotoUpdated);
      } catch (error) {
        console.error(error);
        setError(error.message || t.profilePhotoUploadError);
      } finally {
        setPhotoLoading(false);
        event.target.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  const getProfileStatusText = (status) => {
    if (status === "approved") return t.profileApproved;
    if (status === "pending") return t.profilePending;
    if (status === "rejected") return t.profileRejected;

    return t.profileStatusPending;
  };

  const getProfileStatusClass = (status) => {
    if (status === "approved") return "approved";
    if (status === "rejected") return "rejected";

    return "pending";
  };

  const formatWinPercentage = (profile) => {
    if (!profile) return 0;

    if (profile.win_percentage !== undefined && profile.win_percentage !== null) {
      return profile.win_percentage;
    }

    const matchesPlayed = profile.matches_played || 0;
    const wins = profile.wins || 0;

    if (matchesPlayed === 0) return 0;

    return Math.round((wins / matchesPlayed) * 100);
  };

  if (loading) {
    return (
      <section className="profile-page">
        <div className="profile-loading-card">
          <h1>{t.profileTitle}</h1>
          <p>{t.loadingProfile}</p>
        </div>
      </section>
    );
  }

  if (error && !profileData) {
    return (
      <section className="profile-page">
        <div className="profile-error-card">
          <h1>{t.profileTitle}</h1>
          <div className="error-message">{error}</div>

          <button
            type="button"
            className="primary-button"
            onClick={loadProfile}
          >
            {t.retry}
          </button>
        </div>
      </section>
    );
  }

  if (!profileData) {
    return (
      <section className="profile-page">
        <div className="profile-error-card">
          <h1>{t.profileTitle}</h1>

          <div className="error-message">{t.profileNotFoundText}</div>

          <button
            type="button"
            className="primary-button"
            onClick={handleLogout}
          >
            {t.loginAgain}
          </button>
        </div>
      </section>
    );
  }

  const { user, profile } = profileData;
  const profileStatus = profile?.status || "pending";
  const isApproved = profileStatus === "approved";
  const winPercentage = formatWinPercentage(profile);

  return (
    <section className="profile-page">
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="profile-hero">
        <div className="profile-main-info">
          <div>
            <div className="profile-avatar-large">
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user?.nickname || t.profilePhotoAlt}
                />
              ) : (
                user?.nickname?.charAt(0)?.toUpperCase() ||
                t.playerFallback.charAt(0)
              )}
            </div>

            <label className="profile-photo-upload-btn">
              {photoLoading ? t.uploading : t.changePhoto}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                disabled={photoLoading}
              />
            </label>
          </div>

          <div>
            <span className="profile-kicker">{t.playerProfileKicker}</span>

            <h1>{user?.nickname || t.playerFallback}</h1>

            <p>
              {user?.name || "-"} {user?.last_name || ""}
            </p>

            <div
              className={`profile-status-pill ${getProfileStatusClass(
                profileStatus
              )}`}
            >
              {getProfileStatusText(profileStatus)}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-side-card">
          <h2>{t.personalData}</h2>

          <div className="profile-detail-list">
            <div>
              <span>{t.emailLabel}</span>
              <strong>{user?.email || "-"}</strong>
            </div>

            <div>
              <span>{t.phoneLabel}</span>
              <strong>{user?.phone || "-"}</strong>
            </div>

            <div>
              <span>{t.levelLabel}</span>
              <strong>{profile?.level || "-"}</strong>
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="profile-action-btn logout"
              onClick={handleLogout}
            >
              {t.logout}
            </button>
          </div>
        </aside>

        <main className="profile-main">
          <div className="profile-stats-grid">
            <div className="profile-stat-card highlight">
              <span>{t.matchesPlayed}</span>
              <strong>{profile?.matches_played ?? 0}</strong>
            </div>

            <div className="profile-stat-card">
              <span>{t.matchesWon}</span>
              <strong>{profile?.wins ?? 0}</strong>
            </div>

            <div className="profile-stat-card">
              <span>{t.matchesLost}</span>
              <strong>{profile?.losses ?? 0}</strong>
            </div>

            <div className="profile-stat-card">
              <span>{t.winPercentage}</span>
              <strong>{winPercentage}%</strong>
            </div>
          </div>

          <div className="profile-info-card">
            <span>{t.yourActivity}</span>

            <h2>{isApproved ? t.alreadyInRanking : t.profileAlmostReady}</h2>

            <p className="desktop-text">
              {isApproved ? t.approvedProfileText : t.pendingProfileText}
            </p>

            <p className="mobile-text">
              {isApproved
                ? t.approvedProfileTextMobile
                : t.pendingProfileTextMobile}
            </p>

            {isApproved ? (
              <Link
                to="/open-matches"
                className="primary-button profile-info-action"
              >
                {t.goPlay}
              </Link>
            ) : (
              <button
                type="button"
                className="secondary-button profile-info-action"
                disabled
              >
                {t.waitingApproval}
              </button>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};