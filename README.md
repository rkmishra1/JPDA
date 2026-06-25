<div align="center">

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.icons8.com/fluency/96/bookmark-documents.png">
  <img alt="JPDA" src="https://img.icons8.com/fluency/96/bookmark-documents.png" width="80">
</picture>

<br>

# Journal PDF Downloader & Archiver

### Bulk-download academic journal PDFs into organized local folders<br>powered by Gemini AI extraction.

<br>

<a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node"></a>&nbsp;
<a href="https://react.dev"><img src="https://img.shields.io/badge/react-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"></a>&nbsp;
<a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"></a>&nbsp;
<a href="https://ai.google.dev"><img src="https://img.shields.io/badge/gemini-3.5_flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"></a>

<br><br>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" alt="divider" width="100%">

</div>

<br>

## Overview

> **Paste** a journal's "All Issues" page source **→** Gemini extracts the full
> **Year → Volume → Issue → PDF link** hierarchy **→** JPDA downloads everything
> through a local proxy (reusing your institutional session) **→** writes into a
> clean folder tree on disk.

```
📂 Neural_Networks/
├── 📁 2024/
│   ├── 📁 Volume_185/
│   │   ├── 📄 NeuralNetworks_2024_Vol185_Issue1.pdf
│   │   └── 📄 NeuralNetworks_2024_Vol185_Issue2.pdf
│   └── 📁 Volume_186/
│       └── ...
└── 📁 2023/
    └── ...
```

<br>

## Features

<table>
<tr>
<td width="50%" valign="top">

### Extraction
- **HTML Source Scraper** — paste page source from ScienceDirect, Wiley, IEEE, Springer, etc. Gemini parses real PDF links automatically
- **Registry Search** — look up journals by title or ISSN via Crossref, then build the archive tree

</td>
<td width="50%" valign="top">

### Downloads
- **Session Proxy** — paste your institutional cookies once; the proxy forwards them to fetch gated PDFs
- **Smart Queue** — jitter delays, User-Agent rotation, exponential backoff retries, retryable error log
- **Folder Sync** — File System Access API writes into nested folders directly — no zips, no sorting

</td>
</tr>
</table>

> [!IMPORTANT]
> Only download content you're licensed to access. Respect each publisher's
> terms of service and your institution's access policies.

<br>

## Quick Start

```bash
# Clone & install
git clone https://github.com/rkmishra1/JPDA.git
cd JPDA && npm install

# Add your Gemini API key
cp .env.example .env
# Edit .env → GEMINI_API_KEY="your-key-here"

# Run — Express + Vite on http://localhost:3000
npm run dev
```

> [!TIP]
> Use **Chrome, Edge, or Opera** for direct folder syncing via the File System Access API.
> Safari and Firefox fall back to individual browser download prompts.

<br>

## How the Proxy Works

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│   Browser    │         │  JPDA Server │         │  Publisher   │
│              │         │              │         │              │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │  1. Login via          │                        │
       │     OpenAthens         │                        │
       │  ─────────────────►    │                        │
       │                        │                        │
       │  2. Paste session      │                        │
       │     cookies            │                        │
       │  ─────────────────►    │                        │
       │                        │                        │
       │                        │  3. GET pdf + cookies  │
       │                        │  ─────────────────────►│
       │                        │                        │
       │                        │  4. PDF bytes          │
       │                        │  ◄─────────────────────│
       │                        │                        │
       │  5. PDF blob           │                        │
       │  ◄─────────────────    │                        │
       │                        │                        │
```

JPDA **never asks for or stores your password**. Cookies stay in your
browser's `localStorage` and are only sent to the publisher URLs you
download from.

<br>

## Scripts

| Command | What it does |
|:--------|:-------------|
| `npm run dev` | Dev server with Vite HMR |
| `npm run build` | Production build (client + server) |
| `npm start` | Serve production build (honors `PORT` env) |
| `npm run lint` | Type-check via `tsc --noEmit` |

<br>

## Built With

<p>
<a href="https://react.dev"><img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React"></a>
<a href="https://vite.dev"><img src="https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
<a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind"></a>
<a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express-000?style=flat-square&logo=express&logoColor=white" alt="Express"></a>
<a href="https://www.npmjs.com/package/@google/genai"><img src="https://img.shields.io/badge/Google_GenAI-4285F4?style=flat-square&logo=google&logoColor=white" alt="GenAI"></a>
<a href="https://www.crossref.org/documentation/retrieve-metadata/rest-api/"><img src="https://img.shields.io/badge/Crossref_API-F36E21?style=flat-square&logoColor=white" alt="Crossref"></a>
</p>

<br>

<div align="center">
<sub>Made for researchers who'd rather read papers than organize them.</sub>
</div>
