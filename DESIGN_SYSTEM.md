# iFood CMS — Design System (export portátil)

Pacote autocontido para reusar este design em outro projeto. Copie:
1. O bloco **CSS tokens** abaixo (cole num `design-system.css` global e importe no root).
2. As **fontes** `iFood RC Titulos` / `iFood RC Textos` (`.woff2`) + o bloco `@font-face`.
3. Use os **contratos de componentes** como referência para recriar UI consistente.

Tema: light é o `:root`; dark sob `html[data-theme="dark"]`. Sempre usar `var(--token)` — nunca hex cravado.

---

## 1. Tokens (CSS) — colar como está

```css
:root {
  /* Fontes */
  --font-heading: 'iFood RC Titulos', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: 'iFood RC Textos', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;

  /* Surfaces */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --bg-tertiary: #E0E0E0;
  --bg-hover: rgba(0,0,0,0.08);
  --bg-active: rgba(0,0,0,0.16);
  --bg-floating: #FFFFFF;
  --bg-dark: #141414;
  --bg-overlay: rgba(0,0,0,0.4);
  --bg-disabled: #EBEBEB;
  --home-card-bg: #FFFFFF;
  --home-bg: #F5F5F5;
  --home-btn-border: #E7E7E7;

  /* Text */
  --text-primary: #141414;
  --text-secondary: #666666;
  --text-placeholder: #666666;
  --text-disabled: #A3A3A3;
  --text-tertiary: #A3A3A3;
  --text-inverse: #FFFFFF;
  --text-brand: #EB0033;

  /* Brand */
  --brand: #EB0033;
  --brand-hover: #FF476F;
  --brand-pressed: #CC002C;
  --brand-subtle: #FFEBEF;
  --brand-subtle-hover: #FFC2CF;
  --brand-on-subtle: #CC002C;

  /* Borders */
  --border-default: #EBEBEB;
  --border-active: #141414;
  --border-focus: #0083CC;
  --border-brand: #EB0033;
  --border-disabled: #EBEBEB;
  --border-strong: #D4D4D4;
  --border-path: #CCCCCC;

  /* Semantic */
  --color-success: #1FAD68; --color-success-text: #007A3F; --color-success-bg: #EBFFF5; --color-success-on: #007A3F;
  --color-warning: #FFC347; --color-warning-text: #A36D00; --color-warning-bg: #FFF8EB; --color-warning-on: #7A5200;
  --color-error:   #FF4747; --color-error-text:   #CC0000; --color-error-bg:   #FFEBEB; --color-error-on:   #7A0000;
  --color-info:    #47BDFF; --color-info-text:    #0083CC; --color-info-bg:    #EBF8FF; --color-info-on:    #0066A3;

  /* Status (experimentos) */
  --color-status-draft: #9fa0aa; --color-status-running: #4cd8b9; --color-status-paused: #ebb400;
  --color-status-completed: #787878; --color-status-published: #4cd8b9;

  /* Tipografia (size / line-height) */
  --text-h1: 24px; --text-h1-lh: 32px;
  --text-h2: 20px; --text-h2-lh: 32px;
  --text-h3: 18px; --text-h3-lh: 24px;
  --text-p1: 16px; --text-p1-lh: 24px;
  --text-p2: 14px; --text-p2-lh: 16px;
  --text-p3: 12px; --text-p3-lh: 16px;
  --text-c1: 10px; --text-c1-lh: 16px;
  --text-display: 48px; --text-display-lh: 56px;
  --text-title: 32px;   --text-title-lh: 40px;
  /* aliases */
  --text-xs: 10px; --text-sm: 12px; --text-base: 14px; --text-md: 16px; --text-lg: 18px; --text-xl: 24px; --text-2xl: 32px;

  /* Pesos / tracking */
  --weight-regular: 400; --weight-medium: 500; --weight-semibold: 600; --weight-bold: 700; --weight-extrabold: 800;
  --tracking-tight: -1px; --tracking-supertight: -2px; --tracking-normal: 0;

  /* Spacing (escala 4px) */
  --space-0_5: 2px; --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;
  --space-14: 56px; --space-16: 64px; --space-20: 80px;

  /* Radius */
  --radius-sm: 4px; --radius-md: 8px; --radius-re: 12px; --radius-lg: 16px; --radius-xl: 24px; --radius-full: 9999px;

  /* Sombra */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);

  /* Transições */
  --transition-fast: 150ms ease-out; --transition-base: 200ms ease-out; --transition-slow: 300ms ease-out;
}

html[data-theme="dark"] {
  --bg-primary: #121314;
  --bg-secondary: #141414;
  --bg-tertiary: #1F1F1F;
  --bg-hover: rgba(255,255,255,0.08);
  --bg-active: rgba(255,255,255,0.16);
  --bg-floating: #1A1A1A;
  --bg-dark: #F5F5F5;
  --bg-overlay: rgba(0,0,0,0.6);
  --home-card-bg: #1B1C1E;
  --home-bg: #121314;
  --home-btn-border: #232427;
  --bg-disabled: #1A1A1A;

  --text-primary: #F5F5F5;
  --text-secondary: #A3A3A3;
  --text-placeholder: #737373;
  --text-disabled: #525252;
  --text-tertiary: #A3A3A3;
  --text-inverse: #0A0A0A;
  --text-brand: #FF4D6A;

  --brand: #EB0033;
  --brand-hover: #FF1A4D;
  --brand-pressed: #CC002C;
  --brand-subtle: rgba(235,0,51,0.15);
  --brand-subtle-hover: rgba(235,0,51,0.25);
  --brand-on-subtle: #FF4D6A;

  --border-default: #262626;
  --border-active: #F5F5F5;
  --border-focus: #47BDFF;
  --border-brand: #EB0033;
  --border-disabled: #1F1F1F;
  --border-strong: #404040;
  --border-path: #333333;

  --color-success: #22C55E; --color-success-text: #4ADE80; --color-success-bg: rgba(34,197,94,0.12); --color-success-on: #4ADE80;
  --color-warning: #FACC15; --color-warning-text: #FDE047; --color-warning-bg: rgba(250,204,21,0.12); --color-warning-on: #FDE047;
  --color-error:   #EF4444; --color-error-text:   #F87171; --color-error-bg:   rgba(239,68,68,0.12); --color-error-on:   #F87171;
}
```

