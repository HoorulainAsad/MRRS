import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, MessageCircle, Sparkles, X } from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import { getAssistantResponse, getAssistantSuggestions } from '../../services/assistantService';
import { Robot } from './Robot';

const welcomeMessage = {
  id: 'welcome',
  sender: 'assistant',
  text: 'Hi, I’m Orbit—a scripted demo workspace guide. Ask me about navigating this demo, reservation reviews, or resource availability.',
};

export function RobotAssistant() {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [suggestions, setSuggestions] = useState(() => getAssistantSuggestions(session));
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [robotState, setRobotState] = useState('idle');
  const requestRef = useRef(0);
  const responseTimerRef = useRef(null);
  const messageIdRef = useRef(0);
  const scrollRef = useRef(null);
  const launcherRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => () => {
    requestRef.current += 1;
    window.clearTimeout(responseTimerRef.current);
  }, []);

  useEffect(() => {
    if (open && scrollRef.current?.scrollIntoView) {
      scrollRef.current.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    }
  }, [messages, thinking, open, reduceMotion]);

  const sendMessage = async (value) => {
    const message = value.trim();
    if (!message || thinking) return;

    const requestId = ++requestRef.current;
    messageIdRef.current += 1;
    setMessages((current) => [...current, { id: `user-${messageIdRef.current}`, sender: 'user', text: message }]);
    setInput('');
    setSuggestions([]);
    setThinking(true);
    setRobotState('thinking');
    window.clearTimeout(responseTimerRef.current);

    try {
      const response = await getAssistantResponse(session, message);
      if (requestId !== requestRef.current) return;
      messageIdRef.current += 1;
      setMessages((current) => [...current, { id: `assistant-${messageIdRef.current}`, sender: 'assistant', text: response.text }]);
      setSuggestions(response.suggestions || []);
      setRobotState('responding');
      responseTimerRef.current = window.setTimeout(() => setRobotState('idle'), 1800);
    } catch {
      if (requestId !== requestRef.current) return;
      messageIdRef.current += 1;
      setMessages((current) => [...current, {
        id: `assistant-${messageIdRef.current}`,
        sender: 'assistant',
        text: 'I couldn’t load that demo guidance. Please try another suggestion. No reservation or workspace change was made.',
      }]);
      setRobotState('idle');
    } finally {
      if (requestId === requestRef.current) setThinking(false);
    }
  };

  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring', damping: 26, stiffness: 320 };

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.section
            id="orbit-assistant-panel"
            role="dialog"
            aria-modal="false"
            aria-labelledby="orbit-title"
            className="fixed inset-x-2 bottom-2 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-3xl border border-white/70 bg-mist-50 shadow-2xl shadow-navy-950/30 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[390px]"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.97 }}
            transition={panelTransition}
          >
            <header className="relative flex shrink-0 items-center gap-3 overflow-hidden bg-navy-950 px-4 py-4 text-white">
              <div className="surface-grid absolute inset-0 opacity-30" aria-hidden="true" />
              <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-brand-500/20 blur-2xl" aria-hidden="true" />
              <Robot state={robotState} className="relative h-16 w-16 shrink-0" />
              <div className="relative min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 id="orbit-title" className="font-bold">Orbit</h2>
                  <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-100">Demo guide</span>
                </div>
                <p className="mt-1 text-xs text-slate-300">Workspace guidance, not live AI</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  launcherRef.current?.focus();
                }}
                className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close Orbit demo guide"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            <div className="chat-scroll min-h-40 flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-relevant="additions">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${message.sender === 'user' ? 'rounded-br-md bg-navy-900 text-white' : 'rounded-bl-md border border-mist-200 bg-white text-ink-900 shadow-sm'}`}>
                      {message.text}
                    </div>
                  </div>
                ))}
                {thinking ? (
                  <div className="flex items-center gap-3" role="status">
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-mist-200 bg-white px-4 py-3 shadow-sm">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          className="h-1.5 w-1.5 rounded-full bg-brand-500"
                          animate={reduceMotion ? { opacity: 0.6 } : { y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.14 }}
                        />
                      ))}
                      <span className="sr-only">Orbit is preparing demo guidance</span>
                    </div>
                  </div>
                ) : null}
                <div ref={scrollRef} aria-hidden="true" />
              </div>
            </div>

            {!thinking && suggestions.length ? (
              <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3" aria-label="Suggested questions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    className="min-h-9 shrink-0 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:border-brand-500 hover:bg-brand-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="shrink-0 border-t border-mist-200 bg-white p-3">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage(input);
                }}
                className="flex items-center gap-2 rounded-2xl border border-mist-200 bg-mist-50 p-1.5 focus-within:border-brand-500"
              >
                <label htmlFor="orbit-message" className="sr-only">Ask Orbit for demo guidance</label>
                <input
                  id="orbit-message"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about this demo…"
                  className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm text-navy-900 outline-none placeholder:text-slate-400"
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!input.trim() || thinking}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-900 text-white transition-colors hover:bg-navy-800 disabled:bg-slate-200 disabled:text-slate-400"
                  aria-label="Send message to Orbit"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
              <p className="mt-2 px-1 text-center text-[10px] leading-4 text-ink-500">
                Demo guidance only. Orbit never submits bookings; reservations require review and confirmation.
              </p>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {!open ? (
        <motion.p
          className="pointer-events-none fixed bottom-24 right-4 z-40 max-w-56 rounded-2xl rounded-br-md border border-brand-100 bg-white px-4 py-3 text-sm font-medium text-navy-900 shadow-lift sm:right-6"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.4 }}
        >
          Hi! Need help booking a workspace?
        </motion.p>
      ) : null}

      <motion.button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-4 right-4 z-40 flex h-16 items-center gap-1 rounded-2xl border border-white/80 bg-white py-1 pl-1 pr-3 shadow-lift ring-1 ring-navy-900/5 sm:bottom-6 sm:right-6"
        aria-label={open ? 'Close Orbit demo guide' : 'Open Orbit demo guide'}
        aria-expanded={open}
        aria-controls="orbit-assistant-panel"
        whileHover={reduceMotion ? undefined : { y: -3 }}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      >
        <Robot state={robotState} className="h-14 w-14" />
        <span className="hidden text-left min-[420px]:block">
          <span className="flex items-center gap-1 text-xs font-bold text-navy-900"><MessageCircle className="h-3 w-3 text-brand-600" aria-hidden="true" /> Ask Orbit</span>
          <span className="mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-brand-600"><Sparkles className="h-2.5 w-2.5" aria-hidden="true" /> Demo guide</span>
        </span>
      </motion.button>
    </>
  );
}
