/** Base URL for the ERP web app (staff login, customer portal). */
export const ERP_BASE_URL =
  import.meta.env.VITE_ERP_BASE_URL ||
  (import.meta.env.PROD
    ? 'http://harotiholdingslimited.com:8080'
    : 'http://localhost:8080');

export const erpUrl = (path: string) =>
  `${ERP_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
