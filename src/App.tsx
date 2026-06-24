/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HardDrive, HelpCircle, Shield, FileText, CheckCircle, AlertTriangle, Bell, X, Info } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ExtractorPanel from "./components/ExtractorPanel";
import ExplorerPanel from "./components/ExplorerPanel";
import OpenAthensPanel from "./components/OpenAthensPanel";
import { JournalData, OpenAthensConfig, DownloadStats, DownloadSettings, ErrorLogItem } from "./types";

// User agents for rotation protection
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0"
];

// Helper to save file into nested folders using File System Access API
async function saveFileToDirectory(
  baseDirHandle: FileSystemDirectoryHandle,
  subfolders: string[],
  filename: string,
  blob: Blob
) {
  let currentDir = baseDirHandle;
  for (const folder of subfolders) {
    const sanitizedFolder = folder.replace(/[\/\\?%*:|"<>\.]/g, "_").trim();
    if (sanitizedFolder) {
      currentDir = await currentDir.getDirectoryHandle(sanitizedFolder, { create: true });
    }
  }
  const fileHandle = await currentDir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export default function App() {
  // --- Persistent Local States ---
  const [journals, setJournals] = useState<JournalData[]>(() => {
    const saved = localStorage.getItem("archiver_journals");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedJournalIndex, setSelectedJournalIndex] = useState<number | null>(() => {
    const saved = localStorage.getItem("archiver_selected_idx");
    return saved ? Number(saved) : null;
  });

  const [openAthensConfig, setOpenAthensConfig] = useState<OpenAthensConfig>(() => {
    const saved = localStorage.getItem("archiver_openathens_config");
    return saved
      ? JSON.parse(saved)
      : {
          institutionName: "",
          portalUrl: "",
          cookies: "",
          customHeaders: "",
          username: "",
          password: "",
          autoChooseOpenAthens: true,
        };
  });

  // Anti-detection & Rate control settings
  const [downloadSettings, setDownloadSettings] = useState<DownloadSettings>(() => {
    const saved = localStorage.getItem("archiver_download_settings");
    return saved ? JSON.parse(saved) : {
      minDelay: 1500,
      maxDelay: 4000,
      rotateHeaders: true,
      retryLimit: 3,
      retryBackoff: true
    };
  });

  // Error log tracking
  const [errorLogs, setErrorLogs] = useState<ErrorLogItem[]>(() => {
    const saved = localStorage.getItem("archiver_error_logs");
    return saved ? JSON.parse(saved) : [];
  });

  // Notification banners state
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // --- Session UI & Native Folder Handles ---
  const [activePanel, setActivePanel] = useState<"extractor" | "explorer" | "setup">("extractor");
  const [localDirHandle, setLocalDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [localDirName, setLocalDirName] = useState<string | null>(null);

  // --- Active Queue Progress Tracker ---
  const [isDownloading, setIsDownloading] = useState(false);
  const isDownloadingRef = useRef(false); // Ref to allow immediate breaking of download loop on Cancel

  const [issuesState, setIssuesState] = useState<Record<string, { status: string; progress: number; error?: string }>>({});
  const [stats, setStats] = useState<DownloadStats>({
    totalCount: 0,
    completedCount: 0,
    failedCount: 0,
    downloadingCount: 0,
    currentSpeed: "0 MB/s",
  });

  // Sync state to local storage on changes
  useEffect(() => {
    localStorage.setItem("archiver_journals", JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    if (selectedJournalIndex !== null) {
      localStorage.setItem("archiver_selected_idx", String(selectedJournalIndex));
    } else {
      localStorage.removeItem("archiver_selected_idx");
    }
  }, [selectedJournalIndex]);

  useEffect(() => {
    localStorage.setItem("archiver_openathens_config", JSON.stringify(openAthensConfig));
  }, [openAthensConfig]);

  useEffect(() => {
    localStorage.setItem("archiver_download_settings", JSON.stringify(downloadSettings));
  }, [downloadSettings]);

  useEffect(() => {
    localStorage.setItem("archiver_error_logs", JSON.stringify(errorLogs));
  }, [errorLogs]);

  // Request HTML5 Notifications permissions on boot
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Toast self-cleanup
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // If a journal gets loaded, automatically transition view to explorer
  useEffect(() => {
    if (journals.length > 0 && selectedJournalIndex === null) {
      setSelectedJournalIndex(0);
      setActivePanel("explorer");
    }
  }, [journals]);

  // Show customized in-app notification & system desktop notification
  const triggerNotification = (type: "success" | "error" | "info", message: string, title?: string) => {
    setToast({ type, message });

    // Desktop Notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title || "ArchiveFlow Sync Notification", {
          body: message,
          icon: "/favicon.ico"
        });
      } catch (err) {
        console.warn("Could not fire standard browser notification:", err);
      }
    }
  };

  // Request macOS Target Directory
  const handleRequestSelectDir = async () => {
    try {
      if (typeof (window as any).showDirectoryPicker !== "function") {
        alert(
          "Your current browser does not natively support the File System Access API. Standard browser individual downloads will execute instead. We highly recommend using Chrome, Edge, or Opera on macOS for direct nested folder syncing!"
        );
        return;
      }
      const handle = await (window as any).showDirectoryPicker();
      setLocalDirHandle(handle);
      setLocalDirName(handle.name);
      triggerNotification("success", `Mac directory linked successfully: ${handle.name}`, "Sync Directory Connected");
    } catch (e: any) {
      console.warn("Folder link cancelled or denied:", e);
    }
  };

  // Helper to handle retrying specifically failed items
  const handleRetryFailedIssues = (failedIds: string[]) => {
    // Clear failed logs of these IDs
    setErrorLogs(prev => prev.filter(l => !failedIds.includes(l.id)));
    // Start queue for them
    handleStartDownloads(failedIds);
  };

  // --- Download Engine (Core Controller with Anti-Detection and Delay Jitter) ---
  const handleStartDownloads = async (selectedIssueIds: string[]) => {
    if (selectedIssueIds.length === 0) return;
    setIsDownloading(true);
    isDownloadingRef.current = true;

    // Transition state for these selected issues to queued
    const initialIssueStates = { ...issuesState };
    selectedIssueIds.forEach((id) => {
      initialIssueStates[id] = { status: "queued", progress: 0 };
    });
    setIssuesState(initialIssueStates);

    setStats({
      totalCount: selectedIssueIds.length,
      completedCount: 0,
      failedCount: 0,
      downloadingCount: 0,
      currentSpeed: "calculating...",
    });

    let completed = 0;
    let failed = 0;

    triggerNotification("info", `Initiating download queue for ${selectedIssueIds.length} volumes. Jitter rate protection enabled.`, "Queue Started");

    for (let idx = 0; idx < selectedIssueIds.length; idx++) {
      // Respect manual user cancel
      if (!isDownloadingRef.current) {
        break;
      }

      const id = selectedIssueIds[idx];

      // Identify nested journal details
      let targetIssue: any = null;
      let targetYear: number | null = null;
      let targetVolume: string | null = null;

      const currentJournal = journals[selectedJournalIndex!];
      for (const yearObj of currentJournal.years) {
        for (const volObj of yearObj.volumes) {
          const found = volObj.issues.find((i) => i.id === id);
          if (found) {
            targetIssue = found;
            targetYear = yearObj.year;
            targetVolume = volObj.volumeName;
            break;
          }
        }
        if (targetIssue) break;
      }

      if (!targetIssue) continue;

      // Update to downloading state
      setIssuesState((prev) => ({
        ...prev,
        [id]: { status: "downloading", progress: 10 },
      }));

      setStats((prev) => ({
        ...prev,
        downloadingCount: prev.downloadingCount + 1,
        currentSpeed: `${(Math.random() * 2.8 + 1.2).toFixed(1)} MB/s`,
      }));

      let success = false;
      let attempt = 0;
      let lastErrorMsg = "Failed";

      // Retry Loop with Exponential Backoff
      while (attempt <= downloadSettings.retryLimit && !success) {
        if (!isDownloadingRef.current) break;

        attempt++;
        if (attempt > 1) {
          // If a retry is ongoing, show customized status
          setIssuesState((prev) => ({
            ...prev,
            [id]: { status: "downloading", progress: 20, error: `Retrying (Attempt ${attempt}/${downloadSettings.retryLimit + 1})...` },
          }));

          // Backoff delay
          if (downloadSettings.retryBackoff) {
            const backoffTime = 2000 * Math.pow(2, attempt - 2);
            await new Promise((resolve) => setTimeout(resolve, backoffTime));
          }
        }

        try {
          // Client-Side Header rotation if enabled
          let headersToSend = openAthensConfig.customHeaders;
          if (downloadSettings.rotateHeaders) {
            const randomAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
            const headerObj: Record<string, string> = {};
            if (headersToSend) {
              try {
                Object.assign(headerObj, JSON.parse(headersToSend));
              } catch (e) {
                console.warn("Custom headers could not be parsed, assigning fallback", e);
              }
            }
            headerObj["User-Agent"] = randomAgent;
            headersToSend = JSON.stringify(headerObj);
          }

          setIssuesState((prev) => ({
            ...prev,
            [id]: { status: "downloading", progress: 40 },
          }));

          const response = await fetch("/api/download-proxy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: targetIssue.pdfUrl,
              cookies: openAthensConfig.cookies,
              customHeaders: headersToSend,
              username: openAthensConfig.username,
              password: openAthensConfig.password,
              autoChooseOpenAthens: openAthensConfig.autoChooseOpenAthens,
            }),
          });

          if (!response.ok) {
            throw new Error(`Proxy replied with status ${response.status} (${response.statusText || "Forbidden / Restricted"})`);
          }

          setIssuesState((prev) => ({
            ...prev,
            [id]: { status: "downloading", progress: 75 },
          }));

          const blob = await response.blob();

          // Step 2: Save to either Direct Mac Folder or Trigger standard browser prompt
          if (localDirHandle) {
            await saveFileToDirectory(
              localDirHandle,
              [currentJournal.journalTitle, String(targetYear!), targetVolume!],
              targetIssue.pdfName,
              blob
            );
          } else {
            // Standard browser download prompt
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = targetIssue.pdfName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }

          setIssuesState((prev) => ({
            ...prev,
            [id]: { status: "completed", progress: 100 },
          }));
          
          success = true;
          completed++;
        } catch (err: any) {
          console.error(`Attempt ${attempt} failed on item ${id}:`, err);
          lastErrorMsg = err.message || "Unknown error";
        }
      }

      // If persistent failure occurred after all retries
      if (!success && isDownloadingRef.current) {
        setIssuesState((prev) => ({
          ...prev,
          [id]: { status: "failed", progress: 0, error: lastErrorMsg },
        }));
        failed++;

        // Add item to Interactive Error Logs
        const timestamp = new Date().toLocaleTimeString();
        const newLog: ErrorLogItem = {
          id: id,
          timestamp,
          journalTitle: currentJournal.journalTitle,
          issueName: targetIssue.issueName,
          pdfName: targetIssue.pdfName,
          errorMsg: lastErrorMsg,
          attemptCount: attempt,
          resolved: false
        };
        setErrorLogs(prev => [newLog, ...prev]);
        triggerNotification("error", `Download failed for: ${targetIssue.issueName}. Added to Error Log.`, "Download Blocked");
      }

      setStats((prev) => ({
        ...prev,
        completedCount: completed,
        failedCount: failed,
        downloadingCount: Math.max(0, prev.downloadingCount - 1),
      }));

      // Polite delay (Jitter) to mimic natural human behavior
      if (idx < selectedIssueIds.length - 1 && isDownloadingRef.current) {
        const jitterRange = downloadSettings.maxDelay - downloadSettings.minDelay;
        const jitterDelay = jitterRange > 0 
          ? Math.floor(Math.random() * jitterRange) + downloadSettings.minDelay 
          : downloadSettings.minDelay;
        
        await new Promise((resolve) => setTimeout(resolve, jitterDelay));
      }
    }

    setIsDownloading(false);
    isDownloadingRef.current = false;

    // End-of-queue notifications
    if (completed === selectedIssueIds.length) {
      triggerNotification("success", `Sync Completed! Successfully saved all ${completed} volumes directly to local directory structures.`, "All Downloads Finished");
    } else if (completed > 0) {
      triggerNotification("info", `Queue finished: Saved ${completed} files successfully. ${failed} files failed. Check error logs.`, "Queue Completed");
    } else {
      triggerNotification("error", "Queue failed completely. Check university credentials or cookies.", "Sync Error");
    }
  };

  const handleStopDownloads = () => {
    setIsDownloading(false);
    isDownloadingRef.current = false;

    const nextState = { ...issuesState };
    Object.keys(nextState).forEach((key) => {
      if (nextState[key].status === "queued" || nextState[key].status === "downloading") {
        nextState[key] = { status: "idle", progress: 0 };
      }
    });
    setIssuesState(nextState);
    triggerNotification("info", "Syncing queue cancelled by user. Active downloads aborted.", "Downloads Paused");
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all extracted journals from your sidebar? This does not affect files on your local Mac.")) {
      setJournals([]);
      setSelectedJournalIndex(null);
      setIssuesState({});
      setActivePanel("extractor");
      triggerNotification("info", "Extract history wiped from session.");
    }
  };

  const currentJournal = selectedJournalIndex !== null && journals[selectedJournalIndex] ? journals[selectedJournalIndex] : null;

  return (
    <div id="app-workspace" className="flex h-screen w-screen bg-[#0F0F0F] font-sans text-[#E0E0E0] overflow-hidden select-none relative">
      
      {/* Toast Notification HUD */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-5 py-3.5 shadow-2xl max-w-md pointer-events-auto"
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-[#28C840] flex-shrink-0" />}
            {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-[#FF453A] flex-shrink-0" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-[#0A84FF] flex-shrink-0" />}
            
            <div className="text-xs text-[#E0E0E0] leading-snug pr-4">
              {toast.message}
            </div>

            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-zinc-800 rounded-lg text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <Sidebar
        journals={journals}
        selectedJournalIndex={selectedJournalIndex}
        onSelectJournal={(idx) => {
          setSelectedJournalIndex(idx);
          setIssuesState({}); 
        }}
        localDirName={localDirName}
        onRequestSelectDir={handleRequestSelectDir}
        openAthensConfig={openAthensConfig}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        stats={stats}
        isDownloading={isDownloading}
        onClearHistory={handleClearHistory}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex-1 flex flex-col min-h-0"
          >
            {activePanel === "extractor" && (
              <ExtractorPanel
                onJournalExtracted={(data) => {
                  setJournals((prev) => {
                    const idx = prev.findIndex((j) => j.journalTitle === data.journalTitle);
                    if (idx > -1) {
                      const updated = [...prev];
                      updated[idx] = data;
                      return updated;
                    }
                    return [data, ...prev];
                  });
                  setSelectedJournalIndex(0);
                }}
                onNavigateToExplorer={() => setActivePanel("explorer")}
              />
            )}

            {activePanel === "explorer" && currentJournal && (
              <ExplorerPanel
                journal={currentJournal}
                openAthensConfig={openAthensConfig}
                localDirHandle={localDirHandle}
                isDownloading={isDownloading}
                onStartDownloads={handleStartDownloads}
                onStopDownloads={handleStopDownloads}
                issuesState={issuesState}
                downloadSettings={downloadSettings}
                onUpdateSettings={(settings) => setDownloadSettings(settings)}
                errorLogs={errorLogs}
                onClearErrorLogs={() => setErrorLogs([])}
                onRetryFailedIssues={handleRetryFailedIssues}
              />
            )}

            {activePanel === "setup" && (
              <OpenAthensPanel
                config={openAthensConfig}
                onUpdateConfig={(conf) => setOpenAthensConfig(conf)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
