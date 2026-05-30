import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bot, FileText, Loader2, Paperclip, Send, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import assistantService from "../services/assistantService";

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  const isError = msg.type === "error";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
        ${isUser ? "bg-indigo-600" : isError ? "bg-red-500" : "bg-gradient-to-br from-indigo-500 to-purple-600"}`}>
        {isUser ? "You" : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? "bg-indigo-600 text-white rounded-tr-sm"
          : isError
          ? "bg-red-50 text-red-700 border border-red-200 rounded-tl-sm"
          : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
        }`}>
        {msg.content}

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Sources</p>
            <div className="flex flex-wrap gap-1">
              {msg.sources.map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                  {s.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] mt-1 ${isUser ? "text-indigo-200" : "text-gray-400"}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};

// ── Recommendation card ───────────────────────────────────────────────────────
const RecommendationCard = ({ rec, index }) => {
  const [expanded, setExpanded] = useState(false);
  const pct = rec.matchPercentage;
  const color = pct >= 75 ? "text-green-700 bg-green-50 border-green-200"
    : pct >= 50 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900 text-sm">{rec.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{rec.company}</p>
          </div>
          <span className={`shrink-0 text-xs font-black px-2.5 py-1 rounded-full border ${color}`}>
            {pct}% match
          </span>
        </div>

        {/* Match bar */}
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Less" : "Details"}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {rec.matchingSkills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1">Matching skills</p>
              <div className="flex flex-wrap gap-1">
                {rec.matchingSkills.map((s, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{s}</span>
                ))}
              </div>
            </div>
          )}
          {rec.missingSkills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-1">Skills to develop</p>
              <div className="flex flex-wrap gap-1">
                {rec.missingSkills.map((s, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">{s}</span>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-600 italic">{rec.reason}</p>
        </div>
      )}
    </div>
  );
};

// ── CV result panel ───────────────────────────────────────────────────────────
const CVResultPanel = ({ data, onClose }) => (
  <div className="border border-indigo-200 rounded-xl bg-indigo-50/40 p-4 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-600" />
        <p className="font-bold text-gray-900 text-sm">CV Analysis Complete</p>
      </div>
      <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>

    {data.cv_data?.skills?.length > 0 && (
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Extracted Skills</p>
        <div className="flex flex-wrap gap-1">
          {data.cv_data.skills.slice(0, 15).map((s, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">{s}</span>
          ))}
        </div>
      </div>
    )}

    {data.summary && (
      <p className="text-xs text-gray-700 leading-relaxed bg-white rounded-lg p-3 border border-gray-200">
        {data.summary}
      </p>
    )}

    {data.recommendations?.length > 0 && (
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Top Matches</p>
        {data.recommendations.map((rec, i) => (
          <RecommendationCard key={i} rec={rec} index={i} />
        ))}
      </div>
    )}
  </div>
);

// ── Suggested questions ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  "How does the application process work?",
  "What are the evaluation stages?",
  "How is the overall score calculated?",
  "What does PENDING status mean?",
  "How do I submit my weekly logbook?",
  "What roles exist on the platform?",
];

// ── Main AssistantChat component ──────────────────────────────────────────────
const AssistantChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hi! I'm your Internship Support Assistant. Ask me anything about internships, the application process, evaluations, or upload your CV for personalized recommendations.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cvResult, setCvResult] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, cvResult]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const addMessage = useCallback((role, content, extras = {}) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role, content, timestamp: new Date().toISOString(), ...extras },
    ]);
  }, []);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    addMessage("user", q);
    setLoading(true);

    const res = await assistantService.ask(q);
    setLoading(false);

    if (res.success) {
      addMessage("assistant", res.data.answer, { sources: res.data.sources });
    } else {
      addMessage("assistant", "Sorry, I couldn't process your question. Please try again.", { type: "error" });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    addMessage("user", `📄 Uploaded CV: ${file.name}`);
    setCvLoading(true);
    setCvResult(null);

    const res = await assistantService.analyzeCV(file);
    setCvLoading(false);

    if (res.success) {
      setCvResult(res.data);
      addMessage("assistant", `I've analyzed your CV and found ${res.data.recommendations?.length || 0} matching internship(s). See the results below.`);
    } else {
      const errMsg = res.error?.error || "Failed to analyze CV. Please try again.";
      addMessage("assistant", errMsg, { type: "error" });
    }
  };

  const handleSuggestion = (q) => {
    setInput(q);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[300] flex flex-col w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-sm">Internship Assistant</p>
            <p className="text-[10px] text-indigo-200">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-white/70 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* CV loading */}
        {cvLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="text-sm text-gray-500">Analyzing your CV…</span>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* CV result */}
        {cvResult && <CVResultPanel data={cvResult} onClose={() => setCvResult(null)} />}

        {/* Suggestions (only when few messages) */}
        {messages.length <= 2 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">Suggested questions</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestion(s)}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-3">
        <div className="flex items-end gap-2">
          {/* CV upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={cvLoading}
            title="Upload CV (PDF)"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition disabled:opacity-40"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleCVUpload}
          />

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about internships…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 max-h-24 overflow-y-auto"
            style={{ minHeight: "36px" }}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Answers based on the internship knowledge base only
        </p>
      </div>
    </div>
  );
};

// ── Floating trigger button ───────────────────────────────────────────────────
export const AssistantButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-[299] w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        title="Open Internship Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>
      <AssistantChat isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default AssistantChat;
