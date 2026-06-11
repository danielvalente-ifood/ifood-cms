'use client';

interface Avatar {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AvatarStackProps {
  avatars: Avatar[];
  max?: number;
  size?: number;
  /** Se true, usa bordas quadradas com canto arredondado (estilo editor). Default: false (circular). */
  square?: boolean;
}

/**
 * Stack de avatares com suporte a overflow ("+N").
 * Ex: 5 colaboradores → mostra 3 avatares + "+2"
 */
export function AvatarStack({ avatars, max = 3, size = 28, square = false }: AvatarStackProps) {
  const shown = avatars.slice(0, max);
  const remaining = Math.max(0, avatars.length - max);

  if (avatars.length === 0) return null;

  const borderRadius = square ? Math.round(size * 0.28) : '50%';
  // stroke sempre na cor do fundo (CSS variable)
  const border = `2px solid var(--bg-primary)`;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {shown.map((avatar, i) => (
          avatar.avatar_url ? (
            <img
              key={avatar.id}
              src={avatar.avatar_url}
              alt={avatar.full_name || 'Colaborador'}
              title={avatar.full_name || ''}
              style={{
                width: size,
                height: size,
                borderRadius,
                border,
                marginLeft: i > 0 ? -(size / 3) : 0,
                zIndex: max - i,
                objectFit: 'cover',
                flexShrink: 0,
                display: 'block',
              }}
            />
          ) : (
            <div
              key={avatar.id}
              title={avatar.full_name || ''}
              style={{
                width: size,
                height: size,
                borderRadius,
                border,
                marginLeft: i > 0 ? -(size / 3) : 0,
                zIndex: max - i,
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size / 2.4,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {(avatar.full_name || '?').charAt(0).toUpperCase()}
            </div>
          )
        ))}
        {remaining > 0 && (
          <div
            style={{
              width: size,
              height: size,
              borderRadius,
              border,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size / 2.5,
              fontWeight: 600,
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              marginLeft: -(size / 3),
              zIndex: 0,
              flexShrink: 0,
            }}
            title={`+${remaining} colaboradores`}
          >
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
}
