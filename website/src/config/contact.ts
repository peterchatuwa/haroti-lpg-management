export const CONTACT_EMAIL = 'info@harotiholdingslimited.com';

export const CONTACT_ADDRESS_LINES = [
  'Haroti Holdings Limited',
  'Area 15, P.O. Box E246',
  'Lilongwe, Malawi',
] as const;

export const CONTACT_PHONES = [
  { display: '+265 991 274 228', href: '+265991274228' },
  { display: '+265 887 082 126', href: '+265887082126' },
] as const;

export const PRIMARY_PHONE = CONTACT_PHONES[0];

/** Haroti Gas PAYC USSD short code */
export const PAYC_USSD_CODE = '4420';
export const PAYC_USSD_DIAL = `*${PAYC_USSD_CODE}#`;
export const PAYC_USSD_HREF = `tel:${encodeURIComponent(PAYC_USSD_DIAL)}`;
