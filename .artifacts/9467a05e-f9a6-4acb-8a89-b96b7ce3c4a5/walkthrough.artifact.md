# Förberedd för Google Play Store (Android)

Jag har nu installerat och konfigurerat **Capacitor**, vilket gör att du kan köra din FuckU-app som en riktig Android-app.

## Vad som har gjorts

### 1. Capacitor-installation
- Installerat `@capacitor/core`, `@capacitor/cli` och `@capacitor/android`.
- Skapat en `capacitor.config.ts` med paket-ID: `com.johnmannen.screamapp`.

### 2. Android-plattform
- Skapat mappen `android/` som innehåller det färdiga Android Studio-projektet.
- Uppdaterat `AndroidManifest.xml` med nödvändiga rättigheter:
    - **RECORD_AUDIO**: För att kunna spela in dina skrik.
    - **INTERNET**: För att prata med Gemini AI på Vercel.
    - **STORAGE**: För att kunna ladda ner dina monsterbilder till galleriet.

### 3. Mobil-anpassad API-logik
- Skapat `src/lib/api.ts` som automatiskt väljer rätt URL.
- När appen körs i din telefon kommer den nu att anropa din Vercel-server istället för att försöka hitta en lokal server inuti mobilen.

## Så här testar du appen nu

1.  **Öppna Android Studio:**
    Kör kommandot: `npx cap open android` (eller klicka på "Open" i Android Studio-menyn och välj mappen `android`).
2.  **Kör på telefonen:**
    Koppla in din Android-telefon med USB och klicka på den gröna "Play"-knappen i Android Studio.
3.  **Synka ändringar:**
    Om du ändrar något i din React-kod, kör följande för att uppdatera appen:
    ```bash
    npm run build
    npx cap sync
    ```

> [!IMPORTANT]
> **Vercel URL:** Just nu pekar mobilappen på en exempel-URL (`fucku-six.vercel.app`). Du bör lägga till din riktiga länk i `.env.local` som `VITE_API_BASE_URL=din-riktiga-länk.vercel.app` och köra en ny build för att det ska fungera på din telefon.

## Nästa steg för Google Play
- **Ikoner:** Du bör byta ut standard-ikonerna i `android/app/src/main/res/`.
- **Signed Bundle:** När du är nöjd, välj **Build > Generate Signed Bundle / APK** i Android Studio för att skapa filen till Google Play Console.
