import './App.css'
import { ParticleLogo } from './assets/ParticleLogo'
import { useEffect, useRef, useState, type MouseEvent } from 'react'

function App() {
  const screenRef = useRef<HTMLElement>(null)
  const [activeSection, setActiveSection] = useState('inicio')
  const [isResponsiblePage, setIsResponsiblePage] = useState(() => window.location.pathname === '/responsavel')
  const [isPoliciesPage, setIsPoliciesPage] = useState(() => window.location.pathname === '/politicas')

  const navigate = (path: string) => {
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setIsResponsiblePage(path === '/responsavel')
    setIsPoliciesPage(path === '/politicas')
  }

  const navigateToSection = (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement> | null, sectionId: string) => {
    if (event) event.preventDefault()
    if (isResponsiblePage || isPoliciesPage) {
      navigate('/')
      window.requestAnimationFrame(() => {
        screenRef.current?.querySelector<HTMLElement>(`#${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } else {
      screenRef.current?.querySelector<HTMLElement>(`#${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      setIsResponsiblePage(window.location.pathname === '/responsavel')
      setIsPoliciesPage(window.location.pathname === '/politicas')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (isResponsiblePage || isPoliciesPage) return
    const screen = screenRef.current
    if (!screen) return

    const sections = screen.querySelectorAll<HTMLElement>('section[id]:not(.policies-section)')
    const observer = new IntersectionObserver((entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (mostVisible) setActiveSection((mostVisible.target as HTMLElement).id)
    }, { root: screen, threshold: [0.35, 0.55, 0.75] })

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [isResponsiblePage, isPoliciesPage])

  return (
    <main className={`screen${isResponsiblePage ? ' screen--responsible' : ''}${isPoliciesPage ? ' screen--policies' : ''}`} ref={screenRef}>
      <header className="topbar">
        <a className="brand" href="/" aria-label="NIT, SESI e SENAI — início" onClick={(event) => {
          event.preventDefault()
          navigate('/')
        }}>
          <img src="/images/Logo_N_S_S.png" alt="NIT | SESI | SENAI" />
        </a>

        <nav className="navigation" aria-label="Navegação principal">
          <a href="#inicio" aria-current={!isResponsiblePage && !isPoliciesPage && activeSection === 'inicio' ? 'page' : undefined} onClick={(event) => navigateToSection(event, 'inicio')}>Início</a>
          <a href="#sobre" aria-current={!isResponsiblePage && !isPoliciesPage && activeSection === 'sobre' ? 'page' : undefined} onClick={(event) => navigateToSection(event, 'sobre')}>Sobre</a>
          <a href="#gestao-documentos" aria-current={!isResponsiblePage && !isPoliciesPage && activeSection === 'gestao-documentos' ? 'page' : undefined} onClick={(event) => navigateToSection(event, 'gestao-documentos')}>Gestão de Documentos</a>
        </nav>

        <a className="leader-link" href="/responsavel" aria-current={isResponsiblePage ? 'page' : undefined} onClick={(event) => {
          event.preventDefault()
          navigate('/responsavel')
        }}>Responsável</a>
      </header>

      <section className="hero" id="inicio" aria-label="Apresentação do NIT">
        <ParticleLogo responsibleMode={isResponsiblePage} policiesMode={isPoliciesPage} />
        <p className="subtitle">Núcleo de Inovação Tecnológica</p>

        <div className="scroll-hint" aria-label="Conheça o NIT">
          <svg
            className="mouse-icon mouse-icon-svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="2" width="14" height="20" rx="7" ry="7" />
            <line x1="12" y1="6" x2="12" y2="10" />
          </svg>
          <span>Conheça o NIT</span>
        </div>
      </section>

      <section className="about-section" id="sobre" aria-label="Sobre o NIT">
        <article className="about-card">
          <h1>💡 <span>Sobre o NIT</span></h1>
          <p className="about-intro">
            O Núcleo de Inovação Tecnológica – NIT é a instância de apoio a gestão da inovação e da
            propriedade intelectual, orientação e articulação entre as áreas envolvidas.
          </p>

          <p className="about-premise">
            <strong>Premissa Central:</strong> Art. 6º A Política do NIT tem por premissa orientar,
            estruturar e fortalecer a atuação do NIT como instância institucional de apoio,
            articulação, orientação e gestão dos temas relacionados à inovação, propriedade
            intelectual, pesquisa, desenvolvimento tecnológico e transferência de tecnologia.
          </p>

          <div className="about-actions">
            <button className="about-action about-action--primary" type="button">
              Estrutura e Operação <span aria-hidden="true">↗</span>
            </button>
            <div className="about-more-wrap">
              <button className="about-action about-action--secondary" type="button" aria-describedby="knowledge-tooltip">
                Saiba Mais <span aria-hidden="true">↗</span>
              </button>
              <div className="knowledge-tooltip" id="knowledge-tooltip" role="tooltip">
                <strong>TRILHA DE CONHECIMENTO</strong>
                <span>Acesse a Trilha de Conhecimento do NIT e descubra os principais conceitos, fundamentos e oportunidades da inovação.</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="documents-section" id="gestao-documentos" aria-label="Gestão de Documentos">
        <div className="documents-content">
          <header className="documents-heading">
            <h1><span aria-hidden="true">📁</span> Gestão de Documentos</h1>
            <p>Acesse os instrumentos e documentos de referência para a gestão da inovação e da propriedade intelectual.</p>
          </header>

          <div className="document-cards">
            <article className="document-card">
              <span className="document-category">DIRETRIZES INSTITUCIONAIS</span>
              <h2>Políticas do NIT</h2>
              <p>Diretrizes, princípios e orientações institucionais do NIT.</p>
              <button
                className="document-card-action"
                type="button"
                aria-label="Acessar Políticas Institucionais de Inovação e PI"
                onClick={() => {
                  navigate('/politicas')
                }}
              >
                →
              </button>
            </article>
            <article className="document-card">
              <span className="document-category">PROPRIEDADE INTELECTUAL</span>
              <h2>Procedimentos do NIT</h2>
              <p>Modelos para Submissão, Identificação de PI e Busca de anterioridade.</p>
              <button className="document-card-action" type="button" aria-label="Procedimentos do NIT: destino ainda não definido">→</button>
            </article>
            <article className="document-card">
              <span className="document-category">MODELOS JURÍDICOS PARA INOVAÇÃO</span>
              <h2>Modelos de Instrumentos jurídicos</h2>
              <p>Instrumentos jurídicos de CT&amp;I baseados nas referências da AGU e adaptados para o SESI/SENAI.</p>
              <button className="document-card-action" type="button" aria-label="Modelos de Instrumentos jurídicos: destino ainda não definido">→</button>
            </article>
          </div>
        </div>
      </section>

      <section className="policies-section" id="politicas" aria-label="Políticas Institucionais de Inovação e PI">
        <div className="policies-content">
          <header className="policies-heading">
            <span className="policies-badge">DIRETRIZES E MARCOS REGULATÓRIOS</span>
            <h1>
              Políticas Institucionais de Inovação e PI <span className="policies-title-icons" aria-hidden="true">📜⚖️</span>
            </h1>
            <p className="policies-subtitle">
              Acesse as diretrizes normativas e marcos regulatórios para a gestão da inovação,
              governança e salvaguarda da propriedade intelectual no âmbito do SESI e SENAI Goiás.
            </p>
            <h2 className="policies-subheading">ECT&amp;I Normas - Políticas do NIT e Diretrizes Vigentes</h2>
          </header>

          <div className="policy-cards">
            <article className="policy-card">
              <h3>Política 1 - Regulamento Operacional do NIT</h3>
              <p>
                Estabelece a governança e fluxos institucionais do Núcleo de Inovação Tecnológica.
                Regula a integração com a ASJUR, os procedimentos de avaliação de patentes, buscas
                de anterioridade e cláusulas contratuais de PD&amp;I.
              </p>
              <button className="policy-card-action" type="button" aria-label="Acessar Política 1 - Regulamento Operacional do NIT">
                <span aria-hidden="true">→</span>
              </button>
            </article>

            <article className="policy-card">
              <h3>Política 2 - Propriedade Intelectual</h3>
              <p>
                Regulamenta os critérios de titularidade e cotitularidade institucional sobre
                criações. Abrange proteção de marcas, patentes, softwares e direitos autorais, além
                de prever deveres de sigilo e transferência tecnológica.
              </p>
              <button className="policy-card-action" type="button" aria-label="Acessar Política 2 - Propriedade Intelectual">
                <span aria-hidden="true">→</span>
              </button>
            </article>

            <article className="policy-card">
              <h3>Política 3 - Política de Inovação</h3>
              <p>
                Define as diretrizes e mecanismos institucionais para fomento à inovação e
                empreendedorismo. Disciplina a integração tecnológica na educação, o
                compartilhamento de laboratórios e o incentivo via bolsas e editais.
              </p>
              <button className="policy-card-action" type="button" aria-label="Acessar Política 3 - Política de Inovação">
                <span aria-hidden="true">→</span>
              </button>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
