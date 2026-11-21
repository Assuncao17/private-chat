// Cinco pontos: os cinco lugares do grupo. O primeiro é o administrador.
export default function Logo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Private Chat">
      <circle cx="32" cy="14" r="8" fill="var(--accent)" />
      <circle cx="14" cy="30" r="8" fill="var(--accent)" opacity=".4" />
      <circle cx="50" cy="30" r="8" fill="var(--accent)" opacity=".4" />
      <circle cx="21" cy="50" r="8" fill="var(--accent)" opacity=".4" />
      <circle cx="43" cy="50" r="8" fill="var(--accent)" opacity=".4" />
    </svg>
  );
}
