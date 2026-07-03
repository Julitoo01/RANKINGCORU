import { Link } from "react-router-dom";

export const Privacy = () => {
  return (
    <section className="legal-page">
      <div className="legal-hero">
        <span>Fuera de Pista</span>
        <h1>Política de Privacidad</h1>
        <p>
          Información sobre cómo se recogen, utilizan y protegen los datos
          personales de los usuarios de Fuera de Pista.
        </p>
      </div>

      <div className="legal-card">
        <div className="legal-updated">
          Última actualización: junio de 2026
        </div>

        <div className="legal-section">
          <h2>1. Responsable del tratamiento</h2>
          <p>
            El responsable del tratamiento de los datos personales será la
            organización de Fuera de Pista. Los datos se utilizarán únicamente
            para gestionar la participación de los usuarios en la plataforma, los
            rankings, los partidos y las comunicaciones relacionadas con la
            comunidad.
          </p>
        </div>

        <div className="legal-section">
          <h2>2. Datos que recopilamos</h2>
          <p>
            Durante el registro y uso de la plataforma podemos recopilar datos
            como nombre, apellidos, nickname, email, teléfono, Instagram, nivel
            aproximado de juego, posición en pista, foto de perfil, partidos
            jugados, resultados y estadísticas deportivas.
          </p>
        </div>

        <div className="legal-section">
          <h2>3. Finalidad del tratamiento</h2>
          <p>
            Los datos se utilizan para crear y gestionar cuentas de usuario,
            organizar partidos por nivel, mostrar rankings, registrar resultados,
            mantener estadísticas, enviar avisos relacionados con partidos y
            permitir la administración de la comunidad.
          </p>
        </div>

        <div className="legal-section">
          <h2>4. Base legal</h2>
          <p>
            El tratamiento de los datos se basa en el consentimiento del usuario
            al registrarse, en la aceptación de estas condiciones y en la
            necesidad de gestionar correctamente la participación en la
            plataforma.
          </p>
        </div>

        <div className="legal-section">
          <h2>5. Datos visibles para otros usuarios</h2>
          <p>
            Algunos datos podrán ser visibles dentro de la comunidad, como el
            nickname, foto de perfil, nivel, posición, partidos jugados,
            victorias, derrotas, porcentaje de victorias y posición en el
            ranking. No se mostrará públicamente la contraseña del usuario.
          </p>
        </div>

        <div className="legal-section">
          <h2>6. Conservación de los datos</h2>
          <p>
            Los datos se conservarán mientras la cuenta del usuario permanezca
            activa o mientras sean necesarios para mantener el historial de
            rankings, partidos y resultados. El usuario podrá solicitar la
            revisión o eliminación de sus datos cuando corresponda.
          </p>
        </div>

        <div className="legal-section">
          <h2>7. Comunicación de datos</h2>
          <p>
            Los datos no se venderán a terceros. Solo podrán compartirse cuando
            sea necesario para el funcionamiento técnico de la plataforma, para
            cumplir obligaciones legales o para gestionar correctamente la
            comunidad.
          </p>
        </div>

        <div className="legal-section">
          <h2>8. Seguridad</h2>
          <p>
            Se aplicarán medidas razonables para proteger los datos personales y
            evitar accesos no autorizados. Aun así, ningún sistema digital puede
            garantizar una seguridad absoluta.
          </p>
        </div>

        <div className="legal-section">
          <h2>9. Derechos del usuario</h2>
          <p>
            El usuario podrá solicitar acceso, rectificación, eliminación,
            limitación u oposición al tratamiento de sus datos personales,
            contactando con la organización de Fuera de Pista a través de los
            canales habilitados.
          </p>
        </div>

        <div className="legal-section">
          <h2>10. Cambios en esta política</h2>
          <p>
            Esta política podrá actualizarse para adaptarse a cambios técnicos,
            legales u organizativos. Cuando sea necesario, se informará a los
            usuarios de los cambios relevantes.
          </p>
        </div>

        <div className="legal-actions">
          <Link to="/register" className="legal-back-btn">
            Volver al registro
          </Link>
        </div>
      </div>
    </section>
  );
};