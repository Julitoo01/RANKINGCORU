import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { translations } from "../i18n/translations";

export const Profile = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const t = translations[language] || translations.es;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
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
      setError(error.message || t.profile.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
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
      setError(t.profile.imageFileError);
      return;
    }

    if (file.size > 1000000) {
      setError(t.profile.imageSizeError);
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

        setMessage(t.profile.photoSuccess);
      } catch (error) {
        console.error(error);
        setError(error.message || t.profile.photoError);
      } finally {
        setPhotoLoading(false);
        event.target.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  const getProfileStatusText = (status) => {
    if (status === "approved") return t.profile.approved;
    if (status === "pending") return t.profile.pending;
    if (status === "rejected") return t.profile.rejected;

    return t.profile.unknownStatus;
  };

  const getProfileStatusClass = (status) => {
    if (status === "approved") return "approved";
    if (status === "rejected") return "rejected";

    return "pending";
  };

  if (loading) {
    return (
      <section className="profile-page">
        <div className="profile-loading-card">
          <h1>{t.profile.title}</h1>
          <p>{t.profile.loading}</p>
        </div>
      </section>
    );
  }

  if (error && !profileData) {
    return (
      <section className="profile-page">
        <div className="profile-error-card">
          <h1>{t.profile.title}</h1>
          <div className="error-message">{error}</div>

          <button
            type="button"
            className="primary-button"
            onClick={loadProfile}
          >
            {t.profile.retry}
          </button>
        </div>
      </section>
    );
  }

  if (!profileData) {
    return (
      <section className="profile-page">
        <div className="profile-error-card">
          <h1>{t.profile.title}</h1>

          <div className="error-message">{t.profile.notFound}</div>

          <button
            type="button"
            className="primary-button"
            onClick={handleLogout}
          >
            {t.profile.loginAgain}
          </button>
        </div>
      </section>
    );
  }

  const { user, profile } = profileData;
  const profileStatus = profile?.status || "pending";
  const isApproved = profileStatus === "approved";

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
                  alt={user?.nickname || t.profile.profilePhotoAlt}
                />
              ) : (
                user?.nickname?.charAt(0)?.toUpperCase() || "J"
              )}
            </div>

            <label className="profile-photo-upload-btn">
              {photoLoading ? t.profile.uploading : t.profile.changePhoto}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                disabled={photoLoading}
              />
            </label>
          </div>

          <div>
            <span className="profile-kicker">{t.profile.playerProfile}</span>

            <h1>{user?.nickname || t.profile.defaultPlayer}</h1>

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
          <h2>{t.profile.personalData}</h2>

          <div className="profile-detail-list">
            <div>
              <span>{t.profile.email}</span>
              <strong>{user?.email || "-"}</strong>
            </div>

            <div>
              <span>{t.profile.phone}</span>
              <strong>{user?.phone || "-"}</strong>
            </div>

            <div>
              <span>{t.profile.level}</span>
              <strong>{profile?.level || "-"}</strong>
            </div>

            <div>
              <span>{t.profile.position}</span>
              <strong>{profile?.position || "-"}</strong>
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="profile-action-btn logout"
              onClick={handleLogout}
            >
              {t.profile.logout}
            </button>
          </div>
        </aside>

        <main className="profile-main">
          <div className="profile-stats-grid">
            <div className="profile-stat-card highlight">
              <span>{t.profile.matchesPlayed}</span>
              <strong>{profile?.matches_played ?? 0}</strong>
            </div>

            <div className="profile-stat-card">
              <span>{t.profile.wins}</span>
              <strong>{profile?.wins ?? 0}</strong>
            </div>

            <div className="profile-stat-card">
              <span>{t.profile.losses}</span>
              <strong>{profile?.losses ?? 0}</strong>
            </div>

            <div className="profile-stat-card">
              <span>{t.profile.winPercentage}</span>
              <strong>{profile?.win_percentage ?? 0}%</strong>
            </div>
          </div>

          <div className="profile-info-card">
            <span>{t.profile.activity}</span>

            <h2>{isApproved ? t.profile.approvedTitle : t.profile.pendingTitle}</h2>

            <p>{isApproved ? t.profile.approvedText : t.profile.pendingText}</p>

            {isApproved ? (
              <Link
                to="/open-matches"
                className="primary-button profile-info-action"
              >
                {t.profile.play}
              </Link>
            ) : (
              <button
                type="button"
                className="secondary-button profile-info-action"
                disabled
              >
                {t.profile.waitingApproval}
              </button>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};