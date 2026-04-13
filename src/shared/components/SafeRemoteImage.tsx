import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

const initialsFromName = (name: string) =>
  name
    .split(/\s+/)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

type SafeRemoteImageProps = {
  src: string;
  alt: string;
  className?: string;
  /** `pastel-icon`: círculo suave + icono persona (listas de chat sin iniciales). */
  fallback?: 'initials' | 'pastel-icon';
};

/**
 * Imagen remota con fallback si falla la carga (red bloqueada, CSP, extensión, etc.).
 */
export function SafeRemoteImage({ src, alt, className = '', fallback = 'initials' }: SafeRemoteImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    if (fallback === 'pastel-icon') {
      return (
        <div
          className={`${className} flex items-center justify-center bg-gradient-to-br from-sky-100/90 to-violet-100/90 text-sky-700/70`}
          aria-hidden
        >
          <User className="w-[45%] h-[45%] min-w-[18px] min-h-[18px]" strokeWidth={1.75} />
        </div>
      );
    }
    return (
      <div
        className={`${className} flex items-center justify-center bg-gradient-to-br from-primary/25 to-secondary/25 text-primary font-display font-bold text-sm sm:text-base select-none`}
        aria-hidden
      >
        {initialsFromName(alt)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
