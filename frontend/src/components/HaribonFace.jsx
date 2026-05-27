export default function HaribonFace({ size = 28, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{ borderRadius: '8px', overflow: 'hidden', ...style }}
    >
      <circle cx="60" cy="22" r="20" fill="#5C3010"/>
      <circle cx="88" cy="36" r="17" fill="#5C3010"/>
      <circle cx="96" cy="62" r="15" fill="#5C3010"/>
      <circle cx="32" cy="36" r="17" fill="#5C3010"/>
      <circle cx="24" cy="62" r="15" fill="#5C3010"/>
      <circle cx="60" cy="98" r="18" fill="#5C3010"/>
      <ellipse cx="60" cy="12" rx="3.5" ry="12" fill="#3D1A08"/>
      <ellipse cx="51" cy="16" rx="3" ry="9" fill="#3D1A08" transform="rotate(-15,51,16)"/>
      <ellipse cx="69" cy="16" rx="3" ry="9" fill="#3D1A08" transform="rotate(15,69,16)"/>
      <circle cx="60" cy="60" r="36" fill="#F2E8D6"/>
      <circle cx="44" cy="57" r="14" fill="#FFB800"/>
      <circle cx="44" cy="58" r="8" fill="#1A0900"/>
      <ellipse cx="47.5" cy="52" rx="5" ry="4" fill="white" opacity="0.9"/>
      <circle cx="76" cy="57" r="14" fill="#FFB800"/>
      <circle cx="76" cy="58" r="8" fill="#1A0900"/>
      <ellipse cx="79.5" cy="52" rx="5" ry="4" fill="white" opacity="0.9"/>
      <path d="M31 48 Q44 42 57 48" stroke="#3D1A08" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M63 48 Q76 42 89 48" stroke="#3D1A08" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M51 73 Q60 69 69 73 L67 79 Q60 76 53 79Z" fill="#6B8299"/>
      <ellipse cx="28" cy="68" rx="10" ry="7" fill="#E0705A" opacity="0.28"/>
      <ellipse cx="92" cy="68" rx="10" ry="7" fill="#E0705A" opacity="0.28"/>
    </svg>
  );
}
