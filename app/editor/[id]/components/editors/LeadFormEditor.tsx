'use client';

import { useEffect } from 'react';
import type { LeadFormBlock, LeadFormField, LeadFormBenefit } from '@/types/database';
import styles from '../../editor.module.css';

interface Props {
  block: LeadFormBlock;
  onUpdate: (block: LeadFormBlock) => void;
}

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

function BenefitsEditor({ value, onChange }: { value: LeadFormBenefit[] | undefined; onChange: (v: LeadFormBenefit[]) => void }) {
  const items = value ?? [];

  return (
    <div className={styles.arraySection}>
      <div className={styles.arraySectionHeader}>
        <span className={styles.arraySectionTitle}>Benefícios ({items.length})</span>
        <button type="button" className={styles.addItemBtn} onClick={() => onChange([...items, { text: 'Novo benefício' }])}>
          + Adicionar
        </button>
      </div>
      {items.map((b, i) => (
        <div key={i} className={styles.arrayItem}>
          <button type="button" className={styles.removeItemBtn} onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Texto</label>
            <input
              className={styles.fieldInput}
              value={b.text}
              onChange={(e) => onChange(items.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
            />
          </div>
        </div>
      ))}
      {items.length === 0 && <p className={styles.selectorEmpty}>Sem benefícios.</p>}
    </div>
  );
}

function FieldsEditor({ value, onChange }: { value: LeadFormField[]; onChange: (v: LeadFormField[]) => void }) {
  const fields = value;

  const setField = (i: number, patch: Partial<LeadFormField>) =>
    onChange(fields.map((f, j) => j === i ? { ...f, ...patch } : f));

  const addField = () =>
    onChange([...fields, { id: `campo_${Date.now()}`, label: 'Campo', type: 'text', required: false }]);

  return (
    <div className={styles.arraySection}>
      <div className={styles.arraySectionHeader}>
        <span className={styles.arraySectionTitle}>Campos ({fields.length})</span>
        <button type="button" className={styles.addItemBtn} onClick={addField}>+ Campo</button>
      </div>
      {fields.map((f, i) => (
        <div key={f.id} className={styles.arrayItem}>
          <button type="button" className={styles.removeItemBtn} onClick={() => onChange(fields.filter((_, j) => j !== i))}>×</button>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Label</label>
              <input className={styles.fieldInput} value={f.label} onChange={(e) => setField(i, { label: e.target.value })} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Placeholder</label>
              <input className={styles.fieldInput} value={f.placeholder ?? ''} onChange={(e) => setField(i, { placeholder: e.target.value })} />
            </div>
          </div>
          <Segmented
            label="Tipo"
            value={f.type}
            onChange={(v) => setField(i, { type: v as LeadFormField['type'] })}
            options={[
              { v: 'text', label: 'Texto' },
              { v: 'email', label: 'Email' },
              { v: 'tel', label: 'Tel' },
              { v: 'select', label: 'Select' },
            ]}
          />
          {f.type === 'select' && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Opções (uma por linha)</label>
              <textarea
                className={styles.fieldInput}
                style={{ height: 80, resize: 'vertical', paddingTop: 8, borderRadius: 8 }}
                value={(f.options ?? []).join('\n')}
                onChange={(e) => setField(i, { options: e.target.value.split('\n').filter(Boolean) })}
              />
            </div>
          )}
          <Segmented
            label="Largura"
            value={f.fullWidth ? 'full' : 'half'}
            onChange={(v) => setField(i, { fullWidth: v === 'full' })}
            options={[{ v: 'half', label: 'Metade' }, { v: 'full', label: 'Inteiro' }]}
          />
          <Segmented
            label="Obrigatório"
            value={f.required ? 'yes' : 'no'}
            onChange={(v) => setField(i, { required: v === 'yes' })}
            options={[{ v: 'yes', label: 'Sim' }, { v: 'no', label: 'Não' }]}
          />
        </div>
      ))}
      {fields.length === 0 && <p className={styles.selectorEmpty}>Sem campos.</p>}
    </div>
  );
}

const leadFormDefaultData = {
  badge: 'Demonstração gratuita',
  title: 'Vamos agendar sua demonstração gratuita',
  subtitle: 'Contrate a solução para o seu restaurante que centraliza sua gestão, traz clareza no dia a dia.',
  benefits: [
    { text: 'Resposta em até 2 horas úteis' },
    { text: 'Demo personalizada para o seu segmento' },
    { text: 'Sem compromisso de contratação' },
    { text: 'Diagnóstico gratuito da sua operação atual' },
  ],
  form_title: 'Preencha seus dados',
  fields: [
    { id: 'nome', label: 'Nome completo', type: 'text' as const, placeholder: 'Seu nome', required: true },
    { id: 'email', label: 'Email', type: 'email' as const, placeholder: 'Seu email', required: true },
    { id: 'telefone', label: 'Telefone / Whatsapp', type: 'tel' as const, placeholder: 'Número', required: true },
    { id: 'restaurante', label: 'Nome do restaurante', type: 'text' as const, placeholder: 'Restaurante', required: true },
    { id: 'cnpj', label: 'CNPJ', type: 'text' as const, placeholder: 'Somente números', required: false, fullWidth: true },
    { id: 'desafio', label: 'Maior desafio atual', type: 'select' as const, required: true, fullWidth: true, options: ['Delivery caótico', 'Controle Financeiro / Estoque', 'Filas no Salão', 'Tudo junto'] },
  ],
  submit_text: 'Quero ver o sistema na prática',
  success_message: 'Recebemos! Nossa equipe entrará em contato em até 2 horas.',
};

export function LeadFormEditor({ block, onUpdate }: Props) {
  const existing = block.data as LeadFormBlock['data'] | undefined;
  const d = existing ?? leadFormDefaultData;

  useEffect(() => {
    if (!existing) onUpdate({ ...block, data: d });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  const update = (patch: Partial<typeof d>) => onUpdate({ ...block, data: { ...d, ...patch } });

  return (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Badge</label>
        <input className={styles.fieldInput} value={d.badge ?? ''} onChange={(e) => update({ badge: e.target.value })} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Título</label>
        <input className={styles.fieldInput} value={d.title} onChange={(e) => update({ title: e.target.value })} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Subtítulo</label>
        <textarea
          className={styles.fieldInput}
          style={{ height: 72, resize: 'vertical', paddingTop: 8, borderRadius: 8 }}
          value={d.subtitle ?? ''}
          onChange={(e) => update({ subtitle: e.target.value })}
        />
      </div>

      <BenefitsEditor value={d.benefits} onChange={(v) => update({ benefits: v })} />

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Título do formulário</label>
        <input className={styles.fieldInput} value={d.form_title} onChange={(e) => update({ form_title: e.target.value })} />
      </div>

      <FieldsEditor value={d.fields} onChange={(v) => update({ fields: v })} />

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Texto do botão</label>
        <input className={styles.fieldInput} value={d.submit_text} onChange={(e) => update({ submit_text: e.target.value })} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Mensagem de sucesso</label>
        <input className={styles.fieldInput} value={d.success_message ?? ''} onChange={(e) => update({ success_message: e.target.value })} />
      </div>
    </>
  );
}
