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
            Juega partidos por parejas, compite de forma individual y sube en
            el ranking contra jugadores de tu nivel.
          </p>

          <div className="fdp-hero-buttons">
            <Link to="/register" className="fdp-btn fdp-btn-primary">
              Crear cuenta
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

          <h2>Una forma fácil de jugar más, competir mejor y conocer gente.</h2>

          <p>
            Fuera de Pista organiza partidos de pádel por niveles. Te apuntas a
            partidos abiertos, juegas con otros jugadores de la comunidad y cada
            resultado actualiza tu posición en el ranking individual.
          </p>
        </section>

        <section className="fdp-cards">
          <article className="fdp-card">
            <div className="fdp-card-number">01</div>

            <h3>Partidos por nivel</h3>

            <p>
              Entra en partidos abiertos de tu categoría para que cada encuentro
              sea equilibrado, competitivo y divertido.
            </p>
          </article>

          <article className="fdp-card">
            <div className="fdp-card-number">02</div>

            <h3>Ranking individual</h3>

            <p>
              Aunque los partidos se juegan por parejas, cada jugador suma sus
              propias estadísticas: partidos, victorias, derrotas y porcentaje.
            </p>
          </article>

          <article className="fdp-card">
            <div className="fdp-card-number">03</div>

            <h3>Resultados automáticos</h3>

            <p>
              Al terminar, uno de los jugadores sube el resultado y el ranking se
              actualiza automáticamente.
            </p>
          </article>
        </section>

        <section className="fdp-how">
          <div className="fdp-how-title">
            <span>Cómo funciona</span>

            <h2>Del registro al ranking en pocos pasos.</h2>
          </div>

          <div className="fdp-steps">
            <div className="fdp-step">
              <strong>1</strong>
              <p>Te registras con tu nombre, nickname, nivel y posición.</p>
            </div>

            <div className="fdp-step">
              <strong>2</strong>
              <p>El admin revisa y aprueba tu inscripción.</p>
            </div>

            <div className="fdp-step">
              <strong>3</strong>
              <p>Te apuntas a partidos abiertos de tu nivel.</p>
            </div>

            <div className="fdp-step">
              <strong>4</strong>
              <p>Cuando hay 4 jugadores, se crean las parejas.</p>
            </div>

            <div className="fdp-step">
              <strong>5</strong>
              <p>Subes el resultado y el ranking se actualiza.</p>
            </div>
          </div>
        </section>

        <section className="fdp-extra">
          <div className="fdp-extra-card">
            <span>Para jugadores</span>
            <h3>Juega más partidos sin depender siempre del mismo grupo.</h3>
            <p>
              Encuentra jugadores de tu nivel, apúntate cuando te venga bien y
              compite dentro de una comunidad organizada.
            </p>
          </div>

          <div className="fdp-extra-card">
            <span>Para competir</span>
            <h3>Cada partido cuenta.</h3>
            <p>
              Cada resultado suma a tu historial y te ayuda a escalar posiciones
              dentro de la clasificación.
            </p>
          </div>
        </section>

        <section className="fdp-final">
          <span>Empieza ahora</span>

          <h2>Únete al ranking y vive el pádel también fuera de la pista.</h2>

          <p>
            Crea tu cuenta, espera la aprobación del admin y empieza a apuntarte
            a partidos de tu nivel.
          </p>

          <div className="fdp-final-actions">
            <Link to="/register" className="fdp-btn fdp-btn-primary">
              Crear cuenta
            </Link>

            <Link to="/login" className="fdp-btn fdp-btn-secondary">
              Ya tengo cuenta
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
};