import { Link } from 'react-router-dom';
import { BRAND } from '../config/company';

interface HarotiLogoProps {
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  className?: string;
  linkToHome?: boolean;
}

export const HarotiLogo = ({
  variant = 'light',
  showTagline = true,
  className = '',
  linkToHome = true,
}: HarotiLogoProps) => {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={BRAND.logoSrc}
        alt={`${BRAND.name} logo`}
        className="h-12 w-auto object-contain"
      />
      {showTagline && (
        <div className="hidden sm:block">
          <div
            className={`font-bold text-lg leading-tight ${
              variant === 'dark' ? 'text-white' : 'text-haroti-green'
            }`}
          >
            {BRAND.name.toUpperCase()}
          </div>
          <div
            className={`text-xs italic ${
              variant === 'dark' ? 'text-white/70' : 'text-haroti-blue'
            }`}
          >
            {BRAND.tagline}
          </div>
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-flex shrink-0">
        {content}
      </Link>
    );
  }

  return content;
};
