import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, Trash2, FileText, MapPin, Tag, Clock, Hash, ExternalLink } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { sendQuery, getHistory, clearHistory } from '../services/crimaService';
import type { ChatMessage, QueryResult } from '../types/crima';

function getConfidenceVariant(confidence: number) {
  if (confidence >= 0.8) return 'closed';
  if (confidence >= 0.5) return 'under_investigation';
  return 'open';
}

function initialMessages(): ChatMessage[] {
  return [
    {
      role: 'assistant',
      text: "Hello! I'm CRIMA AI, your crime analysis assistant. I can help you search cases, identify patterns, and generate insights. Try asking me questions like:",
      timestamp: new Date().toISOString(),
    },
    {
      role: 'assistant',
      text: '• "Show me all burglary cases from last month"\n• "Find cases near MG Road"\n• "What is the clearance rate for theft?"\n• "Who is the officer handling case CR-2024-001?"',
      timestamp: new Date().toISOString(),
    },
  ];
}

export default function CRIMAIChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Restore from localStorage to survive navigation (case -> back)
    try {
      const saved = localStorage.getItem('crima_history');
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialMessages();
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Persist to localStorage on every change so chat survives unmount (go to case and back)
  useEffect(() => {
    try {
      // Don't save the initial greeting alone as history if no user messages yet
      if (messages.length > 2 || (messages.length === 2 && messages.some(m => m.role === 'user'))) {
        localStorage.setItem('crima_history', JSON.stringify(messages));
      } else if (messages.length <= 2) {
        // Keep at least initial messages if user hasn't chatted
        const hasUserMsg = messages.some(m => m.role === 'user');
        if (!hasUserMsg) localStorage.removeItem('crima_history');
      }
    } catch {}
  }, [messages]);

  useEffect(() => {
    // Merge backend history with localStorage (backend is source of truth if it has more)
    getHistory()
      .then((history) => {
        if (history && history.length > 0) {
          // Backend history is array of {role, text, timestamp, results?} - normalize
          const normalized = history as unknown as ChatMessage[];
          // If backend has more messages than local, use backend
          setMessages((prev) => {
            if (normalized.length > prev.length) return normalized;
            // Otherwise keep local (which already has backend on first load)
            if (prev.length <= 2 && normalized.length > 0) return normalized;
            return prev;
          });
          try { localStorage.setItem('crima_history', JSON.stringify(history)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const res = await sendQuery(text);
      const aiMsg: ChatMessage = {
        role: 'assistant',
        text: res.response,
        results: res.results,
        intent: res.intent,
        entities: res.entities as any,
        sources: res.sources,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to get response from CRIMA AI';
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearHistory();
    } catch {
      // ignore
    }
    try { localStorage.removeItem('crima_history'); } catch {}
    setMessages(initialMessages());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
    }
  };

  const resultsCount = messages
    .filter((m) => m.role === 'assistant')
    .reduce((sum, m) => sum + (m.results?.length ?? 0), 0);

  // Derive last assistant message's entities/sources for sidebar (real, not static)
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && (m.entities || m.sources)) as ChatMessage & { entities?: any, sources?: string[], intent?: string } | undefined;
  const detectedEntities = lastAssistant?.entities || null;
  const activeSources = lastAssistant?.sources || [];
  const activeIntent = lastAssistant?.intent || null;

  // Active filters derived from last entities
  const activeFilters: string[] = [];
  if (detectedEntities) {
    for (const [k, v] of Object.entries(detectedEntities)) {
      if (v && k !== '_session_id' && k !== 'intent_class' && k !== 'locations') {
        if (Array.isArray(v) && v.length > 0) activeFilters.push(`${k}: ${v.join(', ')}`);
        else if (!Array.isArray(v) && String(v).trim()) activeFilters.push(`${k}: ${String(v)}`);
      }
      if (k === 'locations' && Array.isArray(v) && v.length) activeFilters.push(`location: ${v.join(', ')}`);
    }
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-0 overflow-hidden rounded-xl border border-(--color-border-primary) bg-white shadow-sm">
      <div className="flex w-full flex-col lg:w-3/5">
        <div className="flex items-center justify-between border-b border-(--color-border-primary) px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--color-indigo-100)">
              <Bot className="h-5 w-5 text-(--color-indigo-600)" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-(--color-text-primary)">CRIMA AI</h2>
              <p className="text-xs text-(--color-text-tertiary)">
                {isLoading ? 'Thinking...' : 'Online'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 size={16} />
            Clear Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {messages.map((msg, idx) => (
            <div key={idx} className="mb-4">
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-(--color-accent-primary) px-4 py-2.5 text-sm text-white">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-indigo-100)">
                      <Bot className="h-4 w-4 text-(--color-indigo-600)" />
                    </div>
                    <span className="text-xs font-medium text-(--color-text-tertiary)">CRIMA AI</span>
                    {(msg as any).intent && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{(msg as any).intent}</span>
                    )}
                  </div>
                  <div className="ml-9 rounded-2xl rounded-tl-sm border border-(--color-border-primary) bg-white px-4 py-2.5 text-sm text-(--color-text-secondary)">
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Sources from response (real entities) */}
                    {(msg as any).sources && (msg as any).sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(msg as any).sources.map((s: string, si: number) => (
                          <span key={si} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-100">{s}</span>
                        ))}
                      </div>
                    )}

                    {/* Entities from response */}
                    {(msg as any).entities && Object.keys((msg as any).entities).filter(k => k !== '_session_id' && (msg as any).entities[k]).length > 0 && (
                      <div className="mt-2 text-[11px] text-slate-500">
                        <span className="font-medium">Entities:</span> {Object.entries((msg as any).entities).filter(([k,v])=> k!=='_session_id' && v && String(v).trim && String(v).trim().length).map(([k,v])=> `${k}=${Array.isArray(v)?v.join(','):String(v)}`).join(' • ')}
                      </div>
                    )}

                    {msg.results && Array.isArray(msg.results) && msg.results.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.results.map((r, ri) => (
                          <QueryResultCard key={ri} result={r} onNavigate={navigate} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-indigo-100)">
                  <Bot className="h-4 w-4 text-(--color-indigo-600)" />
                </div>
                <span className="text-xs font-medium text-(--color-text-tertiary)">CRIMA AI</span>
              </div>
              <div className="ml-9 mt-2 flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-(--color-border-primary) bg-white px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-purple-400" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '0.15s' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-(--color-border-primary) px-5 py-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask CRIMA AI about cases..."
              rows={1}
              className="input-field max-h-24 min-h-[40px] flex-1 resize-none py-2.5"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-400/50 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden border-l border-(--color-border-primary) bg-(--color-slate-50) lg:block lg:w-2/5">
        <div className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-(--color-text-secondary)">Current Context</h3>
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-(--color-text-tertiary)">
              Detected Entities
            </p>
            {detectedEntities && Object.keys(detectedEntities).filter(k=>k!=='_session_id' && detectedEntities[k] && String(detectedEntities[k]).trim()).length > 0 ? (
              <div className="space-y-1.5">
                {Object.entries(detectedEntities).filter(([k,v])=> k!=='_session_id' && v && (Array.isArray(v)?v.length:String(v).trim().length>0)).map(([k,v])=>(
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <Tag size={12} className="text-indigo-500" />
                    <span className="font-medium text-slate-700">{k}:</span>
                    <span className="text-slate-600 truncate">{Array.isArray(v)?v.join(', '):String(v)}</span>
                  </div>
                ))}
                {activeIntent && (
                  <div className="flex items-center gap-2 text-xs">
                    <Hash size={12} className="text-indigo-500" />
                    <span className="font-medium text-slate-700">intent:</span>
                    <span className="text-slate-600">{activeIntent}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-(--color-text-tertiary) italic">
                Send a query to detect entities
              </p>
            )}
          </div>

          <h3 className="mb-4 text-sm font-semibold text-(--color-text-secondary)">Active Sources</h3>
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            {activeSources.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {activeSources.map((s, i)=>(
                  <span key={i} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 border border-indigo-100">{s}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-(--color-text-tertiary) italic">No active sources</p>
            )}
          </div>

          <h3 className="mb-4 text-sm font-semibold text-(--color-text-secondary)">Active Filters</h3>
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            {activeFilters.length > 0 ? (
              <div className="space-y-1">
                {activeFilters.map((f,i)=>(
                  <div key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                    {f}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-(--color-text-tertiary) italic">No active filters</p>
            )}
          </div>

          <h3 className="mb-4 text-sm font-semibold text-(--color-text-secondary)">Session History</h3>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-(--color-text-primary)">
              {messages.filter((m) => m.role === 'user').length}
            </p>
            <p className="text-xs text-(--color-text-tertiary)">Queries this session</p>
          </div>

          <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-(--color-text-primary)">{resultsCount}</p>
            <p className="text-xs text-(--color-text-tertiary)">Results found</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueryResultCard({ result, onNavigate }: { result: QueryResult; onNavigate: (to:string)=>void }) {
  // Clickable case cards that navigate to /cases/{case_id}?tab=evidence etc.
  const hasEvidenceHint = result.summary.toLowerCase().includes('evidence');
  const hasSuspectHint = result.summary.toLowerCase().includes('suspect');
  const hasTimelineHint = result.summary.toLowerCase().includes('timeline');
  const isStatistics = result.crime_type === 'Statistics';

  const handleClick = () => {
    if (isStatistics || !result.case_id) return;
    // choose tab based on hint
    let tab = 'overview';
    if (hasEvidenceHint) tab = 'evidence';
    else if (hasSuspectHint) tab = 'suspects';
    else if (hasTimelineHint) tab = 'timeline';
    onNavigate(`/cases/${result.case_id}?tab=${tab}`);
  };
  const handleEvidenceTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (result.case_id) onNavigate(`/cases/${result.case_id}?tab=evidence`);
  };
  const handleSuspectTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (result.case_id) onNavigate(`/cases/${result.case_id}?tab=suspects`);
  };

  return (
    <div
      onClick={handleClick}
      className={`rounded-lg border border-gray-100 bg-(--color-slate-50) p-3 transition ${!isStatistics && result.case_id ? 'cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-sm' : ''}`}
      title={!isStatistics && result.case_id ? `View case ${result.case_id}` : undefined}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-(--color-intel-blue-600) flex items-center gap-1">
          {result.case_id || 'Statistics'}
          {!isStatistics && result.case_id && <ExternalLink size={12} className="text-indigo-400" />}
        </span>
        <Badge variant={getConfidenceVariant(result.confidence)}>
          {(result.confidence * 100).toFixed(0)}%
        </Badge>
      </div>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-(--color-text-tertiary)">
        {result.crime_type && <span className="flex items-center gap-1"><FileText size={12} />{result.crime_type}</span>}
        {result.location && <span className="flex items-center gap-1"><MapPin size={12} />{result.location}</span>}
        {result.date_filed && <span className="flex items-center gap-1"><Clock size={12} />{result.date_filed}</span>}
        {result.status && <span className="rounded-full bg-white border px-2 py-0.5 text-[10px] font-medium">{result.status}</span>}
      </div>
      <p className="text-xs text-(--color-text-secondary) line-clamp-2">{result.summary}</p>
      {!isStatistics && result.case_id && (
        <div className="mt-2 flex gap-1.5">
          <button onClick={handleEvidenceTab} className="rounded-md bg-white border px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">Evidence</button>
          <button onClick={handleSuspectTab} className="rounded-md bg-white border px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">Suspects</button>
          <button onClick={(e)=>{e.stopPropagation(); onNavigate(`/cases/${result.case_id}`);}} className="rounded-md bg-indigo-600 text-white px-2 py-1 text-[10px] font-medium hover:bg-indigo-700">View Case</button>
        </div>
      )}
    </div>
  );
}
