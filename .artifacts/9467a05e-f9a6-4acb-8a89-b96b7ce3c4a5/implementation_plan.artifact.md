# Plan: Publicera på Google Play Store

För att förvandla din webbapp till en riktig Android-app som kan laddas ner från Google Play Store använder vi ett verktyg som heter **Capacitor**. Det "paketerar" din React-hemsida till en app-behållare som kan köras på mobiler.

## Förutsättningar
- Ett **Google Play Developer Account** (kostar ca $25 som en engångsavgift till Google).
- **Android Studio** installerat på din dator.

## Proposed Changes

### 1. Installera Capacitor
Vi lägger till Capacitor i ditt projekt för att hantera kopplingen till Android.
- Installera `@capacitor/core`, `@capacitor/cli` och `@capacitor/android`.
- Initiera Capacitor med ett unikt paketnamn (t.ex. `com.johnmannen.screamapp`).

### 2. Anpassa Koden för Mobil
Vissa saker i en webbläsare fungerar annorlunda i en installerad app.
- **Backend-anrop:** Vi måste se till att appen pratar med din Vercel-länk istället för `localhost`.
- **Mobil-anpassningar:** Justera eventuella knappar eller menyer som känns "webbiga" så att de känns som en riktig app.

### 3. Byggprocessen
Vi skapar de filer som Google Play kräver.
1.  Kör `npm run build` för att skapa den senaste versionen av din webbkod.
2.  Kör `npx cap sync` för att kopiera in koden i Android-projektet.
3.  Öppna projektet i Android Studio.

### 4. Skapa en "Signed App Bundle" (AAB)
Detta görs i Android Studio:
- Skapa en digital signatur (Keystore).
- Bygg en `.aab`-fil som är det format Google Play vill ha.

### 5. Publicering i Google Play Console
- Skapa en ny app i Play Console.
- Ladda upp din `.aab`-fil.
- Fyll i beskrivning, lägg till skärmbilder och välj åldersgräns.
- Skicka in för granskning (tar oftast några dagar första gången).

## User Review Required

> [!IMPORTANT]
> **Backend-servern:** Din Express-backend (`server.ts`) kommer fortfarande att köras på Vercel. Android-appen kommer att fungera som en "klient" som ringer till Vercel för att få sina monster.
> **Google Play-avgift:** Kom ihåg att Google tar ut en engångsavgift på $25 för att få öppna ett utvecklarkonto.

## Verification Plan

### Manual Verification
- Kör appen i en Android-emulator eller på en fysisk telefon via Android Studio.
- Kontrollera att mikrofonen och inloggningen fungerar inuti app-behållaren.
- Verifiera att nerladdningsfunktionen fungerar korrekt på Android.
