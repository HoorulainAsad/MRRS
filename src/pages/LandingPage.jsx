import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, DoorOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SpaceFlowMark } from '../components/Logo';
import { AuthGlassPortal } from '../components/auth/AuthGlassPortal';
import { FloatingGlassNav } from '../components/landing/FloatingGlassNav';
import { OrbitFeatureCards } from '../components/landing/OrbitFeatureCards';
import { LandingFooter } from '../components/landing/LandingFooter';
import { useSession } from '../hooks/useSession';

gsap.registerPlugin(ScrollTrigger);

const EASE = [0.22, 1, 0.36, 1];

function IntroLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center"
      style={{ background: 'var(--sf-canvas)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      role="status"
      aria-label="Loading SpaceFlow"
    >
      <div className="text-center">
        <span className="inline-flex items-center gap-3">
          <span className="flex h-11 w-10 shrink-0 items-center justify-center">
            <SpaceFlowMark className="h-7 w-7" />
          </span>
          <span className="text-xl font-semibold tracking-[-0.03em]" style={{ color: 'var(--sf-ink)' }}>
            Space<span style={{ color: 'var(--sf-sage)' }}>Flow</span>
          </span>
        </span>
        <div
          className="mx-auto mt-6 h-[3px] w-52 overflow-hidden rounded-full"
          style={{ background: 'rgba(32, 61, 48, 0.14)' }}
        >
          <div className="intro-loader-bar h-full w-full rounded-full" style={{ background: 'var(--sf-forest)' }} />
        </div>
        <p className="mt-3 text-xs font-medium" style={{ color: 'var(--sf-ink-muted)' }}>
          Preparing your workspace…
        </p>
      </div>
    </motion.div>
  );
}

