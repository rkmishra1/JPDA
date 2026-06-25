import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support large HTML pastes
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Lazy initialize Gemini AI client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Secrets/Environment.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // API: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API: Extract Journal issues from html or text pasting
  app.post("/api/extract-journal", async (req, res) => {
    try {
      const { html, journalUrl } = req.body;
      if (!html || html.trim() === "") {
        return res.status(400).json({ error: "HTML page source or text content is required" });
      }

      console.log(`Received extraction request. URL hint: ${journalUrl || "None"}. Size: ${html.length} chars`);

      const ai = getGeminiClient();

      const systemInstruction = `You are a professional academic journal metadata extraction assistant.
Your task is to analyze the pasted HTML page source or raw text of a journal's list of issues, table of contents, or archives.
Accurately identify and extract:
1. The journal title (e.g. "Neural Networks", "Nature Biotechnology").
2. The publisher platform (e.g., "ScienceDirect", "IEEE", "Springer", "Wiley", "Oxford Academic", "MDPI").
3. Categorize this journal automatically into one of these fields based on its title: "Mathematics", "Economics", "Finance", "Data Science", "Statistics", "Computer Science", "Engineering", "Physics", "Chemistry", "Biology", "Medicine", "Social Sciences", "Multidisciplinary", "Other".
4. The ISSN (International Standard Serial Number) if found in the text/html, otherwise set it to "N/A".
5. The hierarchical list of published volumes, issues, and years.
6. For every issue:
   - issueName: Name of the issue (e.g., "Issue 1", "Issue 12", "Supplement 1", "Special Issue").
   - date: Publication date string (e.g., "January 2024", "Summer 2023").
   - pdfName: A clean, safe, standardized filename for the PDF download (e.g., "NeuralNetworks_2024_Vol160_Issue1.pdf" - replace characters with underscores/dashes to be safe for Mac/Unix filesystems).
   - pdfUrl: The direct URL to fetch the full issue PDF or individual article pages/downloads if full-issue PDFs are not found. Search for links containing '/pdf', 'download', 'article/pii/', '.pdf', '/reader/'.

Resolve relative links:
If the PDF URL is relative (e.g. starting with '/') and a journalUrl is provided (e.g. "https://www.sciencedirect.com/journal/neural-networks"), convert it into an absolute URL using the protocol and domain of the journalUrl.

Output strictly in JSON format matching this schema:
{
  "journalTitle": "string",
  "publisher": "string",
  "category": "string",
  "issn": "string",
  "years": [
    {
      "year": number,
      "volumes": [
        {
          "volumeName": "string",
          "issues": [
            {
              "issueName": "string",
              "date": "string",
              "pdfName": "string",
              "pdfUrl": "string"
            }
          ]
        }
      ]
    }
  ]
}

Only output the raw JSON object. Do not add markdown wrapper tags like \`\`\`json. Return only valid parseable JSON.`;

      // Slice the HTML content to avoid exceeding Gemini context limits, whilst remaining large enough
      const htmlSlice = html.slice(0, 400000);

      const prompt = `Journal URL Reference: ${journalUrl || "Not Provided"}\n\nContent:\n${htmlSlice}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini model");
      }

      let parsedData;
      try {
        parsedData = JSON.parse(text.trim());
      } catch (e) {
        // Fallback cleanup
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedData = JSON.parse(cleanedText);
      }

      res.json(parsedData);
    } catch (error: any) {
      console.error("Journal extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract journal structure" });
    }
  });

  // API: Search journals by Title or ISSN using Crossref API + Gemini categorization
  app.get("/api/search-journals", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== "string" || query.trim() === "") {
        return res.status(400).json({ error: "Search query is required" });
      }

      console.log(`Searching journals for query: ${query}`);

      // Query Crossref
      const crossrefUrl = `https://api.crossref.org/journals?query=${encodeURIComponent(query)}&rows=5`;
      let crossrefResults: any[] = [];
      try {
        const fetchRes = await fetch(crossrefUrl);
        if (fetchRes.ok) {
          const json = await fetchRes.json();
          if (json.message && json.message.items) {
            crossrefResults = json.message.items;
          }
        }
      } catch (err) {
        console.warn("Crossref query failed, falling back to local simulation:", err);
      }

      // We'll use Gemini to format the results, categorize them, and make sure we have clean title, issn, and category
      const ai = getGeminiClient();
      const prompt = `You are an academic journal database search assistant.
Based on the following user search query: "${query}"
And these optional Crossref metadata results: ${JSON.stringify(crossrefResults)}

Please produce a list of up to 5 matching academic journals.
For each journal, identify:
1. journalTitle (string)
2. publisher (string)
3. issn (string, e.g. "0893-6080" or "N/A")
4. category (string - MUST be one of these exact fields: "Mathematics", "Economics", "Finance", "Data Science", "Statistics", "Computer Science", "Engineering", "Physics", "Chemistry", "Biology", "Medicine", "Social Sciences", "Multidisciplinary", "Other")
5. subjectField (string - a short descriptive phrase, e.g., "Neural Networks & Machine Learning")

Output strictly in JSON format matching this schema:
{
  "journals": [
    {
      "journalTitle": "string",
      "publisher": "string",
      "issn": "string",
      "category": "string",
      "subjectField": "string"
    }
  ]
}

Only return raw parseable JSON. Do not write markdown tags.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from search model");
      }

      let parsed;
      try {
        parsed = JSON.parse(text.trim());
      } catch (e) {
        parsed = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
      }
      res.json(parsed);
    } catch (error: any) {
      console.error("Journal search error:", error);
      res.status(500).json({ error: error.message || "Failed to search journals" });
    }
  });

  // API: Proxy PDF downloads using user-supplied session cookies
  app.post("/api/download-proxy", async (req, res) => {
    try {
      const { url, cookies, customHeaders } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      console.log(`Proxying download for: ${url}`);

      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/pdf,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      };

      if (cookies && cookies.trim() !== "") {
        headers["Cookie"] = cookies;
      }

      if (customHeaders) {
        try {
          const parsed = typeof customHeaders === "string" ? JSON.parse(customHeaders) : customHeaders;
          Object.assign(headers, parsed);
        } catch (e) {
          console.warn("Could not parse custom headers, skipping");
        }
      }

      const fetchRes = await fetch(url, { headers });

      if (!fetchRes.ok) {
        return res.status(fetchRes.status).json({
          error: `Failed to download file from publisher: ${fetchRes.statusText} (${fetchRes.status})`
        });
      }

      const contentType = fetchRes.headers.get("content-type") || "application/pdf";
      res.setHeader("Content-Type", contentType);

      const contentDisposition = fetchRes.headers.get("content-disposition");
      if (contentDisposition) {
        res.setHeader("Content-Disposition", contentDisposition);
      }

      const buffer = await fetchRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      console.error("Download proxy error:", error);
      res.status(500).json({ error: error.message || "Proxy download failed" });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully booted on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
