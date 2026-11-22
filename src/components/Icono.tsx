export function Icono({ tipo }: { tipo: 'conexion' | 'boveda' | 'vacio' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {tipo === 'conexion' ? (
        <>
          <path d="M7 17 17 7M7 7h10v10" />
          <path d="M5 12v7h7" />
        </>
      ) : tipo === 'boveda' ? (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 9v1M12 14v1M9 12h1M14 12h1" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}
