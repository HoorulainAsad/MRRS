import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo, SpaceFlowMark } from '../components/Logo';
import { useSession } from '../hooks/useSession';
import { AuthPage } from './AuthPage';

const EASE = [0.22, 1, 0.36, 1];
const STAGE_HEIGHT_VH = 320;
const SNAP_POINTS = [0, 0.48, 0.84, 1];

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="flex h-11 w-10 shrink-0 items-center justify-center">
        <SpaceFlowMark className="h-7 w-7" />
      </span>
      <span className="text-xl font-semibold tracking-[-0.03em]" style={{ color: 'var(--ink-dark)' }}>
        Space<span style={{ color: 'var(--sage)' }}>Flow</span>
      </span>
    </span>
  );
}

function IntroLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center"
      style={{ background: 'var(--off-white)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      role="status"
      aria-label="Loading SpaceFlow"
    >
      <div className="text-center">
        <BrandMark />
        <div className="mx-auto mt-7 h-[3px] w-52 overflow-hidden rounded-full" style={{ background: 'rgba(142,168,148,0.3)' }}>
          <div className="intro-loader-bar h-full w-full rounded-full" style={{ background: 'var(--forest)' }} />
        </div>
        <p className="mt-3 text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>Preparing your workspace…</p>
      </div>
    </motion.div>
  );
}

function StaticLanding() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [doorOpen, setDoorOpen] = useState(false);
  const [openingDoor, setOpeningDoor] = useState(false);
  const [authTransition, setAuthTransition] = useState(false);
  const enterTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(enterTimer.current), []);

  const openDoor = () => {
    if (session) {
      navigate('/app/dashboard');
      return;
    }
    if (openingDoor) return;
    setOpeningDoor(true);
    setDoorOpen(true);
    enterTimer.current = window.setTimeout(() => setAuthTransition(true), 500);
  };

  return (
    <>
    <main
      className="relative grid min-h-screen place-items-center overflow-hidden px-6 py-20 text-white"
      style={{
        backgroundImage: 'linear-gradient(105deg, rgba(18,21,19,0.78) 0%, rgba(18,21,19,0.44) 55%, rgba(18,21,19,0.2) 100%), url("/images/landing-architecture-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <header className="absolute inset-x-0 top-0 z-10 mx-auto flex max-w-7xl px-5 py-4 sm:px-8">
        <Logo to="/" />
      </header>
      <div className="relative z-[2] grid w-full max-w-6xl items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] md:gap-10">
        <div className="mx-auto max-w-xl text-center md:mx-0 md:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E1D8C8]">SpaceFlow · Shared workspaces</p>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl">Make room for your best work.</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/80 sm:text-base sm:leading-7 md:mx-0">
            Find a quiet desk for deep focus or the right meeting room for your next big idea.
          </p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/75">Click the closed door to continue</p>
        </div>

        <div className="mx-auto flex flex-col items-center">
          <button
            type="button"
            onClick={openDoor}
            className="landing-door-trigger relative block border-0 bg-transparent p-0 focus-visible:outline-offset-4"
            aria-label={openingDoor ? 'Meeting room door opening' : 'Open the meeting room door'}
          >
            <img
              src="/images/meeting-door-closed.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain"
              style={{ opacity: doorOpen ? 0 : 1, transition: 'opacity 0.45s ease', filter: 'drop-shadow(0 24px 24px rgba(0,0,0,0.34))' }}
            />
            <img
              src="/images/meeting-door-frame.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain"
              style={{ opacity: doorOpen ? 1 : 0, transition: 'opacity 0.45s ease', filter: 'drop-shadow(0 24px 24px rgba(0,0,0,0.34))' }}
            />
          </button>
          <p className="mb-0 mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
            {openingDoor ? 'Opening · taking you to sign in' : 'Meeting Room A'}
            {!openingDoor ? <ArrowRight className="ml-2 inline h-3 w-3" aria-hidden="true" /> : null}
          </p>
        </div>
      </div>
    </main>
    <AnimatePresence>
      {authTransition ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed inset-0 z-[110] overflow-auto"
          style={{ pointerEvents: 'none' }}
          onAnimationComplete={() => navigate('/login', { state: { skipEntrance: true } })}
        >
          <AuthPage skipEntrance />
        </motion.div>
      ) : null}
    </AnimatePresence>
    </>
  );
}

const STAGES = [
  { label: 'The space', fraction: 0 },
  { label: 'The door', fraction: 0.55 },
  { label: 'Enter', fraction: 0.94 },
];

