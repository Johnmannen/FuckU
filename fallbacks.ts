export interface ScreamFigure {
  minIntensity: number;
  maxIntensity: number;
  minDuration: number;
  title: string;
  characterType: string;
  characterStyle: string;
  prompt: string;
  analysisEn: string;
  analysisSv: string;
}

const subjects: Record<string, string[]> = {
  "Bioluminescent Abyssal": ["Leviathan", "Hydra", "Medusa Jelly", "Trench Guardian", "Glow-spore", "Neon Anemone", "Abyssal Maw", "Ghost Shark"],
  "Fractal Crystal": ["Quartz Colossus", "Prismatic Shard", "Geode Heart", "Crystalline Dragon", "Obsidian Spire", "Diamond Wraith", "Amethyst Wave", "Fractal Tree"],
  "Clockwork Celestial": ["Brass Orrery", "Steam-driven Comet", "Mechanical Sun", "Gear-tooth Moon", "Chronos Titan", "Automaton Star", "Copper Nebula", "Ticking Void"],
  "Ethereal Void": ["Shadow Weaver", "Soul Fragment", "Empty Throne", "Stellar Ghost", "Phantom Mist", "Echoing Silence", "Drifting Memory", "Void Ribbon"],
  "Volcanic Obsidian": ["Magma Serpent", "Ashen Phoenix", "Basalt Golem", "Lava Pillar", "Sulfur Wraith", "Burning Core", "Obsidian Blade", "Pyroclastic Flow"],
  "Verdant Overgrowth": ["Ancient Sylvan", "Thorned Monarch", "Mossy Guardian", "Emerald Bloom", "Brambled Heart", "Fungal Spore", "Lush Canopy", "Vine Creeper"],
  "Cybernetic Neon": ["Data Wraith", "Circuit Vein", "Neon Pulse", "Digital Mirage", "Synthwave Horizon", "Holographic Shard", "Binary Rain", "Quantum Core"],
  "Mythological Aether": ["Golden Fleece", "Aurelian Wing", "Divine Spark", "Celestial Lyre", "Ambrosian Cloud", "Olympian Pillar", "Icarus Shadow", "Phoenix Rebirth"]
};

const styles = [
  "Intricate Baroque oil painting",
  "Hyper-detailed digital matte painting",
  "Cinematic 3D V-Ray architectural render",
  "Dark gothic fine art masterpiece",
  "Surrealism masterpiece with heavy textures",
  "Photorealistic epic fantasy art"
];

const adjectives = {
  Low: ["Stifled", "Subterranean", "Hushed", "Glimmering", "Ebbing", "Distant", "Muffled", "Serene"],
  Mid: ["Resonant", "Luminous", "Surging", "Vibrant", "Pulsating", "Rhythmic", "Kinetic", "Oscillating"],
  High: ["Cataclysmic", "Radiant", "Fulminant", "Incandescent", "Shattering", "Titanic", "Apocalyptic", "Blazing"]
};

const intensityDescriptions = {
  Low: "shimmering with a subtle, internal resonance that barely disturbs the air",
  Mid: "erupting in a powerful, harmonic resonance that vibrates through the surroundings",
  High: "unleashing a blinding, world-shattering surge of power that fractures reality itself"
};

/**
 * FALLBACK_THEMES_500: A comprehensive array of 500 unique Scream Figure objects.
 * Generated programmatically to ensure perfect distribution across intensities, durations, and themes.
 * Explicitly avoids "Pokemon" or "cartoonish" styles in favor of high-art photorealism.
 */
export const FALLBACK_THEMES_500: ScreamFigure[] = (["Low", "Mid", "High"] as const).flatMap(intensityGroup => {
  const [minI, maxI] = intensityGroup === "Low" ? [0, 30] : (intensityGroup === "Mid" ? [30, 65] : [65, 100]);
  const count = intensityGroup === "High" ? 200 : 150;
  const adjs = adjectives[intensityGroup];
  const intensityDesc = intensityDescriptions[intensityGroup];

  return Array.from({ length: count }).map((_, i) => {
    const themeKeys = Object.keys(subjects);
    const theme = themeKeys[i % themeKeys.length];
    const subjectList = subjects[theme];
    const subject = subjectList[Math.floor(i / themeKeys.length) % subjectList.length];
    const style = styles[i % styles.length];
    const duration = [0, 2, 5][i % 3] as 0 | 2 | 5;
    const adj = adjs[Math.floor(i / (themeKeys.length * subjectList.length)) % adjs.length] || adjs[i % adjs.length];

    const screamKeywords = ["screaming", "roaring", "wide-open mouth"];
    const screamKeyword = screamKeywords[i % screamKeywords.length];
    const prompt = `Masterpiece, 8k, highly detailed, photorealistic, cinematic lighting, intricate textures, v-ray render. A ${style} portrayal of a ${adj} ${subject} ${screamKeyword} while emerging from a ${theme} realm. The essence of a ${intensityGroup.toLowerCase()} intensity scream captured in frozen motion, ${intensityDesc}. --no pokemon, cartoon, anime, chibi, childish, flat colors`;

    const analysisEn = `A ${adj.toLowerCase()} ${subject.toLowerCase()} manifested from the ${theme.toLowerCase()} domain, vibrating with the poetic and raw energy of a ${intensityGroup.toLowerCase()} intensity scream. It stands as a testament to the ${intensityGroup === "High" ? "unrelenting power" : (intensityGroup === "Mid" ? "vibrant resonance" : "subtle whisper")} of its origin.`;

    const swedishThemes: Record<string, string> = {
      "Bioluminescent Abyssal": "bioluminescent djuphavs-",
      "Fractal Crystal": "fraktal kristall-",
      "Clockwork Celestial": "urverks-himmelsk",
      "Ethereal Void": "eterisk tomrums-",
      "Volcanic Obsidian": "vulkanisk obsidian-",
      "Verdant Overgrowth": "grönskande övervuxen",
      "Cybernetic Neon": "cybernetisk neon-",
      "Mythological Aether": "mytologisk eter-"
    };

    const analysisSv = `En ${adj.toLowerCase()} ${subject.toLowerCase()} manifesterad ur det ${swedishThemes[theme] || theme.toLowerCase()}riket, sjudande av den poetiska och råa kraften i ett skrik med ${intensityGroup.toLowerCase()} intensitet. Den står som ett monument över dess ursprungs ${intensityGroup === "High" ? "obevekliga kraft" : (intensityGroup === "Mid" ? "vibrerande resonans" : "subtila viskning")}.`;

    return {
      minIntensity: minI,
      maxIntensity: maxI,
      minDuration: duration,
      title: `${adj} ${subject}`,
      characterType: theme,
      characterStyle: style,
      prompt,
      analysisEn,
      analysisSv
    };
  });
});
