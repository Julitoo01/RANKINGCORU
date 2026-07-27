import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <p>© 2026 Fuera de Pista · Ranking social de pádel</p>

        <nav className="app-footer-links">
          <Link to="/terms">Términos</Link>
          <Link to="/privacy">Privacidad</Link>
          <a href="mailto:contacto@fueradepista.app">Contacto</a>
        </nav>
      </div>
    </footer>
  );
};