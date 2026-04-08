interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

export function UserAvatar({ username, avatarUrl, size = 'md' }: UserAvatarProps) {
  const initials = username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colorIndex = username.charCodeAt(0) % 5;
  const gradients = [
    'from-primary to-secondary',
    'from-secondary to-primary',
    'from-primary/80 to-accent/80',
    'from-accent to-primary',
    'from-secondary/80 to-primary/80',
  ];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-primary/20`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradients[colorIndex]} flex items-center justify-center font-heading font-bold ring-2 ring-primary/20`}
    >
      {initials}
    </div>
  );
}
