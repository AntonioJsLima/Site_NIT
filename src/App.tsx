import './App.css'
import { ParticleLogo } from './assets/ParticleLogo'
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'

type LegalModelCategory = 'models' | 'legal'
type LegalModel = {
  id: string
  title: string
  description: string
  category: LegalModelCategory
  documentCount?: number
}

const LEGAL_MODELS: LegalModel[] = [
  {
    id: 'modelo-1', category: 'models', title: 'Modelo 1 - Parecer Técnico',
    description: 'Comprova tecnicamente que a atividade proposta se enquadra como pesquisa básica, pesquisa aplicada ou desenvolvimento experimental, justificando o risco tecnológico e seu enquadramento no Marco Legal de CT&I. Deve ser elaborado pelo Pesquisador Responsável ou Coordenador do Projeto na fase inicial de concepção, antes da submissão de qualquer minuta contratual ao NIT.',
  },
  {
    id: 'modelo-2', category: 'models', title: 'Modelo 2 - Parecer Técnico',
    description: 'Valida o alinhamento da parceria com a Política de Inovação da ICT, define a titularidade da propriedade intelectual envolvida e avalia a precificação de contrapartidas e royalties. Elaborado pelo Analista do NIT e aprovado pelo Coordenador ou Gestor do NIT. Deve ser emitido após o Parecer Técnico e o Plano de Trabalho, antes do encaminhamento para análise jurídica.',
  },
  {
    id: 'modelo-3', category: 'models', title: 'Modelo 3 - Plano de trabalho de acordo de parceria',
    description: 'Define o objeto, as metas, o cronograma, os recursos envolvidos e os entregáveis do projeto, estabelecendo as obrigações técnicas das partes. Elaborado conjuntamente pela ICT e pela empresa parceira, deve ser desenvolvido em paralelo à minuta jurídica e integrar o Anexo I do Acordo de Parceria em PD&I.',
  },
  {
    id: 'modelo-4', category: 'models', title: 'Modelo 4 - Plano de trabalho para prestação de serviços especializados',
    description: 'Define as condições para a prestação de serviços tecnológicos e ensaios laboratoriais de rotina, sem compartilhamento de risco tecnológico e com preço previamente estabelecido. Elaborado pelo responsável pelo serviço e aprovado pela área competente. Deve ser utilizado em contratações de serviços técnicos ou laboratoriais solicitados por terceiros.',
  },
  {
    id: 'modelo-5', category: 'models', title: 'Modelo 5 - Plano de trabalho de contratos que envolvem transferência de tecnologia',
    description: 'Define as ações de absorção tecnológica, transferência de know-how, capacitação e exploração da tecnologia, estabelecendo as condições para sua utilização e comercialização. Elaborado pelo NIT em conjunto com a empresa parceira, deve ser utilizado em processos de licenciamento, cessão de direitos de propriedade intelectual ou transferência de tecnologia.',
  },
  {
    id: 'modelos-6-8', category: 'models', documentCount: 3, title: 'Modelos 6, 7 e 8 - Formaturas de Aprovação de Projetos de PD&I',
    description: 'Formaliza a aprovação institucional de projetos de PD&I após a conclusão da instrução técnica e jurídica. A aprovação pode ocorrer por decisão da autoridade competente, de forma referendada por instância colegiada ou diretamente por órgão colegiado, conforme a governança do SENAI. Elaborado pela área responsável pela tramitação do processo e aprovado pelas instâncias competentes. Deve ser emitido na etapa final da instrução processual, antes da assinatura do instrumento jurídico pelas partes.',
  },
  {
    id: 'modelo-9', category: 'models', title: 'Modelo 9 - Declaração de Ausência de Conflito de Interesses',
    description: 'Declara a inexistência de conflitos de interesse que possam comprometer a execução ou a imparcialidade do projeto. Deve ser assinada por todos os participantes da equipe antes do início das atividades e sempre que houver inclusão de novos integrantes.',
  },
  {
    id: 'modelo-10', category: 'models', title: 'Modelo 10 - Declaração de limitação de remuneração ao teto constitucional',
    description: 'Declara que a remuneração recebida no âmbito do projeto, somada à remuneração funcional do servidor ou pesquisador, não ultrapassa o teto constitucional aplicável. Deve ser preenchida e assinada pelo beneficiário antes da concessão ou do pagamento de bolsas e demais incentivos vinculados ao projeto.',
  },
  {
    id: 'modelo-11', category: 'models', title: 'Modelo 11 - Justificativa para a escolha de uma das fundações de apoio',
    description: 'Justifica a escolha da fundação de apoio responsável pela gestão administrativa e financeira do projeto. Elaborada pelo Coordenador do Projeto e aprovada pela direção competente. Deve ser emitida quando houver participação de fundação de apoio na execução do projeto.',
  },
  {
    id: 'modelo-12', category: 'models', title: 'Modelo 12 - Lista de verificação para a instrução processual de termos aditivos',
    description: 'Verifica a conformidade das solicitações de alteração contratual, incluindo prorrogação de prazo, revisão de valores, ajuste de metas e substituição de equipe técnica. Elaborado pelo Gestor do Contrato e pelo NIT, com aprovação da coordenação responsável. Deve ser utilizado sempre que houver necessidade de modificar o instrumento original, preferencialmente antes do término de sua vigência.',
  },
  {
    id: 'modelo-13', category: 'models', title: 'Modelo 13 - Manifestação do Núcleo de Inovação Tecnológica (NIT) para termos aditivos',
    description: 'Avalia os impactos das alterações contratuais sobre a propriedade intelectual, os prazos de execução e o equilíbrio econômico-financeiro do projeto. Elaborada pelo NIT e aprovada pela coordenação responsável. Deve ser emitida sempre que houver necessidade de aditamento do instrumento, antes da formalização das alterações.',
  },
  {
    id: 'modelo-14', category: 'models', title: 'Modelo 14 - Manifestação acerca da proposta de despesas operacionais e administrativas da fundação de apoio',
    description: 'Analisa e valida os custos operacionais e administrativos aplicáveis ao projeto, assegurando sua adequação às normas institucionais e às condições da parceria. Elaborada pela área financeira e/ou NIT, deve ser emitida quando houver participação de fundação de apoio na gestão administrativa e financeira do projeto.',
  },
  {
    id: 'convenio-aporte-ict', category: 'legal', title: 'Convênio com Aporte de Recurso diretamente pela ICT',
    description: 'Formaliza o repasse de recursos públicos para a execução de projetos de pesquisa, desenvolvimento e inovação (PD&I), estabelecendo as responsabilidades das partes, a aplicação dos recursos, o plano de trabalho, a prestação de contas e as regras de propriedade intelectual. Destina-se às ICTs que recebem recursos diretamente de órgãos ou entidades públicas, sem a interveniência de fundação de apoio. Deve ser utilizado antes do início da execução do projeto, acompanhado do respectivo Plano de Trabalho.',
  },
  {
    id: 'termo-outorga', category: 'legal', title: 'Termo de Outorga',
    description: 'Formaliza a concessão de bolsas, auxílios financeiros ou bônus tecnológico para execução de atividades de pesquisa, desenvolvimento e inovação (PD&I), estabelecendo direitos, obrigações, critérios de utilização dos recursos e prestação de contas. Destina-se às instituições de fomento, ICTs, pesquisadores, bolsistas e empresas beneficiárias. Deve ser utilizado quando houver apoio financeiro vinculado a projetos de pesquisa, capacitação, desenvolvimento tecnológico ou inovação, conforme regulamentação da instituição concedente.',
  },
  {
    id: 'acordo-cooperacao-internacional', category: 'legal', title: 'Acordo de Cooperação Internacional',
    description: 'Formaliza parcerias internacionais voltadas ao desenvolvimento de atividades de ciência, tecnologia e inovação (CT&I), estabelecendo regras de cooperação, execução de projetos, intercâmbio de conhecimento, compartilhamento de recursos, confidencialidade e propriedade intelectual. Destina-se a ICTs e instituições estrangeiras que desejam atuar conjuntamente em ações de pesquisa, desenvolvimento tecnológico e inovação. Deve ser utilizado antes do início da cooperação internacional, acompanhado de Plano de Trabalho contendo objetivos, responsabilidades, recursos e metas pactuadas entre os participantes.',
  },
  {
    id: 'acordo-parceria-aporte', category: 'legal', title: 'Acordo de Parceria com Aporte de Recurso',
    description: 'Formaliza a cooperação entre uma ICT e uma empresa ou instituição parceira para execução conjunta de projetos de pesquisa, desenvolvimento e inovação (PD&I), com aporte de recursos financeiros pelo parceiro. Define as responsabilidades das partes, a aplicação dos recursos, o plano de trabalho, a execução do projeto, as regras de confidencialidade e a gestão da propriedade intelectual dos resultados. Destina-se a projetos de PD&I desenvolvidos em parceria entre ICTs e entidades externas, com ou sem interveniência de fundação de apoio na gestão dos recursos. Deve ser utilizado antes do início da execução do projeto e acompanhado do respectivo Plano de Trabalho.',
  },
  {
    id: 'acordo-parceria-sem-aporte', category: 'legal', title: 'Acordo de Parceria sem Aporte de Recurso',
    description: 'Formaliza a cooperação entre ICTs, empresas ou outras instituições para a execução conjunta de projetos de pesquisa, desenvolvimento e inovação (PD&I), sem transferência de recursos financeiros entre os parceiros. Define as responsabilidades das partes, a execução das atividades, o compartilhamento de infraestrutura, as regras de confidencialidade e a gestão da propriedade intelectual dos resultados. Também pode ser utilizado para a estruturação de ambientes promotores de inovação, como parques tecnológicos, hubs e espaços de coworking. Deve ser utilizado antes do início das atividades previstas, acompanhado do respectivo Plano de Trabalho.',
  },
  {
    id: 'contrato-aquisicao-produto', category: 'legal', title: 'Contrato de Aquisição de Produto',
    description: 'Formaliza a aquisição de bens, insumos, serviços ou obras necessários à execução de atividades de pesquisa, desenvolvimento e inovação (PD&I), por meio de contratação direta prevista na legislação aplicável. Define as condições de fornecimento ou execução, responsabilidades das partes, prazos, pagamentos, fiscalização e demais obrigações contratuais. Destina-se às ICTs que necessitam contratar produtos ou serviços diretamente vinculados a projetos de pesquisa e inovação. Deve ser utilizado antes da aquisição ou contratação, acompanhado do Projeto Básico ou documento equivalente que justifique sua aplicação ao projeto de PD&I.',
  },
  {
    id: 'contrato-servico-com-fundacao', category: 'legal', title: 'Contrato de Serviço Tecnológico com Fundação de Apoio',
    description: 'Formaliza a prestação de serviços técnicos especializados voltados à pesquisa, ao desenvolvimento tecnológico e à inovação, com interveniência de fundação de apoio responsável pela gestão administrativa e financeira dos recursos. Define o escopo dos serviços, as responsabilidades das partes, a forma de remuneração, a gestão dos recursos, as regras de confidencialidade e a propriedade intelectual dos resultados. Destina-se a contratações realizadas por empresas, órgãos públicos ou outras instituições que demandem competências técnico-científicas da ICT. Deve ser utilizado antes do início da execução dos serviços, acompanhado do respectivo Plano de Trabalho.',
  },
  {
    id: 'contrato-servico-sem-fundacao', category: 'legal', title: 'Contrato de Serviço Tecnológico sem Fundação de Apoio',
    description: 'Formaliza a prestação de serviços técnicos especializados voltados à pesquisa, ao desenvolvimento tecnológico e à inovação, com pagamento realizado diretamente à ICT contratada, sem intermediação de fundação de apoio. Define o escopo dos serviços, responsabilidades das partes, forma de remuneração, utilização de infraestrutura, confidencialidade e regras aplicáveis à propriedade intelectual dos resultados. Destina-se a empresas, órgãos públicos e demais instituições que demandem competências técnico-científicas da ICT para execução de atividades de inovação e pesquisa aplicada. Deve ser utilizado antes do início da execução dos serviços e acompanhado do respectivo Plano de Trabalho.',
  },
  {
    id: 'cessao-patente', category: 'legal', title: 'Contrato de Cessão de Patente',
    description: 'Formaliza a transferência definitiva dos direitos sobre uma patente ou pedido de patente da ICT para uma pessoa física ou jurídica, de forma total ou parcial, gratuita ou onerosa. Estabelece as condições de exploração comercial da tecnologia, as responsabilidades das partes, a remuneração aplicável, as regras de confidencialidade e os direitos relacionados à propriedade intelectual cedida. Destina-se à transferência de tecnologias protegidas para empresas, instituições públicas ou privadas, ou, nos casos previstos em lei, ao próprio inventor. Deve ser utilizado quando houver interesse na cessão da titularidade da tecnologia, observadas as diretrizes da Política de Inovação da ICT e a legislação de propriedade intelectual vigente.',
  },
  {
    id: 'licenciamento-patente', category: 'legal', title: 'Contrato de Licenciamento com Patente',
    description: 'Formaliza a autorização para que uma empresa ou instituição utilize e explore comercialmente uma patente ou pedido de patente de titularidade da ICT, sem transferência da propriedade intelectual. Define as condições de uso da tecnologia, os prazos para desenvolvimento e comercialização, as responsabilidades das partes, as regras de proteção da propriedade intelectual e a remuneração da ICT por meio de royalties ou outras formas de contrapartida. Destina-se à transferência de tecnologia para o setor produtivo, com ou sem exclusividade, visando sua introdução no mercado. Deve ser utilizado quando a ICT deseja manter a titularidade da patente, concedendo apenas o direito de exploração econômica da tecnologia a terceiros.',
  },
  {
    id: 'transferencia-sem-patente', category: 'legal', title: 'Contrato de Transferência sem Patente',
    description: 'Formaliza a transferência de tecnologia não patenteada, não patenteável ou de know-how da ICT para uma empresa ou instituição, permitindo sua utilização, desenvolvimento e exploração comercial. Define as condições de acesso ao conhecimento, suporte técnico, confidencialidade, remuneração, sublicenciamento e eventual compartilhamento de inovações decorrentes da tecnologia transferida. Destina-se a situações em que a tecnologia não está protegida por patente ou consiste em conhecimento técnico especializado, processos, métodos ou informações estratégicas. Deve ser utilizado quando houver interesse em transferir esse conhecimento ao setor produtivo, mantendo-se as condições contratuais de uso e exploração definidas entre as partes.',
  },
]

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function App() {
  const screenRef = useRef<HTMLElement>(null)
  const [activeSection, setActiveSection] = useState('inicio')
  const [isResponsiblePage, setIsResponsiblePage] = useState(() => window.location.pathname === '/responsavel')
  const [isPoliciesPage, setIsPoliciesPage] = useState(() => window.location.pathname === '/politicas')
  const [isProceduresPage, setIsProceduresPage] = useState(() => window.location.pathname === '/procedimentos')
  const [isLegalModelsPage, setIsLegalModelsPage] = useState(() => window.location.pathname === '/instrumentos-juridicos')
  const [legalModelsFilter, setLegalModelsFilter] = useState<'all' | LegalModelCategory>('all')
  const [legalModelsQuery, setLegalModelsQuery] = useState('')

  const navigate = (path: string) => {
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setIsResponsiblePage(path === '/responsavel')
    setIsPoliciesPage(path === '/politicas')
    setIsProceduresPage(path === '/procedimentos')
    setIsLegalModelsPage(path === '/instrumentos-juridicos')
  }

  const filteredLegalModels = LEGAL_MODELS.filter((model) => {
    const matchesCategory = legalModelsFilter === 'all' || model.category === legalModelsFilter
    const searchableText = normalizeSearch(`${model.title} ${model.description} ${model.id}`)
    return matchesCategory && searchableText.includes(normalizeSearch(legalModelsQuery.trim()))
  })

  const legalDocumentCount = filteredLegalModels.reduce((count, model) => count + (model.documentCount ?? 1), 0)

  const navigateToSection = (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement> | null, sectionId: string) => {
    if (event) event.preventDefault()
    if (isResponsiblePage || isPoliciesPage || isProceduresPage || isLegalModelsPage) {
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
      setIsProceduresPage(window.location.pathname === '/procedimentos')
      setIsLegalModelsPage(window.location.pathname === '/instrumentos-juridicos')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useLayoutEffect(() => {
    if (!isLegalModelsPage) return
    screenRef.current?.scrollTo({ top: 0, left: 0 })
    window.scrollTo({ top: 0, left: 0 })
  }, [isLegalModelsPage])

  useEffect(() => {
    if (isResponsiblePage || isPoliciesPage || isProceduresPage || isLegalModelsPage) return
    const screen = screenRef.current
    if (!screen) return

    const sections = screen.querySelectorAll<HTMLElement>('.hero, .about-section, .documents-section')
    const observer = new IntersectionObserver((entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (mostVisible) setActiveSection((mostVisible.target as HTMLElement).id)
    }, { root: screen, threshold: [0.35, 0.55, 0.75] })

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [isResponsiblePage, isPoliciesPage, isProceduresPage, isLegalModelsPage])

  return (
    <main className={`screen${isResponsiblePage ? ' screen--responsible' : ''}${isPoliciesPage ? ' screen--policies' : ''}${isProceduresPage ? ' screen--procedures' : ''}${isLegalModelsPage ? ' screen--legal-models' : ''}`} ref={screenRef}>
      <header className="topbar">
        <a className="brand" href="/" aria-label="NIT, SESI e SENAI — início" onClick={(event) => {
          event.preventDefault()
          navigate('/')
        }}>
          <img src="/images/Logo_N_S_S.png" alt="NIT | SESI | SENAI" />
        </a>

        <nav className="navigation" aria-label="Navegação principal">
          <a href="#inicio" aria-current={!isResponsiblePage && !isPoliciesPage && !isProceduresPage && !isLegalModelsPage && activeSection === 'inicio' ? 'page' : undefined} onClick={(event) => navigateToSection(event, 'inicio')}>Início</a>
          <a href="#sobre" aria-current={!isResponsiblePage && !isPoliciesPage && !isProceduresPage && !isLegalModelsPage && activeSection === 'sobre' ? 'page' : undefined} onClick={(event) => navigateToSection(event, 'sobre')}>Sobre</a>
          <a href="#gestao-documentos" aria-current={!isResponsiblePage && !isPoliciesPage && !isProceduresPage && !isLegalModelsPage && activeSection === 'gestao-documentos' ? 'page' : undefined} onClick={(event) => navigateToSection(event, 'gestao-documentos')}>Gestão de Documentos</a>
        </nav>

        <a className="leader-link" href="/responsavel" aria-current={isResponsiblePage ? 'page' : undefined} onClick={(event) => {
          event.preventDefault()
          navigate('/responsavel')
        }}>Responsável</a>
      </header>

      <section className="hero" id="inicio" aria-label="Apresentação do NIT">
        <ParticleLogo responsibleMode={isResponsiblePage} policiesMode={isPoliciesPage} proceduresMode={isProceduresPage} legalModelsMode={isLegalModelsPage} />
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

      <section className="responsible-section" aria-labelledby="responsible-title">
        <header className="responsible-heading">
          <span className="responsible-eyebrow">GESTÃO E ARTICULAÇÃO</span>
          <h1 id="responsible-title">Responsável pelo Programa</h1>
        </header>

        <article className="responsible-card">
          <figure className="responsible-photo-frame">
            <img src="/images/Foto_Resposavel.jpg" alt="Gabrielly Tavares Lopes" />
          </figure>

          <div className="responsible-details">
            <span className="responsible-role">Analista III de STI <span aria-hidden="true">•</span> SENAI Goiás</span>
            <h2>Gabrielly Tavares Lopes</h2>
            <p>
              Formada em <strong>Gestão da Informação (UFG)</strong>, pós-graduada em <strong>BI, Big Data e Analytics</strong> e
              especializando em <strong>Gestão da Inovação e Gestão de Projetos</strong>, atua na articulação estratégica
              entre áreas técnicas, parceiros e soluções tecnológicas no SENAI Goiás.
            </p>
            <p>
              Integrante da comissão do <strong>Núcleo de Inovação Tecnológica (NIT)</strong>, lidera a implantação do
              sistema de gestão de metrologia no Instituto SENAI de Alimentos, Bebidas e Cosméticos e representa o
              SENAI no programa <strong>SebraeTec</strong>, conectando empresas e inteligência de dados para impulsionar
              a inovação industrial.
            </p>

            <ul className="responsible-tags" aria-label="Áreas de atuação">
              <li>Núcleo de Inovação Tecnológica</li>
              <li>SebraeTec</li>
              <li>Inteligência de Dados</li>
            </ul>

            <div className="responsible-actions">
              <a
                className="responsible-action responsible-action--linkedin"
                href="https://www.linkedin.com/in/gabrielly-t-383812107/"
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM8.34 18H5.67V9.4h2.67ZM7 8.23a1.55 1.55 0 1 1 .02-3.1A1.55 1.55 0 0 1 7 8.23ZM18.34 18h-2.67v-4.18c0-1-.02-2.28-1.39-2.28s-1.6 1.08-1.6 2.21V18h-2.67V9.4h2.56v1.17h.04a2.81 2.81 0 0 1 2.53-1.39c2.71 0 3.21 1.78 3.21 4.09Z" /></svg>
                LinkedIn
              </a>
              <button className="responsible-action responsible-action--contact" type="button" disabled title="Contato indisponível no momento">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5Zm2 .18v.3l7 5.1 7-5.1v-.3a.5.5 0 0 0-.5-.5h-13a.5.5 0 0 0-.5.5Zm14 2.76-6.41 4.67a1 1 0 0 1-1.18 0L5 8.44v10.06a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5Z" /></svg>
                Contato
              </button>
            </div>
          </div>
        </article>
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
              <button className="document-card-action" type="button" aria-label="Acessar Procedimentos Operacionais do NIT" onClick={() => navigate('/procedimentos')}>→</button>
            </article>
            <article className="document-card">
              <span className="document-category">MODELOS JURÍDICOS PARA INOVAÇÃO</span>
              <h2>Modelos de Instrumentos jurídicos</h2>
              <p>Instrumentos jurídicos de CT&amp;I baseados nas referências da AGU e adaptados para o SESI/SENAI.</p>
              <button className="document-card-action" type="button" aria-label="Acessar Modelos de Instrumentos Jurídicos" onClick={() => navigate('/instrumentos-juridicos')}>→</button>
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

      <section className="procedures-section" aria-label="Procedimentos Operacionais do NIT">
        <div className="procedures-content">
          <header className="procedures-heading">
            <span className="procedures-badge">PROPRIEDADE INTELECTUAL &amp; FLUXOS</span>
            <h1>Procedimentos Operacionais do NIT <span aria-hidden="true">📋🔍</span></h1>
            <p>
              Instrumentos técnicos, roteiros metodológicos e formulários padronizados para identificação,
              busca de anterioridade e submissão formal de pedidos de PI no SESI e SENAI Goiás.
            </p>
            <h2>ECT&amp;I Fluxos - Procedimentos, Metodologias e Submissão de PI</h2>
          </header>

          <div className="procedures-cards">
            <article className="procedure-card">
              <h3>Procedimento 1 - Identificação Prévia de PI</h3>
              <p>
                Formulário para mapeamento preliminar de potenciais ativos gerados em projetos de inovação.
                Orienta o diagnóstico inicial de titularidade, tecnologias preexistentes e riscos de divulgação
                precoce. Subsidia a triagem e o plano de ação estratégico do NIT antes de submissões formais.
              </p>
              <button className="policy-card-action" type="button" disabled aria-label="Identificação Prévia de PI: destino ainda não definido">
                <span aria-hidden="true">→</span>
              </button>
            </article>

            <article className="procedure-card">
              <h3>Procedimento 2 - Busca de Anterioridade</h3>
              <p>
                Instrução de trabalho baseada nas metodologias da Academia do INPI para consulta ao estado da
                técnica. Estabelece critérios de busca por palavras-chave, operadores booleanos e classificações
                IPC e CPC. Subsidia a análise prévia de novidade e atividade inventiva de soluções tecnológicas.
              </p>
              <button className="policy-card-action" type="button" disabled aria-label="Busca de Anterioridade: destino ainda não definido">
                <span aria-hidden="true">→</span>
              </button>
            </article>

            <article className="procedure-card">
              <h3>Procedimento 3 - Submissão de Ativo de PI</h3>
              <p>
                Relatório técnico detalhado para submissão e proteção de ativos perante o Comitê e o NIT. Registra
                inventores, maturidade tecnológica (TRL), evidências, contratos e resultados de anterioridade.
                Instrumento indispensável antes de qualquer depósito, publicação externa ou parceria.
              </p>
              <button className="policy-card-action" type="button" disabled aria-label="Submissão de Ativo de PI: destino ainda não definido">
                <span aria-hidden="true">→</span>
              </button>
            </article>
          </div>
        </div>
      </section>

      <section className="legal-models-section" aria-labelledby="legal-models-title">
        <div className="legal-models-content">
          <header className="legal-models-heading">
            <span className="legal-models-badge">BIBLIOTECA JURÍDICA &amp; MINUTAS AGU</span>
            <div className="legal-models-title-wrap">
              <h1 id="legal-models-title" className="legal-models-title-trigger" tabIndex={0} aria-describedby="legal-models-info">
                Modelos de Instrumentos Jurídicos <span aria-hidden="true">📑</span>
              </h1>
              <p className="legal-models-intro" id="legal-models-info" role="tooltip">
                Os modelos disponibilizados nesta página foram elaborados com base nas minutas e orientações publicadas pela
                Advocacia-Geral da União (AGU) para aplicação do Marco Legal de Ciência, Tecnologia e Inovação (MLCT&amp;I).
                Estes documentos foram adaptados para utilização no âmbito do SESI Goiás e do SENAI Goiás, contemplando ajustes
                de identidade visual sem prejuízo às diretrizes jurídicas de referência. O objetivo desta biblioteca é promover
                maior padronização, segurança jurídica e agilidade na formalização de instrumentos relacionados a projetos de
                pesquisa, desenvolvimento, inovação, transferência de tecnologia e demais parcerias estratégicas.
              </p>
            </div>
            <p className="legal-models-lead">
              Biblioteca de modelos e minutas jurídicas para formalização de parcerias, projetos e instrumentos de inovação,
              adaptados para utilização no SESI Goiás e SENAI Goiás.
            </p>
            <p className="legal-models-source">
              Fonte:{' '}
              <a href="https://www.gov.br/agu/pt-br/composicao/procuradoria-geral-federal-1/subprocuradoria-federal-de-consultoria-juridica/ciencia-tecnologia-e-inovacao/cp-ct-i" target="_blank" rel="noreferrer">
                Advocacia-Geral da União (AGU) — Ciência, Tecnologia e Inovação
              </a>
            </p>
          </header>

          <div className="legal-models-toolbar">
            <label className="legal-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
              <input
                type="search"
                value={legalModelsQuery}
                onChange={(event) => setLegalModelsQuery(event.target.value)}
                placeholder="Buscar modelo por nome, número ou finalidade..."
                aria-label="Buscar modelo por nome, número ou finalidade"
              />
            </label>

            <div className="legal-filter-chips" role="tablist" aria-label="Filtrar modelos por categoria">
              <button type="button" role="tab" aria-selected={legalModelsFilter === 'all'} className={legalModelsFilter === 'all' ? 'is-active' : ''} onClick={() => setLegalModelsFilter('all')}>Todos</button>
              <button type="button" role="tab" aria-selected={legalModelsFilter === 'models'} className={legalModelsFilter === 'models' ? 'is-active' : ''} onClick={() => setLegalModelsFilter('models')}>Modelos de Instrumentos e Finalidades</button>
              <button type="button" role="tab" aria-selected={legalModelsFilter === 'legal'} className={legalModelsFilter === 'legal' ? 'is-active' : ''} onClick={() => setLegalModelsFilter('legal')}>Instrumentos do Marco Legal</button>
            </div>

            <p className="legal-results-count" aria-live="polite">
              {legalDocumentCount} {legalDocumentCount === 1 ? 'documento' : 'documentos'} em {filteredLegalModels.length} {filteredLegalModels.length === 1 ? 'card' : 'cards'}
            </p>
          </div>

          {filteredLegalModels.length ? (
            <div className="legal-models-grid">
              {filteredLegalModels.map((model) => (
                <article className="legal-model-card" key={model.id}>
                  <span className="legal-model-category">
                    {model.category === 'models' ? 'MODELOS DE INSTRUMENTOS E FINALIDADES' : 'INSTRUMENTOS DO MARCO LEGAL'}
                  </span>
                  {model.documentCount && <span className="legal-model-count">3 documentos</span>}
                  <h2>{model.title}</h2>
                  <p>{model.description}</p>
                  <button className="legal-model-open" type="button" disabled title="Link do documento ainda não informado" aria-label={`Abrir ${model.title}: link ainda não informado`}>
                    <span aria-hidden="true">→</span>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="legal-empty-state">Nenhum instrumento encontrado. Tente outro termo ou filtro.</p>
          )}
        </div>

        <button className="legal-back-button" type="button" onClick={() => navigateToSection(null, 'gestao-documentos')}>
          <span aria-hidden="true">←</span> Voltar para Gestão de Documentos
        </button>
      </section>
    </main>
  )
}

export default App
