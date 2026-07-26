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
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setMessages(res.data);
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
        text: res.data.response,
        results: res.data.results,
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
    <div className="flex h-[calc(100vh-6rem)] gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex w-full flex-col lg:w-3/5">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">CRIMA AI</h2>
              <p className="text-xs text-gray-400">
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
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">CRIMA AI</span>
                  </div>
                  <div className="ml-9 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700">
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.results && msg.results.length > 0 && (
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
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100">
                  <Bot className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">CRIMA AI</span>
              </div>
              <div className="ml-9 mt-2 flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3">
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

        <div className="border-t border-gray-200 px-5 py-4">
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
              className="max-h-24 min-h-[40px] flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden border-l border-gray-200 bg-gray-50 lg:block lg:w-2/5">
        <div className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Current Context</h3>
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
              Detected Entities
            </p>
            <p className="text-sm text-gray-400 italic">
              Send a query to detect entities
            </p>
          </div>

          <h3 className="mb-4 text-sm font-semibold text-gray-700">Active Filters</h3>
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-400 italic">No active filters</p>
          </div>

          <h3 className="mb-4 text-sm font-semibold text-gray-700">Session History</h3>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">
              {messages.filter((m) => m.role === 'user').length}
            </p>
            <p className="text-xs text-gray-500">Queries this session</p>
          </div>

          <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{resultsCount}</p>
            <p className="text-xs text-gray-500">Results found</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueryResultCard({ result }: { result: QueryResult }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-blue-600">
          {result.case_id}
        </span>
        <Badge variant={getConfidenceVariant(result.confidence)}>
          {(result.confidence * 100).toFixed(0)}%
        </Badge>
      </div>
      <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
        <FileText size={12} />
        <span>{result.crime_type}</span>
        <MapPin size={12} />
        <span>{result.location}</span>
      </div>
      <p className="text-xs text-gray-600 line-clamp-2">{result.summary}</p>
    </div>
  );
}
