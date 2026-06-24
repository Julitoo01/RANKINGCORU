import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

export const Navbar = () => {
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const moreMenuRef = useRef(null);

  let user = null;

  try {
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Error leyendo user de localStorage:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("profile");
    user = null;
  }

  const isLogged = Boolean(storedToken) && Boolean(user);
  const isAdmin = user?.is_admin === true;

  const loadNotificationsCount = async () => {
    try {
      if (!isLogged) {
        setNotificationsCount(0);
        return;
      }

      const data = await authFetch(`${backendUrl}/api/notifications`);

      if (!data) return;

      setNotificationsCount(data.length);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
      setNotificationsCount(0);
    }
  };

  useEffect(() => {
    if (isLogged) {
      loadNotificationsCount();
    } else {
      setNotificationsCount(0);
    }
  }, [isLogged]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      loadNotificationsCount();
    };

    window.addEventListener("notificationsUpdated", handleNotificationsUpdated);

    return () => {
      window.removeEventListener(
        "notificationsUpdated",
        handleNotificationsUpdated
      );
    };
  }, [isLogged]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target)
      ) {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const closeMoreMenu = () => {
    setIsMoreOpen(false);
  };
useEffect(() => {
  const updateMobileNavbarPosition = () => {
    const navbar = document.querySelector(".navbar");

    if (!navbar || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const scale = viewport.scale || 1;

    navbar.style.setProperty("--vv-left", `${viewport.offsetLeft}px`);
    navbar.style.setProperty("--vv-top", `${viewport.offsetTop}px`);
    navbar.style.setProperty("--vv-width", `${viewport.width}px`);
    navbar.style.setProperty("--vv-height", `${viewport.height}px`);
    navbar.style.setProperty("--vv-scale", `${scale}`);
    navbar.style.setProperty("--vv-inverse-scale", `${1 / scale}`);
  };

  updateMobileNavbarPosition();

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateMobileNavbarPosition);
    window.visualViewport.addEventListener("scroll", updateMobileNavbarPosition);
  }

  window.addEventListener("resize", updateMobileNavbarPosition);
  window.addEventListener("scroll", updateMobileNavbarPosition);

  return () => {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener(
        "resize",
        updateMobileNavbarPosition
      );
      window.visualViewport.removeEventListener(
        "scroll",
        updateMobileNavbarPosition
      );
    }

    window.removeEventListener("resize", updateMobileNavbarPosition);
    window.removeEventListener("scroll", updateMobileNavbarPosition);
  };
}, []);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    setIsMoreOpen(false);
    navigate("/");
  };

  if (!isLogged) {
    return null;
  }

  return (
    <nav className="navbar">
      <Link to="/ranking" className="navbar-logo">
        Fuera de Pista
      </Link>

      <div className="navbar-links">
        <Link
          to="/notifications"
          className="navbar-item navbar-notification-icon-link"
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <span className="navbar-icon-wrapper">
            <span className="navbar-bell-wrapper">
              <svg
                className="navbar-bell-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {notificationsCount > 0 && (
                <span className="navbar-bell-dot"></span>
              )}
            </span>
          </span>

          <span className="navbar-mobile-label">Avisos</span>
        </Link>

        <Link to="/ranking" className="navbar-item">
          <span className="navbar-mobile-icon">🏆</span>
          <span className="navbar-mobile-label">Ranking</span>
          <span className="navbar-desktop-label">Ranking</span>
        </Link>

        <Link to="/open-matches" className="navbar-item">
          <span className="navbar-mobile-icon">🎾</span>
          <span className="navbar-mobile-label">Jugar</span>
          <span className="navbar-desktop-label">Jugar</span>
        </Link>

        <Link to="/profile" className="navbar-item">
          <span className="navbar-mobile-icon">👤</span>
          <span className="navbar-mobile-label">Perfil</span>
          <span className="navbar-desktop-label">Mi perfil</span>
        </Link>

        <div className="navbar-more-wrapper" ref={moreMenuRef}>
          <button
            type="button"
            className="navbar-more-button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            aria-label="Abrir menú"
            title="Más opciones"
          >
            <span className="navbar-mobile-icon">☰</span>
            <span className="navbar-mobile-label">Más</span>
          </button>

          {isMoreOpen && (
            <div className="navbar-more-menu">
              <Link to="/matches" onClick={closeMoreMenu}>
                Historial Partidos
              </Link>

              <Link to="/rules" onClick={closeMoreMenu}>
                Normas
              </Link>

              {isAdmin && (
                <Link to="/admin" onClick={closeMoreMenu}>
                  Admin
                </Link>
              )}

              {isAdmin && (
                <Link to="/admin/open-matches" onClick={closeMoreMenu}>
                  Abrir partidos
                </Link>
              )}
            </div>
          )}
        </div>

        <Link to="/matches" className="navbar-desktop-only">
          Historial Partidos
        </Link>

        <Link to="/rules" className="navbar-desktop-only">
          Normas
        </Link>

        {isAdmin && (
          <Link to="/admin" className="navbar-desktop-only">
            Admin
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin/open-matches" className="navbar-desktop-only">
            Abrir partidos
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="navbar-logout-icon-btn navbar-desktop-only"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <svg
            className="navbar-logout-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 17L15 12L10 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M15 12H3"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M12 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H12"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};