/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - AI Supply Chain Copilot Drawer
 * Powered by Google Gemini (gemini-3.8-flash) with specialized domain fallbacks.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { ApiController } from '../../backend/controllers/apiController.ts';
import { AICopilotAnalysis } from '../../backend/services/aiLogisticsService.ts';

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeWaybill?: string;
  vehicleId?: string;
}

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  activeWaybill,
  vehicleId,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AICopilotAnalysis | null>(null);

  const samplePrompts = [
    'Mitigate customs inspection delay on European hazmat cargo',
    'Cold-chain reefer temperature alert: recommend emergency procedure',
    'Optimize regional cross-dock buffer for Q4 consumer surge',
    'Evaluate driver Hours-of-Service margin on Transatlantic air-to-road hub',
  ];

  const handleExecutePrompt = async (promptText: string) => {
    setQuery(promptText);
    setLoading(true);
    try {
      const res = await ApiController.consultAiCopilot(promptText, {
        activeWaybill,
        vehicleId,
      });
      setAnalysis(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    handleExecutePrompt(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col justify-between shadow-2xl z-10 h-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white">LogiFlow AI Operations Copilot</h2>
              <p className="text-[11px] font-mono text-cyan-400">Gemini 3.8 Flash • Enterprise Logistics Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Preset Prompts */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Operations Scenarios
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {samplePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleExecutePrompt(p)}
                  className="text-left p-2.5 rounded-lg border border-slate-800 hover:border-cyan-700 bg-slate-950/40 hover:bg-slate-800/60 text-xs text-slate-300 transition-all flex items-center justify-between"
                >
                  <span className="truncate pr-2">{p}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-3">
              <Bot className="h-8 w-8 text-cyan-400 mx-auto animate-bounce" />
              <p className="text-xs text-slate-300 font-medium">
                Analyzing global network telematics &amp; corridor constraints...
              </p>
            </div>
          )}

          {/* Analysis Results Display */}
          {analysis && !loading && (
            <div className="space-y-4 animate-fadeIn">
              {/* Headline */}
              <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/80 rounded-xl p-4 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-cyan-400 uppercase font-mono">{analysis.aiModelUsed}</span>
                  <span className="text-slate-400">{new Date(analysis.generatedAt).toLocaleTimeString()}</span>
                </div>
                <h3 className="font-extrabold text-base text-white">{analysis.headline}</h3>
                <p className="text-xs text-slate-300">{analysis.riskAssessment.impactSummary}</p>
              </div>

              {/* Risk Assessment Pill */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Severity Assessment</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {analysis.riskAssessment.severity} RISK ({analysis.riskAssessment.score}/100)
                  </div>
                </div>
                <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      analysis.riskAssessment.score > 70
                        ? 'bg-red-500'
                        : analysis.riskAssessment.score > 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${analysis.riskAssessment.score}%` }}
                  ></div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Strategic Recommendations
                </div>
                <div className="space-y-1.5">
                  {analysis.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-2.5 text-xs text-slate-200 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational Action Checklist */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Operational Response Protocol
                </div>
                <div className="space-y-2">
                  {analysis.operationalPlan.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-400 font-mono">Step #{step.stepNumber}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                          <UserCheck className="h-3 w-3 text-cyan-400" />
                          {step.responsibleRole}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">{step.action}</p>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        Est. Duration: {step.estimatedMinutes} minutes
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask AI Copilot for logistics guidance..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-md"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
