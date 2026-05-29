// @ts-nocheck
'use client';

import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { CmsUserWithVerticals, Vertical } from '@/types/database';
import styles from './VerticalPicker.module.css';

interface VerticalPickerProps {
  open: boolean;
  onClose: () => void;
  user: CmsUserWithVerticals | null;
  allVerticals: Vertical[];
  onUpdate: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export function VerticalPicker({
  open,
  onClose,
  user,
  allVerticals,
  onUpdate,
  onShowToast,
}: VerticalPickerProps) {
  if (!user) return null;

  const assignedIds = new Set(user.verticals.map((v) => v.id));

  const handleToggle = async (vertical: Vertical) => {
    const isAssigned = assignedIds.has(vertical.id);

    if (isAssigned) {
      const { error } = await supabase
        .from('user_verticals')
        .delete()
        .eq('user_id', user.id)
        .eq('vertical_id', vertical.id);

      if (error) {
        onShowToast('Erro ao remover vertical', 'error');
        return;
      }
    } else {
      const { error } = await supabase
        .from('user_verticals')
        .insert({ user_id: user.id, vertical_id: vertical.id });

      if (error) {
        onShowToast('Erro ao adicionar vertical', 'error');
        return;
      }
    }

    onUpdate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Verticais"
      description={`Selecione as verticais para ${user.full_name || user.email}`}
      actions={
        <Button variant="secondary" onClick={onClose}>Fechar</Button>
      }
    >
      <div className={styles.list}>
        {allVerticals.map((v) => {
          const checked = assignedIds.has(v.id);
          return (
            <button
              key={v.id}
              className={styles.item}
              onClick={() => handleToggle(v)}
            >
              <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`}>
                {checked && <span className={styles.checkIcon}>✓</span>}
              </span>
              <span className={styles.verticalName}>{v.name}</span>
              <span className={styles.verticalSlug}>{v.slug}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
