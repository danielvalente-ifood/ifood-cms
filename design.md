# Design System — iFood CMS

Documento de referência das características de design aplicadas no projeto. Tokens definidos em `app/design-system.css` (light é o `:root`, dark em `html[data-theme="dark"]`). Sempre usar variáveis CSS — nunca hex hardcoded em componentes (exceto casos pontuais documentados).

---

## 1. Tipografia

### Fontes
- **Títulos** (`--font-heading`): `iFood RC Titulos` → fallback system-ui
- **Corpo** (`--font-body`): `iFood RC Textos` → fallback system-ui
- **Mono** (`--font-mono`): `SF Mono, Fira Code, Consolas`
- Arquivos `.woff2` (com fallback `.ttf`), `font-display: swap`, pesos críticos com `<link rel=preload>`.

### Escala (Figma)
| Token | Size / LH | Uso |
|-------|-----------|-----|
| `--text-h1` | 24 / 32 | Heading H1 |
| `--text-h2` | 20 / 32 | Heading H2 |
| `--text-h3` | 18 / 24 | Heading H3 |
| `--text-p1` | 16 / 24 | Parágrafo |
| `--text-p2` | 14 / 16 | Parágrafo |
| `--text-p3` | 12 / 16 | Parágrafo |
| `--text-c1` | 10 / 16 | Caption |
| `--text-display` | 48 / 56 | Title T5 |
| `--text-title` | 32 / 40 | Title T8 |

Aliases compat: `--text-xs:10`, `--text-sm:12`, `--text-base:14`, `--text-md:16`, `--text-lg:18`, `--text-xl:24`, `--text-2xl:32`.

### Pesos
`--weight-regular:400` · `--weight-medium:500` · `--weight-semibold:600` · `--weight-bold:700` · `--weight-extrabold:800`

### Letter-spacing
`--tracking-tight:-1px` · `--tracking-supertight:-2px` · headings grandes usam `-0.3px` a `-0.96px`.

---

## 2. Cores

### Marca
| Token | Light | Dark |
|-------|-------|------|
| `--brand` | `#EB0033` | `#EB0033` |
| `--brand-hover` | `#FF476F` | `#FF1A4D` |
| `--brand-pressed` | `#CC002C` | `#CC002C` |
| `--brand-subtle` | `#FFEBEF` | `rgba(235,0,51,.15)` |

### Superfícies
| Token | Light | Dark |
|-------|-------|------|
| `--bg-primary` | `#FFFFFF` | `#121314` |
| `--bg-secondary` | `#F5F5F5` | `#141414` |
| `--bg-tertiary` | `#E0E0E0` | `#1F1F1F` |
| `--home-card-bg` | `#FFFFFF` | `#1B1C1E` |
| `--bg-hover` | `rgba(0,0,0,.08)` | `rgba(255,255,255,.08)` |
| `--bg-overlay` | `rgba(0,0,0,.4)` | `rgba(0,0,0,.6)` |

> Cor de card dark de referência usada em painéis flutuantes: **`#252729`**.

### Texto
| Token | Light | Dark |
|-------|-------|------|
| `--text-primary` | `#141414` | `#F5F5F5` |
| `--text-secondary` | `#666666` | `#A3A3A3` |
| `--text-disabled` | `#A3A3A3` | `#525252` |
| `--text-inverse` | `#FFFFFF` | `#0A0A0A` |

### Bordas
`--border-default` (`#EBEBEB` / `#262626`) · `--border-strong` (hover) · `--border-active` · `--border-focus` (`#0083CC` / `#47BDFF`). **Stroke neutro de elemento**: `#666666` (ex. pill de tag).

### Semânticas
`--color-success`, `--color-warning`, `--color-error`, `--color-info` — cada uma com `-text`, `-bg`, `-on`.

### Status (experimentos)
`draft #9fa0aa` · `running/published #4cd8b9` · `paused #ebb400` · `completed #787878` — cada um com `-bg` em 12% alpha.

### Verticais (cor por vertical, vem do banco)
Delivery `#EB0033` · Ads `#FFC347` · Logística `#1FAD68` · **iFood Pago `#7E0A33`** · **Salão `#F91C4C`**.

