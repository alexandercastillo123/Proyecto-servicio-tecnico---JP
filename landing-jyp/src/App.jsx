import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Cpu,
  Laptop,
  MapPin,
  Menu,
  MessageCircle,
  Network,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
  Wrench,
  X,
} from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/51xxxxxxxxx';

const solutions = [
  {
    number: '01',
    icon: Laptop,
    title: 'Laptops y computadoras',
    description:
      'Diagnóstico, mantenimiento y reparación para que tus equipos vuelvan a rendir.',
    image: '/assets/computer-equipment.jpg',
    alt: 'Computadora de escritorio preparada para uso y mantenimiento',
    tags: ['Hardware', 'Mantenimiento', 'Reparación'],
  },
  {
    number: '02',
    icon: Network,
    title: 'Servidores y redes',
    description:
      'Soporte especializado para infraestructura, conectividad y equipos de red.',
    image: '/assets/network-servers.jpg',
    alt: 'Servidores y conexiones de red en un centro de datos',
    tags: ['Servidores', 'Redes', 'Soporte técnico'],
  },
  {
    number: '03',
    icon: ShoppingBag,
    title: 'Repuestos y tiendas',
    description:
      'Explora productos de sucursales y coordina tus pedidos desde la plataforma.',
    image: '/assets/technology-accessories.jpg',
    alt: 'Laptop y accesorios tecnológicos disponibles para uso cotidiano',
    tags: ['Repuestos', 'Productos', 'Pedidos'],
  },
];

const audiences = [
  {
    icon: Cpu,
    title: 'Si necesitas soporte',
    description:
      'Encuentra especialistas, solicita atención y mantente al tanto de tu cita o pedido.',
    link: 'Un espacio para clientes',
  },
  {
    icon: Wrench,
    title: 'Si brindas servicios',
    description:
      'Organiza tu agenda, atiende solicitudes y conversa con tus clientes desde un mismo lugar.',
    link: 'Herramientas para técnicos',
  },
  {
    icon: Store,
    title: 'Si tienes una tienda',
    description:
      'Presenta tus productos, administra pedidos y acerca tus artículos a más personas.',
    link: 'Un canal para tiendas',
  },
];

const steps = [
  {
    icon: ClipboardCheck,
    title: 'Cuéntanos qué necesitas',
    description:
      'Describe el problema de tu equipo o busca el producto que estás buscando.',
    image: '/assets/technical-planning.jpg',
    alt: 'Especialista organizando un diagnóstico técnico con planos y herramientas',
  },
  {
    icon: CalendarDays,
    title: 'Coordina con el especialista',
    description:
      'Revisa opciones, agenda una cita y conversa para acordar los detalles.',
    image: '/assets/service-coordination.jpg',
    alt: 'Personas coordinando un servicio con sus computadoras',
  },
  {
    icon: PackageCheck,
    title: 'Sigue cada actualización',
    description:
      'Consulta el estado de tus citas y pedidos, y comparte tu experiencia al finalizar.',
    image: '/assets/electronic-components.jpg',
    alt: 'Detalle de componentes electrónicos durante un proceso técnico',
  },
];

const platformHighlights = [
  {
    icon: Wrench,
    title: 'Soporte técnico',
    description: 'Encuentra especialistas para laptops, computadoras, servidores y redes.',
  },
  {
    icon: Store,
    title: 'Productos tecnológicos',
    description: 'Explora artículos y repuestos ofrecidos por tiendas de la plataforma.',
  },
  {
    icon: MessageCircle,
    title: 'Coordinación y seguimiento',
    description: 'Conversa, organiza los detalles y consulta el avance de tu solicitud.',
  },
];