### Base global
```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg-primary); font-family: var(--font-body); font-size: var(--text-base);
  color: var(--text-primary); line-height: 1.5; -webkit-font-smoothing: antialiased; }
h1,h2,h3,h4,h5,h6 { font-family: var(--font-heading); color: var(--text-primary); }
button,a,input,textarea,select { outline: none; font-family: inherit; }
:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { transition-duration: .01ms !important; animation-duration: .01ms !important; } }
```

---

## 2. Fontes

```css
@font-face { font-family:'iFood RC Titulos'; src:url('/Font/iFoodRCTitulos-Regular-web.woff2') format('woff2'); font-weight:400; font-display:swap; }
@font-face { font-family:'iFood RC Titulos'; src:url('/Font/iFoodRCTitulos-Medium-web.woff2')  format('woff2'); font-weight:500; font-display:swap; }
@font-face { font-family:'iFood RC Titulos'; src:url('/Font/iFoodRCTitulos-Bold-web.woff2')    format('woff2'); font-weight:700; font-display:swap; }
@font-face { font-family:'iFood RC Textos';  src:url('/Font/iFoodRCTextos-Regular-web.woff2')  format('woff2'); font-weight:400; font-display:swap; }
@font-face { font-family:'iFood RC Textos';  src:url('/Font/iFoodRCTextos-Medium-web.woff2')   format('woff2'); font-weight:500; font-display:swap; }
@font-face { font-family:'iFood RC Textos';  src:url('/Font/iFoodRCTextos-Bold-web.woff2')     format('woff2'); font-weight:700; font-display:swap; }
```
Pesos disponíveis: Thin(100), Light(300), Regular(400), Medium(500), Bold(700), ExtraBold(800) — para ambas. Preload os críticos com `<link rel="preload" as="font" type="font/woff2" crossorigin>`.

