export interface JournalIssue {
  id: string; // Unique path-like id, e.g., "year/volume/issueName"
  issueName: string;
  date: string;
  pdfName: string;
  pdfUrl: string;
  // Local status
  status: "idle" | "queued" | "downloading" | "completed" | "failed";
  progress: number; // 0 to 100
  error?: string;
}

export interface JournalVolume {
  volumeName: string;
  issues: JournalIssue[];
}

export interface JournalYear {
  year: number;
  volumes: JournalVolume[];
}

export interface JournalData {
  journalTitle: string;
  publisher: string;
  years: JournalYear[];
  category?: string; // e.g. "Data Science", "Mathematics", "Finance", etc.
  issn?: string; // Optional ISSN
  subjectField?: string; // Descriptive field
}

export interface OpenAthensConfig {
  institutionName: string;
  portalUrl: string;
  cookies: string;
  customHeaders: string;
}

export interface DownloadStats {
  totalCount: number;
  completedCount: number;
  failedCount: number;
  downloadingCount: number;
  currentSpeed: string; // e.g. "2.4 MB/s"
}

export interface DownloadSettings {
  minDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  rotateHeaders: boolean;
  retryLimit: number;
  retryBackoff: boolean; // exponential backoff
}

export interface ErrorLogItem {
  id: string;
  timestamp: string;
  journalTitle: string;
  issueName: string;
  pdfName: string;
  errorMsg: string;
  attemptCount: number;
  resolved: boolean;
}
