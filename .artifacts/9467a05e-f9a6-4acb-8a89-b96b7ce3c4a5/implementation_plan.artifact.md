# Plan för publicering på Vercel

Vi ska förbereda appen så att den kan köras på Vercel. Eftersom appen har både en frontend (React/Vite) och en backend (Express), behöver vi konfigurera Vercel att hantera båda.

## Proposed Changes

### Backend-anpassning
Vi flyttar API-logiken till en struktur som Vercel förstår (Serverless Functions).

#### [NEW] [index.ts](file:///C:/Users/johnr/StudioProjects/FuckU/api/index.ts)
Vi skapar en ny fil i en `api/`-mapp som exporterar Express-appen. Vercel kommer automatiskt att upptäcka denna och köra den som en serverlös funktion.

#### [MODIFY] [server.ts](file:///C:/Users/johnr/StudioProjects/FuckU/server.ts)
Vi justerar den befintliga servern så att den kan användas både lokalt och exporteras för Vercel.

#### [NEW] [vercel.json](file:///C:/Users/johnr/StudioProjects/FuckU/vercel.json)
Vi lägger till en konfigurationsfil som talar om för Vercel att alla anrop till `/api/*` ska gå till vår backend-funktion, och resten till vår frontend.

## User Review Required

> [!IMPORTANT]
> **Miljövariabler:** Du måste lägga till din `GEMINI_API_KEY` i Vercels kontrollpanel (Dashboard) under **Settings > Environment Variables** för att AI-analysen ska fungera på den publika länken.

## Verification Plan

### Automated Tests
1. Kontrollera att `npm run build` fortfarande fungerar lokalt.
2. Verifiera att API-logiken är intakt i den nya filen.

### Manual Verification
1. När vi har skickat upp koden till GitHub, kan du gå till Vercel, välja ditt repository `Johnmannen/FuckU` och klicka på **Deploy**.
2. Efter deployment, testa att spela in ett skrik via den nya länken.
