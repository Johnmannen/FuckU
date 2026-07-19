# App redo för Vercel

Jag har nu förberett din applikation för att kunna deployas direkt på Vercel.

## Ändringar som utförts

### Backend (Serverless)
- **[NEW] [api/index.ts](file:///C:/Users/johnr/StudioProjects/FuckU/api/index.ts)**: Skapat en entry-point för Vercels serverlösa funktioner. Denna fil importerar din Express-app och gör den tillgänglig för Vercel.
- **[MODIFY] [server.ts](file:///C:/Users/johnr/StudioProjects/FuckU/server.ts)**: Justerat server-koden så att den exporterar appen (`export default app`). Den startar nu bara den lokala servern om den inte körs i en Vercel-miljö.

### Konfiguration
- **[NEW] [vercel.json](file:///C:/Users/johnr/StudioProjects/FuckU/vercel.json)**: Lagt till en konfigurationsfil som mappar alla anrop till `/api/*` till din backend, medan resten av trafiken går till din frontend (React).

## Nästa steg

För att få ut appen på nätet behöver du göra följande:

1.  **Spara och skicka till GitHub:**
    Kör följande kommandon i din terminal (eller använd Git-verktygen i Android Studio):
    ```bash
    git add .
    git commit -m "Prepare for Vercel deployment"
    git push origin main
    ```

2.  **Importera i Vercel:**
    - Gå till [vercel.com](https://vercel.com).
    - Klicka på **"Add New"** > **"Project"**.
    - Välj ditt repository `FuckU`.
    - Vercel kommer automatiskt att upptäcka att det är ett Vite-projekt.

3.  **Lägg till API-nyckel:**
    - Innan du klickar på "Deploy", expandera **"Environment Variables"**.
    - Lägg till `GEMINI_API_KEY` med din nyckel från AI Studio.

4.  **Deploy!**
    - Klicka på **Deploy**. När det är klart får du en länk som du kan öppna i din telefon.

> [!TIP]
> Om du vill testa i telefonen *utan* att pusha till GitHub, kan du fortfarande använda din lokala IP (`http://192.168.8.62:3000`) om båda enheterna är på samma Wi-Fi.
