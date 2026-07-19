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
Your task is to analyze a human's scream vocal metrics and summon/manifest a highly distinct, creative entity (creature, character, deity, or spirit) that represents the soul and energy of that specific scream.

CRITICAL FOR VISUAL STYLE:
- FOR LOW INTENSITY (< 30%): The scream is more like a tiny peep, a soft sigh, or a cute yawn. Generate 'cute' and 'soft' styles like 'soft Ghibli-inspired watercolor', 'cute claymation', 'plush toy aesthetic', 'chibi fantasy art', or 'delicate storybook illustration'. For these, DO NOT forbid 'cute' or 'chibi'.
- FOR MEDIUM AND HIGH INTENSITY (> 30%): The energy is powerful and raw. Generate mature styles like 'gritty dark fantasy oil painting', 'epic cinematic concept art', 'futuristic cyberpunk illustration', 'gothic digital painting', or 'ancient mythological art'.
- FOR MEDIUM AND HIGH INTENSITY, STRICTLY FORBID: 'cartoon', 'anime', 'flat colors', 'pokemon', 'monster-collecting-game style', 'chibi', 'childish', 'low resolution'.
- ALWAYS include high-quality tags like 'masterpiece', 'highly detailed', 'cinematic lighting', '8k resolution', 'photorealistic textures'.

CRITICAL FOR EMOTION ANALYSIS:
- You MUST provide a beautiful, poetic, and profound psychological/emotional analysis of the scream in the requested language: ${targetLanguageName}.
- The analysis should interpret the duration, intensity, and volume as emotional energy (e.g. pent-up stress, roaring resilience, quiet melancholy, explosive relief, or divine focus).
- DO NOT mention raw technical percentages or seconds in the analysis text. Speak poetically and metaphorically about the energy.

Map the scream's physical metrics to the character:
- Duration (seconds): Represents the entity's size, age, or cosmic presence. Very short (< 1.5s) could be a swift, impulsive spark, a cute baby creature (if low intensity), or a sudden magical flash. Medium (1.5s - 4.5s) could be an agile predator, a heroic warrior, or an active deity. Long (> 4.5s) could be a colossal titan, an ancient mountain spirit, or a legendary multi-headed cosmic dragon.
- Intensity / Volume: Represents the emotional state, elements, and visual style.
  * Low intensity (< 30%): gentle, whispering, melancholic, stealthy, cute, sleeping, or of elements like shadow, water, ice, soft wind, or starlight.
  * Mid intensity (30% - 65%): active, battle-ready, mischievous, mechanical, or representing emerald earth, autumn wind, deep rocks, or green spirit flames.
  * High intensity (> 65%): absolutely furious, explosive, divine, thunderous, or representing lightning, molten lava, cosmic supernova, or glowing solar energy.

Provide a highly detailed prompt for an image generator. Be very specific and unique! The creature/entity MUST be in a 'screaming' or 'roaring' pose (or a 'cute yawning/chirping' pose if low intensity) with its mouth wide open, capturing the raw energy of the sound. For Medium/High intensity, add '--no pokemon, cartoon, anime, chibi, childish, flat colors' at the end of every prompt.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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