export function LandingPage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { session } = useSession();

  const rootRef = useRef(null);
  const journeyPinRef = useRef(null);
  const journeyTriggerRef = useRef(null);

  const [introDone, setIntroDone] = useState(Boolean(reduceMotion));
  const [activeSection, setActiveSection] = useState('hero-arch');
  const [doorClickedOpen, setDoorClickedOpen] = useState(false);
  const [doorInteractive, setDoorInteractive] = useState(false);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = window.setTimeout(() => setIntroDone(true), 1250);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return undefined;

    const ctx = gsap.context(() => {
      // ── UNIFIED SEAMLESS ARCHITECTURAL JOURNEY (Hero Arch -> Door Entrance) ──
      // Single pinned container eliminates white gaps/flashes between sections.
      const journeyTl = gsap.timeline({
        scrollTrigger: {
          trigger: journeyPinRef.current,
          start: 'top top',
          end: '+=240%',
          pin: true,
          scrub: 0.9,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            setDoorInteractive(p >= 0.44);
            if (p < 0.44) {
              setActiveSection('hero-arch');
            } else {
              setActiveSection('door-entrance');
            }
          },
        },
      });

      journeyTriggerRef.current = journeyTl.scrollTrigger;

      // 1) Hero Arch Reveal (0.00 -> 0.44)
      journeyTl
        .to('.hero-copy-layer', { opacity: 0, y: -24, duration: 0.14, ease: 'power2.out' }, 0)
        .to('.hero-scroll-hint', { opacity: 0, y: 10, duration: 0.1, ease: 'power1.out' }, 0)
        .to(
          '.arch-camera-rig',
          {
            scale: 2.75,
            transformOrigin: '50% 51%',
            duration: 0.44,
            ease: 'power2.inOut',
          },
          0.02,
        )
        // 2) Seamless direct crossfade into Door Room (0.40 -> 0.50) — zero white gap
        .to('.door-stage-wrapper', { opacity: 1, duration: 0.12, ease: 'power1.inOut' }, 0.38)
        // 3) Door Open + Camera Dolly Through Doorway (0.50 -> 0.98)
        .to('.door-open-layer', { opacity: 1, duration: 0.16, ease: 'power2.inOut' }, 0.50)
        .to('.door-wall-copy', { opacity: 0, y: -18, duration: 0.14, ease: 'power2.out' }, 0.54)
        .to(
          '.door-camera-rig',
          {
            scale: 2.85,
            transformOrigin: '65.6% 49%',
            duration: 0.36,
            ease: 'power2.inOut',
          },
          0.60,
        )
        .to('.door-dark-veil', { opacity: 1, duration: 0.12, ease: 'power1.in' }, 0.88);

      // ── Section active-tab tracking for Login & Capabilities ──
      ScrollTrigger.create({
        trigger: '#portal-login',
        start: 'top 55%',
        end: 'bottom 55%',
        onEnter: () => setActiveSection('portal-login'),
        onEnterBack: () => setActiveSection('portal-login'),
      });

      ScrollTrigger.create({
        trigger: '#capabilities',
        start: 'top 55%',
        end: 'bottom bottom',
        onEnter: () => setActiveSection('capabilities'),
        onEnterBack: () => setActiveSection('capabilities'),
      });
    }, rootRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  const navigateToSection = (id) => {
    if (!reduceMotion && journeyTriggerRef.current) {
      const st = journeyTriggerRef.current;
      if (id === 'hero-arch') {
        window.scrollTo({ top: st.start, behavior: 'smooth' });
        return;
      }
      if (id === 'door-entrance') {
        const doorScrollY = st.start + (st.end - st.start) * 0.50;
        window.scrollTo({ top: doorScrollY, behavior: 'smooth' });
        return;
      }
    }
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const handleDoorClick = () => {
    if (session) {
      navigate('/app/dashboard');
      return;
    }
    if (!doorClickedOpen) {
      setDoorClickedOpen(true);
      window.setTimeout(() => {
        navigateToSection('portal-login');
      }, 650);
    } else {
      navigateToSection('portal-login');
    }
  };

  return (
    <div ref={rootRef} className="relative min-h-screen overflow-x-clip" style={{ background: 'var(--sf-canvas)' }}>
      <AnimatePresence>{!introDone ? <IntroLoader /> : null}</AnimatePresence>

      {/* PHASE 7: Floating Glass Navigation */}
      <FloatingGlassNav
        activeSection={activeSection}
        onNavigateSection={navigateToSection}
        session={session}
      />

      {/* ════════════════════════════════════════════════════════════════════════
          UNIFIED ARCHITECTURAL JOURNEY (Hero Arch + Door Entrance)
          Eliminates any white flash or gap between pinned scenes.
         ════════════════════════════════════════════════════════════════════════ */}
      <div
        id="hero-arch"
        ref={journeyPinRef}
        className="relative h-screen w-full overflow-hidden"
        style={{ background: 'var(--sf-plaster)' }}
      >
        {/* ── STAGE 1: HERO ARCHITECTURAL ARCH ── */}
        <section
          aria-label="SpaceFlow architectural lounge entrance"
          className="landing-grain absolute inset-0 z-[1] flex items-center justify-center overflow-hidden"
        >
          <div className="arch-camera-rig arch-stage-frame">
            {/* Outer Plaster Wall */}
            <img
              src="/images/landing-architecture-bg.jpg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{ zIndex: 0 }}
            />

            {/* Semicircular Arch Opening with Symmetrical Architectural Depth */}
            <div
              className="absolute overflow-hidden"
              style={{
                left: '33.8%',
                top: '19.4%',
                width: '32.4%',
                height: '64.7%',
                borderRadius: '50% 50% 0 0 / 44.4% 44.4% 0 0',
                zIndex: 1,
              }}
            >
              <img
                src="/images/workspace-hero.jpg"
                alt="Sunlit SpaceFlow shared workspace lounge seen through an architectural arch"
                className="arch-lounge-img h-full w-full object-cover"
                style={{ imageRendering: 'high-quality' }}
              />
              {/* Symmetrical left, right, and top recessed arch jamb shadows */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  borderRadius: 'inherit',
                  boxShadow:
                    'inset 14px 0 26px -6px rgba(18, 26, 22, 0.40), inset -14px 0 26px -6px rgba(18, 26, 22, 0.40), inset 0 22px 36px -8px rgba(18, 26, 22, 0.44), inset 0 0 0 1.5px rgba(255, 255, 255, 0.30)',
                }}
              />
            </div>
          </div>

          {/* Hero Typography Overlay */}
          <div className="hero-copy-layer pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
            <div
              className="max-w-2xl rounded-3xl px-6 py-7 sm:px-10 sm:py-9"
              style={{
                background: 'linear-gradient(155deg, rgba(247, 248, 244, 0.80) 0%, rgba(232, 238, 228, 0.58) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.78)',
                boxShadow: '0 24px 56px -14px rgba(22, 43, 34, 0.18)',
              }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{
                  background: 'rgba(255, 255, 255, 0.72)',
                  borderColor: 'var(--sf-sage-line)',
                  color: 'var(--sf-forest)',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--sf-forest)' }} />
                SpaceFlow · Workspace Scheduling
              </span>
              <h1
                className="mt-5 text-balance font-bold leading-[1.04] tracking-[-0.04em]"
                style={{ fontSize: 'clamp(2rem, 4.8vw, 3.6rem)', color: 'var(--sf-navy)' }}
              >
                Make room for your best work.
              </h1>
              <p
                className="mx-auto mt-4 max-w-lg text-sm leading-6 sm:text-base sm:leading-7"
                style={{ color: 'var(--sf-ink-muted)' }}
              >
                Reserve meeting rooms, shared desks, and workspace resources managed by your organization.
              </p>
            </div>
          </div>

          {/* Scroll Hint */}
          <div
            className="hero-scroll-hint pointer-events-none absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-center"
            aria-hidden="true"
          >
            <span
              className="rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{
                background: 'rgba(247, 248, 244, 0.82)',
                color: 'var(--sf-forest)',
                backdropFilter: 'blur(8px)',
              }}
            >
              Scroll to enter
            </span>
            <ChevronDown className="scroll-hint-chevron mx-auto mt-1.5 h-5 w-5" style={{ color: 'var(--sf-forest)' }} />
          </div>
        </section>

        {/* ── STAGE 2: ARCHITECTURAL DOOR ENTRANCE (crossfades seamlessly over Stage 1) ── */}
        <section
          id="door-entrance"
          aria-label="Meeting room architectural entrance"
          className="door-stage-wrapper absolute inset-0 z-[15] flex items-center justify-center overflow-hidden"
          style={{
            opacity: reduceMotion ? 1 : 0,
            pointerEvents: reduceMotion || doorInteractive ? 'auto' : 'none',
            position: reduceMotion ? 'relative' : 'absolute',
            height: '100vh',
          }}
        >
          <div className="door-camera-rig door-stage-frame" style={{ perspective: 1200 }}>
            <img
              src="/images/door-scene-closed.jpg"
              alt="Architectural room with a closed forest-green and brass meeting room door"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{ imageRendering: 'high-quality' }}
            />

            <img
              src="/images/door-scene-open.png"
              alt="Architectural room with the meeting room door open into the workspace"
              className="door-open-layer pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
              style={{ opacity: doorClickedOpen ? 1 : 0, imageRendering: 'high-quality' }}
            />

            <button
              type="button"
              onClick={handleDoorClick}
              className="door-hotspot"
              aria-label={doorClickedOpen ? 'Step through the open meeting room door to sign in' : 'Click to open the meeting room door'}
            >
              <span className="sr-only">
                {doorClickedOpen ? 'Enter workspace portal' : 'Open meeting room door'}
              </span>
            </button>
          </div>

          {/* Architectural Wall Copy */}
          <div className="door-wall-copy pointer-events-none absolute inset-x-0 top-24 z-10 mx-auto max-w-6xl px-5 sm:top-auto sm:px-10">
            <div
              className="pointer-events-auto max-w-md rounded-3xl p-6 sm:p-7"
              style={{
                background: 'linear-gradient(145deg, rgba(247, 248, 244, 0.84) 0%, rgba(232, 238, 228, 0.64) 100%)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(255, 255, 255, 0.78)',
                boxShadow: '0 22px 48px -12px rgba(22, 43, 34, 0.16)',
              }}
            >
              <span
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: 'var(--sf-forest)' }}
              >
                <span className="h-px w-6" style={{ background: 'var(--sf-forest)' }} />
                Your Space Awaits
              </span>
              <h2
                className="mt-3 text-balance text-2xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-3xl"
                style={{ color: 'var(--sf-navy)' }}
              >
                One door away from a calmer workday.
              </h2>
              <p className="mt-3 text-sm leading-6" style={{ color: 'var(--sf-ink-muted)' }}>
                Click the door to open it, or continue scrolling to step inside and access your organization&apos;s
                reservation portal.
              </p>
              <button
                type="button"
                onClick={handleDoorClick}
                className="forest-pill-button mt-5 inline-flex min-h-[42px] items-center gap-2 px-5 py-2.5 text-xs"
              >
                <DoorOpen className="h-4 w-4" aria-hidden="true" />
                <span>{doorClickedOpen ? 'Entering workspace…' : 'Open the door'}</span>
              </button>
            </div>
          </div>

          {/* Soft radial threshold vignette as camera enters the dark doorway */}
          <div
            aria-hidden="true"
            className="door-dark-veil pointer-events-none absolute inset-0 z-20 opacity-0"
            style={{
              background: 'radial-gradient(circle at 65.6% 49%, rgba(20, 27, 23, 0.72) 0%, rgba(20, 27, 23, 0.94) 75%)',
            }}
          />
        </section>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          PHASE 4: CENTERED GLASSMORPHISM 2.0 LOGIN PORTAL
         ════════════════════════════════════════════════════════════════════════ */}
      <section id="portal-login" aria-label="Workspace sign-in portal" className="relative z-10">
        <AuthGlassPortal skipEntrance />
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          PHASE 6: FOUR ORGANIZATION CAPABILITY CARDS (ORBIT PRESENTATION)
         ════════════════════════════════════════════════════════════════════════ */}
      <OrbitFeatureCards />

      {/* ════════════════════════════════════════════════════════════════════════
          PHASE 8: FOOTER
         ════════════════════════════════════════════════════════════════════════ */}
      <LandingFooter onNavigateSection={navigateToSection} />
    </div>
  );
}