---

## 3. Ícones
- SVGs em `public/icons/`, carregados por nome, injetados inline.
- Padrão (estilo **Pikaicons**): `stroke="currentColor"`, `stroke-width:2`, `linecap/linejoin: round`, viewBox 24.
- Cor vem de `currentColor` (herda do texto). Tamanho via `width/height`.
- Componente `Icon`: faz `fetch(/icons/{name}.svg)`, valida (sem `<script>`/handlers) e substitui `width/height` pelo `size`.

---

## 4. Componentes (contratos)

### Button
- Variants: `primary` (bg `--brand`, texto `--text-inverse`), `secondary` (bg `--bg-secondary`, borda `--home-btn-border`), `danger` (outline `--color-error`, preenche no hover), `ghost` (transparente).
- Sizes: `md` (8px/14px, padrão) · `sm` (6px/12px). Radius 10px, `display:inline-flex; gap:8px`. `loading` mostra `…`.
- **Regra**: usar SEMPRE o mesmo componente e o size padrão (`md`) salvo necessidade.

### Card
- Base: bg `--home-card-bg`, radius 12–16, **sem borda**, hover `translateY(-2px)` + `--shadow-lg`.
- Seleção: fundo `--brand-subtle` (sem stroke) ou borda 1px `--brand` quando precisa de destaque forte.
- Avatares (autor/colaboradores): quadrado-arredondado, radius 6–8px, stack com overlap `-8px`, borda 2px na cor do card.

### Sidebar (navegação)
- Fixa 64px, ícones 20px, item 40px radius-md. Hover `--bg-hover` + texto `--text-primary`. Ativo: cor `--brand` + bg `--brand-subtle`.
- Tooltip: à direita (`left: calc(100% + 12px)`), bg `--bg-dark`, texto `--text-inverse`, radius-sm, aparece no hover (opacity).

### Painel flutuante
- `position:fixed`, margem ~8–16px, radius 16, **sem stroke**, `--shadow-lg`.
- Fundo translúcido: `color-mix(in srgb, var(--bg-primary) 75%, transparent)` + `backdrop-filter: blur(20px)`.
- Abrir/fechar com fade + slide (GSAP ou CSS); fecha ao clicar fora.

### Inputs
- bg `--bg-secondary`/`--bg-primary`, **sem borda** (ou 1px `--border-default`), radius-md, foco `--border-active`. Placeholder `--text-secondary`.

### Dropdown (select custom)
- Trigger estilo input + lista flutuante (radius-md, `--shadow-md`), fecha em click-fora/Esc. Padrão único em toda a app (filtros, role, vertical, zoom).

### Tag (pill)
- Pill `--bg-secondary`, radius-full, `--text-xs`. Ação "adicionar": pill outline 1px `#666666`.

### Toast
- Fixo bottom-right, radius-md, `--shadow-md`, sucesso `--color-success` / erro `--color-error`, texto `--text-inverse`. Slide-up ~250ms.

### Status badge (experimentos)
- Cor por status (`--color-status-*`) + fundo 12% alpha; pill.

---

## 5. Estados & princípios
- **Seleção** = fundo (`--brand-subtle`) ou borda 1px `--brand` (mantida no hover).
- **Hover** = `--bg-hover` ou `--border-strong`. **Foco** = outline 2px `--border-focus`.
- **Sem linhas/strokes neutros** quando possível — separar por background, não por borda.
- **Consistência componentizada**: mesmo componente + mesmo size em todas as telas.
- **Thumbnails**: imagem maior que o container → `cover`; menor → tamanho natural centralizado; SVG → `contain` (e sanitizar `preserveAspectRatio="none"`).

---

## 6. SEO / a11y (para apps de página pública)
- `<html lang>`, semântica (`header`/`main`/`section`/`footer`), 1 `<h1>`, skip-to-content.
- Imagens decorativas `alt=""`+`aria-hidden`; ícones interativos com `aria-label`. CTAs como `<a href>`.
- Metadata global no `layout` + `generateMetadata` por rota; `robots.txt` + `sitemap`. Fontes `font-display: swap` + preload.
