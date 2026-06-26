import { Link } from "react-router-dom";

export const Terms = () => {
  return (
    <section className="legal-page">
      <div className="legal-hero">
        <span>Fuera de Pista</span>
        <h1>Términos y Condiciones</h1>
        <p>
          Condiciones de uso de la plataforma Fuera de Pista para participar en
          rankings, partidos y actividades de la comunidad.
        </p>
      </div>

      <div className="legal-card">
        <div className="legal-updated">
          Última actualización: junio de 2026
        </div>

        <div className="legal-section">
          <h2>1. Identificación del servicio</h2>
          <p>
            Fuera de Pista es una plataforma digital orientada a la organización
            de partidos, rankings y actividades de pádel por niveles. El objetivo
            es facilitar que los usuarios puedan apuntarse a partidos, consultar
            clasificaciones y registrar resultados dentro de la comunidad.
          </p>
        </div>

        <div className="legal-section">
          <h2>2. Registro de usuario</h2>
          <p>
            Para utilizar determinadas funcionalidades de la plataforma, el
            usuario deberá crear una cuenta proporcionando datos reales y
            actualizados. El usuario se compromete a no utilizar datos falsos,
            suplantar a terceros ni crear cuentas con fines fraudulentos.
          </p>
        </div>

        <div className="legal-section">
          <h2>3. Uso de la plataforma</h2>
          <p>
            El usuario se compromete a utilizar Fuera de Pista de forma correcta,
            respetuosa y conforme a la finalidad de la plataforma. No está
            permitido realizar un uso abusivo, manipular resultados, alterar el
            funcionamiento del ranking o perjudicar la experiencia de otros
            usuarios.
          </p>
        </div>

        <div className="legal-section">
          <h2>4. Rankings y resultados</h2>
          <p>
            Los resultados introducidos en la plataforma podrán afectar a la
            clasificación de los jugadores. El usuario que suba un resultado
            declara que la información introducida es correcta. La organización
            podrá revisar, corregir o eliminar resultados si detecta errores,
            duplicidades o uso indebido.
          </p>
        </div>

        <div className="legal-section">
          <h2>5. Aprobación de perfiles</h2>
          <p>
            La organización podrá revisar y aprobar perfiles antes de que los
            usuarios aparezcan en el ranking o puedan participar en determinadas
            actividades. Esta revisión tiene como finalidad mantener el orden,
            la seguridad y el correcto funcionamiento de la comunidad.
          </p>
        </div>

        <div className="legal-section">
          <h2>6. Conducta de los usuarios</h2>
          <p>
            Los usuarios deberán comportarse con respeto hacia otros jugadores,
            administradores y colaboradores. La organización podrá limitar,
            suspender o eliminar el acceso de usuarios que incumplan estas normas
            o realicen conductas inapropiadas.
          </p>
        </div>

        <div className="legal-section">
          <h2>7. Disponibilidad del servicio</h2>
          <p>
            Fuera de Pista podrá realizar cambios, mejoras o interrupciones
            temporales en la plataforma por motivos técnicos, organizativos o de
            mantenimiento. No se garantiza que el servicio esté disponible de
            forma permanente o libre de errores.
          </p>
        </div>

        <div className="legal-section">
          <h2>8. Modificación de las condiciones</h2>
          <p>
            La organización podrá modificar estos términos para adaptarlos a
            cambios técnicos, legales u organizativos. Cuando sea necesario, se
            informará a los usuarios de los cambios relevantes.
          </p>
        </div>

        <div className="legal-section">
          <h2>9. Contacto</h2>
          <p>
            Para cualquier duda relacionada con estos términos, el usuario puede
            contactar con la organización de Fuera de Pista a través de los
            canales habilitados por la comunidad.
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