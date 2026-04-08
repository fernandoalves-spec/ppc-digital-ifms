import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EmptyStateInstitutional from "./EmptyStateInstitutional";
import PageHeader from "./PageHeader";
import SectionCard from "./SectionCard";
import StatCard from "./StatCard";

describe("layout components", () => {
  it("renders page header content", () => {
    const html = renderToStaticMarkup(
      <PageHeader badge="Painel" title="Titulo" description="Descricao" actions={<button>Abrir</button>} />,
    );
    expect(html).toContain("Titulo");
    expect(html).toContain("Painel");
    expect(html).toContain("Abrir");
  });

  it("renders institutional empty state", () => {
    const html = renderToStaticMarkup(
      <EmptyStateInstitutional title="Sem dados" description="Cadastre informacoes para continuar." />,
    );
    expect(html).toContain("Sem dados");
    expect(html).toContain("Cadastre informacoes");
  });

  it("renders section and stat card tokens", () => {
    const sectionHtml = renderToStaticMarkup(<SectionCard>Conteudo</SectionCard>);
    const statHtml = renderToStaticMarkup(<StatCard label="Pendencias" value={3} tone="danger" />);
    expect(sectionHtml).toContain("Conteudo");
    expect(statHtml).toContain("Pendencias");
    expect(statHtml).toContain(">3<");
  });
});
