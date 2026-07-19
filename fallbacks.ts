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
  Cosmic: ["Nebula", "Black Hole", "Star", "Comet", "Alien", "Planet", "Void", "Moon"],
  Nature: ["Tree", "River", "Mountain", "Ocean", "Flower", "Wolf", "Eagle", "Cave"],
  Mechanical: ["Gear", "Robot", "Clock", "Engine", "Wire", "Bolt", "Steam", "Metal"],
  Ethereal: ["Ghost", "Spirit", "Cloud", "Light", "Shadow", "Dream", "Mist", "Soul"],
  Volcanic: ["Lava", "Ash", "Fire", "Rock", "Smoke", "Crater", "Magma", "Obsidian"],
  Storm: ["Bolt", "Wind", "Rain", "Cloud", "Thunder", "Wave", "Ice", "Snow"],
  Ancient: ["Statue", "Rune", "Scroll", "Mummy", "Totem", "Coin", "Wall", "Sword"],
  Whimsical: ["Cat", "Hat", "Toy", "Candy", "Balloon", "Rainbow", "Bubble", "Box"]
};

const styles = ["Ghibli-watercolor", "Gritty dark fantasy oil", "Cyberpunk neon", "Ancient mythological engraving", "3D Octane render"];

const adjectives = {
  Low: ["Whispering", "Soft", "Faint", "Gentle", "Subtle", "Quiet", "Muted", "Delicate"],
  Mid: ["Calling", "Steady", "Echoing", "Resonant", "Vibrant", "Active", "Present", "Firm"],
  High: ["Screaming", "Piercing", "Roaring", "Shaking", "Explosive", "Intense", "Fierce", "Wild"]
};

/**
 * FALLBACK_THEMES_500: A comprehensive array of 500 unique Scream Figure objects.
 * Generated programmatically to ensure perfect distribution across intensities, durations, and themes.
 */
export const FALLBACK_THEMES_500: ScreamFigure[] = (["Low", "Mid", "High"] as const).flatMap(intensityGroup => {
  const [minI, maxI] = intensityGroup === "Low" ? [0, 30] : (intensityGroup === "Mid" ? [30, 65] : [65, 100]);
  const count = intensityGroup === "High" ? 200 : 150;
  const adjs = adjectives[intensityGroup];

  return Array.from({ length: count }).map((_, i) => {
    const theme = Object.keys(subjects)[i % 8];
    const subjectList = subjects[theme];
    const subject = subjectList[Math.floor(i / 8) % subjectList.length];
    const style = styles[i % styles.length];
    const duration = [0, 2, 5][i % 3] as 0 | 2 | 5;
    const adj = adjs[Math.floor(i / (8 * subjectList.length)) % adjs.length] || adjs[i % adjs.length];

    return {
      minIntensity: minI,
      maxIntensity: maxI,
      minDuration: duration,
      title: `${adj} ${subject}`,
      characterType: theme,
      characterStyle: style,
      prompt: `A high-quality ${style} depiction of a ${adj.toLowerCase()} ${subject.toLowerCase()} within a ${theme.toLowerCase()} environment. The figure is captured in a state of ${intensityGroup.toLowerCase()} intensity scream, with detailed textures and atmospheric lighting.`,
      analysisEn: `This ${theme.toLowerCase()} figure represents a ${intensityGroup.toLowerCase()} intensity scream, manifesting as a ${adj.toLowerCase()} ${subject.toLowerCase()}.`,
      analysisSv: `Denna ${theme.toLowerCase().replace('cosmic', 'kosmiska').replace('nature', 'naturliga').replace('mechanical', 'mekaniska').replace('ethereal', 'eteriska').replace('volcanic', 'vulkaniska').replace('storm', 'stormiga').replace('ancient', 'antika').replace('whimsical', 'nyckfulla')} figuren representerar ett skrik med ${intensityGroup.toLowerCase()} intensitet, i form av en ${adj.toLowerCase()} ${subject.toLowerCase()}.`
    };
  });
});
