import { useState, FormEvent } from "react";
import {
  Sparkles,
  FileText,
  Globe,
  ArrowRight,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Search,
  BookOpen,
  Plus,
  Bookmark
} from "lucide-react";
import { JournalData } from "../types";

interface ExtractorPanelProps {
  onJournalExtracted: (data: JournalData) => void;
  onNavigateToExplorer: () => void;
}

interface SearchedJournal {
  journalTitle: string;
  publisher: string;
  issn: string;
  category: string;
  subjectField: string;
}

export default function ExtractorPanel({ onJournalExtracted, onNavigateToExplorer }: ExtractorPanelProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "search">("paste");

  // --- Paste Extractor states ---
  const [journalUrl, setJournalUrl] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHowToCopy, setShowHowToCopy] = useState(false);
  const [result, setResult] = useState<JournalData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // --- Search Extractor states ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchedJournal[]>([]);
  const [isGeneratingVolumes, setIsGeneratingVolumes] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const steps = [
    "Reading raw HTML source slice...",
    "Scanning document for volume and issue headers...",
    "Identifying publisher schema (ScienceDirect/Wiley/IEEE)...",
    "Gemini parsing and translating raw layouts into structure...",
    "Extracting PDF download URLs and relative paths...",
    "Standardizing filenames for macOS Silicon filesystems...",
    "Generating final hierarchical JSON map..."
  ];

  const handleExtract = async (e: FormEvent) => {
    e.preventDefault();
    if (!htmlContent.trim()) {
      setError("Please paste some HTML page source or text first.");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setResult(null);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    try {
      const response = await fetch("/api/extract-journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: htmlContent,
          journalUrl: journalUrl.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract journal structure.");
      }

      const data: JournalData = await response.json();
      
      if (!data.journalTitle) {
        throw new Error("No journal title was returned. Please verify you pasted the correct page source containing the issues list.");
      }

      // Standardize data by injecting client-side helper IDs
      const cleanedYears = (data.years || []).map((y) => ({
        ...y,
        volumes: (y.volumes || []).map((v) => ({
          ...v,
          issues: (v.issues || []).map((i) => ({
            ...i,
            id: `${data.journalTitle}/${y.year}/${v.volumeName}/${i.issueName}`.replace(/\s+/g, "_"),
            status: "idle" as const,
            progress: 0,
          })),
        })),
      }));

      const finalData: JournalData = {
        journalTitle: data.journalTitle,
        publisher: data.publisher || "Unknown Publisher",
        category: data.category || "Other",
        issn: data.issn || "N/A",
        years: cleanedYears,
      };

      setResult(finalData);
      onJournalExtracted(finalData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during extraction.");
    } finally {
      clearInterval(stepInterval);
      setIsExtracting(false);
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setResult(null);

    try {
      const response = await fetch(`/api/search-journals?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Search failed.");
      }
      const data = await response.json();
      setSearchResults(data.journals || []);
      if ((data.journals || []).length === 0) {
        setSearchError("No matching journals found. Try adjusting your search query or paste code directly instead.");
      }
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || "Failed to search the academic journal database.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportSearchedJournal = async (journal: SearchedJournal) => {
    setIsGeneratingVolumes(true);
    setSearchError(null);
    setResult(null);

    try {
      const response = await fetch("/api/generate-journal-volumes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(journal),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate volume structures.");
      }

      const data: JournalData = await response.json();

      const cleanedYears = (data.years || []).map((y) => ({
        ...y,
        volumes: (y.volumes || []).map((v) => ({
          ...v,
          issues: (v.issues || []).map((i) => ({
            ...i,
            id: `${data.journalTitle}/${y.year}/${v.volumeName}/${i.issueName}`.replace(/\s+/g, "_"),
            status: "idle" as const,
            progress: 0,
          })),
        })),
      }));

      const finalData: JournalData = {
        journalTitle: data.journalTitle,
        publisher: data.publisher || "Unknown Publisher",
        category: data.category || journal.category || "Other",
        issn: data.issn || journal.issn || "N/A",
        years: cleanedYears,
      };

      setResult(finalData);
      onJournalExtracted(finalData);
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || "Failed to generate functional download archive structure.");
    } finally {
      setIsGeneratingVolumes(false);
    }
  };

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
    <div id="journal-extractor-panel" className="flex-1 bg-[#0F0F0F] p-8 overflow-y-auto flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#0A84FF]" />
            <span>AI Journal Setup Suite</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            Build down-syncable volume maps instantly. Paste HTML archive codes or search our global directory by Title/ISSN.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowHowToCopy(!showHowToCopy)}
          className="flex items-center space-x-1.5 bg-[#161616] hover:bg-[#1E1E1E] border border-[#2A2A2A] text-xs text-[#E0E0E0] font-medium px-3 py-1.5 rounded-xl transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-[#28C840]" />
          <span>How to use?</span>
        </button>
      </div>

      {/* Tutorial Banner */}
      {showHowToCopy && (
        <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 space-y-4 text-xs text-[#8E8E93] leading-relaxed">
          <h3 className="font-semibold text-white text-sm">How to load journals into ArchiveFlow:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-[#0F0F0F] p-4 rounded-xl border border-[#2A2A2A] space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-[#0A84FF] bg-[#0A84FF]/10 px-1.5 py-0.5 rounded border border-[#0A84FF]/20 text-[10px]">METHOD A</span>
                <p className="font-semibold text-white">Direct Paste Extraction</p>
              </div>
              <p className="text-[11px] text-[#8E8E93] leading-normal">
                Go to a journal's "All Issues" page, right-click, choose <strong>View Page Source</strong>, copy the entire HTML dump, and paste it into our scraper box. Gemini automatically builds links and maps relative resources!
              </p>
            </div>
            <div className="bg-[#0F0F0F] p-4 rounded-xl border border-[#2A2A2A] space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-[#28C840] bg-[#163c1a] px-1.5 py-0.5 rounded border border-[#235d29] text-[10px]">METHOD B</span>
                <p className="font-semibold text-white">Global Registry Search</p>
              </div>
              <p className="text-[11px] text-[#8E8E93] leading-normal">
                Don't have the HTML source? Flip to the "Registry Search" tab, enter any journal name or its unique 8-digit ISSN, select the correct match, and Gemini builds a fully populated archive tree ready for queuing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex space-x-2 bg-[#121212] p-1 rounded-xl self-start border border-[#2A2A2A]">
        <button
          onClick={() => {
            setActiveTab("paste");
            setResult(null);
            setError(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "paste"
              ? "bg-[#1E1E1E] text-white shadow-sm border border-[#2A2A2A]"
              : "text-[#8E8E93] hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4 text-[#0A84FF]" />
          <span>HTML Source Scraper</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("search");
            setResult(null);
            setSearchError(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "search"
              ? "bg-[#1E1E1E] text-white shadow-sm border border-[#2A2A2A]"
              : "text-[#8E8E93] hover:text-white"
          }`}
        >
          <Search className="w-4 h-4 text-[#28C840]" />
          <span>Registry Search (ISSN / Title)</span>
        </button>
      </div>

      {/* Extractor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Paste Area Form Tab */}
        {activeTab === "paste" && (
          <form onSubmit={handleExtract} className="lg:col-span-7 bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#2A2A2A] pb-3">
              <FileText className="w-4 h-4 text-[#0A84FF]" />
              <span className="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">Journal Page Code</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-600" />
                <span>Journal URL (Optional - Recommended for relative link resolution)</span>
              </label>
              <input
                type="url"
                value={journalUrl}
                onChange={(e) => setJournalUrl(e.target.value)}
                placeholder="e.g. https://www.sciencedirect.com/journal/neural-networks/issues"
                className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-2 px-3 text-xs text-[#E0E0E0] placeholder:text-zinc-650 focus:outline-none focus:border-[#0A84FF] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">Pasted HTML Page Source</label>
                <span className="text-[9px] text-[#8E8E93] font-mono">Supports up to 400,000 characters</span>
              </div>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Right-click page -> View Page Source -> Select All -> Copy & Paste here..."
                rows={12}
                required
                className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-2 px-3 text-xs font-mono text-zinc-350 placeholder:text-zinc-650 focus:outline-none focus:border-[#0A84FF] transition-all leading-normal"
              />
              <div className="flex items-center justify-between text-[10px] text-[#8E8E93] font-mono">
                <span>Lines: {htmlContent.split("\n").length}</span>
                <span>Characters: {htmlContent.length.toLocaleString()} / 400,000 limit</span>
              </div>
            </div>

            {error && (
              <div className="bg-[#FF453A]/10 border border-[#FF453A]/25 p-3.5 rounded-xl flex items-start space-x-2 text-xs text-[#FF453A]">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Extraction Failed</p>
                  <p className="mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#2A2A2A] flex justify-end">
              <button
                type="submit"
                disabled={isExtracting || !htmlContent.trim()}
                className={`flex items-center space-x-2 bg-[#0A84FF] hover:bg-[#007AFF] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  isExtracting || !htmlContent.trim() ? "opacity-55 cursor-not-allowed" : ""
                }`}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Compiling Issue Tree...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 text-sky-200" />
                    <span>AI Compile Journal Volumes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Registry Search Form Tab */}
        {activeTab === "search" && (
          <div className="lg:col-span-7 space-y-4">
            <form onSubmit={handleSearch} className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-[#2A2A2A] pb-3">
                <Search className="w-4 h-4 text-[#28C840]" />
                <span className="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">Crossref & AI Directory Search</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">Journal Title or unique ISSN</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Journal of Finance, 0893-6080, Econometrica..."
                      required
                      className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-2.5 pl-9 pr-3 text-xs text-[#E0E0E0] placeholder:text-zinc-650 focus:outline-none focus:border-[#28C840] transition-colors"
                    />
                    <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-650" />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className={`flex items-center justify-center space-x-1.5 bg-[#28C840] hover:bg-[#235d29] text-white text-xs font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer ${
                      isSearching || !searchQuery.trim() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {searchError && (
                <div className="bg-[#FF453A]/10 border border-[#FF453A]/25 p-3 rounded-xl flex items-start space-x-2 text-xs text-[#FF453A]">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="leading-relaxed">{searchError}</p>
                </div>
              )}
            </form>

            {/* Results Grid */}
            {searchResults.length > 0 && (
              <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 space-y-3">
                <span className="text-[10px] font-bold text-[#4D4D4D] tracking-widest uppercase block">Matching Registers</span>
                <div className="space-y-2">
                  {searchResults.map((j, idx) => (
                    <div
                      key={`${j.journalTitle}-${idx}`}
                      className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-start md:items-center flex-wrap gap-2">
                          <span className="font-semibold text-white text-xs leading-snug">{j.journalTitle}</span>
                          <span className={`text-[8px] font-mono font-medium px-1.5 rounded border ${getCategoryColor(j.category)}`}>
                            {j.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8E8E93] flex items-center space-x-2.5">
                          <span className="truncate max-w-[150px]">{j.publisher}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700" />
                          <span className="font-mono text-zinc-500">ISSN: {j.issn}</span>
                        </div>
                        <p className="text-[10px] text-[#28C840] font-mono font-medium">{j.subjectField}</p>
                      </div>

                      <button
                        onClick={() => handleImportSearchedJournal(j)}
                        disabled={isGeneratingVolumes}
                        className="flex items-center space-x-1 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#28C840]" />
                        <span>Build Archive</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right side status / result preview */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Parsing State */}
          {isExtracting && (
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2 text-[#0A84FF]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest">Gemini 3.5 Engine Active</h3>
              </div>

              <div className="space-y-2.5">
                {steps.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isDone = idx < currentStep;
                  return (
                    <div
                      key={step}
                      className={`flex items-center space-x-2.5 text-xs transition-opacity duration-300 ${
                        isActive ? "text-sky-300 font-semibold" : isDone ? "text-zinc-500" : "text-zinc-700"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#28C840]" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 text-[#0A84FF] animate-spin" />
                      ) : (
                        <div className="w-4 h-4 border border-[#2A2A2A] rounded-full" />
                      )}
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Search Structure Generation State */}
          {isGeneratingVolumes && (
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 text-center space-y-4">
              <Loader2 className="w-7 h-7 text-[#28C840] animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compiling Dynamic Volume Archives</h4>
                <p className="text-[11px] text-[#8E8E93] max-w-xs mx-auto">
                  Gemini is constructing real-world volume directories and mock-download routes matching the selected register.
                </p>
              </div>
            </div>
          )}

          {/* Success Preview */}
          {result && (
            <div className="bg-[#161616] border border-[#235d29] rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2 text-[#28C840]">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest">AI Structure Compiled</h3>
              </div>

              <div className="space-y-3 border-y border-[#2A2A2A] py-3 text-xs">
                <div>
                  <label className="text-[10px] text-[#8E8E93] uppercase tracking-wider block">Journal Name</label>
                  <span className="text-sm font-semibold text-white leading-normal block mt-0.5">{result.journalTitle}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-[#8E8E93] uppercase tracking-wider block">Publisher</label>
                    <span className="text-xs font-semibold text-[#E0E0E0] mt-0.5 block bg-[#0F0F0F] px-2 py-1 rounded border border-[#2A2A2A] truncate">
                      {result.publisher}
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8E8E93] uppercase tracking-wider block">Classification Field</label>
                    <span className="text-xs font-semibold text-white mt-0.5 block bg-[#0F0F0F] px-2 py-1 rounded border border-[#2A2A2A] text-center truncate">
                      📚 {result.category || "Other"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-[#8E8E93] uppercase tracking-wider block">ISSN</label>
                    <span className="text-xs font-mono font-semibold text-[#8E8E93] mt-0.5 block bg-[#0F0F0F] px-2 py-1 rounded border border-[#2A2A2A]">
                      {result.issn || "N/A"}
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8E8E93] uppercase tracking-wider block">Archive Span</label>
                    <span className="text-xs font-semibold text-[#E0E0E0] mt-0.5 block bg-[#0F0F0F] px-2 py-1 rounded border border-[#2A2A2A] text-center">
                      {result.years.length} Years
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#0F0F0F] rounded-xl border border-[#2A2A2A] space-y-1.5">
                  <div className="flex items-center justify-between text-[#8E8E93]">
                    <span>Total Volumes:</span>
                    <span className="font-mono text-[#E0E0E0] font-semibold">
                      {result.years.reduce((acc, y) => acc + y.volumes.length, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#8E8E93]">
                    <span>Total Issue Paths:</span>
                    <span className="font-mono text-[#28C840] font-bold">
                      {result.years.reduce((acc, y) => acc + y.volumes.reduce((vi, v) => vi + v.issues.length, 0), 0)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onNavigateToExplorer}
                className="w-full flex items-center justify-center space-x-2 bg-[#28C840] hover:bg-[#235d29] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Navigate to Explorer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Idle Guidance */}
          {!isExtracting && !isGeneratingVolumes && !result && (
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 space-y-3.5">
              <h3 className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest flex items-center space-x-1.5">
                <Bookmark className="w-3.5 h-3.5 text-[#28C840]" />
                <span>Smart Archiving Core</span>
              </h3>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                Our twin metadata extraction engines translate digital references directly into organized macOS paths.
              </p>
              <ul className="text-xs text-zinc-500 space-y-2 list-disc pl-4 leading-normal">
                <li>Classification is completely automated matching your scientific domain requirements.</li>
                <li>Search utilizes the Crossref Registry database for perfect bibliographic standardization.</li>
                <li>Generates safe paths protecting files from duplicate naming conventions.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
