'use client';

import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/Icon/Icon';
import styles from './VerticalAccordion.module.css';

interface VerticalAccordionProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Accordion por vertical na lista de páginas — header expansível + linhas. */
export function VerticalAccordion({ title, count, defaultOpen = true, children }: VerticalAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={styles.group}>
      <button
        type="button"
        className={`${styles.header} ${open ? styles.headerOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Icon
          name="chevron-right"
          size={18}
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
        />
        <span className={styles.title}>{title}</span>
        <span className={styles.count}>{count}</span>
      </button>

      {open && <div className={styles.body}>{children}</div>}
    </section>
  );
}

export default VerticalAccordion;
