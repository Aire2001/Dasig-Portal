export default function SunSeal({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <circle cx="48" cy="48" r="46" fill="#001d5c" stroke="#f97316" strokeWidth="2"/>
      <g stroke="#f97316" strokeWidth="3.5" strokeLinecap="round">
        <line x1="48" y1="10" x2="48" y2="24"/>
        <line x1="79" y1="27" x2="67" y2="34"/>
        <line x1="79" y1="69" x2="67" y2="62"/>
        <line x1="48" y1="86" x2="48" y2="72"/>
        <line x1="17" y1="69" x2="29" y2="62"/>
        <line x1="17" y1="27" x2="29" y2="34"/>
      </g>
      <circle cx="48" cy="48" r="16" fill="#f97316"/>
      <path d="M48 36C44 40 42 44 43 48C44 52 46 54 48 56C50 54 52 52 53 48C54 44 52 40 48 36Z" fill="white"/>
    </svg>
  );
}
