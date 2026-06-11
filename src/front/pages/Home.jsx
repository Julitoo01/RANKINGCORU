import { Link, Navigate } from "react-router-dom";

export const Home = () => {
  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

  let user = null;

  try {
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("profile");
    user = null;
  }

  const isLogged = Boolean(storedToken) && Boolean(user);
  const isAdmin = user?.is_admin === true;

  if (isLogged) {
    return <Navigate to="/ranking" replace />;
  }
  return (
    <section className="fdp-home">
      <div className="fdp-hero">
        <div className="fdp-hero-overlay"></div>
        <div className="fdp-shape fdp-shape-left"></div>
        <div className="fdp-shape fdp-shape-right"></div>

        <div className="fdp-hero-content">
          <span className="fdp-kicker">Ranking social de pádel · A Coruña</span>

          <h1>FUERA DE PISTA</h1>

          <p>
            El ranking donde juegas partidos por parejas, compites de forma
            individual y conectas con jugadores de tu nivel.
          </p>

          <div className="fdp-hero-buttons">
            <Link to="/register" className="fdp-btn fdp-btn-primary">
              Únete
            </Link>
             <Link to="/login" className="home-premium-btn secondary">
    Iniciar sesión
  </Link>
          </div>
        </div>
      </div>

      <div className="fdp-content">
        <section className="fdp-intro">
          <span>¿Qué es Fuera de Pista?</span>
          <h2>Una comunidad para competir, jugar más y conocer nuevos jugadores.</h2>
          <p>
            Fuera de Pista nace para organizar partidos de pádel de una forma
            más social, más competitiva y más divertida. Los partidos se juegan
            por parejas, pero cada jugador suma puntos dentro de un ranking
            individual.
          </p>
        </section>

        <section className="fdp-cards">
          <article className="fdp-card">
            <div className="fdp-card-number">01</div>
            <h3>Ranking individual</h3>
            <p>
              Cada jugador tiene sus propios puntos, victorias, derrotas,
              partidos jugados y porcentaje de victorias.
            </p>
          </article>

          <article className="fdp-card">
            <div className="fdp-card-number">02</div>
            <h3>Partidos por niveles</h3>
            <p>
              Los jugadores se organizan por nivel para que los partidos sean
              más equilibrados, competitivos y entretenidos.
            </p>
          </article>

          <article className="fdp-card">
            <div className="fdp-card-number">03</div>
            <h3>Resultados al momento</h3>
            <p>
              Al terminar el partido, uno de los jugadores sube el resultado y
              el ranking se actualiza automáticamente.
            </p>
          </article>
        </section>

        <section className="fdp-how">
          <div className="fdp-how-title">
            <span>Cómo funciona</span>
            <h2>Simple, claro y competitivo.</h2>
          </div>

          <div className="fdp-steps">
            <div className="fdp-step">
              <strong>1</strong>
              <p>Te registras con tu nickname, nivel y posición.</p>
            </div>

            <div className="fdp-step">
              <strong>2</strong>
              <p>Juegas partidos 2 vs 2 con jugadores de tu nivel.</p>
            </div>

            <div className="fdp-step">
              <strong>3</strong>
              <p>Subes el resultado al terminar el partido.</p>
            </div>

            <div className="fdp-step">
              <strong>4</strong>
              <p>Sumas puntos y subes posiciones en el ranking.</p>
            </div>
          </div>
        </section>

        <section className="fdp-final">
          <h2>Únete al ranking y vive el pádel también fuera de la pista.</h2>

          <Link to="/register" className="fdp-btn fdp-btn-primary">
            Crear cuenta
          </Link>
        </section>
      </div>
    </section>
  );
};