# PPC Digital IFMS - TODO

## Banco de Dados & Schema
- [x] Tabela: campuses (campus/unidades)
- [x] Tabela: teaching_areas (áreas de ensino)
- [x] Tabela: courses (cursos com tipo, campus, duração, turmas)
- [x] Tabela: subjects (disciplinas com semestre, carga horária, área)
- [x] Tabela: ppc_documents (documentos PDF enviados)
- [x] Tabela: approval_requests (solicitações de indicação de área ao coordenador)
- [x] Tabela: audit_logs (histórico de auditoria)
- [x] Tabela: user_course_roles (roles: admin, coordinator, teacher por campus/curso)
- [x] Migração e aplicação do schema no banco

## Backend (tRPC Routers)
- [x] Router: campuses (CRUD)
- [x] Router: teaching_areas (CRUD)
- [x] Router: courses (CRUD + listagem com filtros)
- [x] Router: subjects (CRUD por curso)
- [x] Router: ppc (upload PDF, extração IA, listagem, applyExtraction)
- [x] Router: approval (criar solicitação, createBulk, responder, listar)
- [x] Router: audit (listar logs por entidade — admin only)
- [x] Router: dashboard (stats, classesByArea, classesBySemester)
- [x] Router: reports (data, byCourse, byCampus, exportPdf com pdfkit)
- [x] Router: users (listar usuários, atribuir roles — admin only)
- [x] adminProcedure para proteção de rotas administrativas
- [x] Registro automático de auditoria em todas as operações
- [x] Integração IA (invokeLLM) para extração estruturada de PDF

## Frontend - Layout & Auth
- [x] DashboardLayout com sidebar responsiva e redimensionável
- [x] Página de login com Google OAuth
- [x] Controle de menu por role (admin, coordinator, teacher)
- [x] Badge de notificações de solicitações pendentes no menu
- [x] Tema visual: verde/azul IFMS, moderno e profissional (fonte Inter)

## Frontend - Páginas
- [x] Dashboard principal com KPIs e gráficos (BarChart, PieChart)
- [x] Página: Gestão de Campus
- [x] Página: Gestão de Áreas de Ensino (com seletor de cor)
- [x] Página: Gestão de Cursos
- [x] Página: Detalhes do Curso (disciplinas por semestre, solicitar áreas em bulk)
- [x] Página: Disciplinas (listagem geral com filtros)
- [x] Página: Upload de PPC (drag & drop, extração IA, aplicar ao curso)
- [x] Página: Solicitações de Aprovação (admin envia, coordenador responde com área)
- [x] Página: Relatórios (4 tipos + exportação PDF)
- [x] Página: Histórico de Auditoria (filtros por entidade)
- [x] Página: Gestão de Usuários e Roles

## Relatórios & Exportação
- [x] Relatório: Total de aulas por semestre
- [x] Relatório: Total de aulas por área
- [x] Relatório: Total de aulas por curso
- [x] Relatório: Visão consolidada por campus
- [x] Exportação em PDF com pdfkit (cabeçalho, tabelas, rodapé)
- [x] Gráficos interativos com Recharts

## Testes
- [x] Testes de autenticação (auth.me, logout)
- [x] Testes de campus, áreas, cursos, disciplinas
- [x] Testes de dashboard (stats, classesByArea, classesBySemester)
- [x] Testes de aprovações e relatórios
- [x] Testes de controle de acesso (admin only)
- [x] 18 testes passando em 2 arquivos de teste

## Melhorias v1.1 — Extração IA Completa
- [x] Adicionar campos `syllabus` (ementa) e `bibliography` (referências bibliográficas) na tabela `subjects`
- [x] Gerar e aplicar migração SQL dos novos campos
- [x] Aprimorar prompt da IA para extrair: área de ensino sugerida, ementa e referências por disciplina
- [x] Auto-cadastro de campus: se não existir no banco, criar automaticamente durante applyExtraction
- [x] Auto-cadastro de curso: se não existir no banco, criar automaticamente durante applyExtraction
- [x] Edição completa de disciplinas: nome, semestre, aulas semanais, carga horária, área, ementa, referências
- [x] Página/modal de revisão pós-extração com todos os campos editáveis antes de aplicar
- [x] Atualizar CourseDetail para exibir ementa e referências de cada disciplina
- [x] Atualizar router subjects.update para aceitar syllabus e bibliography
