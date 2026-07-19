# Plan: Hybrid-inloggning (Firebase), Molnlagring och Bildnedladdning

Vi ska bygga ett system som tillåter anonym användning men uppmuntrar till inloggning för att säkra sina skrik i molnet. Vi lägger även till möjligheten att spara bilderna till enhetens galleri.

## Proposed Changes

### 1. Firebase Konfiguration
- **[NEW] [firebase.ts](file:///C:/Users/johnr/StudioProjects/FuckU/src/lib/firebase.ts)**: Initiera Firebase Auth och Firestore. Vi använder miljövariabler för konfigurationen.

### 2. Nedladdningsfunktion (Spara till galleri)
- **[NEW] [download.ts](file:///C:/Users/johnr/StudioProjects/FuckU/src/lib/download.ts)**: En hjälpfunktion som hämtar en bild via URL och triggar en nerladdning.
- **[MODIFY] [ResultScreen.tsx](file:///C:/Users/johnr/StudioProjects/FuckU/src/components/ResultScreen.tsx)**: Lägg till en "Ladda ner"-knapp (ikon) bredvid "Spara".

### 3. Hybrid-Storage System
- **[MODIFY] [storage.ts](file:///C:/Users/johnr/StudioProjects/FuckU/src/lib/storage.ts)**: Skapa en brygga:
    - `saveScream`: Sparar lokalt i IndexedDB om utloggad, i Firestore om inloggad.
    - `getAllScreams`: Slår ihop lokala skrik med molnskrik.
- **[MODIFY] [App.tsx](file:///C:/Users/johnr/StudioProjects/FuckU/src/App.tsx)**: Hantera Auth-state globalt och skicka ner användarinformation till skärmarna.

### 4. Auth-gränssnitt
- **[NEW] [AuthModal.tsx](file:///C:/Users/johnr/StudioProjects/FuckU/src/components/AuthModal.tsx)**: En modal som erbjuder inloggning med Google/Facebook. Visas när man klickar på en ny profil-ikon eller försöker dela ett monster.
- **[MODIFY] [GalleryScreen.tsx](file:///C:/Users/johnr/StudioProjects/FuckU/src/components/GalleryScreen.tsx)**: Lägg till inloggnings-status och en knapp för att synka lokala monster till molnet.

## User Review Required

> [!IMPORTANT]
> **Firebase Setup:** Du måste skapa ett projekt på [Firebase Console](https://console.firebase.google.com/), aktivera "Google" och "Facebook" under Authentication, och aktivera "Cloud Firestore".
> **Konfigurationsdata:** Jag kommer skapa en fil där du behöver klistra in dina Firebase-nycklar (liknande hur vi gjorde med Gemini).

## Verification Plan

### Manual Verification
1. Verifiera att "Ladda ner"-knappen sparar en bild till telefonen.
2. Testa att spara ett monster som gäst.
3. Logga in med Google och verifiera att nästa monster sparas i molnet (Firestore).
4. Kontrollera att utloggning tar en tillbaka till gästläge men att molnmonstren döljs.
