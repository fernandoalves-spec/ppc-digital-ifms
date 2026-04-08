export type PageMeta = {
  title: string;
  description: string;
  badge: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
};

type PageMetaMatcher = {
  match: (path: string) => boolean;
  meta: PageMeta;
};

const FALLBACK_META: PageMeta = {
  title: "Dashboard institucional",
  description: "Panorama operacional de cursos, pendencias e fluxo academico.",
  badge: "Painel",
  emptyStateTitle: "Nenhum dado disponivel",
  emptyStateDescription: "Sem registros para exibir no momento.",
};

const PAGE_META_MATCHERS: PageMetaMatcher[] = [
  {
    match: (path: string) => path === "/" || path === "/dashboard",
    meta: FALLBACK_META,
  },
  {
    match: (path: string) => path.startsWith("/courses"),
    meta: {
      title: "Cursos",
      description: "Consulta e gestao dos PPCs e estruturas curriculares.",
      badge: "Gestao academica",
      emptyStateTitle: "Nenhum curso encontrado",
      emptyStateDescription: "Cadastre um curso para iniciar a estruturacao curricular.",
    },
  },
  {
    match: (path: string) => path.startsWith("/subjects"),
    meta: {
      title: "Disciplinas",
      description: "Base curricular institucional e vinculacao por area.",
      badge: "Gestao academica",
      emptyStateTitle: "Nenhuma disciplina encontrada",
      emptyStateDescription: "As disciplinas cadastradas aparecerao aqui.",
    },
  },
  {
    match: (path: string) => path.startsWith("/areas"),
    meta: {
      title: "Areas de ensino",
      description: "Distribuicao de responsabilidades academicas por area.",
      badge: "Gestao academica",
      emptyStateTitle: "Nenhuma area cadastrada",
      emptyStateDescription: "Cadastre areas para organizar as atribuicoes docentes.",
    },
  },
  {
    match: (path: string) => path.startsWith("/campus"),
    meta: {
      title: "Campus",
      description: "Gestao das unidades institucionais do IFMS.",
      badge: "Gestao academica",
      emptyStateTitle: "Nenhum campus encontrado",
      emptyStateDescription: "Cadastre um campus para iniciar o mapeamento da oferta.",
    },
  },
  {
    match: (path: string) => path.startsWith("/ppc-upload"),
    meta: {
      title: "Upload de PPC",
      description: "Entrada de documentos com extracao estruturada.",
      badge: "Fluxo operacional",
      emptyStateTitle: "Nenhum documento enviado",
      emptyStateDescription: "Envie um PDF para iniciar a extracao inteligente.",
    },
  },
  {
    match: (path: string) => path.startsWith("/approvals"),
    meta: {
      title: "Solicitacoes",
      description: "Acompanhamento de pendencias e aprovacoes institucionais.",
      badge: "Fluxo operacional",
      emptyStateTitle: "Sem solicitacoes no momento",
      emptyStateDescription: "As novas solicitacoes aparecerao aqui para tratativa.",
    },
  },
  {
    match: (path: string) => path.startsWith("/offerings"),
    meta: {
      title: "Quadro de oferta",
      description: "Consolidacao de turmas, cargas e distribuicao por area.",
      badge: "Fluxo operacional",
      emptyStateTitle: "Nenhuma oferta encontrada",
      emptyStateDescription: "Cadastre ofertas para acompanhar o planejamento academico.",
    },
  },
  {
    match: (path: string) => path.startsWith("/reports"),
    meta: {
      title: "Relatorios",
      description: "Leitura analitica para acompanhamento e decisao.",
      badge: "Analises",
      emptyStateTitle: "Sem dados para relatorio",
      emptyStateDescription: "Registre dados de PPC e oferta para liberar as analises.",
    },
  },
  {
    match: (path: string) => path.startsWith("/memory-calc"),
    meta: {
      title: "Memoria de calculo",
      description: "Parametros operacionais e memoria auxiliar.",
      badge: "Analises",
      emptyStateTitle: "Sem parametros cadastrados",
      emptyStateDescription: "Adicione entradas para gerar a memoria de calculo.",
    },
  },
  {
    match: (path: string) => path.startsWith("/users"),
    meta: {
      title: "Usuarios",
      description: "Perfis, permissoes e controles de acesso.",
      badge: "Governanca",
      emptyStateTitle: "Nenhum usuario encontrado",
      emptyStateDescription: "Adicione usuarios para habilitar o acesso institucional.",
    },
  },
  {
    match: (path: string) => path.startsWith("/audit"),
    meta: {
      title: "Auditoria",
      description: "Rastreabilidade completa de eventos do sistema.",
      badge: "Governanca",
      emptyStateTitle: "Sem eventos de auditoria",
      emptyStateDescription: "Os registros de auditoria aparecerao conforme o uso da plataforma.",
    },
  },
];

export function getPageMeta(path: string): PageMeta {
  return PAGE_META_MATCHERS.find(entry => entry.match(path))?.meta ?? FALLBACK_META;
}

