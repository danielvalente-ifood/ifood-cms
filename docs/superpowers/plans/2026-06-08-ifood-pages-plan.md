# iFood Pages — Plano de Implementação

**Data:** 2026-06-08
**Spec base:** `docs/superpowers/specs/2026-06-02-ifood-pages-design.md`
**Status:** Pronto para execução

## Objetivo

Criar o app novo `ifood-pages`, semeado do `ifood-landing` comprovado, com um **registry** como fonte única de verdade dos componentes de landing. Cutover do CMS para o novo deploy só quando estiver verde. Sem mudança de schema.

## Princípios de execução

- Cada fase termina com **`npx tsc --noEmit` + `npm run build` verdes**. Não avança com vermelho.
- `ifood-landing` permanece intocado e funcional até o cutover (Fase 7). É a rede de segurança.
- Commits por fase em branch `feature/ifood-pages-*`; PR para `main` por projeto. Nunca push direto em `main`.
- Não arrastar legado: rotas `/ads`, `/delivery`, `/ifood-pago`, `/logistica`, proxies e resíduo Retune ficam de fora.

---

## Fase 0 — Bootstrap do repo `ifood-pages`

**Meta:** repo novo que builda vazio antes de receber código.

1. Criar diretório irmão `ifood-pages/` (fora do `ifood-cms`). `git init`, branch `main`.
2. Copiar do `ifood-landing` os arquivos de config: `package.json`, `tsconfig.json`, `next.config.*`, `.eslintrc*`, `.gitignore`, `postcss`/config de CSS se houver.
3. Ajustar `package.json`: `name: "ifood-pages"`, scripts `dev`/`build`/`start`. Definir porta dev distinta do CMS (CMS usa 3000) — usar **3002** pra dev e **3003** pra start, evitando colisão com CMS (3000/3001).
4. `npm install`.
5. Criar `app/layout.tsx`, `app/globals.css`, `app/fonts.css` (copiados do landing), e um `app/page.tsx` mínimo placeholder.

**Verificação:** `npm run dev` sobe na 3002; `npm run build` verde.

---

## Fase 1 — Semear componentes, lib, assets e rotas de render

**Meta:** paridade visual com o `ifood-landing` atual, sem o legado.

1. Copiar `components/`: `Hero`, `Vision`, `Growth`, `Integrated`, `Results`, `FAQ`, `Navbar`, `Footer`, `Badge` + auxiliares de render usados por eles (`SectionTracker`, `SkipLink`, `SalaoMenu` se referenciado pelas páginas).
2. Copiar `lib/`: `ab-testing.ts`, `personalization.ts`, `tracker.ts`, `gtag.ts`, `supabase.ts`.
3. Copiar `public/Font/` e `public/images/`, `robots.txt`, `favicon.ico`.
4. Copiar rotas de render:
   - `app/p/[slug]/` (inclui `page.tsx` + `DynamicPage.tsx`). **Não** copiar `DynamicPage_debug.tsx`.
   - `app/preview/[type]/page.tsx` (será refatorado na Fase 3 — copiar como está agora).
   - `app/sitemap.ts`.
5. Copiar **apenas** as rotas de API essenciais ao render/tracking: `app/api/track/route.ts` e `app/api/personalize/route.ts`. **Não** copiar `proxy-ads`, `proxy-delivery`, `proxy-ifood`, `proxy-logistica`.
6. Criar `.env.local` no `ifood-pages` com as vars que o landing usa (Supabase URL/anon, GA). **Pedir ao usuário os valores** — não ler `.env*` do landing sem permissão (regra de arquivos sensíveis).

**Verificação:** `tsc` + `build` verdes. `app/p/<slug-publicado>` renderiza igual ao landing atual (comparar lado a lado).

---

## Fase 2 — Limpeza de legado

**Meta:** garantir que nada do legado entrou.

1. Confirmar que `app/ads`, `app/delivery`, `app/ifood-pago`, `app/logistica` **não existem** no repo novo.
2. `grep -ri retune` no repo → zero ocorrências. Remover qualquer resíduo.
3. Remover imports/código morto referente a proxies removidos.
4. Conferir `sitemap.ts` e `Navbar`/`Footer`: remover links para rotas legadas que não existem mais.

**Verificação:** `grep` limpo; `tsc` + `build` verdes; navegação não tem links quebrados pra rotas removidas.

---

## Fase 3 — Registry (peça central) + refatorar `/preview` e `DynamicPage`

**Meta:** fonte única de verdade; `/preview` e render passam a ler do registry.

1. Criar `registry/types.ts` com a interface:
   ```ts
   export interface ComponentVariant { id: string; label: string; description: string; config?: Record<string, unknown>; }
   export interface ComponentSchemaField { key: string; label: string; type: 'text'|'textarea'|'image'|'video'|'list'|'boolean'|'select'; options?: string[]; }
   export interface RegistryEntry {
     type: string; label: string; category: string;
     component: React.ComponentType<any>;
     defaults: Record<string, unknown>;
     variants: ComponentVariant[];
     schema: ComponentSchemaField[];
   }
   ```
