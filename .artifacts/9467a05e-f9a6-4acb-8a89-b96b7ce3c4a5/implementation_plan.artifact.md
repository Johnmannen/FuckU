# Plan: "Monster Cards" & Realistisk Skrik-animation

Vi ska lösa problemet med text som döljer bilden genom att skapa ett "Monster Card"-format vid nerladdning, samt uppgradera animationen så att figuren faktiskt ser ut att öppna munnen.

## Proposed Changes

### 1. Förbättrad Skrik-animation ("Split-Jaw")
Istället för att stretcha hela bilden, delar vi upp den i två delar: en fast överdel och en rörlig underdel (käken).
- **[MODIFY] [ResultScreen.tsx](file:///C:/Users/johnr/StudioProjects/FuckU/src/components/ResultScreen.tsx)**:
    - Implementera två bild-lager med `clip-path`.
    - Övre halvan (0-50%) förblir stationär.
    - Undre halvan (50-100%) rör sig nedåt baserat på `playbackVolume`.
    - Detta skapar en dramatisk och realistisk "munöppning".

### 2. UI-Layout: Separera Text från Bild
- **[MODIFY] [ResultScreen.tsx](file:///C:/Users/johnr/StudioProjects/FuckU/src/components/ResultScreen.tsx)**:
    - Flytta `emotion-analysis-box` från att ligga *på* bilden till att ligga i en egen sektion direkt *under* bilden.
    - Detta gör att hela bilden syns tydligt i appen.

### 3. "Monster Card" vid Nerladdning (Social Media Optimized)
För att det ska se proffsigt ut när man delar på sociala medier bygger vi en funktion som skapar ett högupplöst "samlarkort".
- **[MODIFY] [download.ts](file:///C:/Users/johnr/StudioProjects/FuckU/src/lib/download.ts)**:
    - Skapa en funktion som ritar upp en canvas i ett optimerat format (t.ex. 1080x1350 px).
    - **Layout:** Monster-bilden överst, följt av en sektion med statistik (Intensitet, Pitch etc.) presenterat med snygga ikoner, och analysen i botten.
    - **Design:** Vi lägger till en mörk gradient-bakgrund, snygg typografi och en liten diskret logotyp ("Screamed with FuckU") för att öka igenkänningen vid delning.
    - **Kvalitet:** Använd högsta möjliga upplösning så att texten inte blir pixlig på Instagram/Facebook.

### 4. Videoexport Uppdatering
- **[MODIFY] [videoExport.ts](file:///C:/Users/johnr/StudioProjects/FuckU/src/lib/videoExport.ts)**:
    - Uppdatera canvas-logiken till att använda "Split-Jaw"-tekniken även i videon för att matcha upplevelsen i appen.

## User Review Required

> [!IMPORTANT]
> **Animationen:** Eftersom vi inte vet exakt var munnen är på bilden delar vi den på mitten (50%). Det fungerar bäst om figuren är hyfsat centrerad.
> **Kort-formatet:** Den sparade bilden kommer nu se ut som ett samlarkort snarare än bara den råa kvadratiska bilden.

## Verification Plan

### Manual Verification
- Spela upp ett skrik: Kontrollera att bilden delar sig och "öppnar munnen".
- Ladda ner bild: Verifiera att den sparade filen innehåller både bild, stats och text på ett snyggt sätt.
- Ladda ner video: Kontrollera att munöppningen ser likadan ut i videon.
