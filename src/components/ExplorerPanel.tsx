import { useState, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  Download,
  AlertTriangle,
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  HardDrive,
  CheckCircle2,
  XCircle,
  Settings2,
  Activity,
  RotateCcw,
  History,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { JournalData, JournalIssue, OpenAthensConfig, DownloadSettings, ErrorLogItem } from "../types";

interface ExplorerPanelProps {
  journal: JournalData;
  openAthensConfig: OpenAthensConfig;
  localDirHandle: FileSystemDirectoryHandle | null;
  isDownloading: boolean;
  onStartDownloads: (selectedIssueIds: string[]) => void;
  onStopDownloads: () => void;
  issuesState: Record<string, { status: string; progress: number; error?: string }>;
  downloadSettings: DownloadSettings;
  onUpdateSettings: (settings: DownloadSettings) => void;
  errorLogs: ErrorLogItem[];
  onClearErrorLogs: () => void;
  onRetryFailedIssues: (failedIds: string[]) => void;
}

export default function ExplorerPanel({
  journal,
  openAthensConfig,
  localDirHandle,
  isDownloading,
  onStartDownloads,
  onStopDownloads,
  issuesState,
  downloadSettings,
  onUpdateSettings,
  errorLogs,
  onClearErrorLogs,
  onRetryFailedIssues
}: ExplorerPanelProps) {
  // Navigation states
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [expandedVolumes, setExpandedVolumes] = useState<Record<string, boolean>>({});
  const [selectedIssueIds, setSelectedIssueIds] = useState<Record<string, boolean>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleVolume = (volKey: string) => {
    setExpandedVolumes((prev) => ({ ...prev, [volKey]: !prev[volKey] }));
  };

  // Extract flat list of issues
  const allIssues = useMemo(() => {
    const list: JournalIssue[] = [];
    (journal.years || []).forEach((y) => {
      (y.volumes || []).forEach((v) => {
        (v.issues || []).forEach((i) => {
          list.push(i);
        });
      });
    });
    return list;
  }, [journal]);

  // Select all helper
  const handleSelectAll = (select: boolean) => {
    const nextSelected: Record<string, boolean> = {};
    if (select) {
      allIssues.forEach((i) => {
        nextSelected[i.id] = true;
      });
    }
    setSelectedIssueIds(nextSelected);
  };

  // Helper to select an entire year
  const handleSelectYear = (yearNum: number, select: boolean) => {
    const nextSelected = { ...selectedIssueIds };
    const yearObj = (journal.years || []).find((y) => y.year === yearNum);
    if (yearObj) {
      yearObj.volumes.forEach((v) => {
        v.issues.forEach((i) => {
          if (select) {
            nextSelected[i.id] = true;
          } else {
            delete nextSelected[i.id];
          }
        });
      });
    }
    setSelectedIssueIds(nextSelected);
  };

  // Helper to select an entire volume
  const handleSelectVolume = (yearNum: number, volumeName: string, select: boolean) => {
    const nextSelected = { ...selectedIssueIds };
    const yearObj = (journal.years || []).find((y) => y.year === yearNum);
    if (yearObj) {
      const volObj = yearObj.volumes.find((v) => v.volumeName === volumeName);
      if (volObj) {
        volObj.issues.forEach((i) => {
          if (select) {
            nextSelected[i.id] = true;
          } else {
            delete nextSelected[i.id];
          }
        });
      }
    }
    setSelectedIssueIds(nextSelected);
  };

  const toggleIssueSelected = (issueId: string) => {
    setSelectedIssueIds((prev) => {
      const next = { ...prev };
      if (next[issueId]) {
        delete next[issueId];
      } else {
        next[issueId] = true;
      }
      return next;
    });
  };

  const selectedCount = Object.keys(selectedIssueIds).length;

  const handleStartQueue = () => {
    const idsToDownload = Object.keys(selectedIssueIds);
    if (idsToDownload.length === 0) return;
    onStartDownloads(idsToDownload);
  };

  // Compute status metrics for the selected issues
  const selectedIssuesMetrics = useMemo(() => {
    let completed = 0;
    let failed = 0;
    let downloading = 0;
    const selectedIds = Object.keys(selectedIssueIds);
    
    selectedIds.forEach((id) => {
      const state = issuesState[id];
      if (state) {
        if (state.status === "completed") completed++;
        else if (state.status === "failed") failed++;
        else if (state.status === "downloading") downloading++;
      }
    });

    return { completed, failed, downloading };
  }, [selectedIssueIds, issuesState]);

  // Overall Journal download progress of *selected* issues
  const journalOverallProgress = useMemo(() => {
    const selectedIds = Object.keys(selectedIssueIds);
    if (selectedIds.length === 0) return 0;
    let totalProgress = 0;
    selectedIds.forEach((id) => {
      const s = issuesState[id];
      if (s) {
        if (s.status === "completed") totalProgress += 100;
        else if (s.status === "downloading") totalProgress += s.progress;
      }
    });
    return Math.round(totalProgress / selectedIds.length);
  }, [selectedIssueIds, issuesState]);

  const getCategoryColor = (category?: string) => {
    const cat = (category || "Other").toLowerCase().replace(/\s+/g, "");
    switch (cat) {
      case "mathematics":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-900/40";
      case "economics":
        return "bg-amber-950/40 text-amber-400 border-amber-900/40";
      case "finance":
        return "bg-purple-950/40 text-purple-400 border-purple-900/40";
      case "datascience":
        return "bg-sky-950/40 text-sky-400 border-sky-900/40";
      case "statistics":
        return "bg-indigo-950/40 text-indigo-400 border-indigo-900/40";
      case "computerscience":
        return "bg-blue-950/40 text-blue-400 border-blue-900/40";
      case "engineering":
        return "bg-rose-950/40 text-rose-400 border-rose-900/40";
      case "physics":
        return "bg-cyan-950/40 text-cyan-400 border-cyan-900/40";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  return (
    <div id="journal-explorer-panel" className="flex-1 bg-[#0F0F0F] p-8 overflow-y-auto flex flex-col space-y-6">
      {/* Top Banner and Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#2A2A2A] pb-5 space-y-4 md:space-y-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {journal.publisher}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2A2A2A]" />
            {journal.category && (
              <span className={`text-[9px] font-medium font-mono px-2 py-0.5 rounded border ${getCategoryColor(journal.category)}`}>
                {journal.category}
              </span>
            )}
            {journal.issn && journal.issn !== "N/A" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#2A2A2A]" />
                <span className="text-[10px] font-mono text-zinc-500">ISSN: {journal.issn}</span>
              </>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight leading-normal">
            {journal.journalTitle}
          </h2>
        </div>

        {/* Sync Warn / Success Alert */}
        <div className="flex items-center space-x-3">
          {localDirHandle ? (
            <div className="flex items-center space-x-2 bg-[#163c1a] border border-[#235d29] p-2.5 rounded-xl text-[11px] text-[#28C840]">
              <HardDrive className="w-4 h-4 text-[#28C840]" />
              <div>
                <span className="font-semibold block leading-none">Apple Silicon Sync Engaged</span>
                <span className="text-[10px] text-[#8E8E93] block mt-1">Direct structure syncing enabled</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-xl text-[11px] text-amber-500">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div>
                <span className="font-semibold block leading-none">Safari Fallback Mode</span>
                <span className="text-[10px] text-amber-600 block mt-1">Standard browser prompts used</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Journal Level Progress Bar (Dynamic Progress Tracking) */}
      {selectedCount > 0 && (
        <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-[#0A84FF]" />
              <span>Journal Sync Progress ({selectedIssuesMetrics.completed} / {selectedCount} files saved)</span>
            </span>
            <span className="font-mono text-xs font-bold text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-0.5 rounded border border-[#0A84FF]/20">
              {journalOverallProgress}% Overall
            </span>
          </div>

          <div className="w-full bg-[#0F0F0F] h-2.5 rounded-full overflow-hidden border border-[#2A2A2A]">
            <div
              className="bg-gradient-to-r from-[#0A84FF] to-[#30d158] h-full rounded-full transition-all duration-300"
              style={{ width: `${journalOverallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Control Panel / Queue Manager */}
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#8E8E93] uppercase tracking-widest font-bold">Total Selected</span>
            <span className="text-lg font-mono font-bold text-white mt-0.5">
              {selectedCount} <span className="text-xs text-[#8E8E93] font-sans font-normal">/ {allIssues.length} issues</span>
            </span>
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center space-x-2 border-l border-[#2A2A2A] pl-4 h-9">
              <div className="text-[10px] font-bold uppercase font-sans space-y-0.5">
                <span className="text-[#8E8E93] block">Queue Status:</span>
                <span className="text-slate-300 font-mono block">
                  🟢 {selectedIssuesMetrics.completed} Saved | 🟡 {selectedIssuesMetrics.downloading} Active | 🔴 {selectedIssuesMetrics.failed} Failed
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Global Action Trigger Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => handleSelectAll(selectedCount === 0)}
            className="px-3 py-1.5 rounded-xl border border-[#2A2A2A] text-[#E0E0E0] hover:bg-[#1E1E1E] text-xs font-semibold transition-all cursor-pointer"
          >
            {selectedCount === allIssues.length ? "Deselect All" : "Select All"}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showSettings ? "bg-[#0A84FF]/10 border-[#0A84FF]/30 text-white" : "border-[#2A2A2A] text-[#8E8E93] hover:text-white hover:bg-[#1E1E1E]"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Anti-Detection</span>
          </button>

          {errorLogs.length > 0 && (
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                showLogs ? "bg-[#FF453A]/10 border-[#FF453A]/30 text-white" : "border-[#2A2A2A] text-amber-500 hover:bg-[#1E1E1E]"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Errors ({errorLogs.length})</span>
            </button>
          )}

          {isDownloading ? (
            <button
              onClick={onStopDownloads}
              className="flex items-center space-x-1.5 bg-[#FF453A] hover:bg-[#FF5F57] text-white text-xs font-bold px-4 py-1.5 rounded-xl border border-[#FF453A]/20 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          ) : (
            <button
              onClick={handleStartQueue}
              disabled={selectedCount === 0}
              className={`flex items-center space-x-1.5 bg-[#28C840] hover:bg-[#235d29] text-white text-xs font-bold px-4 py-1.5 rounded-xl border border-[#235d29]/20 transition-all cursor-pointer ${
                selectedCount === 0 ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Queue</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Anti-Detection Settings */}
      {showSettings && (
        <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#2A2A2A] pb-3 text-white">
            <Settings2 className="w-4 h-4 text-[#0A84FF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider">IP Block Protection & Queue Tuning</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider">Delay Between Downloads</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="500"
                  value={downloadSettings.minDelay}
                  onChange={(e) => onUpdateSettings({ ...downloadSettings, minDelay: Number(e.target.value) })}
                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-1.5 px-3 text-xs text-white"
                />
                <span className="text-xs text-zinc-500">to</span>
                <input
                  type="number"
                  min="500"
                  max="20000"
                  step="500"
                  value={downloadSettings.maxDelay}
                  onChange={(e) => onUpdateSettings({ ...downloadSettings, maxDelay: Number(e.target.value) })}
                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-1.5 px-3 text-xs text-white"
                />
                <span className="text-xs text-zinc-500">ms</span>
              </div>
              <p className="text-[9px] text-[#8E8E93]">Varying intervals mimic human mouse-clicks.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider block">Privacy Protection</label>
              <label className="flex items-center space-x-2 text-xs text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={downloadSettings.rotateHeaders}
                  onChange={(e) => onUpdateSettings({ ...downloadSettings, rotateHeaders: e.target.checked })}
                  className="rounded border-[#2A2A2A] bg-[#0F0F0F] text-[#0A84FF] focus:ring-[#0A84FF]"
                />
                <span>Rotate User-Agents & Headers</span>
              </label>
              <p className="text-[9px] text-[#8E8E93]">Changes browser request footprints constantly.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider block">Retry Automation</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-zinc-500">Limit:</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={downloadSettings.retryLimit}
                  onChange={(e) => onUpdateSettings({ ...downloadSettings, retryLimit: Number(e.target.value) })}
                  className="w-16 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-1 px-2 text-xs text-white text-center"
                />
                <label className="flex items-center space-x-1.5 text-xs text-white cursor-pointer select-none ml-2">
                  <input
                    type="checkbox"
                    checked={downloadSettings.retryBackoff}
                    onChange={(e) => onUpdateSettings({ ...downloadSettings, retryBackoff: e.target.checked })}
                    className="rounded border-[#2A2A2A] bg-[#0F0F0F] text-[#0A84FF] focus:ring-[#0A84FF]"
                  />
                  <span>Exponential Backoff</span>
                </label>
              </div>
              <p className="text-[9px] text-[#8E8E93]">Automatically retry failed links with backoff timers.</p>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Error Log Viewer */}
      {showLogs && errorLogs.length > 0 && (
        <div className="bg-[#1C1212] border border-[#5d2323] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#5d2323]/50 pb-3">
            <div className="flex items-center space-x-2 text-[#FF453A]">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Queue Persistent Failure Logs</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onRetryFailedIssues(errorLogs.map(l => l.id))}
                className="flex items-center space-x-1 bg-[#FF453A]/10 border border-[#FF453A]/25 hover:bg-[#FF453A]/20 text-[#FF453A] rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry All Failed</span>
              </button>
              <button
                onClick={onClearErrorLogs}
                className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                Clear Log
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-[#5d2323]/20 pr-1 space-y-2">
            {errorLogs.map((log) => (
              <div key={log.id} className="text-xs py-2 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-white font-semibold">
                    <span className="font-mono text-[10px] text-zinc-500">{log.timestamp}</span>
                    <span>{log.issueName}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">({log.pdfName})</span>
                  </div>
                  <p className="text-[#FF453A] text-[11px] leading-normal">{log.errorMsg}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-zinc-500">Attempts: {log.attemptCount}</span>
                  <button
                    onClick={() => onRetryFailedIssues([log.id])}
                    className="p-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-white"
                    title="Retry this individual file"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explorer Tree Grid */}
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl overflow-hidden flex flex-1 min-h-[400px]">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 bg-[#0F0F0F] p-3.5 border-b border-[#2A2A2A] text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">
          <div className="col-span-6 flex items-center space-x-3 pl-2">
            <span>Archive Hierarchy / Title</span>
          </div>
          <div className="col-span-3">Publication Date</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-center">Save</div>
        </div>

        {/* Tree Contents */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#2A2A2A]/40">
          {(journal.years || []).map((yearObj) => {
            const isYearExpanded = !!expandedYears[yearObj.year];
            
            // Count total and selected in year
            let totalInYear = 0;
            let selectedInYear = 0;
            yearObj.volumes.forEach((v) => {
              v.issues.forEach((i) => {
                totalInYear++;
                if (selectedIssueIds[i.id]) selectedInYear++;
              });
            });

            const isYearPartiallySelected = selectedInYear > 0 && selectedInYear < totalInYear;
            const isYearFullySelected = selectedInYear === totalInYear && totalInYear > 0;

            return (
              <div key={yearObj.year} className="flex flex-col bg-[#161616]">
                {/* Year Folder Row */}
                <div className="grid grid-cols-12 gap-2 p-3 hover:bg-[#1E1E1E] items-center transition-colors">
                  <div className="col-span-6 flex items-center space-x-2 pl-2">
                    <input
                      type="checkbox"
                      checked={isYearFullySelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isYearPartiallySelected;
                      }}
                      onChange={(e) => handleSelectYear(yearObj.year, e.target.checked)}
                      className="rounded border-[#2A2A2A] bg-[#0F0F0F] text-[#0A84FF] focus:ring-[#0A84FF] w-3.5 h-3.5 mr-1"
                    />
                    <button
                      type="button"
                      onClick={() => toggleYear(yearObj.year)}
                      className="flex items-center space-x-2 text-xs font-semibold text-white hover:text-[#0A84FF] transition-colors cursor-pointer text-left"
                    >
                      {isYearExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />}
                      {isYearExpanded ? <FolderOpen className="w-4 h-4 text-[#0A84FF]" /> : <Folder className="w-4 h-4 text-[#0A84FF]" />}
                      <span>Published Year {yearObj.year}</span>
                      <span className="text-[9px] text-[#8E8E93] font-mono font-normal bg-[#0F0F0F] border border-[#2A2A2A] px-1.5 py-0.5 rounded ml-2">
                        {totalInYear} Issues
                      </span>
                    </button>
                  </div>
                  <div className="col-span-3 text-[#8E8E93] text-xs">Annual Archive</div>
                  <div className="col-span-2 text-center">
                    <span className="text-[10px] font-mono bg-[#0F0F0F] text-[#8E8E93] px-2 py-0.5 rounded border border-[#2A2A2A]">
                      {selectedInYear} / {totalInYear} Selected
                    </span>
                  </div>
                  <div className="col-span-1 text-center" />
                </div>

                {/* Volumes listing (if expanded) */}
                {isYearExpanded && (
                  <div className="bg-[#0F0F0F]/30 pl-5 divide-y divide-[#2A2A2A]/20">
                    {yearObj.volumes.map((volObj) => {
                      const volKey = `${yearObj.year}-${volObj.volumeName}`;
                      const isVolExpanded = !!expandedVolumes[volKey];

                      // Count issues in volume & calculate dynamic nested progress
                      const totalInVol = volObj.issues.length;
                      let selectedInVol = 0;
                      let completedInVol = 0;
                      let downloadingInVol = 0;
                      let failedInVol = 0;

                      volObj.issues.forEach((i) => {
                        if (selectedIssueIds[i.id]) selectedInVol++;
                        const s = issuesState[i.id];
                        if (s) {
                          if (s.status === "completed") completedInVol++;
                          else if (s.status === "downloading") downloadingInVol++;
                          else if (s.status === "failed") failedInVol++;
                        }
                      });

                      const isVolPartiallySelected = selectedInVol > 0 && selectedInVol < totalInVol;
                      const isVolFullySelected = selectedInVol === totalInVol && totalInVol > 0;
                      const volProgress = selectedInVol > 0 ? Math.round((completedInVol / selectedInVol) * 100) : 0;

                      return (
                        <div key={volObj.volumeName} className="flex flex-col bg-[#121212]/30">
                          {/* Volume Row with dynamic volume-level progress */}
                          <div className="grid grid-cols-12 gap-2 p-2.5 hover:bg-[#1E1E1E] items-center transition-colors">
                            <div className="col-span-6 flex items-center space-x-2 pl-4">
                              <input
                                type="checkbox"
                                checked={isVolFullySelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = isVolPartiallySelected;
                                }}
                                onChange={(e) => handleSelectVolume(yearObj.year, volObj.volumeName, e.target.checked)}
                                className="rounded border-[#2A2A2A] bg-[#0F0F0F] text-[#0A84FF] focus:ring-[#0A84FF] w-3.5 h-3.5 mr-1"
                              />
                              <button
                                type="button"
                                onClick={() => toggleVolume(volKey)}
                                className="flex items-center space-x-2 text-xs font-semibold text-[#E0E0E0] hover:text-[#0A84FF] transition-colors cursor-pointer text-left"
                              >
                                {isVolExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />}
                                {isVolExpanded ? <FolderOpen className="w-4 h-4 text-[#0A84FF]" /> : <Folder className="w-4 h-4 text-[#0A84FF]" />}
                                <span>{volObj.volumeName}</span>
                              </button>

                              {/* Volume Progress Ring or Loading Indicator */}
                              {downloadingInVol > 0 && (
                                <span className="flex items-center space-x-1 text-[#0A84FF] text-[9px] font-mono animate-pulse">
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#0A84FF]" />
                                  <span>Active ({volProgress}%)</span>
                                </span>
                              )}
                              {completedInVol === selectedInVol && selectedInVol > 0 && (
                                <span className="flex items-center space-x-1 text-[#28C840] text-[9px] font-mono">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Done</span>
                                </span>
                              )}
                            </div>
                            <div className="col-span-3 text-[#8E8E93] text-xs">Volume Archive</div>
                            <div className="col-span-2 text-center flex items-center justify-center space-x-2">
                              {selectedInVol > 0 ? (
                                <div className="w-24 space-y-1">
                                  <div className="w-full bg-[#0F0F0F] h-1 rounded-full overflow-hidden border border-[#2A2A2A]">
                                    <div
                                      className="bg-gradient-to-r from-[#0A84FF] to-[#30d158] h-full rounded-full"
                                      style={{ width: `${volProgress}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-mono text-[#8E8E93] block text-center leading-none">
                                    {completedInVol}/{selectedInVol} files ({volProgress}%)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-mono text-zinc-650">
                                  0 / {totalInVol} Issues
                                </span>
                              )}
                            </div>
                            <div className="col-span-1 text-center" />
                          </div>

                          {/* Issues listing (if expanded) */}
                          {isVolExpanded && (
                            <div className="bg-[#0F0F0F] pl-8 divide-y divide-[#2A2A2A]/40">
                              {volObj.issues.map((issue) => {
                                const isSelected = !!selectedIssueIds[issue.id];
                                const state = issuesState[issue.id] || { status: "idle", progress: 0 };

                                return (
                                  <div
                                    key={issue.id}
                                    className={`grid grid-cols-12 gap-2 p-2 hover:bg-[#1E1E1E] items-center transition-all ${
                                      isSelected ? "bg-[#0A84FF]/5" : ""
                                    }`}
                                  >
                                    <div className="col-span-6 flex items-center space-x-2.5 pl-4">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleIssueSelected(issue.id)}
                                        className="rounded border-[#2A2A2A] bg-[#0F0F0F] text-[#0A84FF] focus:ring-[#0A84FF] w-3.5 h-3.5"
                                      />
                                      <FileCode className="w-4 h-4 text-[#4D4D4D] flex-shrink-0" />
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-medium text-[#E0E0E0] truncate leading-snug">
                                          {issue.issueName}
                                        </span>
                                        <span className="text-[9px] font-mono text-[#8E8E93] truncate" title={issue.pdfName}>
                                          {issue.pdfName}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Issue Publication Date */}
                                    <div className="col-span-3 text-xs text-[#8E8E93] truncate pl-1">
                                      {issue.date || "N/A"}
                                    </div>

                                    {/* Queue Status / Progress */}
                                    <div className="col-span-2 flex flex-col items-center justify-center">
                                      {state.status === "idle" && (
                                        <span className="text-[10px] text-[#4D4D4D] font-mono">Idle</span>
                                      )}
                                      {state.status === "queued" && (
                                        <span className="text-[10px] bg-[#1E1E1E] text-slate-300 font-mono px-2 py-0.5 rounded font-medium border border-[#2A2A2A]">
                                          Queued
                                        </span>
                                      )}
                                      {state.status === "downloading" && (
                                        <div className="w-full px-2 space-y-1">
                                          <div className="w-full bg-[#0F0F0F] h-1.5 rounded-full overflow-hidden border border-[#2A2A2A]">
                                            <div
                                              className="bg-gradient-to-r from-[#0A84FF] to-[#007AFF] h-full rounded-full transition-all duration-300"
                                              style={{ width: `${state.progress}%` }}
                                            />
                                          </div>
                                          <span className="text-[9px] font-mono text-[#0A84FF] font-bold block text-center leading-none">
                                            {state.progress}%
                                          </span>
                                        </div>
                                      )}
                                      {state.status === "completed" && (
                                        <span className="flex items-center space-x-1 text-[#28C840] font-medium text-[10px] font-mono bg-[#163c1a] px-1.5 py-0.5 rounded border border-[#235d29]">
                                          <CheckCircle2 className="w-3 h-3 text-[#28C840]" />
                                          <span>Saved</span>
                                        </span>
                                      )}
                                      {state.status === "failed" && (
                                        <span
                                          className="flex items-center space-x-1 text-[#FF453A] font-medium text-[10px] font-mono bg-[#2c1616] px-1.5 py-0.5 rounded border border-[#5d2323]"
                                          title={state.error}
                                        >
                                          <XCircle className="w-3 h-3 text-[#FF453A]" />
                                          <span>Failed</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* Direct Download Attachment Trigger */}
                                    <div className="col-span-1 text-center flex items-center justify-center">
                                      <a
                                        href={issue.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 text-[#8E8E93] hover:text-white hover:bg-[#1E1E1E] rounded transition-all"
                                        title="Open direct link in new tab"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
