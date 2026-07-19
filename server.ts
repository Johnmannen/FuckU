import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { FALLBACK_THEMES_1000 } from "./fallbacks";

// Load environment variables in development
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to choose a local fallback character from the 1000+ library
function getLocalFallback(intensity: number, duration: number, pitch: number, stability: number, isSv: boolean): { title: string; characterType: string; characterStyle: string; prompt: string; analysis: string } {
  // Filter by intensity range
  const matchingIntensity = FALLBACK_THEMES_1000.filter(
    (t) => intensity >= t.minIntensity && intensity <= t.maxIntensity
  );

  // Score remaining options based on pitch and stability proximity
  const scored = matchingIntensity.map(t => {
    const pitchDiff = Math.abs((t.minPitch + t.maxPitch) / 2 - pitch);
    const stabilityDiff = Math.abs(t.minStability - stability);
    return { item: t, score: pitchDiff + stabilityDiff };
  });

  scored.sort((a, b) => a.score - b.score);

  // Take top 10 closest matches and pick random for variety
  const topTen = scored.slice(0, 10);
  const selected = topTen[Math.floor(Math.random() * topTen.length)]?.item || FALLBACK_THEMES_1000[0];

  return {
    title: selected.title,
    characterType: selected.characterType,
    characterStyle: selected.characterStyle,
    prompt: selected.prompt,
    analysis: isSv ? selected.analysisSv : selected.analysisEn
  };
}

// API Endpoint to analyze scream using Gemini
app.post("/api/analyze-scream", async (req, res) => {
  const { duration, maxVolume, avgVolume, intensity, pitch, stability, lang } = req.body;

  if (duration === undefined || intensity === undefined) {
    return res.status(400).json({ error: "Missing required scream parameters." });
  }

  const isSv = !!(lang && lang.toLowerCase().startsWith("sv"));
  const safePitch = pitch || 50;
  const safeStability = stability || 80;

  // Check if GEMINI_API_KEY exists
  if (!process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY not configured. Falling back to creative local database.");
    const fallback = getLocalFallback(intensity, duration, safePitch, safeStability, isSv);
    return res.json(fallback);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const targetLanguageName = isSv ? "Swedish (svenska)" : "English";

    const systemInstruction = `You are an expert fantasy worldbuilder, character designer, image prompt engineer, and psychologist.
Your task is to analyze a human's scream vocal metrics and summon/manifest a highly distinct, creative entity that represents the soul and energy of that specific scream.

NEW METRICS:
- Pitch: ${safePitch}/100. High pitch = sharp, energy, ethereal, lightning. Low pitch = deep, ground, shadows, giants.
- Stability: ${safeStability}/100. High stability = pure, solid, crystalline, divine. Low stability = glitchy, chaotic, eldritch, mist.

CRITICAL FOR VISUAL STYLE:
- For Medium and High intensity (> 30%), DO NOT generate cartoonish, childish, or Pokemon-like styles. Instead, generate mature styles like 'gritty dark fantasy oil painting', 'epic cinematic concept art', 'futuristic cyberpunk illustration', 'gothic digital painting', or 'ancient mythological art'.
- ALWAYS include high-quality tags like 'masterpiece', 'highly detailed', 'cinematic lighting', '8k resolution'.
- STRICTLY FORBID: 'cartoon', 'anime' (unless it's gritty 90s style), 'flat colors', 'pokemon', 'chibi'.
- The entity MUST be in a 'screaming' or 'roaring' pose with its mouth wide open.

CRITICAL FOR EMOTION ANALYSIS:
- provide a poetic analysis in ${targetLanguageName}. Do not use technical percentages. Speak metaphors.

Map the scream's metrics to the character:
- Duration: size and age.
- Intensity: emotional elements.

Provide a highly detailed prompt for an image generator. Add '--no pokemon, cartoon, anime, chibi, flat colors' at the end.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze this scream:
- Duration: ${duration}s
- Intensity: ${intensity}%
- Pitch: ${safePitch}/100
- Stability: ${safeStability}/100
- Language: ${targetLanguageName}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A grand, descriptive name."
            },
            characterType: {
              type: Type.STRING,
              description: "The specific category."
            },
            characterStyle: {
              type: Type.STRING,
              description: "A summary of the visual vibe."
            },
            prompt: {
              type: Type.STRING,
              description: "The full, highly detailed English prompt."
            },
            analysis: {
              type: Type.STRING,
              description: `A profound analysis in ${targetLanguageName}.`
            }
          },
          required: ["title", "characterType", "characterStyle", "prompt", "analysis"]
        }
      }
    });

    const jsonStr = response.text?.trim() || "";
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      return res.json(parsed);
    } else {
      throw new Error("Empty text returned from Gemini API");
    }
  } catch (error) {
    console.error("Gemini analysis error:", error);
    const fallback = getLocalFallback(intensity, duration, safePitch, safeStability, isSv);
    return res.json(fallback);
  }
});

async function startServer() {
  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  startServer();
}

export default app;
