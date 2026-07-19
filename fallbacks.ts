export interface ScreamFigure {
  category: string;
  minIntensity: number;
  maxIntensity: number;
  minPitch: number; // 0 (low/deep) to 100 (high/sharp)
  maxPitch: number;
  minStability: number; // 0 (chaotic) to 100 (pure)
  title: string;
  characterType: string;
  characterStyle: string;
  prompt: string; // High quality, including "screaming/roaring/mouth open"
  analysisEn: string;
  analysisSv: string;
}

const CATEGORY_DATA = {
  "Cute & Whimsical": {
    subjects: ["Tiny Dragon", "Fluffy Cloud", "Slime King", "Starry Kitten", "Mushroom Sprite", "Fairy Fox", "Toy Soldier", "Candy Golem", "Bubbling Potion", "Hummingbird Knight", "Marshmallow Ghost", "Teacup Gryphon", "Stardust Rabbit", "Crystal Beetle", "Pollen Pixie", "Sugar Glider"],
    styles: ["Storybook illustration", "Watercolor painting", "3D Pixar-style render", "Soft Claymation", "Ghibli-inspired art", "Vibrant digital felt texture", "Hand-painted ceramic style", "Whimsical pastel sketch"],
    pitch: [60, 100],
    intensity: [0, 80],
    stability: [40, 90],
    keywords: ["squeaky scream", "joyful roar", "mouth wide open in wonder", "high-pitched cheer"],
    negative: true
  },
  "Pathetic & Weak": {
    subjects: ["Scrawny Goblin", "Shivering Ghost", "Broken Automaton", "Wet Rat", "Withered Sprout", "Cracked Porcelain Doll", "Rusty Gear", "Fading Echo", "Limp Sock Puppet", "Trembling Mouse", "Dusty Ragdoll", "Empty Shell", "Solitary Pebble", "Forgotten Toy", "Fragile Glass Bird", "Moulting Crow"],
    styles: ["Sketchy charcoal", "Depressing realism", "Rough pencil drawing", "Grungy watercolor", "Desaturated oil painting", "Minimalist ink wash", "Dystopian bleak art", "Fragile line art"],
    pitch: [0, 100],
    intensity: [0, 30],
    stability: [0, 30],
    keywords: ["feeble wail", "trembling sob", "unstable shriek", "cracking voice", "silent scream of despair"],
    negative: true
  },
  "Cyberpunk & Action": {
    subjects: ["Chrome Samurai", "Neon Cyborg", "Glitch Stalker", "Data Daemon", "Mech Pilot", "Android Rebel", "Laser Beast", "Circuit Wyvern", "Holographic Assassin", "Silicon Wraith", "Binary Titan", "Neural Network Entity", "Plasma Vanguard", "Electric Reaper", "Synthetic Valkyrie", "Vector Dragon"],
    styles: ["Synthwave digital art", "High-tech concept art", "Unreal Engine 5 render", "Cyberpunk aesthetic", "Hard surface modeling", "Neon-drenched noir", "Futuristic propaganda poster", "Ray-traced cinematic lighting"],
    pitch: [30, 90],
    intensity: [40, 100],
    stability: [50, 100],
    keywords: ["mechanical roar", "digital scream", "processed war cry", "energy-pulsing shout", "overclocked vocalization"],
    negative: true
  },
  "Eldritch Horror": {
    subjects: ["Many-eyed Beholder", "Tentacled Void", "Flesh-stitcher", "Shoggoth", "Reality Fracture", "Screaming Abyss", "Unspeakable One", "Cosmic Horror", "Amorphous Mass", "Void-Hearted King", "Thousand-Mouthed Beast", "Lurker in the Stars", "Fractal Mutation", "Shadow from Beyond", "Ancient Gatekeeper", "Hive Mind Core"],
    styles: ["Lovecraftian dark art", "Beksiński-inspired surrealism", "Grotesque body horror", "Abyssal oil painting", "Macabre fine art", "Twisted anatomical study", "Nightmarish digital matte", "Eerie cosmic horror style"],
    pitch: [0, 100],
    intensity: [60, 100],
    stability: [0, 40],
    keywords: ["unearthly screech", "chaotic howl", "mind-shattering roar", "discordant scream", "reality-tearing wail"],
    negative: true
  },
  "Mythological Deities": {
    subjects: ["Zeus-like Titan", "Valkyrie Queen", "Anubis Guardian", "Jörmungandr", "Solar Deity", "Frost Giant", "Celestial Emperor", "Phoenix Lord", "Oceanic Leviathan", "Thunder God", "Earth Mother", "Star-Forged Hero", "Golden Sphinx", "Dragon Eternal", "Seraphim Warrior", "Olympian Master"],
    styles: ["Epic Renaissance painting", "Marble sculpture aesthetic", "Golden ratio composition", "Classical mythology art", "Majestic oil on canvas", "Heroic bronze statue look", "Divine light rendering", "Baroque masterpiece"],
    pitch: [0, 60],
    intensity: [70, 100],
    stability: [60, 100],
    keywords: ["booming roar", "god-like shout", "thunderous command", "eternal scream of power", "resonant celestial bellow"],
    negative: true
  },
  "90s Anime Style": {
    subjects: ["Mecha Pilot", "Magical Girl", "Ninja Assassin", "Space Pirate", "Vampire Hunter", "Cyber-cop", "Psychic Teenager", "Demon Swordsman", "Alien Prince", "School Delinquent", "Robot Companion", "Street Fighter", "Galaxy Explorer", "Spirit Medium", "Gunslinger", "Mecha Suit"],
    styles: ["Hand-drawn cel animation", "Retro 90s anime style", "Akira-inspired aesthetic", "Neon Genesis vibes", "Cowboy Bebop gritty style", "Classic OVA look", "Vibrant cel-shading", "Detailed retro manga art"],
    pitch: [0, 100],
    intensity: [0, 100],
    stability: [0, 100],
    keywords: ["heroic scream", "dramatic anime yell", "power-up roar", "angst-filled shout", "signature move cry"],
    negative: false
  },
  "Hyper-realistic": {
    subjects: ["Human Soldier", "African Lion", "Old Grizzled Man", "Viking Berserker", "Opera Soprano", "Primal Shaman", "Tundra Caveman", "Highland Warrior", "Tribal Elder", "Deep Sea Diver", "Mountain Hermit", "Wounded Gladiator", "Desperate Survivor", "Enraged Blacksmith", "Nomadic Hunter", "Venerable Sage"],
    styles: ["National Geographic photography", "Cinematic 8k photo", "High-shutter speed action shot", "Raw portrait photography", "Documentary style", "Kodak Portra 400 aesthetic", "Ultra-detailed skin textures", "Authentic historical realism"],
    pitch: [0, 100],
    intensity: [0, 100],
    stability: [0, 100],
    keywords: ["visceral human scream", "animalistic roar", "raw guttural shout", "pain-filled wail", "intense vocal expression"],
    negative: true
  }
};

