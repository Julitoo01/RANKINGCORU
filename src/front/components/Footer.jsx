import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <div>
          <strong>Fuera de Pista</strong>
          <span>Ranking social de pádel en A Coruña</span>
        </div>

        <nav className="app-footer-links">
          <Link to="/terms">Términos</Link>
          <Link to="/privacy">Privacidad</Link>
          <a href="mailto:contacto@fueradepista.app">Contacto</a>
        </nav>
      </div>
    </footer>
  );
};