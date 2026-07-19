import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { FALLBACK_THEMES_500 } from "./fallbacks";

// Load environment variables in development
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to choose a local fallback character from the 500+ library
function getLocalFallback(intensity: number, duration: number, isSv: boolean): { title: string; characterType: string; characterStyle: string; prompt: string; analysis: string } {
  // Filter by intensity range
  const matchingIntensity = FALLBACK_THEMES_500.filter(
    (t) => intensity >= t.minIntensity && intensity <= t.maxIntensity
  );

  // Further filter by duration weighting
  // duration < 1.5 -> 0 (short)
  // 1.5 <= duration < 4.5 -> 2 (medium)
  // duration >= 4.5 -> 5 (long)
  const durWeight = duration < 1.5 ? 0 : (duration < 4.5 ? 2 : 5);
  let finalOptions = matchingIntensity.filter(t => t.minDuration === durWeight);

  // Fallback to just intensity if no perfect duration match
  if (finalOptions.length === 0) finalOptions = matchingIntensity;
  if (finalOptions.length === 0) finalOptions = [FALLBACK_THEMES_500[0]];

  const randomIndex = Math.floor(Math.random() * finalOptions.length);
  const selected = finalOptions[randomIndex];

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
  const { duration, maxVolume, avgVolume, intensity, lang } = req.body;

  if (duration === undefined || intensity === undefined) {
    return res.status(400).json({ error: "Missing required scream parameters." });
  }

  const isSv = !!(lang && lang.toLowerCase().startsWith("sv"));

  // Check if GEMINI_API_KEY exists
  if (!process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY not configured. Falling back to creative local database.");
    const fallback = getLocalFallback(intensity, duration, isSv);
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
- For Medium and High intensity (> 30%), DO NOT generate cartoonish, childish, cute, or Pokemon-like styles. Instead, generate mature styles like 'gritty dark fantasy oil painting', 'epic cinematic concept art', 'futuristic cyberpunk illustration', 'gothic digital painting', or 'ancient mythological art'.
- ALWAYS include high-quality tags like 'masterpiece', 'highly detailed', 'cinematic lighting', '8k resolution', 'photorealistic textures'.
- STRICTLY FORBID: 'cartoon', 'anime', 'flat colors', 'pokemon', 'monster-collecting-game style', 'chibi', 'childish', 'low resolution'.
- Let the creature look imposing, divine, beastly, or legendary, not like a cute trading card pet!

CRITICAL FOR EMOTION ANALYSIS:
- You MUST provide a beautiful, poetic, and profound psychological/emotional analysis of the scream in the requested language: ${targetLanguageName}.
- The analysis should interpret the duration, intensity, and volume as emotional energy (e.g. pent-up stress, roaring resilience, quiet melancholy, explosive relief, or divine focus).
- DO NOT mention raw technical percentages or seconds in the analysis text (e.g. do NOT write 'your scream of 4.5 seconds at 80% intensity'). Speak poetically and metaphorically about the energy (e.g., 'Ett långt och djupt utbrott som visar på uppdämd kraft...').

Map the scream's physical metrics to the character:
- Duration (seconds): Represents the entity's size, age, or cosmic presence. Very short (< 1.5s) could be a swift, impulsive spark, a cute baby creature (if low intensity), or a sudden magical flash. Medium (1.5s - 4.5s) could be an agile predator, a heroic warrior, or an active deity. Long (> 4.5s) could be a colossal titan, an ancient mountain spirit, or a legendary multi-headed cosmic dragon.
- Intensity / Volume: Represents the emotional state, elements, and visual style.
  * Low intensity (< 30%): gentle, whispering, melancholic, stealthy, cute, sleeping, or of elements like shadow, water, ice, soft wind, or starlight.
  * Mid intensity (30% - 65%): active, battle-ready, mischievous, mechanical, or representing emerald earth, autumn wind, deep rocks, or green spirit flames.
  * High intensity (> 65%): absolutely furious, explosive, divine, thunderous, or representing lightning, molten lava, cosmic supernova, or glowing solar energy.

Provide a highly detailed prompt for an image generator. Be very specific and unique! The creature/entity MUST be in a 'screaming' or 'roaring' pose with its mouth wide open, capturing the raw energy of the sound. Add '--no pokemon, cartoon, anime, chibi, childish, flat colors' at the end of every prompt.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze this scream and summon its unique creature:
- Duration: ${duration} seconds
- Max Volume: ${maxVolume}%
- Avg Volume: ${avgVolume}%
- Intensity: ${intensity}%
- Requested Language for Analysis: ${targetLanguageName}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A grand, descriptive, or cute name and title for the creature (e.g., 'Anubis, Arbiter of Souls', 'Giga-Volt Clockwork Golem', 'Screechy, the fluffy cotton-ball cloud', 'Ryu, the Storm Samurai')."
            },
            characterType: {
              type: Type.STRING,
              description: "The specific category or species (e.g., 'Ancient Egyptian Underworld God', 'Chibi electric squirrel spirit', 'Photorealistic volcanic elemental')."
            },
            characterStyle: {
              type: Type.STRING,
              description: "A concise summary of the visual vibe and emotional style (e.g., 'Sleek anime style, glowing golden runes, crackling lightning', 'Chibi watercolor illustration, soft pastel colors, cute Ghibli aesthetic')."
            },
            prompt: {
              type: Type.STRING,
              description: "The full, highly detailed English prompt for an AI image generator. Describe the main character, their expressive pose (screaming, charging energy, or sleeping), specific styling/vibe (anime, photorealistic, fantasy art), the magical visual elements around them (fire, electric arcs, leaves, water), the background environment, lighting (cinematic, dramatic, volumetric, soft), framing (close-up portrait, dynamic low angle, 3D render), and high-quality artistic tags. Keep it under 80 words."
            },
            analysis: {
              type: Type.STRING,
              description: `A profound, poetic, and beautiful psychological analysis of the feelings behind this vocal release, written completely in ${targetLanguageName}. Keep it to 1-2 expressive sentences.`
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
    // Graceful fallback on error
    const fallback = getLocalFallback(intensity, duration, isSv);
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
