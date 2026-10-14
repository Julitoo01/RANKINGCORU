import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { translations } from "../i18n/translations";

export const Navbar = () => {
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  const moreMenuRef = useRef(null);

  const t = translations[language] || translations.es;

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

      if (!data) {
        setNotificationsCount(0);
        return;
      }

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
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
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
      window.visualViewport.addEventListener(
        "resize",
        updateMobileNavbarPosition
      );
      window.visualViewport.addEventListener(
        "scroll",
        updateMobileNavbarPosition
      );
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

  const closeMoreMenu = () => {
    setIsMoreOpen(false);
  };

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
        <Link to="/ranking" className="navbar-item">
          <span className="navbar-mobile-icon">🏆</span>
          <span className="navbar-mobile-label">{t.navbar.ranking}</span>
          <span className="navbar-desktop-label">{t.navbar.ranking}</span>
        </Link>

        <Link
          to="/open-matches"
          className="navbar-item navbar-item-with-notification"
          title={
            notificationsCount > 0
              ? `${notificationsCount} ${t.navbar.pendingAlerts}`
              : t.navbar.play
          }
          aria-label={
            notificationsCount > 0
              ? `${t.navbar.play}, ${notificationsCount} ${t.navbar.pendingAlerts}`
              : t.navbar.play
          }
        >
          <span className="navbar-mobile-icon navbar-play-icon-wrapper">
            🎾
            {notificationsCount > 0 && (
              <span className="navbar-play-dot"></span>
            )}
          </span>

          <span className="navbar-mobile-label">{t.navbar.play}</span>

          <span className="navbar-desktop-label navbar-desktop-label-with-dot">
            {t.navbar.play}
            {notificationsCount > 0 && (
              <span className="navbar-play-dot-desktop"></span>
            )}
          </span>
        </Link>

        <Link to="/profile" className="navbar-item">
          <span className="navbar-mobile-icon">👤</span>
          <span className="navbar-mobile-label">{t.navbar.profile}</span>
          <span className="navbar-desktop-label">{t.navbar.profile}</span>
        </Link>

        <div className="navbar-more-wrapper" ref={moreMenuRef}>
          <button
            type="button"
            className="navbar-more-button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            aria-label={t.navbar.openMenu}
            title={t.navbar.moreOptions}
          >
            <span className="navbar-mobile-icon">☰</span>
            <span className="navbar-mobile-label">{t.navbar.more}</span>
          </button>

          {isMoreOpen && (
            <div className="navbar-more-menu">
              <Link to="/matches" onClick={closeMoreMenu}>
                {t.navbar.matches}
              </Link>

              <Link to="/rules" onClick={closeMoreMenu}>
                {t.navbar.rules}
              </Link>

              {isAdmin && (
                <Link to="/admin" onClick={closeMoreMenu}>
                  {t.navbar.admin}
                </Link>
              )}

              <button type="button" onClick={handleLogout}>
                {t.navbar.logout}
              </button>
            </div>
          )}
        </div>

        <Link to="/matches" className="navbar-desktop-only">
          {t.navbar.matches}
        </Link>

        <Link to="/rules" className="navbar-desktop-only">
          {t.navbar.rules}
        </Link>

        {isAdmin && (
          <Link to="/admin" className="navbar-desktop-only">
            {t.navbar.admin}
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="navbar-logout-icon-btn navbar-desktop-only"
          title={t.navbar.logout}
          aria-label={t.navbar.logout}
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
              d="M12 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 21 19 21 19V21H12"
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