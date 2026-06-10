import { Link } from "react-router-dom";

export const Admin = () => {
  return (
    <section className="page">
      <h1>Panel admin</h1>

      <div className="admin-grid">
        <Link to="/admin/players" className="admin-card">
          Gestionar jugadores
        </Link>

        <Link to="/admin/matches" className="admin-card">
          Gestionar partidos
        </Link>

        <Link to="/admin/rules" className="admin-card">
          Editar normas
        </Link>
      </div>
    </section>
  );
};
