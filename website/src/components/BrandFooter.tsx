const PARTNERS = [
  { name: 'GETF', logo: '/brand/partners/getf.png' },
  { name: 'UNDP', logo: '/brand/partners/undp.svg' },
  { name: 'Imani Development', logo: '/brand/partners/imani.png' },
  { name: 'Landell Mills', logo: '/brand/partners/landell-mills.svg' },
  { name: 'Irish Aid', logo: '/brand/partners/ireland.svg' },
];

type Variant = 'light' | 'dark';

export function BrandFooter({ variant = 'dark' }: { variant?: Variant }) {
  const isDark = variant === 'dark';

  return (
    <section
      className={`border-t ${
        isDark
          ? 'border-white/10 bg-[#020f0c] text-white/80'
          : 'border-gray-200 bg-[#f3f7f4] text-gray-900'
      }`}
      aria-label="Affiliations and supporters"
    >
      <div className="container-custom grid gap-6 py-8 md:grid-cols-[minmax(220px,320px)_1fr] md:items-start">
        <div>
          <p
            className={`mb-3 text-xs font-bold uppercase tracking-widest ${
              isDark ? 'text-white/55' : 'text-gray-500'
            }`}
          >
            Proud member of
          </p>
          <img
            src="/brand/gdc-member-stamp.png"
            alt="Global Distributors Collective member"
            className="block h-auto w-full max-w-[320px]"
          />
        </div>

        <div>
          <p
            className={`mb-3 text-xs font-bold uppercase tracking-widest ${
              isDark ? 'text-white/55' : 'text-gray-500'
            }`}
          >
            Supported by
          </p>
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-5">
            {PARTNERS.map((partner) => (
              <li key={partner.name} className="flex items-center justify-center">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  loading="lazy"
                  className={`max-h-10 max-w-[150px] object-contain ${
                    isDark
                      ? 'rounded-lg bg-white/90 px-2 py-1'
                      : 'grayscale-[0.05]'
                  }`}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
