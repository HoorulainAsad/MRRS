import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function Robot({ state = 'idle', className = '' }) {
  const reduceMotion = useReducedMotion();
  const instanceId = useId().replaceAll(':', '');
  const shellId = `shell-${instanceId}`;
  const faceId = `face-${instanceId}`;
  const metalId = `metal-${instanceId}`;
  const glowId = `glow-${instanceId}`;

  const animation = state === 'thinking'
    ? { y: [0, -3, 0], rotate: [0, -2, 2, 0] }
    : state === 'responding'
      ? { y: [0, -5, 0], scale: [1, 1.035, 1] }
      : { y: [0, -5, 0], rotate: 0, scale: 1 };

  return (
    <motion.div
      className={`robot-${state} ${className}`}
      animate={reduceMotion ? { y: 0, rotate: 0, scale: 1 } : animation}
      transition={reduceMotion ? { duration: 0 } : { duration: state === 'idle' ? 4 : 1.1, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 160 160" className="h-full w-full overflow-visible" role="presentation">
        <defs>
          <linearGradient id={shellId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.46" stopColor="#eef3e9" />
            <stop offset="0.78" stopColor="#c3d0ba" />
            <stop offset="1" stopColor="#91a58a" />
          </linearGradient>
          <linearGradient id={faceId} x1="0" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor="#3c5843" />
            <stop offset="0.55" stopColor="#2c4937" />
            <stop offset="1" stopColor="#203629" />
          </linearGradient>
          <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#91a58a" />
            <stop offset="0.45" stopColor="#f4f7f0" />
            <stop offset="1" stopColor="#a4b69b" />
          </linearGradient>
          <radialGradient id={glowId} cx="0.35" cy="0.25" r="0.9">
            <stop offset="0" stopColor="#edf5e6" />
            <stop offset="0.45" stopColor="#a7c496" />
            <stop offset="1" stopColor="#709464" />
          </radialGradient>
        </defs>

        <ellipse cx="80" cy="148" rx="39" ry="6" fill="#293e30" opacity="0.14" />
        <path d="M80 35V19" stroke={`url(#${metalId})`} strokeWidth="6" strokeLinecap="round" />
        <circle className="robot-antenna-light" cx="80" cy="14" r="8" fill={`url(#${glowId})`} />
        <circle cx="77" cy="11" r="2.5" fill="#fff" opacity="0.8" />

        <rect x="16" y="60" width="17" height="35" rx="8" fill={`url(#${metalId})`} stroke="#819579" />
        <rect x="127" y="60" width="17" height="35" rx="8" fill={`url(#${metalId})`} stroke="#819579" />
        <rect x="19" y="68" width="7" height="18" rx="3.5" fill="#7f9a76" opacity="0.7" />
        <rect x="134" y="68" width="7" height="18" rx="3.5" fill="#7f9a76" opacity="0.7" />

        <rect x="27" y="32" width="106" height="86" rx="31" fill={`url(#${shellId})`} stroke="#a7b79e" strokeWidth="1.5" />
        <path d="M44 43c17-12 51-13 70 1" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
        <rect x="38" y="47" width="84" height="56" rx="22" fill={`url(#${faceId})`} stroke="#506a4b" strokeWidth="2" />
        <path d="M50 55c13-7 39-8 55-2" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.08" />

        <g className="robot-eye">
          <rect x="53" y="64" width="14" height="18" rx="7" fill={`url(#${glowId})`} />
          <rect x="56" y="66" width="4" height="6" rx="2" fill="#fff" opacity="0.8" />
        </g>
        <g className="robot-eye">
          <rect x="93" y="64" width="14" height="18" rx="7" fill={`url(#${glowId})`} />
          <rect x="96" y="66" width="4" height="6" rx="2" fill="#fff" opacity="0.8" />
        </g>
        <circle cx="47" cy="88" r="4" fill="#9aaf91" opacity="0.25" />
        <circle cx="113" cy="88" r="4" fill="#9aaf91" opacity="0.25" />

        {state === 'thinking' ? (
          <g fill="#bad0ad">
            <circle cx="70" cy="91" r="2.5" opacity="0.45" />
            <circle cx="80" cy="91" r="2.5" opacity="0.75" />
            <circle cx="90" cy="91" r="2.5" />
          </g>
        ) : state === 'responding' ? (
          <rect className="robot-mouth" x="72" y="87" width="16" height="8" rx="4" fill="#b4cfa4" />
        ) : (
          <path d="M70 88c5 6 15 6 20 0" fill="none" stroke="#b4cfa4" strokeWidth="3.5" strokeLinecap="round" />
        )}

        <path d="M62 116v8M98 116v8" stroke="#819579" strokeWidth="8" />
        <rect x="43" y="119" width="74" height="28" rx="14" fill={`url(#${shellId})`} stroke="#a7b79e" />
        <rect x="65" y="125" width="30" height="13" rx="6.5" fill="#2c4937" />
        <path d="M73 134v-5l7 5 7-5v5" fill="none" stroke="#b4cfa4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M51 124c5-3 10-4 15-4" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      </svg>
    </motion.div>
  );
}
