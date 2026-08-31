import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Send, Trash2, FileText, MapPin } from 'lucide-react';
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
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
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

  useEffect(() => {
    getHistory()
      .then((history) => {
        if (history && history.length > 0) {
          setMessages(history);
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
                  </div>
                  <div className="ml-9 rounded-2xl rounded-tl-sm border border-(--color-border-primary) bg-white px-4 py-2.5 text-sm text-(--color-text-secondary)">
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.results && Array.isArray(msg.results) && msg.results.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.results.map((r, ri) => (
                          <QueryResultCard key={ri} result={r} />
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
            <p className="text-sm text-(--color-text-tertiary) italic">
              Send a query to detect entities
            </p>
          </div>

          <h3 className="mb-4 text-sm font-semibold text-(--color-text-secondary)">Active Filters</h3>
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm text-(--color-text-tertiary) italic">No active filters</p>
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

function QueryResultCard({ result }: { result: QueryResult }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-(--color-slate-50) p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-(--color-intel-blue-600)">
          {result.case_id}
        </span>
        <Badge variant={getConfidenceVariant(result.confidence)}>
          {(result.confidence * 100).toFixed(0)}%
        </Badge>
      </div>
      <div className="mb-1 flex items-center gap-2 text-xs text-(--color-text-tertiary)">
        <FileText size={12} />
        <span>{result.crime_type}</span>
        <MapPin size={12} />
        <span>{result.location}</span>
      </div>
      <p className="text-xs text-(--color-text-secondary) line-clamp-2">{result.summary}</p>
    </div>
  );
}
