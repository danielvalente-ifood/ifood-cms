# iFood Pages — Design

**Data:** 2026-06-02
**Status:** Aprovado (design) — aguardando plano de implementação

## Contexto

Hoje existem dois apps separados (sem monorepo):
- **ifood-cms** — editor/admin (Next 15, Supabase). UI e componentes próprios do CMS.
- **ifood-landing** — renderiza as páginas publicadas (`/p/[slug]`), serve preview isolado (`/preview/[type]`) e contém os componentes de landing (Hero, Vision, Growth, Integrated, Results, FAQ, Navbar, Footer, Badge), além de tracking, A/B testing, personalização e SEO.

Problema: os componentes/padrões das landing pages estão sem uma **fonte única de verdade**. O painel "Adicionar" do CMS usa um `BLOCK_VARIANTS` hardcoded; previews e render têm switches espalhados; adicionar componente novo exige mexer em vários lugares. Falta também um lugar para o time ver o que existe (catálogo).

Objetivo: criar o **iFood Pages**, projeto que centraliza as páginas criadas e padroniza/reaproveita os componentes de landing. Importante: o padrão visual e os componentes do **ifood-cms** continuam exclusivos do CMS — o iFood Pages cuida só dos componentes das **páginas criadas**.

## Decisões

- **iFood Pages é um projeto novo**, semeado a partir do código já comprovado do `ifood-landing` (não reescrito do zero). O `ifood-landing` é aposentado após o cutover.
- **Responsabilidades:** render público das páginas, preview isolado para o CMS, fonte única dos componentes (registry) e catálogo navegável.
- **Integração com o CMS:** iframe (edição/preview) + Supabase compartilhado. Sem acoplar runtime (CMS não importa os componentes no próprio React).
- **Sem mudança de schema.** iFood Pages lê `pages` + `page_versions` publicados.

## Arquitetura

Novo projeto `ifood-pages` (Next 15, mesmo Supabase do CMS). Rotas/áreas:

- `app/p/[slug]/` — render público das páginas publicadas (migra do ifood-landing).
- `app/preview/[type]/` — render isolado de um bloco com defaults; alimenta as miniaturas e o iframe de edição do CMS (migra do ifood-landing).
- `app/catalog/` — galeria navegável de componentes/variantes, gerada a partir do registry (novo).
- `app/api/registry/` — expõe os metadados do registry em JSON para o CMS (fase 2).

O CMS permanece o editor; conversa via **iframe + Supabase**.

## Registry de componentes (peça central)

Módulo `registry/` (index + 1 arquivo por componente) que é a **fonte única de verdade**. Por componente:

```ts
{
  type: 'hero',
  label: 'Hero',
  category: 'Header',
  component: Hero,                 // React component
  defaults: HeroDefaults,          // dados padrão
  variants: [{ id, label, description, config }],
  schema: [...],                   // campos editáveis (referência p/ o editor do CMS)
}
```

Consequências:
- Adicionar componente novo = 1 entrada no registry → aparece automaticamente em `/preview`, `/catalog` e na lista do CMS. Sem upload de asset, sem hardcode espalhado.
- `/preview/[type]` e o `DynamicPage` passam a renderizar **a partir do registry** (em vez de `switch` hardcoded).
- O painel "Add" do CMS pode (fase 2) ler `/api/registry` e montar a lista dinamicamente, aposentando o `BLOCK_VARIANTS` hardcoded.

## Estrutura de pastas

```
ifood-pages/
  app/
    p/[slug]/        render público
    preview/[type]/  preview isolado
    catalog/         galeria (lê o registry)
    api/registry/    metadados do registry (JSON) — fase 2
    layout.tsx  globals.css  fonts.css  sitemap.ts  robots.txt
  components/        Hero, Vision, Growth, Integrated, Results, FAQ, Navbar, Footer, Badge…
  registry/          index + 1 arquivo por componente (meta/defaults/variants)
  lib/               ab-testing, personalization, tracker, supabase
  public/Font/  public/images/
```

## Plano de migração (incremental, baixo risco)

1. Criar repo `ifood-pages` semeado com `components/`, `lib/`, e rotas `/p/[slug]` e `/preview/[type]` do ifood-landing.
2. **Limpar legado:** remover rotas soltas (`/delivery`, `/ads`, `/ifood-pago`, `/logistica`) e o que não for de landing; remover qualquer resíduo (ex. Retune).
3. Criar `registry/` e refatorar `/preview` + `DynamicPage` para renderizar a partir do registry.
4. Criar `/catalog` lendo o registry.
5. Garantir `.env` (Supabase URL/anon, GA), fontes e imagens; `tsc` + `build` verdes.
6. Apontar `NEXT_PUBLIC_LANDING_URL` do CMS para o novo deploy. Congelar/aposentar o ifood-landing.
7. (Fase 2, opcional) CMS lê `/api/registry` para montar o painel Add dinâmico.

## Dados / integração

- iFood Pages lê `pages` + `page_versions` publicados via anon key (somente leitura para render).
- Tracking, A/B testing e personalização migram como estão do ifood-landing.
- CMS continua dono da escrita (criação/edição/publicação).

## Riscos

- Repo novo: garantir env, fontes e imagens copiadas; validar `tsc` + `build` antes do cutover.
- Cutover do `NEXT_PUBLIC_LANDING_URL` só quando o novo deploy estiver verde.
- Não arrastar legado (rotas antigas, Retune).

## Fora de escopo (YAGNI)

- Monorepo / pacote npm de componentes.
- CMS importando os componentes no próprio runtime.
- Versionamento de componentes, multi-tenant.

(Reavaliar se/quando houver necessidade real.)

## Verificação (end-to-end)

1. `ifood-pages` sobe local: `/p/<slug-publicado>` renderiza igual ao ifood-landing atual.
2. `/preview/<type>` renderiza o bloco isolado; CMS apontado para o novo URL mostra miniaturas e iframe de edição funcionando.
3. `/catalog` lista todos os componentes do registry com suas variantes.
4. Adicionar 1 componente novo no registry → aparece em `/preview`, `/catalog` e na lista do CMS sem outras mudanças.
5. `tsc --noEmit` e `build` verdes nos dois projetos.
