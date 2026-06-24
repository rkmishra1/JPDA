import { BookOpen, FolderCheck, ShieldAlert, FileText, ChevronRight, HardDrive, Settings, RefreshCw, BarChart2 } from "lucide-react";
import { JournalData, DownloadStats, OpenAthensConfig } from "../types";

interface SidebarProps {
  journals: JournalData[];
  selectedJournalIndex: number | null;
  onSelectJournal: (index: number) => void;
  localDirName: string | null;
  onRequestSelectDir: () => void;
  openAthensConfig: OpenAthensConfig;
  activePanel: "explorer" | "setup" | "extractor";
  setActivePanel: (panel: "explorer" | "setup" | "extractor") => void;
  stats: DownloadStats;
  isDownloading: boolean;
  onClearHistory: () => void;
}

export default function Sidebar({
  journals,
  selectedJournalIndex,
  onSelectJournal,
  localDirName,
  onRequestSelectDir,
  openAthensConfig,
  activePanel,
  setActivePanel,
  stats,
  isDownloading,
  onClearHistory,
}: SidebarProps) {
  const hasCookies = openAthensConfig.cookies.trim() !== "";

  return (
    <div id="macos-sidebar" className="w-80 bg-[#121212] text-[#E0E0E0] flex flex-col border-r border-[#2A2A2A] select-none">
      {/* App Header with Mac buttons mockup */}
      <div className="h-14 border-b border-[#2A2A2A] bg-[#161616] flex items-center px-5 justify-between flex-shrink-0">
        <div className="flex space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
          <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
        </div>
        <div className="text-[11px] font-medium text-[#8E8E93] tracking-wider font-mono">ArchiveFlow</div>
        <div className="w-12"></div>
      </div>

      {/* Main Navigation */}
      <div className="p-4 space-y-1">
        <p className="text-[10px] uppercase font-bold text-[#4D4D4D] tracking-widest mb-3 px-2">Navigation</p>
        <button
          onClick={() => setActivePanel("extractor")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activePanel === "extractor"
              ? "bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20"
              : "text-[#8E8E93] hover:bg-[#1E1E1E] hover:text-white"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <FileText className="w-4 h-4" />
            <span>1. Extractor (Gemini AI)</span>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activePanel === "extractor" ? "rotate-90 text-[#0A84FF]" : "text-slate-600"}`} />
        </button>

        <button
          onClick={() => setActivePanel("explorer")}
          disabled={journals.length === 0}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            journals.length === 0 ? "opacity-40 cursor-not-allowed" : ""
          } ${
            activePanel === "explorer"
              ? "bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20"
              : "text-[#8E8E93] hover:bg-[#1E1E1E] hover:text-white"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4" />
            <span>2. Archive Explorer</span>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activePanel === "explorer" ? "rotate-90 text-[#0A84FF]" : "text-slate-600"}`} />
        </button>

        <button
          onClick={() => setActivePanel("setup")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activePanel === "setup"
              ? "bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20"
              : "text-[#8E8E93] hover:bg-[#1E1E1E] hover:text-white"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Settings className="w-4 h-4" />
            <span>OpenAthens & Proxy</span>
          </div>
          <div className="flex items-center space-x-1.5">
            {hasCookies ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#28C840] shadow-[0_0_8px_#28C840]" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            )}
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activePanel === "setup" ? "rotate-90 text-[#0A84FF]" : "text-slate-600"}`} />
          </div>
        </button>
      </div>

      {/* Directory Sync Box */}
      <div className="mx-4 my-2 p-3.5 bg-[#161616] rounded-xl border border-[#2A2A2A] flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-[#0A84FF]" />
            <span className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider">Mac Target Directory</span>
          </div>
          {localDirName ? (
            <span className="text-[9px] bg-[#163c1a] text-[#28C840] border border-[#235d29] px-1.5 py-0.5 rounded font-mono font-medium">
              CONNECTED
            </span>
          ) : (
            <span className="text-[9px] bg-[#1a1a1a] text-[#8E8E93] px-1.5 py-0.5 rounded font-mono font-medium border border-[#2A2A2A]">
              NOT SYNCED
            </span>
          )}
        </div>

        <div className="text-[11px] text-[#8E8E93] leading-normal">
          {localDirName ? (
            <div className="space-y-1">
              <p className="text-white font-medium font-mono text-[10px] truncate bg-[#0F0F0F] p-1.5 rounded border border-[#2A2A2A]">
                📁 {localDirName}
              </p>
              <p className="text-[10px] text-[#8E8E93]">Files write directly into Mac subfolders organized by year.</p>
            </div>
          ) : (
            <p className="text-[10px] text-[#8E8E93]">
              Select a folder on your Mac hard-drive. The app downloads PDFs directly into structured subfolders automatically.
            </p>
          )}
        </div>

        <button
          onClick={onRequestSelectDir}
          className="w-full bg-[#1E1E1E] hover:bg-[#2A2A2A] active:bg-[#1E1E1E] text-white text-[11px] font-medium py-1.5 px-3 rounded-lg border border-[#2A2A2A] transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <FolderCheck className="w-3.5 h-3.5 text-[#0A84FF]" />
          <span>{localDirName ? "Change Directory" : "Link Mac Folder..."}</span>
        </button>
      </div>

      {/* Parsed Journals History */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-1 py-1">
          <span className="text-[10px] font-bold text-[#4D4D4D] tracking-widest uppercase">Extracted Journals</span>
          {journals.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[10px] text-[#8E8E93] hover:text-[#FF453A] transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="mt-1.5 flex-1 space-y-1 overflow-y-auto pr-1">
          {journals.length === 0 ? (
            <div className="py-8 px-4 border border-dashed border-[#2A2A2A] rounded-xl text-center text-[11px] text-[#4D4D4D]">
              No journals loaded yet. Use Extractor to paste issues.
            </div>
          ) : (
            journals.map((journal, idx) => {
              const isSelected = selectedJournalIndex === idx;
              const getCategoryStyle = (category?: string) => {
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
                <button
                  key={`${journal.journalTitle}-${idx}`}
                  onClick={() => {
                    onSelectJournal(idx);
                    setActivePanel("explorer");
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-all flex flex-col space-y-1.5 ${
                    isSelected
                      ? "bg-[#0A84FF]/10 border-[#0A84FF]/30 text-white shadow-sm"
                      : "bg-[#1E1E1E]/40 border-[#2A2A2A]/50 text-[#8E8E93] hover:bg-[#1E1E1E] hover:text-white"
                  }`}
                >
                  <div className="flex flex-col space-y-1 w-full">
                    <span className="font-semibold line-clamp-1">{journal.journalTitle}</span>
                    {journal.category && (
                      <span className={`text-[9px] font-medium font-mono px-1.5 py-0.5 rounded border self-start ${getCategoryStyle(journal.category)}`}>
                        {journal.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#8E8E93] w-full pt-0.5 border-t border-[#2A2A2A]/20">
                    <span className="truncate max-w-[100px] bg-[#0F0F0F] px-1 py-0.5 rounded border border-[#2A2A2A]" title={journal.publisher}>{journal.publisher}</span>
                    {journal.issn && journal.issn !== "N/A" && (
                      <span className="font-mono text-[9px] text-zinc-500">ISSN: {journal.issn}</span>
                    )}
                    <span className="font-mono">
                      {journal.years.reduce((acc, y) => acc + y.volumes.reduce((vi, v) => vi + v.issues.length, 0), 0)} iss
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Live Stats Footprint */}
      {isDownloading && (
        <div className="p-4 bg-[#161616] border-t border-[#2A2A2A] flex flex-col space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
            <div className="flex items-center space-x-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-[#0A84FF] animate-spin" />
              <span className="font-medium text-white">Syncing to Local...</span>
            </div>
            <span className="font-mono text-[#28C840] font-semibold">{stats.currentSpeed}</span>
          </div>

          <div className="w-full bg-[#0F0F0F] h-1.5 rounded-full overflow-hidden border border-[#2A2A2A]">
            <div
              className="bg-gradient-to-r from-[#0A84FF] to-[#007AFF] h-full transition-all duration-300 rounded-full"
              style={{
                width: `${stats.totalCount > 0 ? (stats.completedCount / stats.totalCount) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-[#8E8E93] font-mono">
            <span>
              {stats.completedCount} / {stats.totalCount} Done
            </span>
            <span>{Math.round(stats.totalCount > 0 ? (stats.completedCount / stats.totalCount) * 100 : 0)}%</span>
          </div>
        </div>
      )}

      {/* Global Status Footer */}
      <div className="p-3 bg-[#0F0F0F] border-t border-[#2A2A2A] flex items-center justify-between text-[10px] text-[#8E8E93] font-sans">
        <div className="flex items-center space-x-1.5">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>System Engine Status</span>
        </div>
        <span className="font-mono font-medium text-[#28C840]">READY</span>
      </div>
    </div>
  );
}
