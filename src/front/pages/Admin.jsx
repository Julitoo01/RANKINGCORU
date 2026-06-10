import { Link } from "react-router-dom";

export const Admin = () => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span>Fuera de Pista</span>
          <h1>Panel admin</h1>
          <p>
            Gestiona los jugadores, revisa los partidos registrados y actualiza
            las normas del ranking.
          </p>
        </div>

        <div className="admin-hero-card">
          <strong>{user?.nickname || "Admin"}</strong>
          <span>Administrador</span>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <Link to="/admin/players" className="admin-dashboard-card">
          <div className="admin-card-icon">👥</div>

          <div>
            <span>Jugadores</span>
            <h2>Gestionar jugadores</h2>
            <p>
              Aprueba nuevos usuarios, cambia niveles, revisa estados y controla
              quién aparece en el ranking.
            </p>
          </div>

          <strong>Entrar →</strong>
        </Link>

        <Link to="/admin/matches" className="admin-dashboard-card">
          <div className="admin-card-icon">🎾</div>

          <div>
            <span>Partidos</span>
            <h2>Gestionar partidos</h2>
            <p>
              Revisa resultados subidos, elimina partidos incorrectos y recalcula
              el ranking cuando sea necesario.
            </p>
          </div>

          <strong>Entrar →</strong>
        </Link>

        <Link to="/admin/rules" className="admin-dashboard-card">
          <div className="admin-card-icon">📋</div>

          <div>
            <span>Normas</span>
            <h2>Editar normas</h2>
            <p>
              Actualiza el texto de las normas públicas, el funcionamiento del
              ranking y la información para jugadores.
            </p>
          </div>

          <strong>Entrar →</strong>
        </Link>
      </div>

      <div className="admin-help-card">
        <div>
          <span>Consejo de uso</span>
          <h2>Mantén el ranking limpio y actualizado.</h2>
          <p>
            Aprueba jugadores antes de que aparezcan en la clasificación y revisa
            los resultados para evitar errores en la puntuación.
          </p>
        </div>
      </div>
    </section>
  );
};