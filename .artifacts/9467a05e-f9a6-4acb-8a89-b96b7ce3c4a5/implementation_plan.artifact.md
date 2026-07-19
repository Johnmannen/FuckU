# Plan: "Organic Scream" Animation & Clean Social Cards

Vi ska ersätta den mekaniska "delade" bilden med en organisk, stretchig animation som känns levande, samt rensa upp i gränssnittet så att konsten får ta plats.

## Proposed Changes

### 1. Från "Split-Jaw" till "Organic Warp" (Animation)
Istället för att klippa bilden i två delar använder vi en avancerad SVG-förskjutningskarta (Displacement Map).
- **[MODIFY] [ResultScreen.tsx](file:///C:/Users/johnr/StudioProjects/FuckU/src/components/ResultScreen.tsx)**:
    - Ta bort `clip-path` och de två separata bild-lagren.
    - Lägg till ett inbyggt SVG-filter (`#screamWarp`) som använder `feTurbulence` och `feDisplacementMap`.
    - **Effekt:** När volymen ökar kommer bilden att stretchas och "flyta" organiskt nedåt från mitten, vilket ger en elastisk känsla i ansiktet/munnen.
    - Koppla `scale`-attributet i filtret direkt till `playbackVolume`.

### 2. UI-Layout: "Art First"
- **[MODIFY] [ResultScreen.tsx](file:///C:/Users/johnr/StudioProjects/FuckU/src/components/ResultScreen.tsx)**:
    - Flytta bort analys-texten helt från bildens yta.
    - Placera texten i en snygg "infobricka" mellan bilden och dashboarden.
    - Detta säkerställer att ingenting döljer monsterbilden.

### 3. Premium "Monster Cards" vid Nerladdning
Vi uppgraderar samlarkorten så att de blir ännu snyggare för sociala medier.
- **[MODIFY] [download.ts](file:///C:/Users/johnr/StudioProjects/FuckU/src/lib/download.ts)**:
    - Uppdatera layouten: Hela monsterbilden visas ostörd längst upp.
    - All text och statistik (Pitch, Intensity, Analysis) placeras på en designad yta under bilden.
    - Lägg till en mörk, elegant ram runt hela kortet.

### 4. Videoexport Synkronisering
- **[MODIFY] [videoExport.ts](file:///C:/Users/johnr/StudioProjects/FuckU/src/lib/videoExport.ts)**:
    - Uppdatera video-renderingens canvas så att den använder samma organiska stretch-logik som visas i appen.

## User Review Required

> [!IMPORTANT]
> **Animationen:** Den nya tekniken ("Warping") kommer att få bilden att se ut som om den är gjord av gummi eller vätska som reagerar på ljudet. Det ser betydligt mer naturligt ut än den tidigare "klipp-och-klistra"-metoden.
> **Sociala Medier:** Det nya formatet på samlarkortet är optimerat för att se professionellt ut när det delas på Instagram-stories eller som ett inlägg.

## Verification Plan

### Manual Verification
- Spela upp ett skrik: Verifiera att bilden "stretchar" organiskt istället för att delas.
- Ladda ner monsterkort: Kontrollera att bilden är helt ren från text och att all info ligger snyggt undertill.
- Verifiera att inga grafiska glitchar uppstår på mobilen vid den nya animationen.
