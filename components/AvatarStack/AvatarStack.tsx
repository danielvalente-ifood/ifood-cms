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
}

/**
 * Stack de avatares com suporte a overflow ("+N").
 * Ex: 5 colaboradores → mostra 3 avatares + "+2"
 */
export function AvatarStack({ avatars, max = 3, size = 28 }: AvatarStackProps) {
  const shown = avatars.slice(0, max);
  const remaining = Math.max(0, avatars.length - max);

  if (avatars.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
        {shown.map((avatar, i) => (
          <img
            key={avatar.id}
            src={avatar.avatar_url || ''}
            alt={avatar.full_name || 'Collaborator'}
            title={avatar.full_name || 'Unknown'}
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              border: '2px solid white',
              marginLeft: i > 0 ? -size / 2 : 0,
              zIndex: max - i,
              objectFit: 'cover',
            }}
          />
        ))}
        {remaining > 0 && (
          <div
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              background: '#e8e8ed',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size / 2.5,
              fontWeight: 600,
              color: '#666',
              marginLeft: -size / 2,
              zIndex: 0,
              flexShrink: 0,
            }}
            title={`+${remaining} more`}
          >
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
}
