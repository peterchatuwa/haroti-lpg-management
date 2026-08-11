const PARTNERS = [
  {
    name: 'GETF Green Economic Transition Facility',
    logo: '/brand/partners/getf.png',
  },
  {
    name: 'UNDP',
    logo: '/brand/partners/undp.svg',
    className:
      'h-16 w-[4.75rem] object-contain object-center md:h-20 md:w-[5.75rem]',
  },
  {
    name: 'Imani Development',
    logo: '/brand/partners/imani.png',
  },
  {
    name: 'Landell Mills',
    logo: '/brand/partners/landell-mills.png',
  },
  {
    name: 'Government of Ireland',
    logo: '/brand/partners/ireland.svg',
  },
];

type Variant = 'light' | 'dark';

const partnerLogoClass = (isDark: boolean, extra?: string) =>
  [
    extra ??
      'max-h-14 max-w-[200px] object-contain md:max-h-16 md:max-w-[240px]',
    isDark ? 'rounded-lg bg-white/95 px-3 py-2' : 'grayscale-[0.05]',
  ]
    .filter(Boolean)
    .join(' ');

const gdcLogoClass =
  'max-h-14 max-w-[200px] object-contain md:max-h-16 md:max-w-[240px]';

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
      <div className="container-custom grid gap-8 py-8 md:grid-cols-2 md:items-start">
        <div>
          <p
            className={`mb-4 text-xs font-bold uppercase tracking-widest ${
              isDark ? 'text-white/55' : 'text-gray-500'
            }`}
          >
            Proud member of
          </p>
          <div className="flex items-center">
            <img
              src="/brand/gdc-member-stamp.png"
              alt="Global Distributors Collective member"
              className={gdcLogoClass}
            />
          </div>
        </div>

        <div>
          <p
            className={`mb-4 text-xs font-bold uppercase tracking-widest ${
              isDark ? 'text-white/55' : 'text-gray-500'
            }`}
          >
            Supported by
          </p>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-6">
            {PARTNERS.map((partner) => (
              <li key={partner.name} className="flex items-center justify-center">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  loading="lazy"
                  className={partnerLogoClass(isDark, partner.className)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
