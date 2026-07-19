import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables in development
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Fallback pool of highly creative, diverse, and randomized characters
const FALLBACK_THEMES = [
  // Low Intensity (Timid, soft, gentle, whispering, sleepy, cute)
  {
    minIntensity: 0,
    maxIntensity: 30,
    options: [
      {
        title: "Koko, the Fluffy Sleepy Sloth",
        characterType: "Cute Ghibli-style forest creature",
        characterStyle: "Soft watercolor, cozy pastel tones, dreamy Ghibli aesthetic",
        prompt: "A cute fluffy sleepy sloth hanging from a tree branch, Ghibli-style watercolor illustration, soft pastel colors, dreamy whimsical lighting, green leaves, cozy forest background, adorable round face",
        analysisEn: "A soft, quiet whisper in the dark. It conveys a soothing, restful energy filled with dreamy innocence and gentle patience.",
        analysisSv: "Ett mjukt, försiktigt viskande i mörkret. Det förmedlar en lugnande och vilsam energi fylld med drömsk oskuldsfullhet och stilla tålamod."
      },
      {
        title: "Selene, the Starry Mew Kitten",
        characterType: "Anime celestial kitten spirit",
        characterStyle: "Sparkling anime style, cosmic dark blue tones, starry night sky",
        prompt: "An adorable celestial kitten with glowing starry eyes and cosmic blue fur, floating stardust, crescent moon in background, gorgeous anime style, cute fantasy illustration",
        analysisEn: "A celestial hum from the depths of space, carrying a dreamlike wonder and galactic peacefulness.",
        analysisSv: "Ett celestialt nynnande från rymdens djup, som bär på en drömsk förundran och galaktisk fridfullhet."
      },
      {
        title: "Grootlet, the Emerald Sapling",
        characterType: "Chibi woodland nature spirit",
        characterStyle: "Lush digital illustration, vibrant emerald and earthy tones",
        prompt: "A tiny cute tree-spirit seedling with glowing green leaf-hair, whispering softly, high-detailed digital illustration, cinematic lighting, mossy forest floor background, soft bokeh",
        analysisEn: "A quiet sigh of growth and gentle nature energy, representing ancient roots starting to awaken slowly.",
        analysisSv: "En tyst suck av tillväxt och mild naturkraft, som representerar uråldriga rötter som sakta börjar vakna."
      }
    ]
  },
  // Mid Intensity (Active, fierce, battle-ready, playful, elemental, mechanical)
  {
    minIntensity: 30,
    maxIntensity: 65,
    options: [
      {
        title: "Anubis, Guardian of the Scale",
        characterType: "Ancient Egyptian Mythic Deity",
        characterStyle: "Gothic dynamic digital art, gold and obsidian textures",
        prompt: "The jackal-headed god Anubis standing majestically, ancient Egyptian theme, gold and black obsidian armor, glowing blue eyes, epic cinematic digital painting, volumetric lighting, hieroglyphics on stone walls",
        analysisEn: "A focused, solemn tone filled with quiet determination. It reflects an inner judge ready to confront challenges with absolute balance.",
        analysisSv: "En fokuserad, högtidlig ton fylld av tyst beslutsamhet. Den speglar en inre dömande kraft som är redo att möta utmaningar med absolut balans."
      },
      {
        title: "Valbrand, the Fire-Forged Viking",
        characterType: "Legendary Norse Warrior Spirit",
        characterStyle: "Realistic gritty fantasy art, dark amber flames",
        prompt: "A roaring Norse Viking warrior with a beard made of embers, realistic gritty fantasy style, iron helmet, glowing orange flames, snowy dark pine forest background, cinematic atmospheric lighting",
        analysisEn: "A warm, spirited outcry of resilience. This reflects an unyielding warrior spirit ready to break through icy obstacles.",
        analysisSv: "Ett varmt, eldigt utbrott av motståndskraft. Detta återspeglar en okuvlig krigaranda redo att bryta igenom isiga hinder."
      },
      {
        title: "Giga-Volt, the Steamwork Golem",
        characterType: "Sleek steampunk mechanical soldier",
        characterStyle: "Industrial concept art, brass and copper highlights, electric sparks",
        prompt: "A brass mechanical golem with glowing electrical copper coils, steampunk aesthetic, electric sparks crackling, industrial dark workshop background, high detail metal textures, 3D render style",
        analysisEn: "An intense, structured burst of kinetic steam power. It reveals structured mental activity breaking through tension.",
        analysisSv: "En intensiv, strukturerad stöt av kinetisk ångkraft. Den avslöjar en organiserad mental aktivitet som bryter igenom spänningar."
      }
    ]
  },
  // High Intensity (Furious, thunderous, legendary, celestial, explosive)
  {
    minIntensity: 65,
    maxIntensity: 100,
    options: [
      {
        title: "Zeus, Lord of Storms",
        characterType: "Greek Olympian God of Thunder",
        characterStyle: "Epic high-fantasy illustration, bright neon lightning, dramatic pose",
        prompt: "Zeus, the king of gods, roaring in extreme fury with eyes of pure lightning, holding a crackling thunderbolt, epic high-fantasy digital painting, dramatic low angle, dark stormy clouds background, neon blue electrical sparks",
        analysisEn: "A monumental primal roar filled with explosive fury. This scream releases deep-seated tension in a thunderous cosmic cascade.",
        analysisSv: "Ett monumentalt primalvrål fyllt av explosiv vrede. Detta skrik frigör djupgående spänningar i en dundrande kosmisk kaskad."
      },
      {
        title: "Ignis, the Obsidian Phoenix",
        characterType: "Colossal molten fire bird",
        characterStyle: "Cinematic dark fantasy art, molten lava and volcanic ash",
        prompt: "A colossal phoenix bird made of pure molten lava and dark ash feathers, roaring as it spreads its wings, cinematic dark fantasy concept art, volcanic background, deep dramatic shadows, intense warm embers",
        analysisEn: "A blazing rebirth. The sheer power of this vocal release represents burning away old stresses to rise stronger from the ashes.",
        analysisSv: "En flammande återfödelse. Den rena kraften i detta vokala utlopp representerar att bränna bort gamla spänningar för att resa sig starkare ur askan."
      },
      {
        title: "Ryujin, the Supernova Star Dragon",
        characterType: "Cosmic stellar serpent deity",
        characterStyle: "Epic cosmic sci-fi fantasy, stellar neon nebulas",
        prompt: "A massive celestial dragon coiling through a stellar nebula, screaming a solar flare, epic sci-fi fantasy digital art, deep space background, glowing neon red and yellow stars, cinematic scale",
        analysisEn: "A stellar shockwave screaming across the cosmos. It indicates a highly dramatic release of raw, uncontained emotional energy.",
        analysisSv: "En färgstark chockvåg som skriker genom kosmos. Den indikerar en extremt dramatisk frigörelse av rå, gränslös känslomässig energi."
      }
    ]
  }
];

// Helper to choose a local fallback character
function getLocalFallback(intensity: number, isSv: boolean): { title: string; characterType: string; characterStyle: string; prompt: string; analysis: string } {
  const matchingRange = FALLBACK_THEMES.find(
    (t) => intensity >= t.minIntensity && intensity <= t.maxIntensity
  ) || FALLBACK_THEMES[1]; // default to mid range

  const randomIndex = Math.floor(Math.random() * matchingRange.options.length);
  const selected = matchingRange.options[randomIndex];
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
    const fallback = getLocalFallback(intensity, isSv);
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
- Cute/chibi/Pokemon-like styles are strictly ONLY allowed for Low intensity (< 30%).
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

Provide a highly detailed prompt for an image generator. Be very specific and unique!`;

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
    const fallback = getLocalFallback(intensity, isSv);
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

startServer();
