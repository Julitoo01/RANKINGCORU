import { Link, useNavigate } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    navigate("/");
  };

  if (!isLogged) {
    return null;
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        Fuera de Pista
      </Link>

      <div className="navbar-links">
        <Link to="/ranking">Ranking</Link>
        <Link to="/matches">Partidos</Link>
        <Link to="/rules">Normas</Link>
        <Link to="/upload-result">Subir resultado</Link>
        <Link to="/profile">Mi perfil</Link>

        {isAdmin && <Link to="/admin">Admin</Link>}

        <button onClick={handleLogout} className="navbar-button">
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
};