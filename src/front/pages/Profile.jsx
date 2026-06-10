import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const Profile = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      setError("");

      const response = await fetch(`${backendUrl}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.msg === "Token has expired") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("profile");
          navigate("/login");
          return;
        }

        throw new Error(data.msg || "No se pudo cargar el perfil");
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
      setError(error.message || "Error al cargar el perfil");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const getStatusText = (status) => {
    if (status === "approved") return "Aprobado";
    if (status === "pending") return "Pendiente";
    if (status === "rejected") return "Rechazado";
    return "";
  };

  const getStatusDescription = (status) => {
    if (status === "approved") {
      return "Tu perfil ya forma parte del ranking. Puedes subir resultados y competir.";
    }

    if (status === "pending") {
      return "Tu perfil está pendiente de aprobación. Cuando la organización lo revise, aparecerás en el ranking.";
    }

    if (status === "rejected") {
      return "Tu perfil ha sido rechazado. Contacta con la organización si crees que ha sido un error.";
    }

    return "";
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

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <div className="profile-main-info">
          <div className="profile-avatar-large">
            {user?.nickname?.charAt(0)?.toUpperCase() || "J"}
          </div>

          <div>
            <span className="profile-kicker">Perfil de jugador</span>
            <h1>{user?.nickname || "Jugador"}</h1>

            <p>
              {user?.name || "-"} {user?.last_name || ""}
            </p>
          </div>
        </div>

        {profile?.status && (
          <div className={`profile-status-card status-${profile.status}`}>
            <span>Estado</span>
            <strong>{getStatusText(profile.status)}</strong>
          </div>
        )}
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

            {user?.instagram && (
              <div>
                <span>Instagram</span>
                <strong>{user.instagram}</strong>
              </div>
            )}

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
            <Link to="/ranking" className="profile-action-btn secondary">
              Ver ranking
            </Link>

            {profile?.status === "approved" && (
              <Link to="/upload-result" className="profile-action-btn primary">
                Subir resultado
              </Link>
            )}
          </div>
        </aside>

        <main className="profile-main">
          {profile?.status && (
            <div className="profile-status-message">
              <h2>{getStatusText(profile.status)}</h2>
              <p>{getStatusDescription(profile.status)}</p>
            </div>
          )}

          <div className="profile-stats-grid">
            <div className="profile-stat-card highlight">
              <span>Puntos</span>
              <strong>{profile?.points ?? 0}</strong>
            </div>

            <div className="profile-stat-card">
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

            <div className="profile-stat-card">
              <span>Formato</span>
              <strong>2 vs 2</strong>
            </div>
          </div>

          <div className="profile-explanation-card">
            <h2>¿Cómo suma puntos tu perfil?</h2>

            <div className="profile-points-rules">
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

            <p>
              Los partidos se juegan por parejas, pero el ranking es individual:
              cada jugador suma sus propios puntos en función del resultado.
            </p>
          </div>
        </main>
      </div>
    </section>
  );
};