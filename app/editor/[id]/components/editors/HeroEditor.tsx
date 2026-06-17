'use client';

import type { HeroBlock, HeroVariant, HeroCTA, HeroSlide } from '@/types/database';
import styles from '../../editor.module.css';
import { ImageUpload } from '../ImageUpload';

interface Props {
  block: HeroBlock;
  onUpdate: (block: HeroBlock) => void;
}

const VARIANTS: { v: HeroVariant; label: string }[] = [
  { v: 'full', label: 'Full' },
  { v: 'slider', label: 'Slider' },
  { v: 'centered', label: 'Centralizado' },
  { v: 'split-image', label: 'Split imagem' },
  { v: 'split-form', label: 'Split form' },
];

const SLIDER_VARIANTS: HeroVariant[] = ['full', 'slider'];
const MAX_CTAS = 2;
const MAX_SLIDES = 3;

function emptyCta(): HeroCTA {
  return { text: 'Botão', link: '#', style: 'primary' };
}
function emptySlide(): HeroSlide {
  return { title: ['Novo slide'], description: 'Descrição do slide', ctas: [emptyCta()], background_image: '' };
}

/* ---- segmented genérico ---- */
function Segmented<T extends string>({
  value, options, onChange, label,
}: {
  value: T | undefined;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      <div className={styles.segmented} role="group">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            className={`${styles.segmentBtn} ${value === o.v ? styles.segmentBtnActive : ''}`}
            onClick={() => onChange(o.v)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- editor de CTAs (máx. 2) ---- */
function CtasEditor({
  value, onChange,
}: {
  value: HeroCTA[] | undefined;
  onChange: (v: HeroCTA[]) => void;
}) {
  const ctas = value ?? [];
  const setCta = (i: number, patch: Partial<HeroCTA>) =>
    onChange(ctas.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <div className={styles.arraySection}>
      <div className={styles.arraySectionHeader}>
        <span className={styles.arraySectionTitle}>Botões ({ctas.length}/{MAX_CTAS})</span>
        {ctas.length < MAX_CTAS && (
          <button type="button" className={styles.addItemBtn} onClick={() => onChange([...ctas, emptyCta()])}>
            + Botão
          </button>
        )}
      </div>
      {ctas.map((c, i) => (
        <div key={i} className={styles.arrayItem}>
          <button type="button" className={styles.removeItemBtn} onClick={() => onChange(ctas.filter((_, j) => j !== i))}>×</button>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Texto</label>
              <input className={styles.fieldInput} value={c.text} onChange={(e) => setCta(i, { text: e.target.value })} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Link</label>
              <input className={styles.fieldInput} value={c.link} onChange={(e) => setCta(i, { link: e.target.value })} />
            </div>
          </div>
          <Segmented
            label="Estilo"
            value={c.style ?? 'primary'}
            onChange={(v) => setCta(i, { style: v })}
            options={[{ v: 'primary', label: 'Primário' }, { v: 'secondary', label: 'Secundário' }, { v: 'empty', label: 'Vazio' }, { v: 'red', label: 'Vermelho' }]}
          />
        </div>
      ))}
      {ctas.length === 0 && <p className={styles.selectorEmpty}>Sem botões (CTA opcional).</p>}
    </div>
  );
}

/* ---- editor de slides (full/slider) ---- */
function SlidesEditor({
  value, onChange,
}: {
  value: HeroSlide[] | undefined;
  onChange: (v: HeroSlide[]) => void;
}) {
  const slides = value ?? [];
  const setSlide = (i: number, patch: Partial<HeroSlide>) =>
    onChange(slides.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div className={styles.arraySection}>
      <div className={styles.arraySectionHeader}>
        <span className={styles.arraySectionTitle}>Slides ({slides.length}/{MAX_SLIDES})</span>
        {slides.length < MAX_SLIDES && (
          <button type="button" className={styles.addItemBtn} onClick={() => onChange([...slides, emptySlide()])}>
            + Slide
          </button>
        )}
      </div>
      {slides.map((s, i) => (
        <div key={i} className={styles.arrayItem}>
          {slides.length > 1 && (
            <button type="button" className={styles.removeItemBtn} onClick={() => onChange(slides.filter((_, j) => j !== i))}>×</button>
          )}
          <span className={styles.arraySectionTitle}>Slide {i + 1}</span>
          <p className={styles.selectorEmpty}>Título e descrição: duplo-clique no preview.</p>
          <ImageUpload label="Imagem de fundo" value={s.background_image || ''} onChange={(url) => setSlide(i, { background_image: url })} />
          <CtasEditor value={s.ctas} onChange={(v) => setSlide(i, { ctas: v })} />
        </div>
      ))}
    </div>
  );
}

/* ---- HeroEditor ---- */
export function HeroEditor({ block, onUpdate }: Props) {
  const d = block.data;
  const variant: HeroVariant = d.variant || 'full';
  const isSliderVariant = SLIDER_VARIANTS.includes(variant);
  const sliderOn = isSliderVariant && !!d.slider;

  const update = (patch: Partial<typeof d>) => onUpdate({ ...block, data: { ...d, ...patch } });

  const changeVariant = (v: HeroVariant) => {
    const patch: Partial<typeof d> = { variant: v };
    // Semeia campos específicos quando faltam, para a variante renderizar
    if (v === 'split-form' && !d.form) {
      patch.form = {
        title: 'Fale com a gente',
        subtitle: 'Preencha e retornaremos em breve.',
        label: 'E-mail',
        placeholder: 'seu@email.com',
        button_text: 'Quero saber mais',
        legal: 'Ao continuar, você concorda com nossos termos e política de privacidade.',
        legal_link_text: 'Saiba mais',
        legal_link: '#',
      };
    }
    if ((v === 'split-image' || v === 'split-form') && !d.assetPosition) patch.assetPosition = 'right';
    update(patch);
  };

  const toggleSlider = (on: boolean) => {
    if (on && (!d.slides || d.slides.length === 0)) {
      update({
        slider: true,
        slides: [{ title: d.title, description: d.description, ctas: d.ctas, background_image: d.background_image }, emptySlide()],
      });
    } else {
      update({ slider: on });
    }
  };

  const setForm = (patch: Partial<NonNullable<typeof d.form>>) =>
    update({ form: { ...(d.form as NonNullable<typeof d.form>), ...patch } });

  return (
    <>
      <Segmented label="Variante" value={variant} onChange={changeVariant} options={VARIANTS} />

      {/* Cor de fundo sólida (todas as variantes, exceto slider per-slide) */}
      {!sliderOn && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Cor de fundo</label>
          <div className={styles.fieldRow} style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={d.background_color || '#272727'}
              onChange={(e) => update({ background_color: e.target.value })}
              style={{ width: 36, height: 36, padding: 2, border: '1px solid #e8e8ed', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}
            />
            <input
              className={styles.fieldInput}
              value={d.background_color || ''}
              placeholder="#272727"
              onChange={(e) => update({ background_color: e.target.value || undefined })}
            />
            {d.background_color && (
              <button
                type="button"
                className={styles.removeItemBtn}
                title="Remover cor"
                onClick={() => update({ background_color: undefined })}
              >
                ×
              </button>
            )}
          </div>
          <p className={styles.selectorEmpty} style={{ marginTop: 4 }}>Sobrepõe o fundo padrão escuro. Deixe vazio para usar o padrão.</p>
        </div>
      )}

      {/* full / slider com carrossel ligado → edita slides; senão, campos simples */}
      {isSliderVariant && (
        <Segmented
          label="Modo"
          value={sliderOn ? 'slider' : 'single'}
          onChange={(v) => toggleSlider(v === 'slider')}
          options={[{ v: 'single', label: 'Banner único' }, { v: 'slider', label: 'Carrossel (até 3)' }]}
        />
      )}

      {sliderOn ? (
        <SlidesEditor value={d.slides} onChange={(v) => update({ slides: v })} />
      ) : (
        <>
          <p className={styles.selectorEmpty}>Edite título e descrição com duplo-clique direto no preview.</p>

          {/* posição do card (split) */}
          {(variant === 'split-image' || variant === 'split-form') && (
            <Segmented
              label="Posição do card"
              value={d.assetPosition ?? 'right'}
              onChange={(v) => update({ assetPosition: v })}
              options={[{ v: 'left', label: 'Esquerda' }, { v: 'right', label: 'Direita' }]}
            />
          )}

          {/* imagem de fundo (full/slider banner único) */}
          {isSliderVariant && (
            <ImageUpload label="Imagem de fundo" value={d.background_image || ''} onChange={(url) => update({ background_image: url })} />
          )}

          {/* imagem do card (split-image) */}
          {variant === 'split-image' && (
            <ImageUpload label="Imagem do card" value={d.image || ''} onChange={(url) => update({ image: url })} />
          )}

          {/* CTAs — todas as variantes exceto split-form (que usa o botão do form) */}
          {variant !== 'split-form' && <CtasEditor value={d.ctas} onChange={(v) => update({ ctas: v })} />}

          {/* formulário (split-form) */}
          {variant === 'split-form' && d.form && (
            <div className={styles.arraySection}>
              <div className={styles.arraySectionHeader}>
                <span className={styles.arraySectionTitle}>Formulário</span>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Título do card</label>
                <input className={styles.fieldInput} value={d.form.title} onChange={(e) => setForm({ title: e.target.value })} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Subtítulo</label>
                <input className={styles.fieldInput} value={d.form.subtitle} onChange={(e) => setForm({ subtitle: e.target.value })} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Label do campo</label>
                  <input className={styles.fieldInput} value={d.form.label} onChange={(e) => setForm({ label: e.target.value })} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Placeholder</label>
                  <input className={styles.fieldInput} value={d.form.placeholder} onChange={(e) => setForm({ placeholder: e.target.value })} />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Texto do botão</label>
                <input className={styles.fieldInput} value={d.form.button_text} onChange={(e) => setForm({ button_text: e.target.value })} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Texto legal</label>
                <textarea className={styles.fieldTextarea} value={d.form.legal} onChange={(e) => setForm({ legal: e.target.value })} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Texto do link</label>
                  <input className={styles.fieldInput} value={d.form.legal_link_text} onChange={(e) => setForm({ legal_link_text: e.target.value })} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Link</label>
                  <input className={styles.fieldInput} value={d.form.legal_link} onChange={(e) => setForm({ legal_link: e.target.value })} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
