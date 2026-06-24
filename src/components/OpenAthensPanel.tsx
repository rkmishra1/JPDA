import { useState, FormEvent } from "react";
import { KeyRound, HelpCircle, Shield, Check, FileCode, AlertCircle, Sparkles } from "lucide-react";
import { OpenAthensConfig } from "../types";

interface OpenAthensPanelProps {
  config: OpenAthensConfig;
  onUpdateConfig: (config: OpenAthensConfig) => void;
}

export default function OpenAthensPanel({ config, onUpdateConfig }: OpenAthensPanelProps) {
  const [institutionName, setInstitutionName] = useState(config.institutionName);
  const [portalUrl, setPortalUrl] = useState(config.portalUrl);
  const [cookies, setCookies] = useState(config.cookies);
  const [customHeaders, setCustomHeaders] = useState(config.customHeaders);
  const [username, setUsername] = useState(config.username || "");
  const [password, setPassword] = useState(config.password || "");
  const [autoChooseOpenAthens, setAutoChooseOpenAthens] = useState(config.autoChooseOpenAthens !== false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHowTo, setShowHowTo] = useState(true);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      institutionName,
      portalUrl,
      cookies,
      customHeaders,
      username,
      password,
      autoChooseOpenAthens,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div id="openathens-credentials-panel" className="flex-1 bg-[#0F0F0F] p-8 overflow-y-auto flex flex-col space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">OpenAthens & Publisher Session</h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            Configure OpenAthens credentials or pasted session tokens to proxy downloads through university firewalls.
          </p>
        </div>
        <div className="flex items-center space-x-1.5 bg-[#0A84FF]/10 border border-[#0A84FF]/20 px-3 py-1.5 rounded-xl text-[11px] text-[#0A84FF] font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>AES-256 Encrypted Local Memory</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Configuration Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6 space-y-5">
          <div className="flex items-center space-x-2 border-b border-[#2A2A2A] pb-3">
            <KeyRound className="w-4 h-4 text-[#0A84FF]" />
            <span className="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">Credential Store</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">College/Institution</label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="e.g. Harvard University"
                className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-2 px-3 text-xs text-[#E0E0E0] placeholder:text-zinc-650 focus:outline-none focus:border-[#0A84FF] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">OpenAthens Portal URL</label>
              <input
                type="text"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
                placeholder="e.g. portal.openathens.net"
                className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-2 px-3 text-xs text-[#E0E0E0] placeholder:text-zinc-650 focus:outline-none focus:border-[#0A84FF] transition-colors"
              />
            </div>
          </div>

          {/* OpenAthens Direct Credentials */}
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-[#28C840]" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">https://login.openathens.net/auth/gen Login</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">User ID / Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jdoe123"
                  className="w-full bg-[#161616] border border-[#2A2A2A] rounded-lg py-2 px-3 text-xs text-[#E0E0E0] placeholder:text-zinc-600 focus:outline-none focus:border-[#28C840] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#161616] border border-[#2A2A2A] rounded-lg py-2 px-3 text-xs text-[#E0E0E0] placeholder:text-zinc-600 focus:outline-none focus:border-[#28C840] transition-colors"
                />
              </div>
            </div>

            <label className="flex items-start space-x-2.5 pt-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoChooseOpenAthens}
                onChange={(e) => setAutoChooseOpenAthens(e.target.checked)}
                className="mt-0.5 rounded border-[#2A2A2A] bg-[#161616] text-[#28C840] focus:ring-[#28C840] w-3.5 h-3.5"
              />
              <div className="text-[11px] leading-snug">
                <span className="text-white font-medium block">Always prioritize OpenAthens authentications</span>
                <span className="text-[#8E8E93] text-[10px] block mt-0.5">
                  Always choose OpenAthens login automatically whenever any publisher journal platform asks for institutional / university access.
                </span>
              </div>
            </label>
          </div>

          {/* Session Cookies */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">Pasted Browser Cookies</label>
              <span className="text-[9px] text-[#8E8E93] font-mono">Bypasses Captchas & Multi-Factor Auth</span>
            </div>
            <textarea
              value={cookies}
              onChange={(e) => setCookies(e.target.value)}
              placeholder="Paste your copied Request Headers 'Cookie' string here..."
              rows={4}
              className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-2 px-3 text-xs font-mono text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-[#0A84FF] transition-all leading-normal"
            />
            <p className="text-[10px] text-[#8E8E93] leading-relaxed">
              *Paste the complete session cookie string so the backend proxy can pretend to be your authorized browser. This cookie remains local to your server container.
            </p>
          </div>

          {/* Custom Headers */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">Custom Headers (JSON - Optional)</label>
              <span className="text-[9px] text-[#8E8E93] font-mono">For advanced publisher payloads</span>
            </div>
            <textarea
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              placeholder='{ "User-Agent": "CustomBot/1.0", "Accept": "application/pdf" }'
              rows={2}
              className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-2 px-3 text-xs font-mono text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-[#0A84FF] transition-all leading-normal"
            />
          </div>

          <div className="pt-4 border-t border-[#2A2A2A] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {saveSuccess ? (
                <div className="flex items-center space-x-1.5 text-[#28C840] text-xs font-medium bg-[#163c1a] border border-[#235d29] px-2.5 py-1 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                  <span>Session Active!</span>
                </div>
              ) : (
                <div className="text-[10px] text-[#8E8E93] flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-[#4D4D4D]" />
                  <span>Settings persist in browser memory</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="bg-[#0A84FF] hover:bg-[#007AFF] active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Update Credentials
            </button>
          </div>
        </form>

        {/* Step-by-Step Guide */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-[#28C840]" />
                <span className="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">Guide: Cookie Extraction</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHowTo(!showHowTo)}
                className="text-[10px] text-[#0A84FF] hover:underline font-medium cursor-pointer"
              >
                {showHowTo ? "Hide Guide" : "Show Guide"}
              </button>
            </div>

            {showHowTo && (
              <div className="space-y-4 text-xs text-[#8E8E93] leading-relaxed">
                <div className="relative pl-6">
                  <div className="absolute left-0 top-0.5 w-4 h-4 bg-[#0F0F0F] text-[#8E8E93] border border-[#2A2A2A] font-bold rounded-full flex items-center justify-center font-mono text-[9px]">
                    1
                  </div>
                  <p className="font-semibold text-white">Login on University Portal</p>
                  <p className="mt-0.5 text-[11px]">
                    Open a new tab, go to your publisher journal page (e.g., <span className="text-slate-300">sciencedirect.com</span> or <span className="text-slate-300">wiley.com</span>), and login via <span className="text-[#0A84FF] font-medium">OpenAthens</span>. Confirm you can download a sample PDF.
                  </p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute left-0 top-0.5 w-4 h-4 bg-[#0F0F0F] text-[#8E8E93] border border-[#2A2A2A] font-bold rounded-full flex items-center justify-center font-mono text-[9px]">
                    2
                  </div>
                  <p className="font-semibold text-white">Open Browser DevTools</p>
                  <p className="mt-0.5 text-[11px]">
                    Right-click anywhere and select <span className="font-mono text-zinc-300 bg-[#0F0F0F] px-1 rounded border border-[#2A2A2A]">Inspect</span>, then switch to the <span className="text-[#28C840] font-medium">Network</span> tab.
                  </p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute left-0 top-0.5 w-4 h-4 bg-[#0F0F0F] text-[#8E8E93] border border-[#2A2A2A] font-bold rounded-full flex items-center justify-center font-mono text-[9px]">
                    3
                  </div>
                  <p className="font-semibold text-white">Copy the Cookie Headers</p>
                  <p className="mt-0.5 text-[11px]">
                    Reload the page. Select the main HTML document request. Look under <span className="font-medium text-white">Headers → Request Headers</span>. Find the <span className="text-[#28C840] font-semibold font-mono">cookie:</span> field, select its entire value, copy it, and paste it on the left form!
                  </p>
                </div>

                <div className="bg-[#0F0F0F] p-3 rounded-lg border border-[#2A2A2A] mt-2">
                  <div className="flex items-center space-x-1.5 text-[#28C840] font-medium text-[11px] mb-1">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Cookie Headers Example</span>
                  </div>
                  <code className="block text-[10px] font-mono text-zinc-500 overflow-x-auto whitespace-pre leading-relaxed">
                    idp_session=abc123xyz...; SD_SESSION=def456...; openathens.net=session_id...
                  </code>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6 space-y-3">
            <div className="flex items-center space-x-2 text-[#0A84FF]">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">How downloads work on macOS</h3>
            </div>
            <p className="text-[11px] text-[#8E8E93] leading-relaxed">
              When a local directory is linked, your browser grants sandboxed directory access. As soon as the proxy completes a PDF download on your behalf, this app creates folders (e.g. <span className="text-[#0A84FF]">/2024/Volume 3/</span>) and writes files directly into your local Mac finder with no zip extracts needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