function ScrollPortal() {
  const navigate = useNavigate();
  const { session } = useSession();
  const stageRef = useRef(null);
  const authTimer = useRef(null);
  const animations = useRef([]);
  const entranceStarted = useRef(false);
  const [openingDoor, setOpeningDoor] = useState(false);
  const [authTransition, setAuthTransition] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [doorInteractive, setDoorInteractive] = useState(false);
  const [headerInteractive, setHeaderInteractive] = useState(true);
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ['start start', 'end end'] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.5 });

  const clickDoorProgress = useMotionValue(0);
  const walkThroughProgress = useMotionValue(0);

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('landing-scroll-snap');
    window.scrollTo(0, 0);
    return () => root.classList.remove('landing-scroll-snap');
  }, []);

  useEffect(() => () => {
    window.clearTimeout(authTimer.current);
    animations.current.forEach((control) => control.stop());
  }, []);

  const startEntrance = () => {
    if (entranceStarted.current) return;
    entranceStarted.current = true;
    if (session) {
      navigate('/app/dashboard');
      return;
    }

    setOpeningDoor(true);
    animations.current.push(animate(clickDoorProgress, 1, { duration: 0.72, ease: EASE }));
    animations.current.push(animate(walkThroughProgress, 1, { delay: 0.72, duration: 1.1, ease: EASE }));
    authTimer.current = window.setTimeout(() => setAuthTransition(true), 1830);
  };

  useMotionValueEvent(smoothProgress, 'change', (value) => {
    setActiveStage(value < 0.48 ? 0 : value < 0.86 ? 1 : 2);
    setDoorInteractive(value >= 0.46 && value < 0.95);
    setHeaderInteractive(value < 0.86);
    if (value >= 0.84) startEntrance();
  });

  // STAGE 1 — arch room reveal
  const archStartW = Math.min(640, viewport.w * 0.88);
  const archStartH = Math.min(620, viewport.h * 0.76);
  const archWidth = useTransform(smoothProgress, [0, 0.35], [archStartW, viewport.w]);
  const archHeight = useTransform(smoothProgress, [0, 0.35], [archStartH, viewport.h]);
  const archRadius = useTransform(smoothProgress, [0, 0.35], [archStartW / 2, 0]);
  const archScale = useTransform(smoothProgress, [0, 0.35], [0.92, 1]);
  const archImageScale = useTransform(smoothProgress, [0, 0.38], [1, 1.24]);
  const archOpacity = useTransform(smoothProgress, [0.3, 0.54], [1, 0]);
  const heroCopyOpacity = useTransform(smoothProgress, [0, 0.22], [1, 0]);
  const heroCopyY = useTransform(smoothProgress, [0, 0.22], [0, -36]);
  const scrollHintOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);

  // STAGE 2 — door imagery crossfades from closed to open on click or scroll.
  const doorSectionOpacity = useTransform(smoothProgress, [0.3, 0.46, 0.85, 0.94], [0, 1, 1, 0]);
  const doorOpenProgressScroll = useTransform(smoothProgress, [0.7, 0.84], [0, 1]);
  const doorOpenProgress = useTransform(
    [doorOpenProgressScroll, clickDoorProgress],
    ([scroll, click]) => Math.max(scroll, click),
  );
  const closedDoorOpacity = useTransform(doorOpenProgress, [0, 0.28, 0.72], [1, 1, 0]);
  const openDoorOpacity = useTransform(doorOpenProgress, [0.28, 0.72, 1], [0, 1, 1]);
  const closedDoorScale = useTransform(doorOpenProgress, [0, 1], [1, 0.96]);
  const openDoorScale = useTransform(doorOpenProgress, [0, 1], [0.96, 1]);
  const openDoorRotateY = useTransform(doorOpenProgress, [0.28, 0.72], [-104, 0]);
  const doorWalkScale = useTransform(walkThroughProgress, [0, 0.7, 1], [1, 3.5, 8]);
  const doorLayerOpacity = useTransform(walkThroughProgress, [0, 0.72, 0.96, 1], [1, 1, 0, 0]);
  const compactDoorViewport = viewport.w < 768;
  const doorButtonWidth = compactDoorViewport
    ? Math.max(230, Math.min(viewport.w * 0.3, 320))
    : Math.max(280, Math.min(viewport.w * 0.32, 460));
  const doorButtonHeight = compactDoorViewport
    ? Math.min(viewport.h * 0.62, 460)
    : Math.min(viewport.h * 0.82, 680);
  const doorArtworkWidth = Math.min(doorButtonWidth, doorButtonHeight * (441 / 1107));
  const doorZoomOriginX = ((doorButtonWidth - doorArtworkWidth) / 2 + doorArtworkWidth * 0.845) / doorButtonWidth * 100;
  const doorHingeOriginX = ((doorButtonWidth - doorArtworkWidth) / 2 + doorArtworkWidth * 0.06) / doorButtonWidth * 100;
  const doorCameraScaleScroll = useTransform(smoothProgress, [0.62, 0.88], [1, 1.02]);
  const doorCameraScale = doorCameraScaleScroll;

  const headerOpacity = useTransform(smoothProgress, [0.78, 0.88], [1, 0]);

  const scrollToFraction = (fraction) => {
    const stage = stageRef.current;
    if (!stage) return;
    const distance = stage.offsetHeight - window.innerHeight;
    window.scrollTo({ top: fraction * distance, behavior: 'smooth' });
  };

  const openDoor = () => {
    startEntrance();
  };

  return (
    <div ref={stageRef} className="relative" style={{ height: `${STAGE_HEIGHT_VH}vh` }}>
      {SNAP_POINTS.map((fraction) => (
        <div
          key={fraction}
          className="landing-scroll-snap-marker"
          style={{ top: `${(STAGE_HEIGHT_VH - 100) * fraction}vh` }}
          aria-hidden="true"
        />
      ))}
      {/* Fixed chrome */}
      <motion.div className="fixed inset-x-0 top-0 z-40 h-[3px]" style={{ scaleX: scrollYProgress, transformOrigin: 'left center', background: 'linear-gradient(90deg, var(--sage), var(--forest))' }} aria-hidden="true" />

      <motion.header style={{ opacity: headerOpacity, pointerEvents: headerInteractive ? 'auto' : 'none' }} className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center px-5 py-4 sm:px-8">
          <Logo
            to="/"
            light={activeStage === 0}
          />
        </div>
      </motion.header>

      <motion.nav style={{ opacity: headerOpacity, pointerEvents: headerInteractive ? 'auto' : 'none' }} className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 md:flex" aria-label="Landing stages">
        {STAGES.map((stage, index) => (
          <button key={stage.label} type="button" onClick={() => scrollToFraction(stage.fraction)} className="group flex items-center gap-2" aria-label={`Go to ${stage.label}`} aria-current={activeStage === index ? 'step' : undefined}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--forest)' }}>{stage.label}</span>
            <span className="block rounded-full transition-all" style={{ width: activeStage === index ? 12 : 8, height: activeStage === index ? 12 : 8, background: activeStage === index ? 'var(--forest)' : 'rgba(27,59,43,0.3)' }} />
          </button>
        ))}
      </motion.nav>

      {/* Sticky viewport */}
      <div className="landing-grain sticky top-0 h-screen w-full overflow-hidden" style={{ background: 'var(--off-white)' }}>
        <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          <img src="/images/landing-architecture-bg.jpg" alt="" className="h-full w-full object-cover" />
        </div>
        <motion.div
          className="absolute inset-0 z-[1]"
          style={{
            opacity: doorSectionOpacity,
            backgroundImage: 'linear-gradient(105deg, rgba(18,21,19,0.8) 0%, rgba(18,21,19,0.54) 52%, rgba(18,21,19,0.4) 100%), url("/images/workspace-hero.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'saturate(0.55)',
          }}
          aria-hidden="true"
        />

        {/* STAGE 1 — arch reveal */}
        <motion.section style={{ opacity: archOpacity, pointerEvents: 'none' }} className="absolute inset-0 z-[2] flex items-center justify-center">
          <motion.div
            style={{
              width: archWidth,
              height: archHeight,
              scale: archScale,
              borderTopLeftRadius: archRadius,
              borderTopRightRadius: archRadius,
              border: '8px solid #8C887D',
              boxShadow: '0 24px 60px rgba(22,25,23,0.22), inset 0 0 0 1px rgba(255,255,255,0.22)',
            }}
            className="relative overflow-hidden"
          >
            <motion.img
              src="/images/workspace-hero.jpg"
              alt="Shared workspace and meeting room"
              className="block h-full w-full object-cover"
              style={{ scale: archImageScale, transformOrigin: 'center center' }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(9,12,11,0.4) 0%, rgba(9,12,11,0.58) 100%)' }} aria-hidden="true" />
          </motion.div>

          <div className="absolute inset-0 z-[3] grid place-items-center px-6 text-center text-white">
            <motion.div style={{ opacity: heroCopyOpacity, y: heroCopyY }} className="w-full">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#D5C4A5' }} />
                SpaceFlow · Shared workspaces
              </span>
              <h1 className="mx-auto mt-5 max-w-3xl text-balance font-bold leading-[1.05] tracking-[-0.04em]" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
                Make room for your best work.
              </h1>
              <p className="mx-auto mt-5 max-w-[510px] text-base leading-7 text-white/85 sm:text-lg">
                Find a quiet desk for deep focus or the right meeting room for your next big idea.
              </p>
            </motion.div>
          </div>

          <motion.div style={{ opacity: scrollHintOpacity }} className="absolute bottom-7 left-1/2 z-[3] -translate-x-1/2 text-center" aria-hidden="true">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--ink-muted)' }}>Scroll to discover your space</span>
            <ChevronDown className="scroll-hint-chevron mx-auto mt-1 h-5 w-5" style={{ color: 'var(--ink-muted)' }} />
          </motion.div>
        </motion.section>

        {/* STAGE 2 — meeting room door */}
        <motion.section
          style={{ opacity: doorSectionOpacity, scale: doorCameraScale, pointerEvents: doorInteractive ? 'auto' : 'none', perspective: 1600 }}
          className="absolute inset-0 z-[4] grid place-items-center overflow-hidden px-4 py-4 sm:px-8 sm:py-6 lg:px-14"
        >
          <div className="grid w-full max-w-6xl items-center gap-3 md:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] md:gap-10">
            <div className="mx-auto max-w-xl text-center md:mx-0 md:text-left">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#E1D8C8]">
                <span className="h-px w-8 bg-[#B7A98F]" />
                Your space is ready
              </span>
              <h2 className="mt-3 text-balance font-bold leading-[1.04] tracking-[-0.035em] text-white sm:mt-4" style={{ fontSize: 'clamp(1.8rem, 4.7vw, 4.1rem)' }}>
                One door away from a better workday.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[13px] leading-5 text-white/75 sm:mt-5 sm:text-base sm:leading-7 md:mx-0">
                Open the meeting room door to sign in, book a shared desk, and find the space that fits your day.
              </p>
              <div className="mt-7 hidden flex-wrap gap-2.5 md:flex">
                {['Meeting rooms', 'Flexible desks', 'Simple reservations'].map((feature) => (
                  <span key={feature} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/85 backdrop-blur-sm">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto flex flex-col items-center">
              <motion.button
                type="button"
                onClick={openDoor}
                aria-label={openingDoor ? 'Meeting room door opening' : 'Open the meeting room door'}
                className="landing-door-trigger relative block border-0 bg-transparent p-0 focus-visible:outline-offset-4"
                style={{ scale: doorWalkScale, opacity: doorLayerOpacity, transformOrigin: `${doorZoomOriginX}% 50%` }}
              >
                <motion.img
                  src="/images/meeting-door-closed.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{
                    opacity: closedDoorOpacity,
                    scale: closedDoorScale,
                    backfaceVisibility: 'hidden',
                    transformOrigin: `${doorHingeOriginX}% center`,
                    filter: 'drop-shadow(0 24px 24px rgba(0,0,0,0.34))',
                  }}
                />
                <motion.img
                  src="/images/meeting-door-frame.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{
                    opacity: openDoorOpacity,
                    scale: openDoorScale,
                    rotateY: openDoorRotateY,
                    backfaceVisibility: 'hidden',
                    transformOrigin: `${doorHingeOriginX}% center`,
                    filter: 'drop-shadow(0 24px 24px rgba(0,0,0,0.34))',
                  }}
                />
              </motion.button>
              <p className="mb-0 mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                {openingDoor ? 'Opening · taking you to sign in' : 'Click the door to continue'}
                {!openingDoor ? <ArrowRight className="ml-2 inline h-3 w-3" aria-hidden="true" /> : null}
              </p>
            </div>
          </div>
        </motion.section>

      </div>
      <AnimatePresence>
        {authTransition ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed inset-0 z-[110] overflow-auto"
            style={{ pointerEvents: 'none' }}
            onAnimationComplete={() => navigate('/login', { state: { skipEntrance: true } })}
          >
            <AuthPage skipEntrance />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function LandingPage() {
  const reduceMotion = useReducedMotion();
  const [introDone, setIntroDone] = useState(Boolean(reduceMotion));

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = window.setTimeout(() => setIntroDone(true), 1500);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  if (reduceMotion) return <StaticLanding />;

  return (
    <>
      <AnimatePresence>{!introDone ? <IntroLoader /> : null}</AnimatePresence>
      <ScrollPortal />
    </>
  );
}