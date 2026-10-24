/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Automated QA Unit & Integration Test Suite Runner
 */

import React, { useState, useEffect } from 'react';
import {
  Beaker,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  X,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';
import { LogisticsTestSuite, TestResult } from '../../backend/tests/unitAndIntegrationTests.ts';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [running, setRunning] = useState(false);
  const [suiteResults, setSuiteResults] = useState<{
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
    coverageEstimate: string;
  } | null>(null);

  const executeTests = () => {
    setRunning(true);
    setTimeout(() => {
      const res = LogisticsTestSuite.runAllTests();
      setSuiteResults(res);
      setRunning(false);
    }, 400);
  };

  useEffect(() => {
    if (isOpen && !suiteResults) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Beaker className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Automated QA &amp; Business Logic Test Runner</h2>
              <p className="text-xs text-slate-400 font-mono">Jest &amp; Unit Specification Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Banner */}
        {suiteResults && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Tests Run</div>
              <div className="text-xl font-mono font-black text-white mt-0.5">{suiteResults.total} Specs</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Assertions Passed</div>
              <div className="text-xl font-mono font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> {suiteResults.passed}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Failures</div>
              <div className="text-xl font-mono font-black text-slate-300 mt-0.5">
                {suiteResults.failed > 0 ? (
                  <span className="text-red-400 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> {suiteResults.failed}
                  </span>
                ) : (
                  '0'
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Critical Coverage</div>
              <div className="text-base font-mono font-bold text-cyan-400 mt-0.5">
                {suiteResults.coverageEstimate}
              </div>
            </div>
          </div>
        )}

        {/* Test Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
          {suiteResults?.results.map((t, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex items-center justify-between ${
                t.status === 'PASSED'
                  ? 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-800/50'
                  : 'bg-red-950/40 border-red-800 text-red-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {t.status === 'PASSED' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-slate-200">
                    <span className="text-cyan-400">[{t.suiteName}]</span> {t.testName}
                  </div>
                  {t.error && <div className="text-[11px] text-red-400 mt-1">{t.error}</div>}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 shrink-0 ml-3">{t.durationMs}ms</div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Environment: Node.js / React 19 Synthetic Runner
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={executeTests}
              disabled={running}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
            >
              <RotateCw className={`h-3.5 w-3.5 ${running ? 'animate-spin' : ''}`} />
              <span>Re-run QA Test Suite</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
