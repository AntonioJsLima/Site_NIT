import './App.css'
import { ParticleLogo } from './assets/ParticleLogo'
import { useEffect, useRef, useState } from 'react'

function App() {
  const screenRef = useRef<HTMLElement>(null)
  const [activeSection, setActiveSection] = useState('inicio')

  useEffect(() => {
    const screen = screenRef.current
    if (!screen) return

    const sections = screen.querySelectorAll<HTMLElement>('.hero[id], .about-section[id]')
    const observer = new IntersectionObserver((entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (mostVisible) setActiveSection((mostVisible.target as HTMLElement).id)
    }, { root: screen, threshold: [0.35, 0.55, 0.75] })

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <main className="screen" ref={screenRef}>
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="NIT, SESI e SENAI — início">
          <img src="/images/Logo_N_S_S.png" alt="NIT | SESI | SENAI" />
        </a>

        <nav className="navigation" aria-label="Navegação principal">
          <a href="#inicio" aria-current={activeSection === 'inicio' ? 'page' : undefined}>Início</a>
          <a href="#sobre-trilha" aria-current={activeSection === 'sobre-trilha' ? 'page' : undefined}>Sobre/Trilha</a>
          <a href="#gestao-documentos">Gestão de Documentos</a>
        </nav>

        <a className="leader-link" href="#lider">Responsável</a>
      </header>

      <section className="hero" id="inicio" aria-label="Apresentação do NIT">
        <ParticleLogo />
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

      <section className="about-section" id="sobre-trilha" aria-label="Sobre e Trilha">
        <div className="about-card" aria-label="Área de conteúdo em preparação" />
      </section>
    </main>
  )
}

export default App
