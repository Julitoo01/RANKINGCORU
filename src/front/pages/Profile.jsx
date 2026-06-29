import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

export const Profile = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      setError("");

      const data = await authFetch(`${backendUrl}/api/profile`);

      if (!data) return;

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
      setError(error.message || "Error al cargar el perfil");
    }
  };

  useEffect(() => {
    loadProfile();
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

    if (!file.type.startsWith("image/")) {
      setError("El archivo tiene que ser una imagen.");
      return;
    }

    if (file.size > 1000000) {
      setError("La imagen es demasiado grande. Usa una foto de menos de 1MB.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        setError("");

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
        const updatedProfile = updatedUser.profile || profileData.profile;

        setProfileData({
          user: updatedUser,
          profile: updatedProfile,
        });

        localStorage.setItem("user", JSON.stringify(updatedUser));

        if (updatedProfile) {
          localStorage.setItem("profile", JSON.stringify(updatedProfile));
        }
      } catch (error) {
        console.error(error);
        setError(error.message || "Error al subir la foto de perfil");
      }
    };

    reader.readAsDataURL(file);
  };

  const getProfileStatusText = (status) => {
    if (status === "approved") return "Perfil aprobado";
    if (status === "pending") return "Pendiente de aprobación";
    if (status === "rejected") return "Perfil rechazado";

    return "Estado pendiente";
  };

  if (error) {
    return (
      <section className="profile-page">
        <div className="profile-error-card">
          <h1>Mi perfil</h1>
          <div className="error-message">{error}</div>
        </div>
      </section>
    );
  }

  if (!profileData) {
    return (
      <section className="profile-page">
        <div className="profile-loading-card">
          <h1>Mi perfil</h1>
          <p>Cargando perfil...</p>
        </div>
      </section>
    );
  }

  const { user, profile } = profileData;
  const profileStatus = profile?.status || "pending";
  const isApproved = profileStatus === "approved";

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <div className="profile-main-info">
          <div>
            <div className="profile-avatar-large">
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user?.nickname || "Foto de perfil"}
                />
              ) : (
                user?.nickname?.charAt(0)?.toUpperCase() || "J"
              )}
            </div>

            <label className="profile-photo-upload-btn">
              Cambiar foto
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
              />
            </label>
          </div>

          <div>
            <span className="profile-kicker">Perfil de jugador</span>

            <h1>{user?.nickname || "Jugador"}</h1>

            <p>
              {user?.name || "-"} {user?.last_name || ""}
            </p>

            <div
              className={`profile-status-pill ${
                isApproved ? "approved" : "pending"
              }`}
            >
              {getProfileStatusText(profileStatus)}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-side-card">
          <h2>Datos personales</h2>

          <div className="profile-detail-list">
            <div>
              <span>Email</span>
              <strong>{user?.email || "-"}</strong>
            </div>

            <div>
              <span>Teléfono</span>
              <strong>{user?.phone || "-"}</strong>
            </div>

            <div>
              <span>Nivel</span>
              <strong>{profile?.level || "-"}</strong>
            </div>

            <div>
              <span>Posición</span>
              <strong>{profile?.position || "-"}</strong>
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="profile-action-btn logout"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="profile-main">
          <div className="profile-stats-grid">
            <div className="profile-stat-card highlight">
              <span>Partidos jugados</span>
              <strong>{profile?.matches_played ?? 0}</strong>
            </div>

            <div className="profile-stat-card">
              <span>Partidos ganados</span>
              <strong>{profile?.wins ?? 0}</strong>
            </div>

            <div className="profile-stat-card">
              <span>Partidos perdidos</span>
              <strong>{profile?.losses ?? 0}</strong>
            </div>

            <div className="profile-stat-card">
              <span>% Victorias</span>
              <strong>{profile?.win_percentage ?? 0}%</strong>
            </div>
          </div>

          <div className="profile-info-card">
            <span>Tu actividad</span>

            <h2>
              {isApproved
                ? "Ya formas parte del ranking"
                : "Tu perfil está casi listo"}
            </h2>

            <p>
              {isApproved
                ? "Apúntate a partidos abiertos, juega con otros jugadores de tu nivel y sube resultados para mejorar tu posición."
                : "Cuando el admin apruebe tu inscripción, podrás apuntarte a partidos abiertos y empezar a competir en el ranking."}
            </p>

            {isApproved ? (
              <Link to="/open-matches" className="primary-button profile-info-action">
                Ir a jugar
              </Link>
            ) : (
              <button
                type="button"
                className="secondary-button profile-info-action"
                disabled
              >
                Esperando aprobación
              </button>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};