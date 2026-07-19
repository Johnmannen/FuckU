# Plan: Ultimate Scream Experience - 1000+ Figurer & Videoexport

Vi ska bygga ett system som mäter skrikets minsta detalj, skapar 1000+ unika arketyp-möjligheter och tillåter användaren att spara hela upplevelsen som en video.

## Proposed Changes

### 1. Avancerad Ljud-analys (The "Scream Fingerprint")
Vi går bortom bara volym.
- **[MODIFY] [StartScreen.tsx](file:///C:/Users/johnr/StudioProjects/FuckU/src/components/StartScreen.tsx)**:
    - **Pitch Detection:** Vi analyserar om skriket är ljust (hög frekvens) eller mörkt (låg frekvens).
    - **Stability Analysis:** Mäter om rösten är "ren" eller darrig/hes (jitter/shimmer).
    - **Attack Force:** Hur snabbt skriket når sin peak (aggressivitet).

### 2. Massivt Figurbibliotek (1000+ Figurer)
Vi skapar en enorm databas som kategoriseras för att matcha ljudanalysen perfekt.
- **[MODIFY] [fallbacks.ts](file:///C:/Users/johnr/StudioProjects/FuckU/fallbacks.ts)**:
    - Utöka till **1000+ unika kombinationer**.
    - **Kategorier:**
        - *Cute & Whimsical* (Ljus pitch, låg volym)
        - *Pathetic & Weak* (Darrig röst, låg volym)
        - *Cyberpunk & Action* (Hög stabilitet, medel volym)
        - *Eldritch Horror* (Kaotisk/darrig röst, hög volym)
        - *Mythological Deities* (Dov pitch, extrem volym, lång duration)
        - *Animerat/Anime* (Speciella stiltaggar)
        - *Hyper-realistic* (Verklighetstrogna monster)

### 3. Smart Hybrid-logik
- **[MODIFY] [server.ts](file:///C:/Users/johnr/StudioProjects/FuckU/server.ts)**:
    - Prioriterar alltid **AI-generering** (Gemini 3.5 Flash) för en 100% unik bild.
    - Om API-kvoten är slut eller anropet misslyckas, hoppar systemet direkt till en av de 1000+ fördefinierade figurerna som bäst matchar det specifika ljud-fingeravtrycket.

### 4. Videoexport till Galleri (MP4)
- **[NEW] [videoExport.ts](file:///C:/Users/johnr/StudioProjects/FuckU/src/lib/videoExport.ts)**:
    - Vi bygger en funktion som filmar skärmen i realtid medan ljudet spelas upp.
    - Resultatet sparas som en videofil i telefonens galleri, komplett med mun-animationen och ljudet.

## User Review Required

> [!IMPORTANT]
> **Video-generering:** På mobiler kan det ta 5-10 sekunder att "rendera" videon efter att man klickat på knappen. Vi lägger till en tydlig laddningsmätare.
> **Databasstorlek:** Med 1000+ figurer kommer appen att växa något i storlek, men det kommer att kännas som en outtömlig källa av kreativitet.

## Verification Plan

### Manual Verification
- Verifiera att ett ljust skrik konsekvent ger "gulliga" eller "eteriska" resultat.
- Verifiera att ett mörkt vrål ger "gudar" eller "monumentala" figurer.
- Ladda ner en video och dela den till en annan app för att se att både bild, rörelse och ljud följer med.
