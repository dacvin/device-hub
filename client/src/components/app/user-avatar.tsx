import { UserRound } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// First letters of the first two words, uppercased. Blank name → null (default icon).
export function nameInitials(name: string | null | undefined): string | null {
  const parts = name?.split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return null;
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function UserAvatar({
  name,
  src,
  size,
  className,
  fallbackClassName,
}: {
  name?: string | null;
  src?: string | null;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  fallbackClassName?: string;
}) {
  const initials = nameInitials(name);
  return (
    <Avatar size={size} className={className}>
      {src && <AvatarImage src={src} alt={name ?? ''} />}
      <AvatarFallback className={fallbackClassName}>
        {initials ?? <UserRound className="size-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
}
