import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

// ─── Cloud SVG ───────────────────────────────────────────────────────────────
function Cloud({ style, animate, transition }) {
  return (
    <motion.svg
      viewBox="0 0 80 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      animate={animate}
      transition={transition}
    >
      <ellipse cx="40" cy="30" rx="38" ry="18" fill="white" opacity="0.95" />
      <ellipse cx="22" cy="26" rx="16" ry="14" fill="white" opacity="0.95" />
      <ellipse cx="58" cy="28" rx="18" ry="13" fill="white" opacity="0.95" />
      <ellipse cx="38" cy="16" rx="20" ry="15" fill="white" />
    </motion.svg>
  );
}

// ─── Star dot ────────────────────────────────────────────────────────────────
function Star({ cx, cy, r, delay = 0, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="white"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0.6, 1], scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            opacity: { repeat: Infinity, duration: 1.8 + delay, delay },
            scale: { duration: 0.3, delay },
          }}
        />
      )}
    </AnimatePresence>
  );
}

// ─── Main Toggle ─────────────────────────────────────────────────────────────
export default function DayNightToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  const W = 120; // pill width
  const H = 56;  // pill height
  const KNOB = 44; // knob diameter
  const PAD = 6;   // padding from edge

  const knobX = isDark ? W - KNOB - PAD : PAD;

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-full ${className}`}
      style={{ width: W, height: H, padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
    >
      {/* ── Pill Track ── */}
      <motion.div
        style={{
          width: W,
          height: H,
          borderRadius: H / 2,
          position: "relative",
          overflow: "hidden",
          boxShadow: isDark
            ? "inset 0 3px 10px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)"
            : "inset 0 3px 10px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.12)",
        }}
        animate={{
          backgroundColor: isDark ? "#1a1a2e" : "#7db8f0",
        }}
        transition={{ duration: 0.5 }}
      >
        {/* ── Day sky gradient layers ── */}
        <AnimatePresence>
          {!isDark && (
            <>
              {/* Sky colour strips */}
              <motion.div
                key="sky-deep"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(180deg,#5ba3e8 0%,#8dcbf7 55%,#b8dff7 100%)",
                  borderRadius: H / 2,
                }}
              />
              {/* horizon glow */}
              <motion.div
                key="horizon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: "absolute",
                  bottom: 0, left: 0, right: 0,
                  height: "40%",
                  background: "linear-gradient(0deg,rgba(255,255,255,0.4) 0%,transparent 100%)",
                }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ── Night star field ── */}
        <svg
          width={W} height={H}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          <Star cx={22} cy={14} r={2.2} delay={0}   visible={isDark} />
          <Star cx={38} cy={9}  r={1.5} delay={0.3} visible={isDark} />
          <Star cx={52} cy={18} r={1.8} delay={0.6} visible={isDark} />
          <Star cx={14} cy={30} r={1.4} delay={0.9} visible={isDark} />
          <Star cx={68} cy={12} r={2.0} delay={0.2} visible={isDark} />
          <Star cx={44} cy={32} r={1.6} delay={0.7} visible={isDark} />
          <Star cx={30} cy={42} r={1.2} delay={1.1} visible={isDark} />
          <Star cx={58} cy={40} r={1.5} delay={0.5} visible={isDark} />
          {/* 4-point star shapes */}
          <AnimatePresence>
            {isDark && (
              <>
                {[
                  { cx: 20, cy: 38, size: 5, delay: 0.1 },
                  { cx: 48, cy: 22, size: 4, delay: 0.5 },
                  { cx: 72, cy: 36, size: 4.5, delay: 0.8 },
                ].map(({ cx, cy, size, delay }) => (
                  <motion.g
                    key={`star4-${cx}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0.7, 1], scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                    transition={{
                      opacity: { repeat: Infinity, duration: 2 + delay, delay },
                      scale: { duration: 0.4, delay },
                    }}
                  >
                    <polygon
                      points={`${cx},${cy - size} ${cx + size * 0.25},${cy - size * 0.25} ${cx + size},${cy} ${cx + size * 0.25},${cy + size * 0.25} ${cx},${cy + size} ${cx - size * 0.25},${cy + size * 0.25} ${cx - size},${cy} ${cx - size * 0.25},${cy - size * 0.25}`}
                      fill="white"
                    />
                  </motion.g>
                ))}
              </>
            )}
          </AnimatePresence>
        </svg>

        {/* ── Clouds (day only) ── */}
        <AnimatePresence>
          {!isDark && (
            <>
              <Cloud
                key="cloud1"
                style={{
                  position: "absolute",
                  width: 72, height: "auto",
                  bottom: -6, right: 4,
                  opacity: 0.92,
                }}
                animate={{ x: [0, -3, 0], opacity: 1 }}
                transition={{ x: { repeat: Infinity, duration: 4, ease: "easeInOut" }, opacity: { duration: 0.4 } }}
              />
              <Cloud
                key="cloud2"
                style={{
                  position: "absolute",
                  width: 50, height: "auto",
                  bottom: 2, right: 28,
                  opacity: 0.75,
                }}
                animate={{ x: [0, 3, 0], opacity: 0.75 }}
                transition={{ x: { repeat: Infinity, duration: 5.5, ease: "easeInOut" }, opacity: { duration: 0.5 } }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ── Knob (sun / moon) ── */}
        <motion.div
          animate={{ x: knobX }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          style={{
            position: "absolute",
            top: PAD,
            left: 0,
            width: KNOB,
            height: KNOB,
            borderRadius: "50%",
            zIndex: 10,
          }}
        >
          {/* Sun face */}
          <AnimatePresence>
            {!isDark && (
              <motion.div
                key="sun"
                initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                style={{
                  position: "absolute", inset: 0,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 38% 38%, #ffe57a 0%, #f4a800 55%, #e0870e 100%)",
                  boxShadow: "0 0 0 3px #f4c34288, 0 3px 14px rgba(240,160,0,0.55), inset 0 -4px 8px rgba(0,0,0,0.15)",
                }}
              />
            )}
          </AnimatePresence>

          {/* Moon face */}
          <AnimatePresence>
            {isDark && (
              <motion.div
                key="moon"
                initial={{ opacity: 0, scale: 0.6, rotate: 30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: -30 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                style={{
                  position: "absolute", inset: 0,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 35%, #d4d4d4 0%, #b0b0b0 60%, #909090 100%)",
                  boxShadow: "inset 0 -3px 8px rgba(0,0,0,0.3), 0 3px 12px rgba(0,0,0,0.5)",
                }}
              >
                {/* Moon craters */}
                {[
                  { left: "28%", top: "28%", w: "22%", h: "22%", opacity: 0.45 },
                  { left: "52%", top: "52%", w: "18%", h: "18%", opacity: 0.4 },
                  { left: "42%", top: "20%", w: "12%", h: "12%", opacity: 0.3 },
                ].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: c.left, top: c.top,
                      width: c.w, height: c.h,
                      borderRadius: "50%",
                      background: `rgba(0,0,0,${c.opacity})`,
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.35)",
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </button>
  );
}
