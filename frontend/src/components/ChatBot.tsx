'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, IssueItem } from '../lib/types';
import { sendChatMessage, getAiStatus, AiStatusResponse } from '../lib/api';
import TrustTag from './TrustTag';
import { Send, Bot, User, Sparkles, ExternalLink, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ChatBotProps {
  owner: string;
  repo: string;
  selectedIssue?: IssueItem | null;
}

export default function ChatBot({ owner, repo, selectedIssue }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello! I'm your AI Repository Mentor for **${owner}/${repo}**.\n\nI am powered by Qwen3-Coder with RAG retrieval over this codebase. Ask me anything about the architecture, key files, tests, or issue ${
        selectedIssue ? `#${selectedIssue.number}` : 'contributions'
      }.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      trust_ratings: {
        verified: [`✓ Vector index initialized for ${owner}/${repo}`],
        inferred: [],
        unknown: []
      }
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'What does this repository do?',
    'Explain the architecture in simple terms',
    selectedIssue ? `Explain issue #${selectedIssue.number}` : 'Where should I start reading code?',
    'How do I run tests?'
  ];

  useEffect(() => {
    fetchAiStatus();
  }, []);

  const fetchAiStatus = async () => {
    try {
      const res = await getAiStatus();
      setAiStatus(res);
    } catch {
      setAiStatus({ status: 'unavailable', model: 'qwen-2.5-coder-32b', provider: 'Groq', demo_mode: true });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (promptText?: string) => {
    const textToSend = promptText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!promptText) setInput('');
    setLoading(true);

    // Prepare history payload for multi-turn chat memory
    const historyPayload = newMessages
      .filter((m) => m.id !== 'welcome-msg')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await sendChatMessage(owner, repo, textToSend, selectedIssue?.number, historyPayload);

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: res.reply,
        sources: res.sources,
        trust_ratings: res.trust_ratings,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: 'bot-err-' + Date.now(),
        role: 'assistant',
        content: `⚠ AI model is currently unavailable. Please check the AI configuration (GROQ_API_KEY and AI_MODEL in .env).`,
        sources: [],
        trust_ratings: {
          verified: [],
          inferred: [],
          unknown: ['Connection to AI Provider failed']
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const isConnected = aiStatus?.status === 'connected';

  return (
    <div className="flex h-[640px] flex-col rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Repository AI Mentor <span className="text-xs font-normal text-slate-400">({owner}/{repo})</span>
            </h3>
            {selectedIssue && (
              <span className="text-[11px] text-emerald-400 font-mono">
                Context: Issue #{selectedIssue.number} ({selectedIssue.title})
              </span>
            )}
          </div>
        </div>

        {/* AI Provider Status Badge */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected — Qwen3-Coder
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-400 border border-amber-500/30">
              <AlertCircle className="h-3 w-3 text-amber-400" />
              AI Status: Unavailable (Check Config)
            </span>
          )}
          <span className="hidden sm:flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 border border-indigo-500/30">
            <ShieldCheck className="h-3 w-3" /> RAG Grounded
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isBot ? 'items-start' : 'items-end justify-end'}`}
            >
              {isBot && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-xl p-4 text-xs leading-relaxed ${
                  isBot
                    ? 'border border-slate-800 bg-slate-950 text-slate-200'
                    : 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/20'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Sources References */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 border-t border-slate-800/80 pt-2 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Sources & Evidence:
                    </span>
                    {msg.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-slate-900 px-2 py-1 text-[11px] text-indigo-300 hover:text-white transition-colors border border-slate-800 mr-1 mb-1"
                      >
                        <ExternalLink className="h-3 w-3 text-indigo-400" />
                        <span>{src.title}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Trust Rating Badges */}
                {msg.trust_ratings && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.trust_ratings.verified.map((v, i) => (
                      <TrustTag key={i} status="VERIFIED" label={v} />
                    ))}
                    {msg.trust_ratings.inferred.map((inf, i) => (
                      <TrustTag key={i} status="INFERRED" label={inf} />
                    ))}
                  </div>
                )}

                <span className="mt-1 block text-[10px] text-slate-500 text-right">{msg.timestamp}</span>
              </div>

              {!isBot && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 p-2">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
            <span>Retrieving repository context & calling Qwen3-Coder model...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="border-t border-slate-800 bg-slate-950/80 px-4 py-2 flex flex-wrap gap-1.5">
        {suggestedPrompts.map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(promptText)}
            className="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] text-slate-300 hover:border-indigo-500/50 hover:bg-slate-850 hover:text-white transition-all"
          >
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>{promptText}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="border-t border-slate-800 bg-slate-950 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question about ${owner}/${repo}...`}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
