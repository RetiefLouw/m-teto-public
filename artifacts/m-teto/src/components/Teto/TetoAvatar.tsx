import { useEffect, useRef, useState } from "react";

interface TetoAvatarProps {
  grade?: string;
  size?: number;
  animated?: boolean;
  talking?: boolean;
}

export function TetoAvatar({
  size = 80,
  animated = true,
  talking = false,
}: TetoAvatarProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [beakOpen, setBeakOpen] = useState(false);
  const [wingPhase, setWingPhase] = useState(0);
  const blinkTimer = useRef<ReturnType<typeof setTimeout>>();
  const talkTimer = useRef<ReturnType<typeof setInterval>>();
  const wingTimer = useRef<ReturnType<typeof setInterval>>();

  // Blinking — randomly every 3–6 seconds
  useEffect(() => {
    if (!animated) return;
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 3000;
      blinkTimer.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(blinkTimer.current);
  }, [animated]);

  // Talking beak
  useEffect(() => {
    clearInterval(talkTimer.current);
    if (!talking) {
      setBeakOpen(false);
      return;
    }
    talkTimer.current = setInterval(() => {
      setBeakOpen((p) => !p);
    }, 175);
    return () => clearInterval(talkTimer.current);
  }, [talking]);

  // Wing gentle flutter
  useEffect(() => {
    if (!animated) return;
    wingTimer.current = setInterval(() => {
      setWingPhase((p) => (p + 1) % 4);
    }, 900);
    return () => clearInterval(wingTimer.current);
  }, [animated]);

  const wingOffset = [0, -2, -3.5, -2][wingPhase];
  const jawDrop = beakOpen ? 7 : 0;
  const eyeRy = isBlinking ? 1.5 : 12;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        animation: animated ? "tetoBob 2.8s ease-in-out infinite" : undefined,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id={`tBG-${size}`} cx="42%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#FFD0E8" />
            <stop offset="55%" stopColor="#FF8DBD" />
            <stop offset="100%" stopColor="#D9507E" />
          </radialGradient>
          <radialGradient id={`tHG-${size}`} cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FFDAEE" />
            <stop offset="50%" stopColor="#FF9AC8" />
            <stop offset="100%" stopColor="#D9507E" />
          </radialGradient>
          <radialGradient id={`tWG-${size}`} cx="50%" cy="25%" r="70%">
            <stop offset="0%" stopColor="#FFE2F0" />
            <stop offset="100%" stopColor="#F07AAE" />
          </radialGradient>
          <radialGradient id={`tIG-${size}`} cx="33%" cy="28%" r="65%">
            <stop offset="0%" stopColor="#90D4FF" />
            <stop offset="45%" stopColor="#5298E8" />
            <stop offset="100%" stopColor="#2255A8" />
          </radialGradient>
          <radialGradient id={`tPG-${size}`} cx="28%" cy="26%" r="62%">
            <stop offset="0%" stopColor="#445566" />
            <stop offset="100%" stopColor="#060E1C" />
          </radialGradient>
          <radialGradient id={`tFG-${size}`} cx="40%" cy="28%" r="62%">
            <stop offset="0%" stopColor="#FFDE9A" />
            <stop offset="100%" stopColor="#E0872C" />
          </radialGradient>
          <radialGradient id={`tCG-${size}`} cx="50%" cy="85%" r="65%">
            <stop offset="0%" stopColor="#FF88BB" />
            <stop offset="100%" stopColor="#CC3366" />
          </radialGradient>
          <radialGradient id={`tBK-${size}`} cx="38%" cy="25%" r="65%">
            <stop offset="0%" stopColor="#FFDC90" />
            <stop offset="100%" stopColor="#D97028" />
          </radialGradient>

          {/* Eye blink clip — left */}
          <clipPath id={`ecL-${size}`}>
            <ellipse cx="39" cy="50" rx="13" ry={Math.max(eyeRy, 1.5)} />
          </clipPath>
          {/* Eye blink clip — right */}
          <clipPath id={`ecR-${size}`}>
            <ellipse cx="81" cy="50" rx="13" ry={Math.max(eyeRy, 1.5)} />
          </clipPath>
        </defs>

        {/* ── Ground shadow ─────────────────────────────────── */}
        <ellipse cx="60" cy="125" rx="34" ry="5.5" fill="#AA3366" opacity="0.18" />

        {/* ── Feet ──────────────────────────────────────────── */}
        <ellipse cx="45" cy="116" rx="13" ry="5.5" fill={`url(#tFG-${size})`} transform="rotate(-15 45 116)" />
        <ellipse cx="37" cy="116" rx="4" ry="2.8" fill="#D87020" transform="rotate(-22 37 116)" />
        <ellipse cx="45" cy="120" rx="3.8" ry="2.5" fill="#D87020" />
        <ellipse cx="53" cy="115" rx="4" ry="2.8" fill="#D87020" transform="rotate(18 53 115)" />

        <ellipse cx="75" cy="116" rx="13" ry="5.5" fill={`url(#tFG-${size})`} transform="rotate(15 75 116)" />
        <ellipse cx="67" cy="115" rx="4" ry="2.8" fill="#D87020" transform="rotate(-18 67 115)" />
        <ellipse cx="75" cy="120" rx="3.8" ry="2.5" fill="#D87020" />
        <ellipse cx="83" cy="116" rx="4" ry="2.8" fill="#D87020" transform="rotate(22 83 116)" />

        {/* ── Body ──────────────────────────────────────────── */}
        <ellipse cx="60" cy="90" rx="38" ry="31" fill={`url(#tBG-${size})`} />
        <ellipse cx="60" cy="95" rx="30" ry="22" fill="#FFB8D8" opacity="0.55" />
        <ellipse cx="60" cy="102" rx="22" ry="15" fill="#FFD0E8" opacity="0.45" />

        {/* Belly feather fans */}
        {([-16, -8, 0, 8, 16] as number[]).map((dx, i) => (
          <ellipse
            key={i}
            cx={60 + dx}
            cy={110}
            rx={7.5}
            ry={5}
            fill="#FFE0F0"
            opacity={0.5}
            transform={`rotate(${-20 + i * 10} ${60 + dx} 110)`}
          />
        ))}

        {/* ── Left Wing ─────────────────────────────────────── */}
        <g
          transform={`translate(0, ${wingOffset})`}
          style={{ transition: "transform 0.55s ease-in-out" }}
        >
          <path
            d="M23 80 C9 70 5 88 12 99 C19 109 32 105 36 97 C40 88 36 76 23 80Z"
            fill={`url(#tWG-${size})`}
          />
          <path d="M13 90 C17 84 27 82 32 88" stroke="#FFECF5" strokeWidth="1.8" fill="none" opacity="0.7" />
          <path d="M12 97 C17 91 29 89 33 95" stroke="#FFECF5" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M15 104 C20 98 31 97 34 102" stroke="#FFECF5" strokeWidth="1.3" fill="none" opacity="0.5" />
          <ellipse cx="13" cy="86" rx="4.5" ry="7" fill="#FFE0F0" opacity="0.5" transform="rotate(-22 13 86)" />
        </g>

        {/* ── Right Wing ────────────────────────────────────── */}
        <g
          transform={`translate(0, ${-wingOffset})`}
          style={{ transition: "transform 0.55s ease-in-out" }}
        >
          <path
            d="M97 80 C111 70 115 88 108 99 C101 109 88 105 84 97 C80 88 84 76 97 80Z"
            fill={`url(#tWG-${size})`}
          />
          <path d="M107 90 C103 84 93 82 88 88" stroke="#FFECF5" strokeWidth="1.8" fill="none" opacity="0.7" />
          <path d="M108 97 C103 91 91 89 87 95" stroke="#FFECF5" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M105 104 C100 98 89 97 86 102" stroke="#FFECF5" strokeWidth="1.3" fill="none" opacity="0.5" />
          <ellipse cx="107" cy="86" rx="4.5" ry="7" fill="#FFE0F0" opacity="0.5" transform="rotate(22 107 86)" />
        </g>

        {/* ── Head ──────────────────────────────────────────── */}
        <circle cx="60" cy="49" r="33" fill={`url(#tHG-${size})`} />
        <circle cx="50" cy="41" r="14" fill="#FFE0F2" opacity="0.32" />
        <circle cx="71" cy="41" r="11" fill="#FFE0F2" opacity="0.26" />

        {/* Head–body join collar */}
        <ellipse cx="60" cy="74" rx="28" ry="10" fill="#FFB8D8" opacity="0.65" />
        {([-12, -6, 0, 6, 12] as number[]).map((dx, i) => (
          <ellipse
            key={i}
            cx={60 + dx}
            cy={72}
            rx={8}
            ry={5.5}
            fill="#FFCCE8"
            opacity={0.5}
            transform={`rotate(${(i - 2) * 9} ${60 + dx} 72)`}
          />
        ))}

        {/* ── Crest feathers ─────────────────────────────────── */}
        <path d="M44 24 C38 8 47 0 51 3 C55 6 55 18 49 24Z" fill={`url(#tCG-${size})`} />
        <path d="M47 20 C44 12 48 5 51 6" stroke="#FFB8D8" strokeWidth="1.2" fill="none" opacity="0.6" />

        <path d="M76 24 C82 8 73 0 69 3 C65 6 65 18 71 24Z" fill={`url(#tCG-${size})`} />
        <path d="M73 20 C76 12 72 5 69 6" stroke="#FFB8D8" strokeWidth="1.2" fill="none" opacity="0.6" />

        <path d="M49 22 C46 6 53 -1 60 1 C67 -1 74 6 71 22 C66 15 54 15 49 22Z" fill={`url(#tCG-${size})`} />
        <path d="M53 18 C51 8 57 2 60 3" stroke="#FFD0E8" strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M67 18 C69 8 63 2 60 3" stroke="#FFD0E8" strokeWidth="1.5" fill="none" opacity="0.7" />
        <ellipse cx="60" cy="2" rx="4" ry="3" fill="#FFCCE0" opacity="0.5" />

        {/* ── Left Eye ──────────────────────────────────────── */}
        <g clipPath={`url(#ecL-${size})`}>
          <ellipse cx="39" cy="50" rx="13" ry="12" fill="white" />
          <ellipse cx="39" cy="51.5" rx="9.5" ry="10" fill={`url(#tIG-${size})`} />
          <circle cx="39" cy="52.5" r="6" fill={`url(#tPG-${size})`} />
          <ellipse cx="33.5" cy="46" rx="4.5" ry="3.8" fill="white" opacity="0.98" />
          <circle cx="43" cy="49" r="2.2" fill="white" opacity="0.9" />
          <circle cx="35" cy="52" r="1" fill="white" opacity="0.6" />
        </g>
        {!isBlinking && (
          <path d="M26 42 C31 38 47 38 52 42" stroke="#BB3366" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {isBlinking && (
          <ellipse cx="39" cy="50" rx="13" ry="2" fill="#E86090" />
        )}

        {/* ── Right Eye ─────────────────────────────────────── */}
        <g clipPath={`url(#ecR-${size})`}>
          <ellipse cx="81" cy="50" rx="13" ry="12" fill="white" />
          <ellipse cx="81" cy="51.5" rx="9.5" ry="10" fill={`url(#tIG-${size})`} />
          <circle cx="81" cy="52.5" r="6" fill={`url(#tPG-${size})`} />
          <ellipse cx="75.5" cy="46" rx="4.5" ry="3.8" fill="white" opacity="0.98" />
          <circle cx="85" cy="49" r="2.2" fill="white" opacity="0.9" />
          <circle cx="77" cy="52" r="1" fill="white" opacity="0.6" />
        </g>
        {!isBlinking && (
          <path d="M68 42 C73 38 89 38 94 42" stroke="#BB3366" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {isBlinking && (
          <ellipse cx="81" cy="50" rx="13" ry="2" fill="#E86090" />
        )}

        {/* ── Cheek blush ───────────────────────────────────── */}
        <ellipse cx="26" cy="60" rx="10" ry="6" fill="#FF5599" opacity="0.22" />
        <ellipse cx="94" cy="60" rx="10" ry="6" fill="#FF5599" opacity="0.22" />

        {/* ── Beak ──────────────────────────────────────────── */}
        <path d="M52 65 C53 60 67 60 68 65 L60 70 Z" fill={`url(#tBK-${size})`} />
        <path d="M54 63 C56 61 64 61 66 63" stroke="#FFE8A0" strokeWidth="1.2" fill="none" opacity="0.8" />
        <path
          d={`M52 65 L60 70 L68 65 C67 ${70 + jawDrop} 53 ${70 + jawDrop} 52 65Z`}
          fill="#D07020"
        />
        {jawDrop > 2 && (
          <ellipse
            cx="60"
            cy={69 + jawDrop * 0.55}
            rx="5"
            ry="3"
            fill="#CC3355"
            opacity={Math.min(jawDrop / 7, 1)}
          />
        )}

        {/* ── Head shine ────────────────────────────────────── */}
        <ellipse cx="43" cy="35" rx="10" ry="7" fill="white" opacity="0.1" transform="rotate(-28 43 35)" />
      </svg>
    </div>
  );
}
