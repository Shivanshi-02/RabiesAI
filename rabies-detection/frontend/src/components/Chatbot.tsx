import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  AlertTriangle,
  Syringe,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  role: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

interface ChatbotProps {
  riskContext?: {
    riskLevel?: string;
    probability?: number;
    patientName?: string;
    recommendations?: string[];
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getRiskBadgeClass = (riskLevel?: string) => {
  if (riskLevel === 'High') return 'bg-crimson-500/20 text-crimson-400 border-crimson-500/30';
  if (riskLevel === 'Medium') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
};

const formatProbability = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(0)}%`;
};

const getRiskIntro = (ctx?: ChatbotProps['riskContext']) => {
  if (!ctx?.riskLevel) {
    return `Greetings. I'm **RabiesAI Research Assistant**. 🔬
    
I can provide clinical guidance on:
- **WHO Category III Protocols**
- **Wound Irrigation Techniques**
- **Symptom Logic (Hydrophobia/Paralysis)**
- **Animal Epidemiology**
- **Diagnostic Score Interpretation**

Complete the clinical assessment for real-time diagnostic support.`;
  }

  const name = ctx.patientName || 'this patient';
  return `Evaluation for **${name}** is active. 📋
    
**Diagnostic State:**
- **Risk Classification:** ${ctx.riskLevel}
- **Assessed Probability:** ${formatProbability(ctx.probability)}

How can I assist with this clinical record? 
*(e.g., "Explain priority recommendations" or "Next steps for high risk")*`;
};

// ── Clinical Knowledge Base ───────────────────────────────────────────────────
const KNOWLEDGE: Array<{
  patterns: RegExp[];
  answer: (ctx?: ChatbotProps['riskContext']) => string;
}> = [
  {
    patterns: [/pep|post.?exposure|prophylax/i],
    answer: () =>
      `**Post-Exposure Prophylaxis (PEP) Protocol**
      
1. **Immediate Wound Hygiene:** Vigorously wash with soap/detergent and water for 15+ minutes.
2. **Standard Vaccination:** Start the 4 or 5-dose vaccine course immediately (D0, D3, D7, D14, [D28]).
3. **Passive Immunization (RIG):** Essential for Category III exposures.
4. **Antibiotics/Tetanus:** Evaluate need based on wound severity.

⚠️ **Rabies is fatal once symptoms appear.** PEP is a 100% effective emergency intervention if initiated promptly post-exposure.`,
  },
  {
    patterns: [/rig|immunoglobulin/i],
    answer: () =>
      `**Rabies Immunoglobulin (RIG) Guidelines**
      
- **Function:** Provides passive antibodies for immediate viral neutralization at the wound site.
- **Indication:** Recommended for all high-risk (Category III) exposures.
- **Administration:** Infiltrate as much as possible deep into and around all wounds.
- **Timing:** Administer on D0 along with the first dose of vaccine.

Consult a clinical expert for dosing (20 IU/kg for HRIG).`,
  },
  {
    patterns: [/wound|wash|clean|irrigat/i],
    answer: () =>
      `**Acute Wound Management Protocol**
      
Immediate and thorough wound cleansing is critical for removing rabies virus particles:
1. **Irrigation:** Use soap or detergent and copious amounts of running water for **15 minutes**.
2. **Antiseptics:** Apply iodine-based solutions or 70% ethanol after washing.
3. **Structural Care:** Delay suturing if possible to avoid trauma near nerve endings.

*Proper irrigation can reduce viral load by up to 90%.*`,
  },
  {
    patterns: [/hydrophobi|water|swallow/i],
    answer: () =>
      `**Hydrophobia & Spastic Symptoms**
      
If the patient displays:
- **Hydrophobia:** Fear of water or intense spasms when attempting to drink.
- **Aerophobia:** Spasms triggered by air currents.
- **Hypersalivation or Agitation.**

🚨 **This is a medical emergency.** Transfer the patient to intensive care immediately for palliative management and isolation. Hydrophobia is a pathognomonic sign of advanced rabies.`,
  },
  {
    patterns: [/symptom|sign|watch|look for|warning/i],
    answer: (ctx) => {
      const base = `**Clinical Symptom Monitoring**
      
**Prodromal Phase:**
- Localized paraesthesia (tingling/itching) at the bite site.
- Flu-like symptoms (fever, malaise).

**Neurological Phase:**
- **Furious Rabies:** Agitation, hydrophobia, aerophobia.
- **Paralytic Rabies:** Slow progression of weakness starting at the wound site.

🚨 Monitor for any altered mental status or neurological deficit.`;

      if (ctx?.riskLevel === 'High') {
        return `${base}\n\n⚠️ **Urgent:** Given the **High Risk** status, any neurological symptom warrants immediate emergency intervention.`;
      }
      return base;
    },
  },
  {
    patterns: [/next.?step|what.*do|should.*do|recommend|advice|suggest/i],
    answer: (ctx) => {
      if (!ctx?.riskLevel) {
        return `**Strategic Next Steps**
        
1. **Initialize Assessment:** Use the RabiesAI tool to quantify exposure risk.
2. **Wound Care:** Wash all contact points with soap and water immediately.
3. **Facility Visit:** Locate the nearest center providing modern cell-culture vaccines.
4. **Vaccination:** Start PEP if the animal is wild or showing signs of rabies.`;
      }

      const name = ctx.patientName || 'this patient';
      const recs = ctx.recommendations?.length
        ? ctx.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
        : `1. Immediate clinician review required.\n2. Verify PEP administration status.\n3. Watch for neurological prodrome.`;

      return `**Actionable Protocols for ${name}**
      
**Current Risk Tier:** ${ctx.riskLevel}

**Priority Actions:**
${recs}

Does the patient have access to high-quality vaccine supplies?`;
    },
  },
  {
    patterns: [/hello|hi|hey|start|help|what.*can|who.*you/i],
    answer: (ctx) => getRiskIntro(ctx),
  },
];

const FALLBACK = `I don't have a specific research-backed protocol for that query.
    
Try asking:
- **How to clean the wound?**
- **Explain PEP protocol**
- **What symptoms are dangerous?**
- **Next steps for this specific case**`;

function getBotResponse(query: string, ctx?: ChatbotProps['riskContext']): string {
  for (const entry of KNOWLEDGE) {
    if (entry.patterns.some((pattern) => pattern.test(query))) {
      return entry.answer(ctx);
    }
  }
  return FALLBACK;
}

// ── Markdown-lite renderer ───────────────────────────────────────────────────
function renderInlineBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-3" />;
    
    // Unordered lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.match(/^\d+\.\s/)) {
      const content = trimmed.replace(/^([-•]|\d+\.)\s/, '');
      return (
        <div key={i} className="flex gap-3 mb-2">
          <ChevronRight className="w-3 h-3 text-crimson-500 mt-1 flex-shrink-0" />
          <p className="text-slate-300 text-xs leading-relaxed">{renderInlineBold(content)}</p>
        </div>
      );
    }

    return (
      <p key={i} className="text-slate-300 text-xs leading-relaxed mb-3 font-light">
        {renderInlineBold(trimmed)}
      </p>
    );
  });
}

const Chatbot: React.FC<ChatbotProps> = ({ riskContext }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'bot', text: getRiskIntro(riskContext), timestamp: new Date() },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(1);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [open, messages]);

  useEffect(() => {
    setMessages([{ id: 0, role: 'bot', text: getRiskIntro(riskContext), timestamp: new Date() }]);
  }, [riskContext]);

  const pushBotReply = useCallback((replyText: string) => {
    setMessages(prev => [...prev, {
      id: idCounter.current++,
      role: 'bot',
      text: replyText,
      timestamp: new Date()
    }]);
  }, []);

  const sendSpecificMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    setMessages(prev => [...prev, {
      id: idCounter.current++,
      role: 'user',
      text: trimmed,
      timestamp: new Date()
    }]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      pushBotReply(getBotResponse(trimmed, riskContext));
      setThinking(false);
    }, 600);
  }, [thinking, riskContext, pushBotReply]);

  const suggestionGroups = useMemo(() => {
    const common = [
      { title: 'Emergency', icon: AlertTriangle, items: ['Is this an emergency?', 'Explain PEP protocol'] },
      { title: 'Wound Care', icon: Syringe, items: ['How to wash the wound?', 'Antiseptic use'] },
      { title: 'Understanding', icon: Info, items: ['What does probability mean?', 'Symptoms to watch'] }
    ];
    return common;
  }, []);

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        id="chatbot-trigger"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl accent-gradient text-white shadow-glow-lg flex items-center justify-center border border-white/10"
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
        {!open && <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="chatbot-window"
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[640px] flex flex-col rounded-[32px] glass-card border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Glossy Header */}
            <div className="p-6 bg-slate-950/40 border-b border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-crimson-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white outfit">RabiesAI Research Unit</h3>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Autonomous Assistant v2.0</span>
                </div>
              </div>
              {riskContext?.riskLevel && (
                <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${getRiskBadgeClass(riskContext.riskLevel)}`}>
                  {riskContext.riskLevel} RISK
                </div>
              )}
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border transition-all ${
                    msg.role === 'bot' ? 'bg-slate-900 border-white/5' : 'accent-gradient border-transparent'
                  }`}>
                    {msg.role === 'bot' ? <Bot className="w-4 h-4 text-crimson-500" /> : <User className="w-4 h-4 text-white" />}
                  </div>
                  
                  <div className={`max-w-[85%] rounded-2xl p-4 md:p-5 ${
                    msg.role === 'bot' 
                      ? 'bg-white/5 border border-white/5 rounded-tl-none' 
                      : 'bg-crimson-500/10 border border-crimson-500/20 rounded-tr-none'
                  }`}>
                    {msg.role === 'bot' ? (
                      <div>{renderMarkdown(msg.text)}</div>
                    ) : (
                      <p className="text-slate-200 text-xs font-medium leading-relaxed">{msg.text}</p>
                    )}
                    <div className="mt-3 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}

              {thinking && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-crimson-500" />
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none px-5 py-4 flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div 
                        key={i} 
                        className="w-1.5 h-1.5 rounded-full bg-crimson-500" 
                        animate={{ opacity: [0.3, 1, 0.3] }} 
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }} 
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            <div className="px-6 py-4 bg-slate-950/20 border-t border-white/5 space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {suggestionGroups.map(group => (
                  <div key={group.title} className="flex gap-2 flex-shrink-0">
                    {group.items.map(item => (
                      <button
                        key={item}
                        onClick={() => sendSpecificMessage(item)}
                        className="px-4 py-2 rounded-xl glass border border-white/5 text-[10px] font-bold text-slate-400 hover:text-white hover:border-crimson-500/50 transition-all whitespace-nowrap"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask for deeper clinical context..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendSpecificMessage(input)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-medium focus:outline-none focus:border-crimson-500/50 transition-all placeholder:text-slate-600"
                />
                <button
                  onClick={() => sendSpecificMessage(input)}
                  disabled={!input.trim() || thinking}
                  className="w-14 h-14 rounded-2xl accent-gradient text-white flex items-center justify-center shadow-lg disabled:opacity-20 transition-all hover:shadow-glow"
                >
                  {thinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;