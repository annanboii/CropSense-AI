import React, { useState, useRef, useEffect } from "react";
import { useFarm } from "../context/FarmContext";
import { useTranslation } from "../i18n/LanguageContext";
import { AdvisorMessage } from "../types";
import { ProvenanceBadge } from "../components/common/ProvenanceBadge";
import {
  BotMessageSquare,
  Send,
  Sparkles,
  RefreshCw,
  User,
  HelpCircle,
  Sprout,
  Droplets,
  ShieldAlert,
  Trash2,
} from "lucide-react";

export const FarmAdvisor: React.FC = () => {
  const { farm, crops, weather } = useFarm();
  const { t, isRTL } = useTranslation();

  const initialSuggestions = [
    t("advisor.sugg1", "When should I apply nitrogen top-dressing to my vegetative corn?"),
    t("advisor.sugg2", "How to manage early blight in processing tomatoes organically?"),
    t("advisor.sugg3", "Optimal irrigation interval for loam soil during 25°C weather?"),
    t("advisor.sugg4", "What are early field scouting signs of stripe rust in winter wheat?"),
    t("advisor.sugg5", "How can I improve soil water retention in sandy loam fields?"),
  ];

  const initialMessages: AdvisorMessage[] = [
    {
      id: "welcome-1",
      role: "assistant",
      content: t(
        "advisor.welcomeMsg",
        `Hello! I am CropSense AI Agronomist, your software-only crop management and plant science advisor.

I have loaded your farm profile:
- Farm: ${farm.name} (${farm.totalArea} ${farm.areaUnit})
- Location: ${farm.location} (${farm.primarySoilType} Soil)
- Active Crops: ${crops.map(c => c.cropName).join(", ") || "None registered yet"}

Ask me any question regarding fertilizer scheduling, irrigation timing, pest & disease management, soil aeration, or canopy care. How can I assist your fields today?`
      ),
      timestamp: t("advisor.justNow", "Just now"),
    },
  ];

  const [messages, setMessages] = useState<AdvisorMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: AdvisorMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/farm-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          farmContext: {
            name: farm.name,
            location: farm.location,
            latitude: farm.latitude,
            longitude: farm.longitude,
            primarySoilType: farm.primarySoilType,
            totalArea: farm.totalArea,
            areaUnit: farm.areaUnit,
            crops: crops.map((c) => ({
              name: c.cropName,
              field: c.fieldName,
              size: c.fieldSize,
              soil: c.soilType,
              stage: c.growthStage,
            })),
            currentWeather: weather
              ? {
                  temp: weather.current.temp,
                  humidity: weather.current.humidity,
                  et0: weather.current.et0,
                  sprayQuality: weather.agriculturalMetrics.sprayingWindowQuality,
                }
              : null,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to get advisor response");
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: data.id || `msg-ai-${Date.now()}`,
          role: "assistant",
          content: data.content,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("Advisor error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: "assistant",
          content: t(
            "advisor.errorMsg",
            "I encountered a temporary connection issue. Please check your questions or try asking again."
          ),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages(initialMessages);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BotMessageSquare className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {t("advisor.title", "CropSense Farm Advisor AI")}
              </h1>
              <ProvenanceBadge source="DEMO AI ASSESSMENT" size="sm" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t("advisor.subtitle", "Grounded plant pathology and agronomy expert powered by Gemini 3.7 Flash and your farm's active field context.")}
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold border border-slate-200 transition-colors self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t("advisor.resetChat", "Reset Chat")}</span>
        </button>
      </div>

      {/* CHAT CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[580px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isUser
                      ? "bg-slate-800 text-white"
                      : "bg-emerald-600 text-white shadow-sm"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sprout className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[82%] rounded-xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? "bg-emerald-600 text-white font-medium rounded-tr-none"
                      : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none space-y-2 whitespace-pre-line"
                  }`}
                >
                  <p>{m.content}</p>
                  <span
                    className={`block text-[10px] mt-1 ${
                      isUser ? "text-emerald-100 text-right" : "text-slate-400"
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sprout className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl rounded-tl-none text-xs text-slate-600 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span className="font-medium animate-pulse">
                  {t("advisor.analyzing", "Analyzing agronomic literature & weather parameters...")}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Chips */}
        <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            {t("advisor.suggested", "Suggested")}:
          </span>
          {initialSuggestions.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/50 text-[11px] text-slate-700 font-medium whitespace-nowrap shrink-0 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={t("advisor.inputPlaceholder", "Ask about fertilizer timing, soil drainage, disease control, pruning...")}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all ${
              !inputText.trim() || isLoading
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("advisor.send", "Send")}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