const NEGATIVE_SUFFIX = " --no pokemon, cartoon, anime, chibi, childish, flat colors";

const analysisTemplates = {
  en: [
    "A {adj} {sub} {action} in a {cat} style, capturing the essence of {int} intensity.",
    "This {sub} manifests a {int} scream, its form vibrating with {stab} stability.",
    "A powerful depiction of a {sub}, where the {pitch} pitch meets the raw energy of {cat}."
  ],
  sv: [
    "En {adj} {sub} som {action} i {cat}-stil, fångar essensen av en {int} intensitet.",
    "Denna {sub} manifesterar ett {int} skrik, dess form vibrerar med {stab} stabilitet.",
    "En kraftfull avbildning av en {sub}, där den {pitch} tonhöjden möter den råa energin från {cat}."
  ]
};

const adjectives = ["Radiant", "Gloom-ridden", "Ancient", "Pulsating", "Eternal", "Fractured", "Divine", "Submerged", "Relentless", "Silent", "Shattered", "Ascendant"];

function generateThemes(): ScreamFigure[] {
  const themes: ScreamFigure[] = [];
  const categories = Object.keys(CATEGORY_DATA) as (keyof typeof CATEGORY_DATA)[];

  // We need at least 1000. 1000 / 7 categories ≈ 143 per category.
  // We have 16 subjects and 8 styles per category = 128 combinations.
  // Adding variations in pitch/intensity/adjectives to reach 150+ per category.

  categories.forEach((catName) => {
    const data = CATEGORY_DATA[catName];
    let count = 0;

    for (let sIdx = 0; sIdx < data.subjects.length; sIdx++) {
      for (let stIdx = 0; stIdx < data.styles.length; stIdx++) {
        for (let v = 0; v < 2; v++) { // Two variations per combination
          if (themes.length >= 1050) break;

          const subject = data.subjects[sIdx];
          const style = data.styles[stIdx];
          const adj = adjectives[(sIdx + stIdx + v) % adjectives.length];
          const keyword = data.keywords[(sIdx + v) % data.keywords.length];

          // Random-ish but deterministic ranges
          const minI = data.intensity[0] + (v * 5);
          const maxI = data.intensity[1];
          const minP = data.pitch[0] + (v * 2);
          const maxP = data.pitch[1];
          const minS = data.stability[0] + (v * 3);

          const title = `${adj} ${subject} (${catName} #${++count})`;
          const prompt = `Masterpiece, 8k, highly detailed, ${style}. A ${adj.toLowerCase()} ${subject} ${keyword}, wide open mouth, intense expression. Themes of ${catName.toLowerCase()}. Cinematic lighting.${data.negative ? NEGATIVE_SUFFIX : ""}`;

          const pitchDesc = minP > 60 ? "high" : (minP < 30 ? "deep" : "mid-range");
          const stabDesc = minS > 60 ? "high" : (minS < 30 ? "unstable" : "moderate");
          const intDesc = minI > 70 ? "massive" : (minI < 30 ? "subtle" : "strong");

          const analysisEn = analysisTemplates.en[v % 3]
            .replace("{adj}", adj.toLowerCase())
            .replace("{sub}", subject.toLowerCase())
            .replace("{action}", keyword)
            .replace("{cat}", catName.toLowerCase())
            .replace("{int}", intDesc)
            .replace("{stab}", stabDesc)
            .replace("{pitch}", pitchDesc);

          const swedishCat = catName === "90s Anime Style" ? "90-tals anime" : catName.toLowerCase();
          const analysisSv = analysisTemplates.sv[v % 3]
            .replace("{adj}", adj.toLowerCase())
            .replace("{sub}", subject.toLowerCase())
            .replace("{action}", keyword)
            .replace("{cat}", swedishCat)
            .replace("{int}", intDesc === "massive" ? "massiv" : (intDesc === "subtle" ? "subtil" : "stark"))
            .replace("{stab}", stabDesc === "high" ? "hög" : (stabDesc === "unstable" ? "ostabil" : "måttlig"))
            .replace("{pitch}", pitchDesc === "high" ? "hög" : (pitchDesc === "deep" ? "djup" : "mellanregister"));

          themes.push({
            category: catName,
            minIntensity: minI,
            maxIntensity: maxI,
            minPitch: minP,
            maxPitch: maxP,
            minStability: minS,
            title,
            characterType: subject,
            characterStyle: style,
            prompt,
            analysisEn,
            analysisSv
          });
        }
      }
    }
  });

  return themes;
}

/**
 * FALLBACK_THEMES_1000: A massive collection of 1000+ unique Scream Figure objects.
 * Categorized and generated for maximum diversity in pitch, intensity, and style.
 */
export const FALLBACK_THEMES_1000: ScreamFigure[] = generateThemes();