---

## 3. Espaçamento, raio, sombra, transição

- **Spacing**: escala 4px → `--space-1`(4) … `--space-6`(24), `--space-8`(32), `--space-16`(64).
- **Radius**: `sm:4` · `md:8` · `re:12` · `lg:16` · `xl:24` · `full:9999`.
- **Sombra**: `--shadow-sm` (0 1px 2px), `--shadow-md` (0 4px 12px), `--shadow-lg` (0 12px 40px).
- **Transição**: `--transition-fast:150ms` · `base:200ms` · `slow:300ms`, todas `ease-out`.
- **Motion**: respeita `prefers-reduced-motion`. Animações ricas via **GSAP** (login, painel de mídia).

---

## 4. Componentes

### Botão — `components/ui/button`
- **Sempre** usar este componente. Variants: `primary` (brand), `secondary` (bg-secondary + border), `danger` (outline error), `ghost`.
- Sizes: `md` (padrão, 8/14px) e `sm` (6/12px). **Manter o size padrão (`md`) por consistência** salvo necessidade real.
- Radius 10px, `gap:8px` (ícone+texto), `loading` mostra `...`.

### Cards
- Card base: `--home-card-bg`, radius 12–16, sem stroke por padrão, hover `translateY(-2px)` + `--shadow-lg`.
- **PageCard**: 404px, status badge + data no topo, vertical/título/autor embaixo. Avatar do autor **quadrado-arredondado** (radius 6px).
- **FolderCard** (mídia): ícone folder colorido pela vertical (`{color}1A` bg), título, `N arquivos`, tamanho total, **stack de avatares** (28px, radius 8px, overlap -8px) de quem tem acesso. Sem stroke, sem divider.

### Sidebar
Fixa 64px, ícones 20px via `<Icon>`, tooltip no hover, toggle de tema + avatar/sair no rodapé.

### Painel flutuante (Asset Details)
- `position:fixed`, margem 8px (top/bottom/right), `width:340`, radius 16, **sem stroke**.
- Fundo translúcido `#252729` 85% + `backdrop-filter: blur(20px)`, `--shadow-lg`.
- Abre/fecha com **GSAP** (slide+fade; fecha anima saída e só então desmonta). Fecha ao clicar fora.

### Tags (pill)
- Tag: pill `--bg-secondary` + border default, `--text-xs`, botão remover circular.
- "Adicionar tag": pill outline `1px solid #666666`, sem ícone.

### Slider (distribuição de tráfego)
- Card padding 16px, título 14px medium, texto 10px regular.
- Track 8px pill, fill `--brand`, **thumb pill branco 40×22** com sombra.

### Ícones — `components/Icon/Icon`
- SVGs em `public/icons/`, carregados por nome, `currentColor`, sanitizados. Padrão: stroke `currentColor`, `stroke-width:2`, linecaps round (estilo **Pikaicons**).
- SVGs de mídia: normalizar `preserveAspectRatio` (Figma exporta `none` → distorce).

---

## 5. Estados & seleção
- **Selecionado** (cards de mídia, blocos A/B): fundo `--bg-primary` + **borda 1px `--brand`** (vermelha). Mantida no hover. Badge de check quando aplicável.
- Hover: `--bg-hover` / `--border-strong`.
- Focus visível: `outline 2px --border-focus`, offset 2px.

---

## 6. Imagens / thumbnails
- Imagem **maior** que o container → `cover` (preenche, corta leve). **Menor** → tamanho natural centralizada (`fitOnLoad` define `object-fit`).
- **SVG**: `object-fit: contain`, ~55% do container, centralizado (não estoura).

---

## 7. Acessibilidade / SEO (landing)
- `<html lang>`, semântica (`header`/`main`/`section`/`footer`), heading hierárquico, skip-to-content.
- Imagens decorativas `alt=""` + `aria-hidden`; ícones interativos com `aria-label`.
- CTAs como `<a href>` (não `<button>`) para crawl. Metadata + OpenGraph + sitemap + robots.