2. Criar `registry/<componente>.ts` (um por bloco): `hero.ts`, `vision.ts`, `growth.ts`, `integrated.ts`, `results.ts`, `faq.ts`, `navbar.ts`, `footer.ts`. Cada um exporta um `RegistryEntry` (extrair `defaults`/`variants`/`schema` do que hoje está hardcoded no `BLOCK_VARIANTS` do CMS e nos defaults dos componentes).
3. Criar `registry/index.ts`: array `registry` + helpers `getEntry(type)` e `getByCategory()`.
4. Refatorar `app/preview/[type]/page.tsx`: trocar o `switch` por `getEntry(type)` e renderizar `entry.component` com `entry.defaults`. Manter o `<style>` que força `.scroll-reveal` visível e o wrapper `pointerEvents:none`.
5. Refatorar `DynamicPage.tsx`: ao mapear blocos salvos, resolver o componente via `getEntry(block.type)` em vez de imports/switch fixos. Preservar o fluxo `postMessage('cms:update-block')` existente.

**Verificação:** `/preview/<type>` para os 8 tipos renderiza idêntico ao anterior; uma página publicada renderiza igual; `tsc` + `build` verdes.

---

## Fase 4 — Catálogo

**Meta:** galeria navegável gerada do registry.

1. Criar `app/catalog/page.tsx`: itera `registry`, agrupa por `category`, e para cada entry mostra label + variantes, usando `/preview/<type>` em iframe (ou render direto do componente) como thumbnail.
2. Estilos próprios do catálogo (não reaproveitar tokens do CMS — são apps separados).

**Verificação:** `/catalog` lista os 8 componentes com suas variantes; `tsc` + `build` verdes.

---

## Fase 5 — Teste do registry (critério de aceite do design)

**Meta:** provar que adicionar componente = 1 entrada.

1. Adicionar um componente trivial novo (ex. `Spacer`/`CTASimple`) só pra validar: criar componente + `registry/cta-simple.ts` + 1 linha no `index.ts`.
2. Confirmar que aparece automaticamente em `/preview/cta-simple` e em `/catalog` sem nenhuma outra mudança.
3. Remover o componente de teste (ou mantê-lo se útil — decidir com o usuário).

**Verificação:** o novo componente aparece nos dois lugares sem edição extra.

---

## Fase 6 — Deploy do `ifood-pages`

**Meta:** ambiente verde antes de tocar no CMS.

1. Configurar deploy (mesma plataforma do landing). Setar env vars no painel do deploy.
2. Garantir fontes/imagens servidas corretamente em produção.
3. Smoke test no domínio de deploy: `/p/<slug>`, `/preview/<type>`, `/catalog`.

**Verificação:** as três rotas funcionam no deploy; `robots.txt`/`sitemap.ts` ok.

---

## Fase 7 — Cutover do CMS

**Meta:** CMS aponta para o `ifood-pages`; landing aposentado.

1. No `ifood-cms`, atualizar `NEXT_PUBLIC_LANDING_URL` para o novo deploy (env de dev e de produção).
2. Validar no CMS: miniaturas do painel "Adicionar" (`PreviewFrame`/`/preview/<type>`) e iframe de edição carregam do novo URL.
3. Congelar/aposentar `ifood-landing` (arquivar repo; manter por um período como rollback).

**Verificação end-to-end (do spec):**
- `/p/<slug>` renderiza igual ao antigo.
- CMS apontado pro novo URL: miniaturas + iframe de edição funcionam.
- `/catalog` lista tudo.
- Componente novo no registry aparece em `/preview`, `/catalog` e (fase 8) na lista do CMS.
- `tsc --noEmit` + `build` verdes nos dois projetos.

---

## Fase 8 (opcional, fase 2 do spec) — CMS consome `/api/registry`

**Meta:** aposentar o `BLOCK_VARIANTS` hardcoded do CMS.

1. No `ifood-pages`, criar `app/api/registry/route.ts` que serializa o registry (sem o campo `component` — só metadados: `type`, `label`, `category`, `defaults`, `variants`, `schema`) em JSON.
2. No `ifood-cms` `BlockSelector.tsx`, buscar `/api/registry` e montar `blockOptions`/`BLOCK_VARIANTS` dinamicamente; remover o hardcode.
3. Tratar fallback/erro de fetch (manter UX se a API cair).

**Verificação:** painel "Adicionar" do CMS é montado a partir da API; adicionar componente no registry reflete no CMS sem mudança no CMS.

---

## Riscos & mitigações

- **Env/fontes/imagens faltando** → Fase 1 e 6 validam explicitamente antes de avançar.
- **Cutover prematuro** → só na Fase 7, com Fase 6 verde.
- **Arrastar legado** → Fase 2 com `grep` como gate.
- **Acoplar runtime** → CMS continua via iframe + Supabase; nunca importa os componentes do `ifood-pages` no próprio React.

## Fora de escopo (YAGNI)

Monorepo, pacote npm, CMS importando componentes no runtime, versionamento de componentes, multi-tenant.

## Ordem de PRs

1. PRs no repo `ifood-pages`: Fases 0–5 (pode ser 1 PR por fase ou agrupado).
2. PR no `ifood-cms`: Fase 7 (cutover do env) — só após Fase 6 verde.
3. PR no `ifood-cms`: Fase 8 (registry dinâmico) — opcional, depois.