const faqs = [
  {
    question: '¿Qué tipo de equipos se pueden atender?',
    answer:
      'La plataforma está orientada a laptops, computadoras, hardware, servidores y redes. La disponibilidad depende de los servicios publicados por cada especialista.',
  },
  {
    question: '¿Puedo elegir dónde recibir el servicio?',
    answer:
      'Las solicitudes contemplan atención local o a domicilio, según la disponibilidad del técnico y las condiciones que acuerden para cada servicio.',
  },
  {
    question: '¿Cómo se define el precio de una reparación?',
    answer:
      'El precio se acuerda después de revisar el diagnóstico y la disponibilidad de repuestos. Las condiciones de la cotización, incluida la garantía aplicable, se informan antes de iniciar.',
  },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselControlsPaused, setCarouselControlsPaused] = useState(false);
  const [carouselVisible, setCarouselVisible] = useState(false);
  const processTrackRef = useRef(null);
  const carouselPauseTimeoutRef = useRef(null);
  const carouselScrollTimeoutRef = useRef(null);
  const carouselHoveredRef = useRef(false);
  const carouselFocusedRef = useRef(false);
  const carouselIsProgrammaticRef = useRef(false);

  const closeMenu = () => setMenuOpen(false);
  const scrollProcessTo = (index) => {
    const track = processTrackRef.current;
    if (!track) return;

    const cards = [...track.querySelectorAll('.step-card')];
    const card = cards[index];
    if (!card) return;

    const targetScroll = card.getBoundingClientRect().left
      - track.getBoundingClientRect().left
      + track.scrollLeft;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    carouselIsProgrammaticRef.current = true;
    window.clearTimeout(carouselScrollTimeoutRef.current);
    track.scrollTo({
      left: targetScroll,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    carouselScrollTimeoutRef.current = window.setTimeout(() => {
      carouselIsProgrammaticRef.current = false;
    }, reducedMotion ? 100 : 1200);
  };

  const pauseCarouselAfterInteraction = () => {
    setCarouselControlsPaused(true);
    window.clearTimeout(carouselPauseTimeoutRef.current);
    carouselPauseTimeoutRef.current = window.setTimeout(() => {
      setCarouselControlsPaused(false);
      setCarouselPaused(carouselHoveredRef.current || carouselFocusedRef.current);
    }, 6500);
  };

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (
      !carouselVisible
      || reducedMotion.matches
      || carouselPaused
      || carouselControlsPaused
      || carouselIndex >= steps.length - 1
    ) return undefined;

    const timeout = window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        setCarouselIndex((index) => Math.min(index + 1, steps.length - 1));
      }
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [carouselControlsPaused, carouselIndex, carouselPaused, carouselVisible]);

  useEffect(() => () => {
    window.clearTimeout(carouselPauseTimeoutRef.current);
    window.clearTimeout(carouselScrollTimeoutRef.current);
  }, []);

  useEffect(() => {
    const section = processTrackRef.current?.closest('.process-band');
    if (!section) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      setCarouselVisible(entry.isIntersecting);
    }, { threshold: 0.25 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const handleCarouselPointerEnter = (event) => {
    if (event.pointerType === 'mouse') {
      carouselHoveredRef.current = true;
      setCarouselPaused(true);
    }
  };
  const handleCarouselPointerLeave = (event) => {
    if (event.pointerType === 'mouse') {
      carouselHoveredRef.current = false;
      setCarouselPaused(carouselControlsPaused || carouselFocusedRef.current);
    }
  };
  const handleCarouselFocus = () => {
    carouselFocusedRef.current = true;
    setCarouselPaused(true);
  };
  const handleCarouselBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      carouselFocusedRef.current = false;
      setCarouselPaused(carouselControlsPaused || carouselHoveredRef.current);
    }
  };
  const handleCarouselControl = (direction) => {
    const nextIndex = Math.max(0, Math.min(carouselIndex + direction, steps.length - 1));
    if (nextIndex === carouselIndex) return;

    pauseCarouselAfterInteraction();
    setCarouselIndex(nextIndex);
  };
  const handleCarouselScroll = (event) => {
    if (carouselIsProgrammaticRef.current) return;

    const track = event.currentTarget;
    const trackLeft = track.getBoundingClientRect().left;
    const nextIndex = [...track.querySelectorAll('.step-card')].reduce(
      (closestIndex, card, index, cards) => {
        const cardLeft = card.getBoundingClientRect().left - trackLeft;
        const closestLeft = cards[closestIndex].getBoundingClientRect().left - trackLeft;
        return Math.abs(cardLeft) < Math.abs(closestLeft) ? index : closestIndex;
      },
      0,
    );

    setCarouselIndex((index) => (index === nextIndex ? index : nextIndex));
  };

  useEffect(() => {
    scrollProcessTo(carouselIndex);
  }, [carouselIndex]);

  return (
    <>
      <div className="announcement">
        <span className="announcement-dot" />
        Conectamos personas con soluciones técnicas en Lima Metropolitana
        <ArrowUpRight aria-hidden="true" size={14} />
      </div>

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="JyP Servicios Técnicos, inicio">
          <span className="brand-mark">J<span>&</span>P</span>
          <span className="brand-copy">
            <strong>JyP</strong>
            <small>SERVICIOS TÉCNICOS</small>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`navigation${menuOpen ? ' navigation-open' : ''}`} aria-label="Navegación principal">
          <a href="#soluciones" onClick={closeMenu}>Soluciones</a>
          <a href="#plataforma" onClick={closeMenu}>La plataforma</a>
          <a href="#para-quien" onClick={closeMenu}>Para quién</a>
          <a href="#preguntas" onClick={closeMenu}>Preguntas</a>
          <a className="nav-cta" href="#contacto" onClick={closeMenu}>
            Hablemos <ArrowUpRight aria-hidden="true" size={16} />
          </a>
        </nav>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-marker" /> SOPORTE TÉCNICO, MÁS CERCA</div>
              <h1>
                Tu tecnología,
                <br />
                <span>en buenas manos.</span>
              </h1>
              <p className="hero-description">
                Una plataforma para encontrar especialistas, coordinar servicios
                técnicos y descubrir productos para tus equipos. Todo con
                comunicación y seguimiento en un solo lugar.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#soluciones">
                  Descubre qué hacemos <ArrowRight size={17} />
                </a>
                <a className="button button-quiet" href="#plataforma">
                  Así funciona <ArrowDown size={16} />
                </a>
              </div>
              <div className="hero-note">
                <MapPin size={15} />
                <span>Servicios y especialistas en Lima Metropolitana</span>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-image-frame">
                <img
                  src="/assets/technician-workshop.jpg"
                  alt="Técnico especializado trabajando en un laboratorio"
                  fetchPriority="high"
                />
                <div className="image-shade" />
                <div className="image-caption">
                  <span className="caption-icon"><ShieldCheck size={17} /></span>
                  <span><strong>Atención coordinada</strong><small>Desde la solicitud hasta el seguimiento</small></span>
                </div>
                <div className="hero-chip"><span className="status-dot" /> Soporte especializado</div>
              </div>
              <div className="visual-orbit orbit-one" />
              <div className="visual-orbit orbit-two" />
            </div>
          </div>
          <div className="hero-bottom">
            <span>TECNOLOGÍA</span><i />
            <span>SERVICIO</span><i />
            <span>CONFIANZA</span>
            <span className="hero-bottom-scroll">DESLIZA PARA DESCUBRIR <ArrowDown size={13} /></span>
          </div>
        </section>

        <section className="intro section-shell">
          <div className="section-label"><span>01</span> QUÉ ES JYP</div>
          <div className="intro-content">
            <h2>Un punto de encuentro para <em>resolver y conectar.</em></h2>
            <div className="intro-aside">
              <p>
                JyP es una plataforma que acerca a personas que necesitan
                soporte, especialistas que ofrecen servicios y tiendas con
                productos tecnológicos. Centraliza la coordinación para que
                cada solicitud tenga un camino más claro.
              </p>
              <a className="text-link" href="#plataforma">
                Conoce la experiencia <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <div className="intro-highlights">
            {platformHighlights.map(({ icon: Icon, title, description }) => (
              <article className="intro-highlight" key={title}>
                <span className="intro-highlight-icon"><Icon size={19} strokeWidth={1.8} /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="solutions-band" id="soluciones">
          <div className="solutions section-shell">
            <div className="section-heading">
              <div>
                <div className="section-label"><span>02</span> LO QUE RESOLVEMOS</div>
                <h2>Soluciones para que<br />sigas conectado.</h2>
              </div>
              <p>
                Desde el equipo que dejó de funcionar hasta el repuesto que
                necesitas: encuentra opciones y coordina desde un mismo espacio.
              </p>
            </div>

            <div className="solution-grid">
              {solutions.map(({ number, icon: Icon, title, description, image, alt, tags }) => (
                <article className="solution-card" key={number}>
                  <div className="solution-image">
                    <img src={image} alt={alt} loading="lazy" />
                    <span className="solution-icon"><Icon size={21} strokeWidth={1.7} /></span>
                    <span className="card-number">{number}</span>
                  </div>
                  <div className="solution-copy">
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <div className="tag-list">
                      {tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    <a className="card-arrow" href="#plataforma" aria-label={`Conoce más sobre ${title}`}>
                      <ArrowUpRight size={18} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="platform" id="plataforma">
          <div className="platform-inner section-shell">
            <div className="platform-copy">
              <div className="section-label section-label-light"><span>03</span> TODO EN UN SOLO LUGAR</div>
              <h2>Del primer mensaje<br />al servicio terminado.</h2>
              <p>
                Una experiencia digital que ayuda a organizar la atención:
                solicita, coordina y consulta las actualizaciones sin perder
                el hilo de tu servicio.
              </p>
              <div className="platform-points">
                <div><span><Check size={15} /></span> Citas y horarios disponibles</div>
                <div><span><Check size={15} /></span> Chat entre clientes y especialistas</div>
                <div><span><Check size={15} /></span> Notificaciones y estado de solicitudes</div>
                <div><span><Check size={15} /></span> Pedidos y productos de tiendas</div>
              </div>
              <a className="button button-light" href="#como-funciona">
                Ver cómo funciona <ArrowRight size={17} />
              </a>
            </div>
            <div className="platform-visual">
              <img src="/assets/electronics-repair.jpg" alt="Reparación detallada de una placa electrónica" loading="lazy" />
              <div className="platform-overlay" />
              <div className="platform-sticker">
                <MessageCircle size={18} />
                <span><strong>Conversaciones claras</strong><small>Coordinación directa en la plataforma</small></span>
              </div>
              <div className="platform-side-note">TECNOLOGÍA CONECTADA <span>—</span> JYP SERVICIOS</div>
            </div>
          </div>
        </section>

        <section className="process-band" id="como-funciona">
          <div className="process section-shell">
            <div className="process-heading">
              <div>
                <div className="section-label"><span>04</span> CÓMO FUNCIONA</div>
                <h2>Un camino claro,<br /><em>paso a paso.</em></h2>
                <p>La plataforma te acompaña para que sepas qué sigue en cada momento.</p>
              </div>
              <div
                className="process-controls"
                aria-label="Controles del carrusel"
                onPointerEnter={handleCarouselPointerEnter}
                onPointerLeave={handleCarouselPointerLeave}
                onFocusCapture={handleCarouselFocus}
                onBlurCapture={handleCarouselBlur}
              >
                <button
                  type="button"
                  aria-label="Ver pasos anteriores"
                  disabled={carouselIndex === 0}
                  onClick={() => handleCarouselControl(-1)}
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Ver pasos siguientes"
                  disabled={carouselIndex === steps.length - 1}
                  onClick={() => handleCarouselControl(1)}
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
            <div
              className="steps"
              ref={processTrackRef}
              role="region"
              aria-label="Pasos para usar JyP"
              tabIndex={0}
              onPointerEnter={handleCarouselPointerEnter}
              onPointerLeave={handleCarouselPointerLeave}
              onFocusCapture={handleCarouselFocus}
              onBlurCapture={handleCarouselBlur}
              onScroll={handleCarouselScroll}
              onTouchStart={() => {
                carouselHoveredRef.current = true;
                setCarouselPaused(true);
              }}
              onTouchEnd={() => {
                carouselHoveredRef.current = false;
                window.clearTimeout(carouselPauseTimeoutRef.current);
                carouselPauseTimeoutRef.current = window.setTimeout(() => {
                  setCarouselControlsPaused(false);
                  setCarouselPaused(carouselFocusedRef.current);
                }, 6500);
              }}
            >
              {steps.map(({ icon: Icon, title, description, image, alt }, index) => (
                <article className="step-card" key={title}>
                  <div className="step-image">
                    <img src={image} alt={alt} loading="lazy" />
                    <span className="step-number">0{index + 1}</span>
                  </div>
                  <div className="step-copy">
                    <span className="step-icon"><Icon size={18} /></span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="carousel-footer">
              <p className="carousel-hint"><ArrowLeft size={13} /> Desliza para descubrir cada paso <ArrowRight size={13} /></p>
              <span className="carousel-status">PASO 0{carouselIndex + 1} DE 0{steps.length}</span>
            </div>
          </div>
        </section>

        <section className="audience section-shell" id="para-quien">
          <div className="audience-heading">
            <div>
              <div className="section-label"><span>05</span> UN ECOSISTEMA PARA TODOS</div>
              <h2>Distintas necesidades.<br /><em>Un mismo punto de encuentro.</em></h2>
            </div>
            <p>JyP conecta a quienes buscan una solución con quienes pueden ofrecerla.</p>
          </div>
          <div className="audience-grid">
            {audiences.map(({ icon: Icon, title, description, link }) => (
              <article className="audience-card" key={title}>
                <span className="audience-icon"><Icon size={21} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
                <a href="#contacto">{link} <ArrowUpRight size={15} /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="faq section-shell" id="preguntas">
          <div className="faq-intro">
            <div className="section-label"><span>06</span> PREGUNTAS FRECUENTES</div>
            <h2>Lo que quieres<br /><em>saber.</em></h2>
            <p>¿Tienes otra consulta? Escríbenos y te ayudaremos a orientarte.</p>
            <a className="text-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Contactar a JyP <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="faq-list">
            {faqs.map(({ question, answer }) => (
              <details className="faq-item" key={question}>
                <summary>
                  <span>{question}</span>
                  <ChevronDown size={19} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="contact-cta section-shell" id="contacto">
          <div className="cta-content">
            <span className="cta-kicker"><CircleHelp size={15} /> ¿LISTO PARA CONOCER JYP?</span>
            <h2>Hagamos que la tecnología<br />trabaje para ti.</h2>
            <p>Conoce una forma más organizada de encontrar soporte técnico y productos para tus equipos.</p>
            <a className="button button-primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Escríbenos <ArrowRight size={17} />
            </a>
          </div>
          <div className="cta-image">
            <img
              src="/assets/technology-products.jpg"
              alt="Laptop lista para trabajar en una mesa junto a otros dispositivos"
              loading="lazy"
            />
            <div className="cta-image-caption">
              <span className="status-dot" />
              <span>Atención técnica con seguimiento</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand brand-footer" href="#inicio" aria-label="JyP Servicios Técnicos, volver al inicio">
          <span className="brand-mark">J<span>&</span>P</span>
          <span className="brand-copy"><strong>JyP</strong><small>SERVICIOS TÉCNICOS</small></span>
        </a>
        <p>Conectando personas con soluciones técnicas.</p>
        <div className="footer-links">
          <a href="#soluciones">Soluciones</a>
          <a href="#plataforma">La plataforma</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Contacto</a>
        </div>
        <span className="copyright">© {new Date().getFullYear()} JyP Servicios Técnicos</span>
      </footer>
    </>
  );
}

export default App;
