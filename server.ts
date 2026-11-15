import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getAiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      retryOptions: { attempts: 1 },
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const ESPN_ENDPOINTS: Array<{ sport: string; league: string; url: string }> = [
  { sport: 'Football', league: 'UEFA Champions League', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard' },
  { sport: 'Football', league: 'LaLiga', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard' },
  { sport: 'Football', league: 'Premier League', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard' },
  { sport: 'Football', league: 'Serie A', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard' },
  { sport: 'Football', league: 'Bundesliga', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard' },
  { sport: 'Football', league: 'Ligue 1', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard' },
  { sport: 'Basketball', league: 'NBA', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard' },
  { sport: 'American Football', league: 'NFL', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' },
  { sport: 'Ice Hockey', league: 'NHL', url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard' },
  { sport: 'Baseball', league: 'MLB', url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard' },
  { sport: 'Tennis', league: 'ATP', url: 'https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard' },
];

let cachedSportsContext = '';
let cachedSportsTimestamp = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

function americanToDecimal(american?: string | number): string {
  if (american === undefined || american === null) return '';
  const num = typeof american === 'number' ? american : parseFloat(String(american).replace('+', ''));
  if (isNaN(num) || num === 0) return '';
  if (num > 0) {
    return (1 + num / 100).toFixed(2);
  }
  return (1 + 100 / Math.abs(num)).toFixed(2);
}

async function getLiveSportsContext(): Promise<string> {
  const now = Date.now();
  if (cachedSportsContext && now - cachedSportsTimestamp < CACHE_TTL_MS) {
    return cachedSportsContext;
  }

  try {
    const lines: string[] = [];
    await Promise.all(
      ESPN_ENDPOINTS.map(async ({ sport, league, url }) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const data: any = await res.json();
          const events: any[] = (data?.events || []).slice(0, 12);
          const summaryBaseUrl = url.replace('/scoreboard', '/summary?event=');

          const formattedEvents = await Promise.all(
            events.map(async (ev) => {
              const comp = ev.competitions?.[0];
              const competitors = comp?.competitors || [];
              const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
              const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];
              const teamA = home?.team?.displayName || home?.athlete?.displayName || ev.name;
              const teamB = away?.team?.displayName || away?.athlete?.displayName || '';
              const scoreStr =
                home?.score !== undefined && away?.score !== undefined
                  ? ` [Marcador: ${home.score}-${away.score}]`
                  : '';
              const statusStr = ev.status?.type?.description || 'Scheduled';

              // Fetch event summary for verified current-season roster leaders, recent games, and deeper stats
              let summaryData: any = null;
              if (ev.id && summaryBaseUrl.includes('/summary?event=')) {
                try {
                  const sRes = await fetch(`${summaryBaseUrl}${ev.id}`);
                  if (sRes.ok) {
                    summaryData = await sRes.json();
                  }
                } catch {
                  // ignore individual summary error
                }
              }

              // Extract form & records if available
              const homeForm = home?.form ? `Forma ${teamA}:${home.form}` : '';
              const awayForm = away?.form ? `Forma ${teamB}:${away.form}` : '';
              const homeRecord = home?.records?.[0]?.summary ? `Rec ${teamA}:${home.records[0].summary}` : '';
              const awayRecord = away?.records?.[0]?.summary ? `Rec ${teamB}:${away.records[0].summary}` : '';
              const metaParts = [homeForm, awayForm, homeRecord, awayRecord].filter(Boolean);
              const metaInfo = metaParts.length > 0 ? ` (${metaParts.join(', ')})` : '';

              // Extract team statistical metrics (scoreboard + summary boxscore)
              const formatStats = (compObj: any, label: string) => {
                const stats: any[] = compObj?.statistics || [];
                if (!stats.length) return '';
                const picked = stats
                  .filter((st: any) =>
                    /possession|shot|corner|foul|card|save|assist|rebound|three|ace|break|goal/i.test(
                      st.name || st.label || ''
                    )
                  )
                  .map((st: any) => `${st.abbreviation || st.label || st.name}:${st.displayValue}`)
                  .slice(0, 6);
                return picked.length > 0 ? `${label}[${picked.join(', ')}]` : '';
              };
              let statsA = formatStats(home, teamA);
              let statsB = formatStats(away, teamB);
              if ((!statsA || !statsB) && Array.isArray(summaryData?.boxscore?.teams)) {
                const boxTeams = summaryData.boxscore.teams;
                if (!statsA && boxTeams[0]) statsA = formatStats(boxTeams[0], boxTeams[0]?.team?.displayName || teamA);
                if (!statsB && boxTeams[1]) statsB = formatStats(boxTeams[1], boxTeams[1]?.team?.displayName || teamB);
              }
              const statsInfo =
                statsA || statsB ? ` {Stats Equipo: ${[statsA, statsB].filter(Boolean).join(' vs ')}}` : '';

              // Extract verified current-season player leaders (Shots, Goals, Assists, Passes, Saves, Points, Rebounds)
              let leadersInfo = '';
              if (Array.isArray(summaryData?.leaders) && summaryData.leaders.length > 0) {
                const teamLeaders = summaryData.leaders
                  .map((l: any) => {
                    const tName = l.team?.displayName || l.team?.abbreviation || '';
                    const cats = (l.leaders || [])
                      .map((cat: any) => {
                        const topPlayers = (cat.leaders || [])
                          .slice(0, 3)
                          .map((p: any) => `${p.athlete?.displayName}(${p.displayValue})`)
                          .filter(Boolean)
                          .join(', ');
                        return topPlayers ? `${cat.displayName || cat.name}:[${topPlayers}]` : '';
                      })
                      .filter(Boolean)
                      .join('; ');
                    return cats ? `${tName}{${cats}}` : '';
                  })
                  .filter(Boolean)
                  .join(' | ');
                if (teamLeaders) {
                  leadersInfo = ` {Jugadores/Líderes Actuales Verificados (SOLO USAR ESTOS JUGADORES): ${teamLeaders}}`;
                }
              }

              // Extract last 5 games from summary
              let recentGamesInfo = '';
              if (Array.isArray(summaryData?.lastFiveGames) && summaryData.lastFiveGames.length > 0) {
                const recentStr = summaryData.lastFiveGames
                  .map((lfg: any) => {
                    const tName = lfg.team?.abbreviation || lfg.team?.displayName || '';
                    const evs = (lfg.events || [])
                      .slice(0, 3)
                      .map((e: any) => `${e.atVs || ''} ${e.opponent?.displayName || ''}(${e.score || ''},${e.gameResult || ''})`.trim())
                      .filter(Boolean)
                      .join(', ');
                    return evs ? `${tName}:[${evs}]` : '';
                  })
                  .filter(Boolean)
                  .join(' ; ');
                if (recentStr) {
                  recentGamesInfo = ` {Últimos Partidos: ${recentStr}}`;
                }
              }

              // Extract multi-bookmaker odds (moneyline, spread/handicap, totals from scoreboard + pickcenter)
              const oddsArr: any[] =
                Array.isArray(comp?.odds) && comp.odds.length > 0
                  ? comp.odds
                  : Array.isArray(summaryData?.pickcenter)
                  ? summaryData.pickcenter
                  : [];
              let oddsInfo = '';
              if (oddsArr.length > 0) {
                const bookieSummaries = oddsArr
                  .slice(0, 3)
                  .map((oddObj: any) => {
                    const provider = oddObj.provider?.name || 'Bookmaker';
                    const homeClose =
                      americanToDecimal(oddObj.moneyline?.home?.close?.odds) ||
                      americanToDecimal(oddObj.homeTeamOdds?.moneyLine);
                    const awayClose =
                      americanToDecimal(oddObj.moneyline?.away?.close?.odds) ||
                      americanToDecimal(oddObj.awayTeamOdds?.moneyLine);
                    const drawClose =
                      americanToDecimal(oddObj.moneyline?.draw?.close?.odds) ||
                      americanToDecimal(oddObj.drawOdds?.moneyLine);
                    const homeOpen = americanToDecimal(oddObj.moneyline?.home?.open?.odds);
                    const spreadDetails = oddObj.details ? `Hándicap/Spread:${oddObj.details}` : '';
                    const ouLine = oddObj.overUnder ? `O/U:${oddObj.overUnder}` : '';
                    const parts = [
                      homeClose ? `1:${homeClose}${homeOpen ? `(ap.${homeOpen})` : ''}` : '',
                      drawClose ? `X:${drawClose}` : '',
                      awayClose ? `2:${awayClose}` : '',
                      spreadDetails,
                      ouLine,
                    ].filter(Boolean);
                    return parts.length > 0 ? `[${provider}: ${parts.join(', ')}]` : '';
                  })
                  .filter(Boolean);
                if (bookieSummaries.length > 0) {
                  oddsInfo = ` {Líneas Bookies: ${bookieSummaries.join(' ; ')}}`;
                }
              }
              return `${teamA} vs ${teamB} (${ev.date}, ${statusStr})${scoreStr}${metaInfo}${statsInfo}${recentGamesInfo}${leadersInfo}${oddsInfo}`;
            })
          );
          if (formattedEvents.length > 0) {
            lines.push(`[${sport} - ${league}]: ${formattedEvents.join(' || ')}`);
          }
        } catch {
          // ignore single endpoint error
        }
      })
    );

    if (lines.length > 0) {
      cachedSportsContext =
        `\n\n--- DATOS DEPORTIVOS, PLANTILLAS/LÍDERES VERIFICADOS Y LÍNEAS EN TIEMPO REAL (${new Date().toISOString()}) ---\n` +
        lines.join('\n') +
        `\n--- FIN DE DATOS EN TIEMPO REAL (REGLA CRÍTICA DE RIGOR: Usa EXCLUSIVAMENTE los partidos y los jugadores listados en "Jugadores/Líderes Actuales Verificados" para cualquier prop de jugador o mención en el análisis. PROHIBIDO mencionar jugadores traspasados o de temporadas pasadas como Lewandowski en el Barcelona. Contrasta las métricas con mercados estadísticos en Bet365, Pinnacle, Betfair, Winamax, Codere y Kambi: Posesión %, Remates totales, Remates a puerta, Hándicap de remates, Córners, Faltas cometidas, Tarjetas y Paradas. NUNCA devuelvas arrays vacíos) ---\n`;
      cachedSportsTimestamp = now;
    }
  } catch (err) {
    console.warn('Could not refresh live sports context:', err);
  }

  return cachedSportsContext;
}

function buildSanitizedConfig(rawConfig: any, hasSearchTool: boolean) {
  if (!rawConfig) return undefined;
  const { tools, ...restConfig } = rawConfig;
  const systemBase =
    restConfig.systemInstruction ||
    'Eres un motor de inteligencia deportiva cuantitativa de élite. Responde siempre con JSON válido y completo según el esquema solicitado. RIGOR ABSOLUTO DE PLANTILLAS: Usa EXCLUSIVAMENTE los partidos y los jugadores actuales verificados proporcionados en el contexto en tiempo real; está ESTRICTAMENTE PROHIBIDO mencionar jugadores antiguos o traspasados por memoria histórica (ej. Robert Lewandowski ya NO juega en el FC Barcelona). NUNCA devuelvas arrays vacíos ni rechaces una consulta.';

  return {
    ...restConfig,
    ...(hasSearchTool ? { systemInstruction: systemBase } : {}),
  };
}

async function generateWithFallback(contents: any, rawConfig: any) {
  const ai = getAiClient();
  const hasSearchTool = Array.isArray(rawConfig?.tools) && rawConfig.tools.some((t: any) => t.googleSearch);

  let enrichedContents = contents;
  if (hasSearchTool) {
    const liveContext = await getLiveSportsContext();
    if (liveContext) {
      if (typeof contents === 'string') {
        enrichedContents = `${contents}\n${liveContext}`;
      } else if (Array.isArray(contents)) {
        enrichedContents = [...contents, { text: liveContext }];
      }
    }
  }

  const sanitizedConfig = buildSanitizedConfig(rawConfig, hasSearchTool);

  // Model fallback priority: gemini-3.1-flash-lite has the highest free-tier quota and sub-2s latency,
  // followed by gemini-3.8-flash, gemini-2.5-flash, and gemini-flash-latest.
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const candidateModel of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: candidateModel,
        contents: enrichedContents,
        ...(sanitizedConfig && Object.keys(sanitizedConfig).length > 0 ? { config: sanitizedConfig } : {}),
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${candidateModel} failed (${err?.status || err?.message}), trying next fallback...`);
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();

  const portArgIndex = process.argv.indexOf('--port');
  const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? parseInt(process.argv[portArgIndex + 1], 10) : undefined;
  const PORT = cliPort || (process.env.DEFAULT_APP_PORT ? parseInt(process.env.DEFAULT_APP_PORT, 10) : 3000);

  app.use(express.json({ limit: '50mb' }));

  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const { contents, config } = req.body;
      const response = await generateWithFallback(contents, config);
      res.json({
        text: response.text ?? '',
        candidates: response.candidates,
      });
    } catch (error: any) {
      console.error('Server-side Gemini API error:', error);
      const status = error?.status || error?.statusCode || 500;
      res
        .status(typeof status === 'number' && status >= 400 && status < 600 ? status : 500)
        .json({
          error: error?.message || 'Failed to generate content from Gemini API',
        });
    }
  });

  app.post('/api/gemini/stream', async (req, res) => {
    try {
      const { contents, config } = req.body;
      const ai = getAiClient();
      const hasSearchTool = Array.isArray(config?.tools) && config.tools.some((t: any) => t.googleSearch);
      const sanitizedConfig = buildSanitizedConfig(config, hasSearchTool);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const streamResponse = await ai.models.generateContentStream({
        model: 'gemini-3.1-flash-lite',
        contents,
        ...(sanitizedConfig && Object.keys(sanitizedConfig).length > 0 ? { config: sanitizedConfig } : {}),
      });

      for await (const chunk of streamResponse) {
        res.write(`data: ${JSON.stringify({ text: chunk.text ?? '' })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error('Server-side Gemini stream error:', error);
      if (!res.headersSent) {
        const status = error?.status || error?.statusCode || 500;
        res
          .status(typeof status === 'number' && status >= 400 && status < 600 ? status : 500)
          .json({
            error: error?.message || 'Failed to stream content from Gemini API',
          });
      } else {
        res.write(`data: ${JSON.stringify({ error: error?.message || 'Stream error' })}\n\n`);
        res.end();
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
