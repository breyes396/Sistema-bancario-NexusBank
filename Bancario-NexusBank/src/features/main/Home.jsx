import { Link } from 'react-router-dom';
import '../../styles/home.css';

const Home = () => {
  return (
    <div className="home-root">
      <header className="site-navbar">
        <div className="site-navbar-inner">
          <div className="nav-left">
            <Link to="/" className="brand-link">
              <img src="/src/assets/img/Logo.jpg" alt="NexusBank" className="brand-logo" />
              <span className="brand-name">NEXUSBANK</span>
            </Link>
          </div>

          <nav className="nav-center">
            <a href="#inicio" className="nav-item">Inicio</a>
            <a href="#productos" className="nav-item">Productos</a>
            <a href="#beneficios" className="nav-item">Beneficios</a>
            <a href="#servicios" className="nav-item">Servicios</a>
            <a href="#contacto" className="nav-item">Contacto</a>
          </nav>

          <div className="nav-right">
            <Link to="/login" className="btn btn-login">Iniciar sesión</Link>
            <Link to="/register" className="btn btn-cta">Registrarse</Link>
          </div>
        </div>
      </header>

      <section className="home-hero" id="inicio">
        <div className="home-hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">Tu familia merece una banca de <span>confianza</span></h1>
            <p className="lead">Soluciones financieras diseñadas para proteger lo que más importa y ayudarte a construir un futuro lleno de oportunidades.</p>

            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary">Abrir tu cuenta ahora</Link>
              <a href="#productos" className="btn btn-outline">Conocer nuestros productos</a>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <div className="fi-wrap hero-stat-icon">
                  <img src="/src/assets/img/icono10.png" alt="icon 10" />
                </div>
                <div className="hero-stat-copy">
                  <strong>+12K</strong>
                  <span>Familias</span>
                </div>
              </div>

              <div className="hero-stat">
                <div className="fi-wrap hero-stat-icon">
                  <img src="/src/assets/img/icono2.png" alt="icon 1" />
                </div>
                <div className="hero-stat-copy">
                  <strong>Q 4.2M</strong>
                  <span>En transacciones</span>
                </div>
              </div>

              <div className="hero-stat">
                <div className="fi-wrap hero-stat-icon">
                  <img src="/src/assets/img/icono1.png" alt="icon 2" />
                </div>
                <div className="hero-stat-copy">
                  <strong>99.9%</strong>
                  <span>Disponibilidad</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="cards-section" id="productos">
        <div className="cards-section-inner">
          <div className="cards-section-header">
            <h2 className="cards-section-title">TARJETAS NEXUSBANK</h2>
            <span className="cards-section-divider" aria-hidden="true" />
          </div>

          <div className="cards-grid">
            <article className="card-item">
              <div className="card-visual">
                <img src="/src/assets/img/TarjetaNormal.png" alt="Tarjeta NexusBank" />
              </div>
              <h3>NEXUSBANK</h3>
              <p>Tu compañera diaria</p>
            </article>

            <article className="card-item">
              <div className="card-visual">
                <img src="/src/assets/img/TarjetaElite.png" alt="Tarjeta Elite NexusBank" />
              </div>
              <h3>ELITE</h3>
              <p>Más beneficios, más experiencias</p>
            </article>

            <article className="card-item">
              <div className="card-visual">
                <img src="/src/assets/img/TarjetaInfinite.png" alt="Tarjeta Infinite NexusBank" />
              </div>
              <h3>INFINITE</h3>
              <p>Sin límites, sin fronteras</p>
            </article>
          </div>

          <div className="cards-cta">
            <Link to="/login" className="btn btn-cards-cta">
              Conocer todas nuestras tarjetas
              <span aria-hidden="true">›</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="benefits-section" id="beneficios">
        <div className="benefits-section-inner">
          <div className="benefits-section-header">
            <h2 className="benefits-section-title">BENEFICIOS QUE MARCAN LA DIFERENCIA</h2>
            <span className="benefits-section-divider" aria-hidden="true" />
          </div>

          <div className="benefits-grid">
            <article className="benefit-item">
              <div className="benefit-icon">
                <img src="/src/assets/img/icono4.png" alt="Recompensas" />
              </div>
              <h3>Recompensas que te acompañan</h3>
              <p>Acumula puntos y obtén beneficios pensados para ti y tu familia.</p>
            </article>

            <article className="benefit-item">
              <div className="benefit-icon">
                <img src="/src/assets/img/icono5.png" alt="Experiencias" />
              </div>
              <h3>Experiencias únicas</h3>
              <p>Accede a promociones exclusivas, viajes y eventos diseñados para ti.</p>
            </article>

            <article className="benefit-item">
              <div className="benefit-icon">
                <img src="/src/assets/img/icono6.png" alt="Seguridad" />
              </div>
              <h3>Seguridad que protege</h3>
              <p>Tecnología avanzada y monitoreo 24/7 para la tranquilidad de tu familia.</p>
            </article>

            <article className="benefit-item">
              <div className="benefit-icon">
                <img src="/src/assets/img/icono7.png" alt="Atención" />
              </div>
              <h3>Atención personalizada</h3>
              <p>Un equipo experto dispuesto a ayudarte en cada paso.</p>
            </article>

            <article className="benefit-item">
              <div className="benefit-icon">
                <img src="/src/assets/img/icono3.png" alt="Familia" />
              </div>
              <h3>Pensados para tu familia</h3>
              <p>Soluciones financieras flexibles que se adaptan a tus necesidades y sueños.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="services-section" id="servicios">
        <div className="services-section-inner">
          <div className="services-section-header">
            <h2 className="services-section-title">SERVICIOS DISEÑADOS PARA TU VIDA</h2>
            <span className="services-section-divider" aria-hidden="true" />
          </div>

          <div className="services-grid">
            <article className="service-item">
              <div className="service-image">
                <img src="/src/assets/img/telefonobanco.png" alt="Banca móvil" />
              </div>
              <div className="service-copy">
                <h3>Banca Móvil</h3>
                <p>Gestiona tus cuentas, realiza transferencias y pagos donde quiera que estés.</p>
                <a className="service-link" href="#">Conoce más <span aria-hidden="true">›</span></a>
              </div>
            </article>

            <article className="service-item">
              <div className="service-image">
                <img src="/src/assets/img/seguridad.png" alt="Seguridad" />
              </div>
              <div className="service-copy">
                <h3>Seguridad</h3>
                <p>Protegemos tu información y tu dinero con los más altos estándares.</p>
                <a className="service-link" href="#">Conoce más <span aria-hidden="true">›</span></a>
              </div>
            </article>

            <article className="service-item">
              <div className="service-image">
                <img src="/src/assets/img/TodoLimpio.png" alt="Inversiones" />
              </div>
              <div className="service-copy">
                <h3>Inversiones</h3>
                <p>Haz crecer tu patrimonio con opciones de inversión diseñadas para tu futuro.</p>
                <a className="service-link" href="#">Conoce más <span aria-hidden="true">›</span></a>
              </div>
            </article>

            <article className="service-item">
              <div className="service-image">
                <img src="/src/assets/img/familiafeliz.png" alt="Familia" />
              </div>
              <div className="service-copy">
                <h3>Familia</h3>
                <p>Cuentas y beneficios especiales para acompañar cada etapa de tu familia.</p>
                <a className="service-link" href="#">Conoce más <span aria-hidden="true">›</span></a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <footer className="footer-section" id="contacto">
        <div className="footer-cta">
          <div className="footer-cta-copy">
            <h2>¿Listo para cambiar tu banca?</h2>
            <p>Únete a miles de familias que ya disfrutan de una banca moderna, segura y hecha para lo que más importa.</p>
          </div>

          <div className="footer-cta-actions">
            <Link to="/" className="btn footer-cta-primary">Abrir tu cuenta ahora <span aria-hidden="true">›</span></Link>
            <Link to="#productos" className="btn footer-cta-secondary">Conocer nuestros productos</Link>
          </div>
        </div>

        <div className="footer-main">
          <div className="footer-brand-block">
            <Link to="/" className="footer-brand-link">
              <img src="/src/assets/img/Logo.jpg" alt="NexusBank" className="footer-brand-logo" />
              <span>NEXUSBANK</span>
            </Link>
            <p>Somos el aliado financiero de tu familia para hoy, mañana y siempre.</p>

            <div className="footer-socials">
              <a href="#" aria-label="Facebook">f</a>
              <a href="#" aria-label="Instagram">ig</a>
              <a href="#" aria-label="LinkedIn">in</a>
              <a href="#" aria-label="YouTube">yt</a>
            </div>
          </div>

          <div className="footer-links-column">
            <h3>PRODUCTO</h3>
            <a href="#productos">Cuentas</a>
            <a href="#productos">Tarjetas</a>
            <a href="#productos">Préstamos</a>
            <a href="#servicios">Inversiones</a>
            <a href="#servicios">Seguros</a>
            <a href="#servicios">Banca Empresarial</a>
          </div>

          <div className="footer-links-column">
            <h3>EMPRESA</h3>
            <a href="#">Quiénes somos</a>
            <a href="#">Nuestro propósito</a>
            <a href="#">Sostenibilidad</a>
            <a href="#">Trabajo con nosotros</a>
            <a href="#">Noticias</a>
            <a href="#">Alianzas</a>
          </div>

          <div className="footer-links-column">
            <h3>LEGAL</h3>
            <a href="#">Términos y condiciones</a>
            <a href="#">Política de privacidad</a>
            <a href="#">Aviso legal</a>
            <a href="#">Transparencia</a>
            <a href="#">Defensor del cliente</a>
          </div>

          <div className="footer-trust">
            <div className="footer-trust-item">
              <img className="footer-trust-icon" src="/src/assets/img/icono9.png" alt="Seguridad" />
              <p>Tu seguridad es nuestra prioridad</p>
            </div>
            <div className="footer-trust-item">
              <img className="footer-trust-icon" src="/src/assets/img/icono8.png" alt="Entidad supervisada" />
              <p>Entidad supervisada por la Superintendencia de Bancos</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-copy">© 2024 NexusBank. Todos los derechos reservados.</div>

          <div className="footer-bottom-locale">
            <span className="footer-bottom-item">
              <span className="footer-bottom-icon" aria-hidden="true">📍</span>
              <span>Guatemala</span>
            </span>

            <span className="footer-bottom-separator" aria-hidden="true" />

            <button type="button" className="footer-bottom-item footer-bottom-button" aria-label="Idioma español">
              <span className="footer-bottom-icon" aria-hidden="true">🌐</span>
              <span>Español</span>
              <span className="footer-bottom-caret" aria-hidden="true">⌄</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
