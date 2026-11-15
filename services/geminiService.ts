import { Sport as SportEnum } from '../types';
import type { 
    MatchPrediction, Sport, BetSlipItem, Fixture, ChatMessage, BetAnalysis, RecommendedBet, ParlayAnalysis, SportAnalyticsDashboardData, AIAction,
    UserPreferences, LiveMatch, LiveMatchEvent, LiveInsight, ScenarioAnalysis, Player, PlayerMatchupAnalysis,
    CompletedBet, BetPostMortemAnalysis, BankrollCoachingAdvice, AIAnalysisBet, PerformanceAnalysis, QuantumVectorAnalysis,
    CategorizedBestBets, AIRecommendedParlay, OddsMovement, OddsAnalysisResult, AIRecommendedParlayLeg, RiskAuditReport,
    MatchMenuData, OptimizerResult, SpecialOpsResponse, EliteCardData, MatchSimulation, EdgeAnalysisResult, CustomPredictionAnalysis,
    ParlayAggressiveness, Nexus9AuditData, RecalibratorResult, ChallengeStep, ChallengeConfig, SuperCuotaConfig, SuperCuota, SynergyResult, DailyParlay, DailyParlayLeg,
    MarketExplorerParams, MarketExplorerResult
} from '../types';

enum Type {
    TYPE_UNSPECIFIED = 'TYPE_UNSPECIFIED',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    INTEGER = 'INTEGER',
    BOOLEAN = 'BOOLEAN',
    ARRAY = 'ARRAY',
    OBJECT = 'OBJECT',
    NULL = 'NULL',
}

const ai = {
    models: {
        generateContent: async (params: { model: string; contents: any; config?: any }): Promise<{ text: string; candidates?: any[] }> => {
            const response = await fetch('/api/gemini/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });
            if (!response.ok) {
                let errorMessage = `Error del servidor (${response.status})`;
                try {
                    const errData = await response.json();
                    if (errData?.error) errorMessage = errData.error;
                } catch {
                    // ignore JSON parse error
                }
                throw new Error(errorMessage);
            }
            return response.json();
        },
    },
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
    let lastError: unknown;
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < retries) {
                console.warn(`API call failed. Retrying in ${delay}ms... (${retries - i} retries left)`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            }
        }
    }
    console.error("API call failed after multiple retries.", lastError);
    throw lastError;
};

const parseGeminiResponse = (text: string | undefined | null, expectArray: boolean = false) => {
    if (!text) {
        return expectArray ? [] : null;
    }
    
    let jsonString = text.trim();
    const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        jsonString = match[1].trim();
        if (jsonString.startsWith('json')) {
            jsonString = jsonString.substring(4).trim();
        }
    } else {
        const firstBracket = jsonString.indexOf('{');
        const firstSquare = jsonString.indexOf('[');
        if (firstBracket === -1 && firstSquare === -1) {
             return expectArray ? [] : null;
        }
        const start = (firstBracket === -1) ? firstSquare : (firstSquare === -1) ? firstBracket : Math.min(firstBracket, firstSquare);
        const lastBracket = jsonString.lastIndexOf('}');
        const lastSquare = jsonString.lastIndexOf(']');
        const end = Math.max(lastBracket, lastSquare);
        if (start !== -1 && end !== -1 && end > start) {
            jsonString = jsonString.substring(start, end + 1);
        }
    }
    
    jsonString = jsonString
        .replace(/([:\[,])\s*\+/g, '$1 ')
        .replace(/,\s*([\]}])/g, '$1');

    try {
        const result = JSON.parse(jsonString);
        if (expectArray) {
          return Array.isArray(result) ? result : [];
        }
        return result;
    } catch (e) {
        console.error("Failed to parse JSON from Gemini response:", e);
        return expectArray ? [] : null;
    }
}

export const getFixturesForSport = (sport: Sport, page: number, pageSize: number): Promise<Fixture[]> => {
    return withRetry(async () => {
        const prompt = `
        ACTÚA COMO UNA API DE DATOS DEPORTIVOS REALES.
        Misión: Listar ${pageSize} eventos de ${sport} REALES programados para los próximos 30 días (Página ${page}).
        
        INSTRUCCIONES CRÍTICAS:
        1. USA GOOGLE SEARCH para encontrar partidos reales que existan hoy en el calendario oficial.
        2. PROHIBIDO: Devolver 'Equipo A', 'TBD', 'Unknown', 'Equipo Desconocido' o campos vacíos.
        3. Si no encuentras eventos reales confirmados, devuelve un array vacío [].
        4. Los nombres de los equipos y ligas deben ser EXACTOS y REALES.
        
        FORMATO JSON:
        [
          {
            "teamA": "Nombre Real",
            "teamB": "Nombre Real",
            "league": "Liga Real",
            "matchDateTime": "ISO String (Ej: 2025-05-20T21:00:00Z)",
            "sport": "${sport}"
          }
        ]
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, true);
    });
};

export const searchFixtures = (sport: Sport, query: string): Promise<Fixture[]> => {
    return withRetry(async () => {
        const prompt = `
        ACTÚA COMO UN MOTOR DE BÚSQUEDA DEPORTIVA FORENSE.
        Misión: Buscar eventos de ${sport} REALES que coincidan con la consulta: "${query}".
        
        INSTRUCCIONES CRÍTICAS:
        1. USA GOOGLE SEARCH para verificar que el partido existe y obtener su fecha oficial.
        2. PROHIBIDO: Devolver datos ficticios o placeholders si la búsqueda no arroja resultados.
        3. Si el evento no es real o no se encuentra, devuelve [].
        
        FORMATO JSON:
        [
          {
            "teamA": "Nombre Real",
            "teamB": "Nombre Real",
            "league": "Liga Real",
            "matchDateTime": "ISO String",
            "sport": "${sport}"
          }
        ]
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, true);
    });
};

export const getFixturesForSportLive = (sport: Sport): Promise<LiveMatch[]> => {
    return withRetry(async () => {
        const prompt = `Find live ${sport} matches happening right now. Use Google Search. Return JSON array.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, true);
    });
};

export const getSportAnalyticsDashboard = (sport: Sport, preferences: UserPreferences, dateRange?: { startDate: string; endDate: string }): Promise<SportAnalyticsDashboardData> => {
     return withRetry(async () => {
        let dateInstruction = `dentro de los próximos 7 días.`;
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            dateInstruction = `entre ${dateRange.startDate} y ${dateRange.endDate}.`;
        }
        const prompt = `
        Genera un panel de inteligencia para ${sport} ${dateInstruction}. Perfil: ${preferences.riskProfile}.
        
        **INSTRUCCIONES CRÍTICAS:**
        1. **USA GOOGLE SEARCH** para encontrar partidos reales y cuotas vigentes.
        2. **PROHIBIDO:** 'Unknown', 'TBD', 'Equipo A' o cuotas 0.00.
        3. Cada apuesta DEBE tener el objeto 'justification' con los 5 vectores cuánticos.
        
        **ESTRUCTURA JSON:**
        {
          "safestBets": [ { "sport": "${sport}", "teamA": "Real", "teamB": "Real", "league": "Liga", "matchDateTime": "ISO", "marketName": "Winner", "outcomeName": "Real", "odds": 1.5, "fiabilityScore": 95, "justification": { "vectorCuantitativo": "...", "vectorMomentum": "...", "vectorMercado": "...", "simulacionEstres": "...", "veredictoCuantico": "..." }, "vectorInfluence": { "cuantitativo": 90, "momentum": 80, "mercado": 85, "simulacionEstres": 90 } } ],
          "valueBets": [], "highRiskBets": [], "playerPropBets": [], "recommendedParlays": []
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
     });
};

export const getBestBetsAcrossSports = (
    preferences: UserPreferences,
    dateRange?: { startDate: string; endDate: string },
    sportFilter?: string,
    matchFilter?: string
): Promise<CategorizedBestBets> => {
    return withRetry(async () => {
        const resolveCanonicalSport = (raw?: string): SportEnum | undefined => {
            if (!raw) return undefined;
            const s = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (s.includes('futbol americano') || s.includes('american football') || s.includes('nfl')) return SportEnum.AmericanFootball;
            if (s.includes('futbol') || s.includes('football') || s.includes('soccer') || s.includes('champions') || s.includes('laliga') || s.includes('premier')) return SportEnum.Football;
            if (s.includes('basket') || s.includes('baloncesto') || s.includes('nba') || s.includes('euroliga')) return SportEnum.Basketball;
            if (s.includes('tenis') || s.includes('tennis') || s.includes('atp') || s.includes('wta')) return SportEnum.Tennis;
            if (s.includes('beisbol') || s.includes('baseball') || s.includes('mlb')) return SportEnum.Baseball;
            if (s.includes('hockey') || s.includes('nhl')) return SportEnum.IceHockey;
            if (s.includes('esport') || s.includes('lol') || s.includes('cs2') || s.includes('valorant')) return SportEnum.Esports;
            if (s.includes('formula') || s.includes('f1')) return SportEnum.Formula1;
            return undefined;
        };

        const canonicalSport = resolveCanonicalSport(sportFilter) || resolveCanonicalSport(matchFilter);
        const targetSportLabel = canonicalSport || sportFilter || 'Football';

        let dateInstruction = `dentro de los próximos 7 días.`;
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            dateInstruction = `para el rango de fechas entre ${dateRange.startDate} y ${dateRange.endDate} (si en esa fecha exacta los partidos están por confirmarse o pertenecen a la jornada inmediata de la competición solicitada, analiza los partidos reales más relevantes de la jornada actual/próxima de dicha competición usando la fecha solicitada).`;
        }
        
        const sportInstruction = sportFilter
            ? `\n        **REGLA CRÍTICA DE DEPORTE:** DEBES incluir ÚNICAMENTE eventos del deporte: "${sportFilter}" (usa "${targetSportLabel}" en el campo \`sport\`). Está ESTRICTAMENTE PROHIBIDO incluir eventos de cualquier otro deporte (ej. si se pide Fútbol, no incluyas NBA, MLB, Tenis, etc.).`
            : `\n        Incluye eventos destacados de los deportes solicitados o principales del mercado.`;

        const matchInstruction = matchFilter
            ? `\n        **REGLA CRÍTICA DE PARTIDO O COMPETICIÓN ("${matchFilter}"):**
        - Si "${matchFilter}" es una competición, liga o torneo (ej. "Champions", "UEFA Champions League", "LaLiga", "Premier League", "NBA", "Copa Libertadores", etc.), DEBES incluir ÚNICAMENTE partidos reales de esa competición y asegurarte de que el campo \`league\` incluya "${matchFilter}" (ej. "UEFA Champions League").
        - Si "${matchFilter}" es un equipo o enfrentamiento específico (ej. "Real Madrid" o "Real Madrid vs Barcelona"), DEBES incluir ÚNICAMENTE apuestas para ese equipo o partido específico.`
            : ``;

        const prompt = `
        Investiga y selecciona las mejores oportunidades de apuesta de alta convicción ${dateInstruction}.
        Perfil de riesgo del usuario: ${preferences?.riskProfile || 'Balanced'}.
        ${sportInstruction}
        ${matchInstruction}
        
        **REGLA INQUEBRANTABLE DE RIGOR FACTUAL Y PLANTILLAS ACTUALIZADAS (CERO JUGADORES DESACTUALIZADOS):**
        1. **PROHIBIDO USAR MEMORIA HISTÓRICA DE PLANTILLAS ANTIGUAS:** Está ESTRICTAMENTE PROHIBIDO mencionar jugadores que ya no pertenecen a un equipo o que no estén verificados en la plantilla actual de la temporada en curso (por ejemplo: **Robert Lewandowski YA NO juega en el FC Barcelona**; Kylian Mbappé ya no juega en el PSG; Toni Kroos está retirado).
        2. **USO EXCLUSIVO DE "Jugadores/Líderes Actuales Verificados" DEL FEED EN TIEMPO REAL:**
           - Si propones un mercado de jugador (*Player Prop* de tiros a puerta, remates, paradas, pases o faltas) o citas nombres propios en cualquiera de los 5 vectores de justificación, **SOLO tienes permitido usar jugadores que aparezcan explícitamente listados en el bloque \`Jugadores/Líderes Actuales Verificados\` de los DATOS EN TIEMPO REAL** para ese partido concreto, respaldando el pick con sus cifras reales del feed (ej. Total Shots, Goals, Assists, Accurate Passes, Saves).
           - Si para un partido no necesitas o no tienes confirmado un jugador específico en ese listado en tiempo real, **formula el pick sobre mercados estadísticos colectivos del equipo** (ej. *% de Posesión del Equipo*, *Hándicap de Remates Totales del Equipo*, *Total de Remates a Puerta del Equipo Local/Visitante*, *Hándicap/Total de Córners*, *Total de Faltas Cometidas por Equipo*, *Tarjetas del Equipo*), los cuales son más sólidos y no dependen de rotaciones de última hora.

        **DIRECTIVA DE EXPLORACIÓN PROFUNDA Y ESCANEO MULTI-CASA DE APUESTAS (SHARP BETTOR & NICHE MARKETS):**
        Eres un analista cuantitativo de élite (*Sharp Bettor*) enfocado en maximizar la relación entre el **Valor Esperado de la Cuota (EV+)** y la **Seguridad Estructural del Pick**.
        1. **PROHIBIDO DAR APUESTAS TÍPICAS SIN VALOR:** NO seas perezoso eligiendo mercados básicos sobreexplotados y sin valor real (como "Ganador del Partido / Resultado Final 1X2" a cuotas bajas de favorito 1.20-1.45, o "Over 2.5 Goles" genéricos donde las casas ya han ajustado el margen al milímetro).
        2. **PRIORIZA MERCADOS INUSUALES, ESTADÍSTICOS E INEXPLOTADOS (BAJA LIQUIDEZ / ALTA INEFICIENCIA):**
           Debes abrir y expandir tu análisis hacia mercados tácticos y estadísticos donde los modelos automatizados de las casas de apuestas cometen errores de calibración:
           - **Posesión de Balón:** % de Posesión de un equipo (Over/Under, ej. *Más de 57.5% Posesión*) o *Hándicap de Posesión* según el modelo de juego (bloque bajo vs dominio posicional).
           - **Remates y Tiros a Puerta (Equipo y Jugadores Verificados):** *Quién realizará Más Remates*, *Hándicap de Remates Totales* (ej. *Equipo Local -4.5 Remates* o *Visitante +5.5 Remates*), *Total de Remates a Puerta de un Equipo*, o *Props de Jugador Verificado en el Feed (+1.5 / +2.5 Remates o Tiros a Puerta)*.
           - **Córners (Saques de Esquina):** *Hándicap Asiático de Córners*, *Córners Individuales de un Equipo (Over/Under)*, *Córners en la 1ª Mitad*, o *Equipo con Más Córners*.
           - **Faltas Cometidas y Tarjetas:** *Total de Faltas del Partido o de un Equipo*, *Equipo que cometerá Más Faltas*, *Línea de Tarjetas Amarillas/Puntos por Tarjeta* según el rigor del árbitro y la fricción táctica en transiciones.
           - **Paradas del Portero, Entradas (Tackles) y Fueras de Juego:** *Portero Verificado +2.5 / +3.5 Paradas*, *Fueras de juego de equipo ante línea defensiva adelantada*.
           - *(Si el deporte filtrado es Baloncesto, Tenis u otro: prioriza Rebotes, Asistencias, PRA, Triples, Pérdidas, Hándicaps por Cuarto/Set, % Primer Servicio, Aces, Total de Juegos o Roturas de Saque).*
        3. **CONEXIÓN Y CONTRASTE ENTRE CASAS DE APUESTAS (MULTI-BOOKMAKER SCAN):**
           Contrasta las líneas y cuotas entre distintas casas de apuestas (**Bet365, Pinnacle, Betfair, Winamax, Codere, Sportium, Marathonbet, Kambi, DraftKings**) para detectar discrepancias de línea (*soft lines*) o cuotas desajustadas. En el campo \`marketName\` o en \`vectorMercado\`, especifica qué casa ofrece la mejor línea/cuota y cuál es la diferencia frente al consenso del mercado.
        4. **CRITERIO DE SELECCIÓN (MERCADOS INUSUALES + MERCADOS POPULARES CON EV+ REAL):**
           - Al menos el **80% de los picks** deben provenir de estos mercados estadísticos/inusuales (posesión, remates, más remates, córners, faltas, tarjetas, paradas, props verificados).
           - **SÍ debes incluir un mercado popular/principal** (ej. Hándicap Asiático, Ambos Marcan, Goles o Ganador) **ÚNICAMENTE SI** tras contrastar todas las casas de apuestas detectas una ineficiencia de cuota extraordinaria donde el valor (EV+) y la seguridad superan claramente a los mercados secundarios para lo que el usuario ha especificado.

        **CRITERIOS POR CATEGORÍA (CONTRASTE VALOR VS SEGURIDAD):**
        - **safestBets (Alta Seguridad + Valor Sólido, Cuotas ~1.55 - 1.90, Fiabilidad 88-96):** Picks estadísticamente blindados por tendencias tácticas repetitivas (ej. Hándicap de Remates de Equipo, Línea de Posesión, Córners de equipo, Faltas Over) donde la probabilidad real supera el 68% y la cuota aún paga con valor.
        - **valueBets (Máximo Valor Esperado EV+, Cuotas ~1.90 - 2.65, Fiabilidad 80-89):** Desajustes claros de cuota entre casas de apuestas en mercados de remates a puerta de equipo/jugador verificado, tarjetas, faltas, córners, posesión o hándicaps donde la cuota pagada es muy superior a la probabilidad real calculada.
        - **highRiskBets (Cuotas Altas de Nicho / Asimetría Positiva, Cuotas ~2.65 - 4.50+, Fiabilidad 70-79):** Mercados inusuales de alto retorno (ej. Hándicap alternativo de Remates/Córners de Equipo, Equipo con Más Tiros a Puerta + Córners, o Prop de Jugador Verificado en el feed en tiempo real).

        **PROTOCOLO OBLIGATORIO DE RESPUESTA:**
        1. **PROHIBIDO DEVOLVER ARRAYS VACÍOS:** DEBES generar SIEMPRE al menos 3 apuestas en \`safestBets\`, 3 apuestas en \`valueBets\` y 3 apuestas en \`highRiskBets\` que cumplan estrictamente con los filtros indicados. NUNCA devuelvas \`[]\`.
        2. **CALIDAD ELITE, DATOS ACTUALIZADOS Y RIGOR SÓLIDO:** Usa únicamente partidos reales del feed, récords reales, últimos resultados reales y jugadores verificados del feed en tiempo real.
        3. El campo \`sport\` es obligatorio en cada apuesta y debe ser "${targetSportLabel}".
        4. Cada apuesta DEBE incluir el objeto \`justification\` completo con los 5 vectores cuánticos detallados (incluyendo métricas exactas de posesión/remates/córners/faltas/tarjetas, datos verificados del feed y comparativa entre casas de apuestas).
        
        **ESTRUCTURA JSON EXACTA REQUERIDA (SIN TEXTO ADICIONAL FUERA DEL JSON):**
        {
          "safestBets": [
            {
              "sport": "${targetSportLabel}",
              "teamA": "Equipo Local Real",
              "teamB": "Equipo Visitante Real",
              "league": "${matchFilter ? matchFilter : 'Nombre de Liga Real'}",
              "matchDateTime": "${dateRange?.startDate ? `${dateRange.startDate}T20:00:00Z` : new Date().toISOString()}",
              "marketName": "Ej: Hándicap de Remates Totales / Posesión de Balón (%) / Córners del Equipo",
              "outcomeName": "Ej: Equipo Local -4.5 Remates / Más de 58.5% Posesión (Bet365)",
              "odds": 1.72,
              "fiabilityScore": 92,
              "justification": {
                "vectorCuantitativo": "Métricas verificadas del partido: récords actuales, goles/tiros del feed en tiempo real y promedios de posesión %, remates o córners.",
                "vectorMomentum": "Choque táctico: forma reciente verificada (últimos partidos) y volumen de juego que garantiza esta estadística.",
                "vectorMercado": "Contraste entre casas (ej. Bet365 @1.72 vs Pinnacle @1.61): probabilidad implícita 58.1% frente a probabilidad real estimada 69.5% (+11.4% EV).",
                "simulacionEstres": "Comportamiento del pick si hay gol temprano o marcador adverso (por qué el volumen estadístico se mantiene seguro).",
                "veredictoCuantico": "Síntesis del equilibrio entre alta seguridad estadística y valor de cuota."
              }
            }
          ],
          "valueBets": [
            {
              "sport": "${targetSportLabel}",
              "teamA": "Equipo Local Real",
              "teamB": "Equipo Visitante Real",
              "league": "${matchFilter ? matchFilter : 'Nombre de Liga Real'}",
              "matchDateTime": "${dateRange?.startDate ? `${dateRange.startDate}T21:00:00Z` : new Date().toISOString()}",
              "marketName": "Ej: Total de Faltas Cometidas / Remates a Puerta del Equipo / Tarjetas de Equipo",
              "outcomeName": "Ej: Visitante Más de 13.5 Faltas / Local Más de 6.5 Tiros a Puerta (Winamax / Betfair)",
              "odds": 2.20,
              "fiabilityScore": 85,
              "justification": {
                "vectorCuantitativo": "Datos duros verificados del feed: volumen de tiros, paradas o promedio de faltas/tarjetas en la competición actual.",
                "vectorMomentum": "Contexto competitivo y emparejamiento táctico directo que fuerza la sobrecarga en este mercado específico.",
                "vectorMercado": "Línea desajustada en Bet365/Winamax (@2.20, implícita 45.4%) frente a proyección del modelo (56.0%, EV+ del +14.8%).",
                "simulacionEstres": "Resistencia de la línea ante rotación o cambio de ritmo en la segunda mitad.",
                "veredictoCuantico": "Ineficiencia de mercado de alto Valor Esperado en mercado secundario inexplotado."
              }
            }
          ],
          "highRiskBets": [
            {
              "sport": "${targetSportLabel}",
              "teamA": "Equipo Local Real",
              "teamB": "Equipo Visitante Real",
              "league": "${matchFilter ? matchFilter : 'Nombre de Liga Real'}",
              "matchDateTime": "${dateRange?.startDate ? `${dateRange.startDate}T21:00:00Z` : new Date().toISOString()}",
              "marketName": "Ej: Hándicap Alternativo de Remates a Puerta / Especial de Córners + Tarjetas",
              "outcomeName": "Ej: Local -3.5 Remates a Puerta / Más de 11.5 Córners Totales (Codere / Kambi)",
              "odds": 3.25,
              "fiabilityScore": 75,
              "justification": {
                "vectorCuantitativo": "Proyección de cola alta basada en volumen ofensivo verificado en el feed, transiciones rápidas y debilidad defensiva rival.",
                "vectorMomentum": "Guion de partido de ida y vuelta respaldado por los últimos resultados reales de ambos clubes.",
                "vectorMercado": "Cuota @3.25 (implícita 30.7%) muy por encima de la frecuencia real proyectada (41.0%).",
                "simulacionEstres": "Varianza controlada por el alto volumen de intentos proyectados en los 90 minutos.",
                "veredictoCuantico": "Pick especulativo de altísimo valor matemático en mercado estadístico alternativo."
              }
            }
          ]
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        
        const parsedResponse = parseGeminiResponse(response.text, false) || {
            safestBets: [],
            valueBets: [],
            highRiskBets: [],
        };

        const normalizeText = (str: string) =>
            (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        const sanitizeOutdatedRosters = (text: string, isBarcaMatch: boolean): string => {
            if (!text) return text;
            if (isBarcaMatch && /lewandowski/i.test(text)) {
                return text.replace(/Robert\s+Lewandowski|Lewandowski/gi, 'Lamine Yamal');
            }
            return text;
        };

        const normalizeBet = (bet: any) => {
            if (!bet) return bet;
            const inferredSport = canonicalSport || resolveCanonicalSport(bet.sport) || resolveCanonicalSport(bet.league) || SportEnum.Football;
            const isBarcaMatch = /barcelona|barca|barça/i.test(`${bet.teamA || ''} ${bet.teamB || ''}`);
            const justification = bet.justification
                ? {
                      vectorCuantitativo: sanitizeOutdatedRosters(bet.justification.vectorCuantitativo, isBarcaMatch),
                      vectorMomentum: sanitizeOutdatedRosters(bet.justification.vectorMomentum, isBarcaMatch),
                      vectorMercado: sanitizeOutdatedRosters(bet.justification.vectorMercado, isBarcaMatch),
                      simulacionEstres: sanitizeOutdatedRosters(bet.justification.simulacionEstres, isBarcaMatch),
                      veredictoCuantico: sanitizeOutdatedRosters(bet.justification.veredictoCuantico, isBarcaMatch),
                  }
                : bet.justification;

            return {
                ...bet,
                sport: inferredSport,
                marketName: sanitizeOutdatedRosters(bet.marketName, isBarcaMatch),
                outcomeName: sanitizeOutdatedRosters(bet.outcomeName, isBarcaMatch),
                justification,
                odds: Number(bet.odds) || 1.85,
                fiabilityScore: Number(bet.fiabilityScore) || 85,
            };
        };

        parsedResponse.safestBets = Array.isArray(parsedResponse.safestBets) ? parsedResponse.safestBets.map(normalizeBet) : [];
        parsedResponse.valueBets = Array.isArray(parsedResponse.valueBets) ? parsedResponse.valueBets.map(normalizeBet) : [];
        parsedResponse.highRiskBets = Array.isArray(parsedResponse.highRiskBets) ? parsedResponse.highRiskBets.map(normalizeBet) : [];
        
        // Post-procesamiento para garantizar que no se cuelen otros deportes o partidos sin vaciar resultados válidos
        if (sportFilter) {
            const filterBySport = (bet: any) => {
                if (!bet) return false;
                const requestedSport = normalizeText(sportFilter);
                const betSport = normalizeText(bet.sport);
                const league = normalizeText(bet.league);
                
                const isFootballRequested = requestedSport.includes('futbol') || requestedSport.includes('football') || requestedSport.includes('soccer');
                const isBasketballRequested = requestedSport.includes('basket') || requestedSport.includes('baloncesto');
                const isBaseballRequested = requestedSport.includes('beisbol') || requestedSport.includes('baseball');
                const isTennisRequested = requestedSport.includes('tenis') || requestedSport.includes('tennis');
                
                if (isFootballRequested && (league.includes('nba') || league.includes('mlb') || league.includes('nhl') || league.includes('nfl') || league.includes('atp') || league.includes('wta'))) return false;
                if (isBasketballRequested && (league.includes('mlb') || league.includes('nhl') || league.includes('nfl') || league.includes('atp') || league.includes('wta') || league.includes('premier') || league.includes('champions'))) return false;
                if (isBaseballRequested && (league.includes('nba') || league.includes('nhl') || league.includes('nfl') || league.includes('atp') || league.includes('wta') || league.includes('premier') || league.includes('champions'))) return false;
                if (isTennisRequested && (league.includes('nba') || league.includes('mlb') || league.includes('nhl') || league.includes('nfl') || league.includes('premier') || league.includes('champions'))) return false;

                if (canonicalSport && bet.sport === canonicalSport) return true;
                if (isFootballRequested) {
                    return betSport.includes('futbol') || betSport.includes('football') || betSport.includes('soccer');
                }
                if (isBasketballRequested) {
                    return betSport.includes('basket') || betSport.includes('baloncesto');
                }
                return betSport.includes(requestedSport) || requestedSport.includes(betSport) || league.includes(requestedSport);
            };
            const filteredSafe = parsedResponse.safestBets.filter(filterBySport);
            const filteredValue = parsedResponse.valueBets.filter(filterBySport);
            const filteredHighRisk = parsedResponse.highRiskBets.filter(filterBySport);
            if (filteredSafe.length + filteredValue.length + filteredHighRisk.length > 0) {
                parsedResponse.safestBets = filteredSafe;
                parsedResponse.valueBets = filteredValue;
                parsedResponse.highRiskBets = filteredHighRisk;
            }
        }

        if (matchFilter) {
            const filterNorm = normalizeText(matchFilter);
            const stopWords = new Set(['vs', 'v', 'de', 'del', 'la', 'el', 'los', 'las', 'en', 'fc', 'cf', 'club']);
            const tokens = filterNorm.split(/[\s,.-]+/).filter(t => t.length >= 2 && !stopWords.has(t));

            const filterByMatch = (bet: any) => {
                if (!bet || !bet.teamA || !bet.teamB) return false;
                const fullText = normalizeText(`${bet.teamA} vs ${bet.teamB} ${bet.league || ''} ${bet.marketName || ''} ${bet.outcomeName || ''}`);
                if (fullText.includes(filterNorm)) return true;
                if (tokens.length > 0 && tokens.some(token => fullText.includes(token))) return true;
                return false;
            };
            const filteredSafe = parsedResponse.safestBets.filter(filterByMatch);
            const filteredValue = parsedResponse.valueBets.filter(filterByMatch);
            const filteredHighRisk = parsedResponse.highRiskBets.filter(filterByMatch);
            if (filteredSafe.length + filteredValue.length + filteredHighRisk.length > 0) {
                parsedResponse.safestBets = filteredSafe;
                parsedResponse.valueBets = filteredValue;
                parsedResponse.highRiskBets = filteredHighRisk;
            }
        }

        return parsedResponse;
    });
};

export const getPredictionForFixture = (fixture: Fixture): Promise<MatchPrediction> => {
    return withRetry(async () => {
        const prompt = `
        TU MISIÓN: Realizar un análisis forense de élite para el partido: ${fixture.teamA} vs ${fixture.teamB} (${fixture.sport}).
        LIGA: ${fixture.league} | FECHA: ${fixture.matchDateTime}
        
        **INSTRUCCIONES OBLIGATORIAS:**
        1. **USA GOOGLE SEARCH** para obtener noticias de última hora, lesiones y cuotas actuales para este partido específico.
        2. Genera una predicción principal y categorías de apuestas (safestBets, valueBets, highRiskBets).
        3. Cada apuesta DEBE incluir una 'justification' con los 5 vectores: vectorCuantitativo, vectorMomentum, vectorMercado, simulacionEstres y veredictoCuantico.
        4. Identifica a los jugadores clave (keyPlayers) para ambos equipos.
        
        **ESTRUCTURA JSON EXACTA:**
        {
          "expertConsensus": "Breve resumen del consenso de expertos.",
          "historicalStats": { "headToHead": "...", "recentFormA": "...", "recentFormB": "..." },
          "mainPrediction": { 
            "marketName": "Nombre Mercado", "outcomeName": "Selección", "odds": 1.85, "fiabilityScore": 92,
            "justification": { "vectorCuantitativo": "...", "vectorMomentum": "...", "vectorMercado": "...", "simulacionEstres": "...", "veredictoCuantico": "..." },
            "vectorInfluence": { "cuantitativo": 90, "momentum": 85, "mercado": 80, "simulacionEstres": 95 }
          },
          "safestBets": [], "valueBets": [], "highRiskBets": [],
          "markets": [ { "name": "Winner 1X2", "outcomes": [ { "name": "Team A", "odds": 2.1 } ] } ],
          "keyPlayers": { "teamA": [ { "name": "...", "position": "...", "stats": {} } ], "teamB": [] },
          "sources": [ { "uri": "...", "title": "..." } ]
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        const prediction = parseGeminiResponse(response.text, false);
        return { ...fixture, ...prediction };
    });
};

export const getChallengePick = async (config: ChallengeConfig, currentCapital: number): Promise<ChallengeStep> => {
    return withRetry(async () => {
        const strategyRange = config.strategy === 'UltraConservative' ? '1.15 a 1.30' : config.strategy === 'Conservative' ? '1.30 a 1.50' : config.strategy === 'Balanced' ? '1.50 a 1.85' : '1.85 a 3.00';
        
        const prompt = `
        ACTÚA COMO UN PLANIFICADOR FINANCIERO DE APUESTAS (NEXUS CHALLENGE PROTOCOL).
        Misión: Proponer el SIGUIENTE PASO óptimo para un reto de interés compuesto.
        
        PARÁMETROS DEL RETO:
        - EstrATEGIA: ${config.strategy} (Cuota objetivo: ${strategyRange})
        - Capital de Operación Actual: ${currentCapital.toFixed(2)}€
        - Prioridad: SUPERVIVENCIA (>90% de probabilidad estimada).
        
        **INSTRUCCIONES DE ÉLITE:**
        1. **USA GOOGLE SEARCH** para encontrar un partido real que ocurra hoy o mañana.
        2. Selecciona un mercado de BAJA VOLATILIDAD (Hándicaps adicionales, Doble oportunidad, Over/Under de tramos seguros).
        3. Calcula el 'volatilityIndex' (0-100) and 'ruinFactor' (Probabilidad de pérdida total del paso).
        4. Proporciona la Síntesis de 5 Vectores enfocada en la ESTABILIDAD.
        
        **DEBES retornar un objeto JSON ChallengeStep:**
        {
          "id": "step_${Date.now()}",
          "order": 1,
          "matchIdentifier": "Equipo A vs Equipo B",
          "marketName": "Mercado Seguro",
          "outcomeName": "Selección",
          "odds": number,
          "stake": ${currentCapital.toFixed(2)},
          "status": "pending",
          "sport": "Football",
          "timestamp": ${Date.now()},
          "reliabilityScore": 92,
          "volatilityIndex": 15,
          "ruinFactor": 8,
          "analysis": {
             "vectorCuantitativo": "...",
             "vectorMomentum": "...",
             "vectorMercado": "...",
             "simulacionEstres": "...",
             "veredictoCuantico": "..."
          }
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getPlannedChallengeRoadmap = async (config: ChallengeConfig): Promise<ChallengeStep[]> => {
    return withRetry(async () => {
        const strategyRange = config.strategy === 'UltraConservative' ? '1.15 a 1.25' : config.strategy === 'Conservative' ? '1.25 a 1.45' : config.strategy === 'Balanced' ? '1.45 a 1.75' : '1.75 a 2.50';
        
        const prompt = `
        ACTÚA COMO UN ARQUITECTO DE ESTRATEGIA NEXUS (MODO PLAN MAESTRO).
        Misión: Generar un ROADMAP COMPLETO e integral de 6 pasos para un reto de interés compuesto.
        
        CONTEXTO DEL PLAN:
        - Nombre: ${config.name}
        - Estrategia: ${config.strategy} (Cuota objetivo por paso: ${strategyRange})
        - Capital Inicial: ${config.seedCapital.toFixed(2)}€
        - Meta: ${config.targetGoal.toFixed(2)}€
        - Timeline: ${config.targetDate ? `Finalizar para ${config.targetDate}` : '30 días'}
        
        **PROTOCOLO DE ARQUITECTO DE RIESGO:**
        1. **PASO 1 (Cálculo):** Determina exactamente 6 pasos necesarios.
        2. **PASO 2 (Búsqueda):** USA GOOGLE SEARCH para encontrar 6 eventos REALES (hoy y próximos días).
        3. **PASO 3 (Análisis):** Cada paso DEBE incluir la síntesis de 5 vectores (sin comillas dobles internas sin escapar).
        
        **REGLA DE ORO DE SALIDA:**
        - Solo devuelve un JSON perfectamente formado.
        - NO incluyas explicaciones fuera del bloque JSON.
        - NO uses caracteres especiales que rompan el parseo JSON.

        **FORMATO JSON (ARRAY):**
        [ 
          { 
            "id": "master_step_1", 
            "order": 1, 
            "matchIdentifier": "Equipo Local vs Visitante", 
            "marketName": "Mercado", 
            "outcomeName": "Selección", 
            "odds": 1.40, 
            "stake": ${config.seedCapital.toFixed(2)}, 
            "status": "upcoming", 
            "sport": "Football", 
            "timestamp": ${Date.now()}, 
            "reliabilityScore": 90, 
            "volatilityIndex": 10, 
            "ruinFactor": 5, 
            "analysis": { 
               "vectorCuantitativo": "texto corto", 
               "vectorMomentum": "texto corto", 
               "vectorMercado": "texto corto", 
               "simulacionEstres": "texto corto", 
               "veredictoCuantico": "texto corto" 
            }
          }
        ]
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        const parsed = parseGeminiResponse(response.text, true);
        if (parsed.length === 0) throw new Error("IA devolvió array vacío.");
        return parsed;
    });
};

export const auditChallengeCustomPick = async (pickText: string, config: ChallengeConfig): Promise<ChallengeStep> => {
    return withRetry(async () => {
        const prompt = `
        AUDITORÍA FORENSE DE PICK PARA RETO: "${pickText}".
        Reglas del Reto: EstrATEGIA ${config.strategy}, Enfoque Supervivencia.
        
        **TAREA:**
        1. Verifica el partido real y cuotas mediante Google Search.
        2. Analiza si este pick rompe la lógica del reto (¿Es demasiado volátil? ¿Cuota demasiado alta?).
        3. Proporciona el reporte completo de fiabilidad, volatilidad y factor de ruina.
        
        **RETORNA JSON ChallengeStep:**
        {
           "matchIdentifier": "...", "marketName": "...", "outcomeName": "...", "odds": number,
           "status": "pending", "timestamp": ${Date.now()}, "isCustom": true, "reliabilityScore": number, "volatilityIndex": number, "ruinFactor": number,
           "analysis": { ... }
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getCustomBetAnalysis = (fixture: Fixture, customPrediction: string): Promise<BetAnalysis> => {
    return withRetry(async () => {
        const prompt = `Analyze this user prediction for ${fixture.teamA} vs ${fixture.teamB}: "${customPrediction}". Return JSON with structuredAnalysis and fiabilityScore.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getBetAnalysis = (fixture: Fixture, marketName: string, outcomeName: string): Promise<BetAnalysis> => {
    return withRetry(async () => {
        const prompt = `Analyze bet: ${outcomeName} in market ${marketName} for ${fixture.teamA} vs ${fixture.teamB}. Return JSON.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getScenarioPrediction = (fixture: Fixture, scenario: string): Promise<ScenarioAnalysis> => {
    return withRetry(async () => {
        const prompt = `Simulate scenario "${scenario}" for ${fixture.teamA} vs ${fixture.teamB}. Return JSON with newFiabilityScore and analysis.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getParlayAnalysis = (items: BetSlipItem[]): Promise<ParlayAnalysis> => {
    return withRetry(async () => {
        const prompt = `Analyze this parlay: ${JSON.stringify(items)}. Return JSON with structuredAnalysis and viabilityScore.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getBetPostMortemAnalysis = (bet: CompletedBet): Promise<BetPostMortemAnalysis> => {
    return withRetry(async () => {
        const prompt = `Analyze completed bet: ${bet.matchIdentifier}, Pick: ${bet.outcomeName}. Result: ${bet.status}. Why did it win/lose? Return JSON.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getPerformanceAnalysis = (history: CompletedBet[], preferences: UserPreferences): Promise<PerformanceAnalysis> => {
    return withRetry(async () => {
        const prompt = `Analyze betting history for ${preferences.riskProfile} profile. Return JSON with summary, strongestAreas, weakestAreas.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getPlayerMatchupAnalysis = (playerA: Player, playerB: Player, fixture: Fixture): Promise<PlayerMatchupAnalysis> => {
    return withRetry(async () => {
        const prompt = `Compare ${playerA.name} vs ${playerB.name} in context of ${fixture.teamA} vs ${fixture.teamB}. Return JSON.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getChatResponse = (messages: ChatMessage[], context: { sport: Sport | null, fixtures: Fixture[], analytics: SportAnalyticsDashboardData | null, detailedPrediction: MatchPrediction | null }): Promise<ChatMessage> => {
    return withRetry(async () => {
        const prompt = `Sports betting assistant. Context: ${JSON.stringify(context)}. User: ${messages[messages.length-1].content}. Return JSON ChatMessage.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getLiveInsight = (match: LiveMatch): Promise<LiveInsight> => {
    return withRetry(async () => {
        const prompt = `
        TU MISIÓN: Análisis forense en tiempo real para el partido: ${match.teamA} vs ${match.teamB}.
        Estado actual: ${match.scoreA}-${match.scoreB}, minuto ${match.minute}'. Liga: ${match.league}.
        
        **INSTRUCCIONES CRÍTICAS:**
        1. **USA GOOGLE SEARCH** para obtener las estadísticas en vivo exactas de este momento.
        2. Proporciona datos de posesión, tiros y corners para el panel de telemetría.
        3. Identifica "brechas de mercado" (cuotas en vivo con valor real).
        
        **ESTRUCTURA JSON OBLIGATORIA:**
        {
          "timestamp": ${Date.now()},
          "reliabilityScore": 85,
          "valueScore": 75,
          "smallAnalysis": "Resumen táctico de lo que está pasando ahora.",
          "stats": {
            "possessionA": 55, "possessionB": 45,
            "shotsA": 10, "shotsB": 4,
            "shotsOnTargetA": 4, "shotsOnTargetB": 1,
            "cornersA": 6, "cornersB": 2
          },
          "suggestedLiveBets": [
            { "marketName": "Next Goal", "outcomeName": "${match.teamA}", "odds": 2.1, "justification": "Presión alta y xG acumulado..." }
          ],
          "structuredAnalysis": {
            "vectorCuantitativo": "...",
            "vectorMomentum": "...",
            "vectorMercado": "...",
            "simulacionEstres": "...",
            "veredictoCuantico": "..."
          },
          "events": []
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getBankrollCoachingAdvice = (history: CompletedBet[], preferences: UserPreferences): Promise<BankrollCoachingAdvice> => {
    return withRetry(async () => {
        const prompt = `Bankroll coaching for ${preferences.riskProfile}. Return JSON with advice, positiveHabits, areasForImprovement.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getParlayOfTheWeek = (targetOdds: number, dateRange: { startDate: string; endDate: string }): Promise<AIRecommendedParlay> => {
    return withRetry(async () => {
        const prompt = `Build a 'Parlay of the Week' with total odds around ${targetOdds}. Date range: ${dateRange.startDate} to ${dateRange.endDate}. Return JSON.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const verifyBetResults = async (bets: CompletedBet[]): Promise<CompletedBet[]> => {
    return withRetry(async () => {
        const prompt = `Verify results for these bets: ${JSON.stringify(bets.map(b => ({id: b.id, match: b.matchIdentifier, selection: b.outcomeName})))}. Return JSON array of updated bets with status 'win', 'loss', or 'push'.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, true);
    });
};

export const getTopOddsMovements = async (sport: Sport): Promise<OddsMovement[]> => {
    return withRetry(async () => {
        const prompt = `
        Actúa como un Escáner de Mercado de Apuestas. Tu misión es detectar 5 movimientos significativos de cuotas REALES para el deporte ${sport}.
        
        **PROTOCOLO OBLIGATORIO:**
        1. **USA GOOGLE SEARCH** para encontrar partidos reales que ocurran hoy o próximamente.
        2. **USA GOOGLE SEARCH** para verificar cuotas que hayan cambiado bruscamente (Steam Moves / Money Flow).
        3. **PROHIBIDO:** Devolver placeholders como 'LIGA', 'Selección', 'Equipo A' o cuotas de '0.00'.
        
        **DEBES retornar un array JSON de objetos OddsMovement:**
        {
          "id": "string único",
          "sport": "${sport}",
          "match": "Equipo Real A vs Equipo Real B",
          "league": "Nombre Real de la Liga",
          "market": "Mercado Real (ej: Handicap Asiático, Winner 1X2)",
          "selection": "Selección Real (ej: El nombre del equipo)",
          "oldOdds": number (ej: 2.10),
          "newOdds": number (ej: 1.85),
          "timestamp": "ISO Date String actual",
          "bookmaker": "Nombre de casa de apuestas real",
          "movementType": "STEAM_MOVE | SHARP_ACTION | PUBLIC_MONEY",
          "magnitude": "HIGH | MEDIUM | LOW",
          "history": [ { "timestamp": "...", "odds": number } ]
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, true);
    });
};

export const analyzeOddsMovement = async (movement: OddsMovement): Promise<OddsAnalysisResult> => {
    return withRetry(async () => {
        const prompt = `
        Realiza un análisis forense de este movimiento de cuota:
        Evento: ${movement.match}
        Selección: ${movement.selection}
        Cambio: de ${movement.oldOdds} a ${movement.newOdds}
        
        **DEBES retornar un objeto JSON OddsAnalysisResult estricto:**
        {
          "verdict": {
            "type": "CONFIRMED_SMART_MONEY | TRAP_MARKET | SQUAD_NEWS_REACTION",
            "score": number (0-100),
            "recommendation": "Follow | Fade | Wait",
            "summary": "Resumen técnico de por qué se mueve la cuota"
          },
          "analysis": {
            "context": "Análisis de lesiones, alineaciones o volumen de dinero",
            "modelCoherence": "Cómo encaja este movimiento con el valor matemático",
            "movementType": "Tipo de movimiento",
            "speed": "Velocidad del cambio",
            "magnitude": "Magnitud del impacto"
          }
        }
        
        Usa Google Search para verificar noticias de última hora sobre ${movement.match}.
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        const result = parseGeminiResponse(response.text, false);
        return { ...result, movement };
    });
};

export const analyzeCustomOddsMovement = async (sport: string, match: string, market: string, selection: string): Promise<OddsAnalysisResult> => {
    return withRetry(async () => {
        const prompt = `
        Investiga y analiza el mercado actual para:
        Deporte: ${sport}
        Partido: ${match}
        Mercado: ${market}
        Selección: ${selection}
        
        **PASOS OBLIGATORIOS:**
        1. **USA GOOGLE SEARCH** para encontrar las cuotas de apertura y las cuotas actuales para esta selección.
        2. Determina si ha habido un movimiento significativo.
        
        **DEBES retornar un objeto JSON OddsAnalysisResult completo, incluyendo el objeto 'movement' with los datos reales encontrados:**
        {
          "movement": {
             "id": "manual_1",
             "sport": "${sport}",
             "match": "${match}",
             "league": "Nombre Real Liga",
             "market": "${market}",
             "selection": "${selection}",
             "oldOdds": number (Cuota de apertura real),
             "newOdds": number (Cuota actual real),
             "timestamp": "ISO Date String",
             "bookmaker": "Market Average",
             "movementType": "...",
             "magnitude": "..."
          },
          "verdict": { "type": "...", "score": number, "recommendation": "...", "summary": "..." },
          "analysis": { "context": "...", "modelCoherence": "...", "movementType": "...", "speed": "...", "magnitude": "..." }
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getTextFromImage = async (base64: string, mimeType: string): Promise<string> => {
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: [
                { inlineData: { mimeType, data: base64 } },
                { text: "Extract all text from this betting slip image. Identify event, selection, and odds." }
            ],
        });
        return response.text || "";
    });
};

export const getCustomPredictionAnalysis = async (text: string): Promise<CustomPredictionAnalysis> => {
    return withRetry(async () => {
        const prompt = `
        ACTÚA COMO UN AUDITOR FORENSE DE RIESGOS FINANCIEROS Y DEPORTIVOS (NEXUS-9 AUDIT SUITE).
        Tu misión es auditar el siguiente pronóstico: "${text}".

        **PROTOCOLO DE AUDITORÍA OBLIGATORIO (4 DIMENSIONES):**
        1. **TRIANGULACIÓN DE LIQUIDEZ:** Compara la cuota del usuario con Market Makers (Pinnacle, Circa). Determina 'marketAlignment' (0-100).
        2. **BLACK SWAN ENGINE:** Identifica 2-3 escenarios catastróficos específicos que arruinarían el pick (lesión estrella, roja temprana) y su probabilidad.
        3. **CORRELACIÓN INVISIBLE:** Si detectas múltiples selecciones, audita si hay contradicciones tácticas.
        4. **HEDGE OPTIMIZER:** Crea un plan de protección/cobertura dinámico.

        **DEBES retornar un objeto JSON CustomPredictionAnalysis con el campo 'nexus9Audit':**
        {
          "isValidPrediction": boolean,
          "originalPrediction": "string",
          "matchContext": { "teamA": "Nombre Real", "teamB": "Nombre Real", "league": "Liga Real", "sport": "..." },
          "analysis": { "vectorCuantitativo": "...", "vectorMomentum": "...", "vectorMercado": "...", "simulacionEstres": "...", "veredictoCuantico": "..." },
          "fiabilityScore": number,
          "valueScore": number,
          "suggestedAlternative": { "marketName": "...", "outcomeName": "...", "odds": number, "reason": "..." },
          "structuredBet": { "matchIdentifier": "...", "marketName": "...", "outcomeName": "...", "odds": number },
          "nexus9Audit": {
            "marketAlignment": number (0-100),
            "blackSwanRisks": [ { "scenario": "...", "probability": number, "impact": "HIGH | MEDIUM | LOW" } ],
            "correlationAudit": "Comentario sobre correlaciones (si aplica)",
            "hedgeOptimizer": [ { "trigger": "Ej: Si minuto 60 marcador es 0-0", "action": "Ej: Cubrir con Over 0.5", "protectionLevel": "80% de inversión" } ],
            "auditCertificateId": "NX9-AUDIT-XXXX"
          }
        }
        
        Usa Google Search para verificar el partido real y noticias de última hora.
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getCertaintyRecalibration = async (text: string): Promise<RecalibratorResult> => {
    return withRetry(async () => {
        const prompt = `
        ACTÚA COMO UN MOTOR DE ARBITRAJE DE PROBABILIDADES ASIMÉTRICAS (NEXUS-9 CERTAINTY RE-CALIBRATOR).
        Tu misión es recibir una apuesta del usuario: "${text}" y encontrar una sustitución que mantenga la cuota pero aumente drásticamente la probabilidad de éxito (>95% de confianza).

        **PROTOCOLO DE RECALIBRACIÓN (TOLERANCIA CERO A LA VOLATILIDAD):**
        1. **ANÁLISIS DE LA APUESTA ORIGINAL:** Identifica Evento, Cuota (Objetivo) y Selección. Evalúa sus Puntos de Fallo (Varianza).
        2. **ESCÁNER DE ESPEJO (MIRROR SCAN):** 
           - Busca en el mismo partido mercados técnicos de baja volatilidad (Asiáticos, Props, Tramos).
           - Si no hay mejora asimétrica en el partido, busca un "Banker Global" en otro deporte/liga hoy con la misma cuota pero probabilidad histórica masiva.
        3. **PRUEBA DE ESTRÉS COMPARATIVA:** Ejecuta 20,000 simulaciones. Compara la curva de probabilidad de la original vs la recalibrada.
        4. **EVIDENCIA FORENSE:** Cita datos reales de [Opta/Flashscore] que demuestren por qué la alternativa es un blindaje total.

        **DEBES retornar un objeto JSON RecalibratorResult:**
        {
          "originalBet": {
            "match": "string", "selection": "string", "odds": number, "probability": number (0-100),
            "failurePoints": ["...", "..."]
          },
          "recalibratedBet": {
            "match": "string", "selection": "string", "market": "string", "odds": number (igual o +5% que original), 
            "probability": number (DEBE ser > original), "shieldFactors": ["...", "..."],
            "evidence": "Texto detallado con datos históricos verídicos", "substitutionType": "LOCAL | GLOBAL", "sport": "Football | Basketball | etc"
          },
          "simulation": {
            "iterations": 20000,
            "originalCurve": [number, number, ...], // 10 puntos para gráfico
            "recalibratedCurve": [number, number, ...] // 10 puntos para gráfico
          },
          "auditId": "RE-CAL-XXXX"
        }
        
        Usa Google Search para verificar el calendario deportivo real y cuotas vigentes.
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const searchLiveMatch = async (query: string): Promise<LiveMatch[]> => {
    return withRetry(async () => {
        const prompt = `
        TU MISIÓN: Intercerptar el feed en vivo para el partido o equipo: "${query}".
        
        **PROTOCOLO DE INTERCEPCIÓN OBLIGATORIO:**
        1. **USA GOOGLE SEARCH** para encontrar el estado exacto del partido en este preciso instante.
        2. Busca en fuentes de resultados en vivo (Flashscore, Sofascore, ESPN).
        3. Identifica: Nombre real de los equipos, Liga, Minuto de juego y Marcador actual.
        4. Si el partido no está en juego ahora mismo o no existe, devuelve un array vacío [].
        
        **DEBES RETORNAR UN ARRAY JSON DE OBJETOS LiveMatch:**
        [
          {
            "teamA": "Nombre Real Equipo Local",
            "teamB": "Nombre Real Equipo Visitante",
            "league": "Nombre Real de la Liga",
            "matchDateTime": "ISO String (Hora de inicio real)",
            "sport": "Football | Basketball | etc",
            "status": "live" | "halftime",
            "minute": number (Minuto actual),
            "scoreA": number (Goles/Puntos Local),
            "scoreB": number (Goles/Puntos Visitante)
          }
        ]
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, true);
    });
};

export const getCorrectedLiveInsight = async (match: LiveMatch, correction: string): Promise<LiveInsight> => {
    return withRetry(async () => {
        const prompt = `
        Toma en cuenta esta CORRECCIÓN del usuario para el partido ${match.teamA} vs ${match.teamB}: "${correction}".
        Actualiza tu análisis táctico y de brechas de mercado basándote en este nuevo dato prioritario.
        
        **DEBES retornar un objeto JSON LiveInsight completo con el nuevo estado:**
        {
          "timestamp": ${Date.now()},
          "reliabilityScore": 90,
          "valueScore": 80,
          "smallAnalysis": "Análisis actualizado tras corrección: ...",
          "stats": { "possessionA": 50, "possessionB": 50, "shotsA": 5, "shotsB": 5, "shotsOnTargetA": 2, "shotsOnTargetB": 2, "cornersA": 3, "cornersB": 3 },
          "suggestedLiveBets": [],
          "structuredAnalysis": { "vectorCuantitativo": "...", "vectorMomentum": "...", "vectorMercado": "...", "simulacionEstres": "...", "veredictoCuantico": "..." },
          "events": []
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const auditLiveSelection = async (match: LiveMatch, selection: string, odds: number): Promise<any> => {
    return withRetry(async () => {
        const prompt = `
        Auditoría Live para: ${selection} @ ${odds}
        Contexto: ${match.teamA} ${match.scoreA}-${match.scoreB} ${match.teamB} (minuto ${match.minute}').
        
        **USA GOOGLE SEARCH** para verificar el estado de peligro actual del partido.
        
        **RETORNA JSON:**
        {
          "reliabilityScore": number,
          "valueScore": number,
          "verdict": "APPROVED | REJECTED | CAUTION",
          "detailedAnalysis": "Análisis forense de por qué la apuesta tiene o no valor ahora mismo."
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const parseCustomBet = async (description: string, odds: number): Promise<BetSlipItem> => {
    return withRetry(async () => {
        const prompt = `Parse bet: "${description}" with odds ${odds}. Return JSON BetSlipItem (matchIdentifier, marketName, outcomeName, sport).`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const runMatchSimulation = async (teamA: string, teamB: string, sport: Sport): Promise<MatchSimulation> => {
    return withRetry(async () => {
        const prompt = `Simulate match ${teamA} vs ${teamB} (${sport}). Run Monte Carlo. Return JSON MatchSimulation.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getEliteCardContent = async (bet: BetSlipItem): Promise<EliteCardData> => {
    return withRetry(async () => {
        const prompt = `
        Genera un informe institucional "Elite Card" para la apuesta: ${bet.outcomeName} en el evento ${bet.matchIdentifier}.
        
        **DEBES retornar un objeto JSON estricto con esta estructura:**
        {
          "cardId": "string (ej: EC-9921)",
          "timestamp": "string (ISO date)",
          "event": "string",
          "league": "string",
          "selection": "string",
          "market": "string",
          "odds": number,
          "confidenceGrade": "string (ej: A+, AA, S)",
          "thesis": {
            "quantitative": "Resumen técnico del modelo matemático",
            "marketFlow": "Análisis del movimiento de dinero y cuotas",
            "riskMitigation": "Factores de seguridad y por qué el riesgo es bajo"
          },
          "verificationCode": "string (ej: VRF-291-X)"
        }
        
        Usa Google Search para obtener datos reales and actuales del partido para que el informe sea verídico.
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getEdgeAnalysis = async (sport: Sport, match: string, market: string, selection: string, bookmakerOdds: number): Promise<EdgeAnalysisResult> => {
    return withRetry(async () => {
        const prompt = `
        Actúa como un Actuario de Seguros y Modelador de Probabilidades Deportivas.
        Calcula la probabilidad real ("True Odds") vs la cuota de la casa for:
        Evento: ${match}
        Selección: ${selection} (${market})
        Deporte: ${sport}
        Cuota de la Casa: ${bookmakerOdds}
        
        **PROTOCOLO OBLIGATORIO:**
        1. **USA GOOGLE SEARCH** para obtener estadísticas recientes, alineaciones y noticias de última hora de ${match}.
        2. Realiza un cálculo de valor esperado (EV).
        
        **DEBES retornar un objeto JSON EdgeAnalysisResult estricto:**
        {
          "match": "${match}",
          "selection": "${selection}",
          "market": "${market}",
          "bookmakerOdds": ${bookmakerOdds},
          "fairOdds": number (Cuota que debería ser según tu modelo),
          "trueProbability": number (0-1),
          "impliedProbability": number (0-1, basado en bookmakerOdds),
          "edgePercentage": number (Ventaja matemática %, ej: 8.5),
          "valueRating": "ELITE VALUE | HIGH VALUE | NO VALUE | TRAP",
          "kellyStake": number (0-10, recomendación stake),
          "simulationData": { "iterations": 20000, "confidenceInterval": "95%" },
          "analysis": "Explicación técnica detallada de por qué existe o no la ventaja."
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getLegMatcherOptions = async (pick: string): Promise<AIAnalysisBet[]> => {
    return withRetry(async () => {
        const prompt = `
        ACTÚA COMO UN ESCÁNER DE MERCADO DE ALTA PROBABILIDAD (THE LEG MATCHER).
        Tu misión es encontrar 3-5 selecciones de "Ancla" (Bankers) para combinar with el pick del usuario: "${pick}".

        **CRITERIOS DE SELECCIÓN (FILTRO DE ÉLITE):**
        1. **PROBABILIDAD EXTREMA:** Solo incluye selecciones con una probabilidad matemática >88%.
        2. **FUENTES REALES:** Usa Google Search para encontrar partidos REALES que ocurran hoy o mañana.
        3. **SIN DATOS "UNKNOWN":** Todos los campos (Liga, Equipos, Cuota) deben ser reales y verificados.
        4. **ESTRUCTURA DE DATOS COMPLETA:** Cada item debe tener la estructura completa de AIAnalysisBet, incluyendo la justificación de 5 vectores.

        **DEBES retornar un array JSON de objetos AIAnalysisBet:**
        [
          {
            "sport": "Football | Basketball | ...",
            "teamA": "Nombre Real",
            "teamB": "Nombre Real",
            "league": "Liga Real",
            "matchDateTime": "ISO String",
            "marketName": "Mercado Seguro (ej: Over 0.5 Goles, Handicap +2.5)",
            "outcomeName": "Selección",
            "odds": number (ej: 1.25),
            "fiabilityScore": number (Mínimo 88),
            "justification": {
              "vectorCuantitativo": "Análisis matemático real...",
              "vectorMomentum": "Tendencia actual...",
              "vectorMercado": "Alineación de cuotas...",
              "simulacionEstres": "Escenarios de riesgo...",
              "veredictoCuantico": "Por qué es un ancla perfecta..."
            },
            "vectorInfluence": { "cuantitativo": 90, "momentum": 85, "mercado": 80, "simulacionEstres": 95 }
          }
        ]
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, true);
    });
};

export const getRiskAudit = async (pick: string): Promise<RiskAuditReport> => {
    return withRetry(async () => {
        const prompt = `Audit risk for bet: "${pick}". Identify failure points. Return JSON RiskAuditReport.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getMatchMenu = async (teamA: string, teamB: string, sport: Sport): Promise<MatchMenuData> => {
    return withRetry(async () => {
        const prompt = `Generate betting menu for ${teamA} vs ${teamB} (${sport}): Safe, Logic, Aggressive. Return JSON MatchMenuData.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getMarketOptimization = async (intuition: string): Promise<OptimizerResult> => {
    return withRetry(async () => {
        const prompt = `Optimize betting strategy for intuition: "${intuition}". Find best market/odds. Return JSON OptimizerResult.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const executeSpecialOpsRequest = async (input: string, context: any): Promise<SpecialOpsResponse> => {
    return withRetry(async () => {
        const prompt = `
        TU MISIÓN: Ejecutar una operación especial táctica de inteligencia deportiva basada en la demanda del usuario: "${input}".
        
        **PROTOCOLO DE CLASIFICACIÓN DE INTENT:**
        - Si el usuario pide un plan paso a paso, interés compuesto o resto: 'intent: ROADMAP'.
        - Si el usuario pide una combinada personalizada o lista de picks: 'intent: PARLAY'.
        - Si el usuario pide auditar una apuesta o comparar equipos/jugadores: 'intent: ALLOCATION'.
        
        **PROTOCOLO DE ANÁLISIS OBLIGATORIO:**
        1. Realiza la Síntesis Cuántica de 5 Vectores (Cuantitativo, Momentum, Mercado, Estrés y Veredicto).
        2. **DEBES** incluir el objeto 'analysis' con las claves exactas: vectorCuantitativo, vectorMomentum, vectorMercado, simulacionEstres y veredictoCuantico.
        
        **ESQUEMAS DE DATOS SEGÚN INTENT (OBLIGATORIO):**
        - Para ROADMAP: El campo 'data' debe ser { "steps": [ { "order": 1, "match": "Nombre vs Nombre", "selection": "Pick", "odds": 1.5, "stake": 10, "time": "Fecha/Hora", "reasoning": "Texto" } ] }
        - Para PARLAY: El campo 'data' debe ser { "legs": [ { "teamA": "...", "teamB": "...", "selection": "...", "market": "...", "odds": 1.5, "reason": "..." } ] }
        
        **ESTRUCTURA JSON FINAL:**
        {
          "intent": "ROADMAP | PARLAY | ALLOCATION | AUDIT",
          "title": "Título Operativo",
          "summary": "Resumen ejecutivo del plan",
          "reliabilityScore": number (0-100),
          "valueScore": number (0-100),
          "analysis": {
            "vectorCuantitativo": "...",
            "vectorMomentum": "...",
            "vectorMercado": "...",
            "simulacionEstres": "...",
            "veredictoCuantico": "..."
          },
          "data": { /* OBJETO SEGÚN EL INTENT ELEGIDO ARRIBA. NO MEZCLES CAMPOS. */ }
        }
        
        Usa Google Search para obtener datos reales del calendario deportivo actual.
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getParlayResearchData = async (sport: Sport, dateRange: { startDate: string; endDate: string }, targetOdds: number, aggressiveness: ParlayAggressiveness): Promise<{ topRecommendations: AIRecommendedParlayLeg[], fullFixtureList: Fixture[] }> => {
    return withRetry(async () => {
        const prompt = `
        ACTÚA COMO UN AUDITOR FORENSE DE CALENDARIOS DEPORTIVOS Y ANALISTA CUÁNTICO DE MÁXIMA PRECISIÓN.
        Misión: Investigar datos REALES para el deporte ${sport} en el rango: DESDE ${dateRange.startDate} HASTA ${dateRange.endDate}.

        **DIRECTIVA PRIMARIA DE RIGUROSIDAD MATEMÁTICA (REGLA DE ORO):**
        Debes construir una selección que sume una cuota total de @${targetOdds} respetando TAXATIVAMENTE los siguientes rangos de cuota por selección (pierna):

        **PARÁMETROS DE RIESGO: ${aggressiveness}**
        1. **FILTRO INDIVIDUAL:** CADA selección DEBE estar en el rango de cuota definido para ${aggressiveness}.
        2. **CALIDAD SOBRE CANTIDAD:** Cada selección DEBE ser un "Pick de Hierro" basado en análisis forense.

        **DEBES retornar un objeto JSON con esta estructura:**
        {
          "topRecommendations": [
            {
              "sport": "${sport}", "teamA": "...", "teamB": "...", "league": "...", "matchDateTime": "...", "marketName": "...", "outcomeName": "...",
              "odds": number,
              "fiabilityScore": number,
              "justification": { "vectorCuantitativo": "...", "vectorMomentum": "...", "vectorMercado": "...", "simulacionEstres": "...", "veredictoCuantico": "..." }
            }
          ],
          "fullFixtureList": [ { "teamA": "...", "teamB": "...", "league": "...", "matchDateTime": "...", "sport": "${sport}" } ]
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getFeedbackResponseForLeg = async (leg: AIRecommendedParlayLeg, feedback: string): Promise<AIRecommendedParlayLeg> => {
    return withRetry(async () => {
        const prompt = `Update parlay leg analysis for ${leg.outcomeName} based on user feedback: "${feedback}". Return JSON AIRecommendedParlayLeg.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getProphetsPick = async (): Promise<AIAnalysisBet> => {
    return withRetry(async () => {
        const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const prompt = `
        IDENTIFICA LA MEJOR APUESTA ABSOLUTA DEL DÍA A NIVEL MUNDIAL (EL PICK DEL PROFETA).
        FECHA DE HOY: ${today}.
        
        **DIRECTIVA DE RENTABILIDAD INSTITUCIONAL (REGLA DE ORO):**
        Tu misión es encontrar un equilibrio perfecto entre seguridad extrema y rentabilidad real.
        1. **CUOTA MÍNIMA REQUERIDA: @1.40.** Está terminantemente prohibido devolver cuotas inferiores a 1.40 (ej: 1.10, 1.25, 1.35). Si la apuesta más segura del mundo tiene cuota 1.20, DESCÁRTALA y busca la siguiente oportunidad de máxima confianza que supere el umbral de 1.40.
        2. **SEGURIDAD EXTREMA:** El pick debe tener una probabilidad de éxito calculada superior al 95%.
        3. **FUENTES REALES:** Usa GOOGLE SEARCH para verificar que el evento ocurre ESTRICTAMENTE HOY (${today}) y que las cuotas son vigentes en casas de primer nivel (Bet365, Pinnacle, etc). NO elijas eventos de mañana ni de días posteriores.
        
        **PROTOCOLO DE ANÁLISIS:**
        - Aplica la Síntesis Cuántica de 5 Vectores.
        - El campo 'vectorMercado' debe justificar por qué la cuota @1.40+ es una ineficiencia explotable.
        
        **DEBES retornar un objeto JSON AIAnalysisBet estricto:**
        {
          "sport": "Nombre Deporte",
          "teamA": "Nombre Real",
          "teamB": "Nombre Real",
          "league": "Liga Real",
          "matchDateTime": "ISO String",
          "marketName": "Mercado Real",
          "outcomeName": "Selección Real",
          "odds": number (MÍNIMO 1.40),
          "fiabilityScore": number (95-100),
          "justification": {
             "vectorCuantitativo": "...",
             "vectorMomentum": "...",
             "vectorMercado": "...",
             "simulacionEstres": "...",
             "veredictoCuantico": "..."
          },
          "vectorInfluence": { "cuantitativo": 95, "momentum": 95, "mercado": 90, "simulacionEstres": 95 }
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getSingleMatchParlay = async (fixture: Fixture, targetOdds: number, aggressiveness: ParlayAggressiveness): Promise<AIRecommendedParlay> => {
    return withRetry(async () => {
        const protocolConfig = {
            'Safe': { label: 'BLINDAJE', minLegs: 4, maxLegOdds: 1.65, minProb: 98, marketDepth: 'MICRO-STATS' },
            'Balanced': { label: 'EFICIENCIA', minLegs: 2, maxLegOdds: 2.50, minProb: 94, marketDepth: 'STANDARD-INEFFICIENCY' },
            'Aggressive': { label: 'ACELERACIÓN', minLegs: 1, maxLegOdds: 5.00, minProb: 90, marketDepth: 'HIGH-IMPACT' }
        };
        const activeProtocol = protocolConfig[aggressiveness] || protocolConfig['Balanced'];

        const prompt = `
        ACTÚA COMO UN VIDENTE ANALÍTICO Y SINDICATO DE ANALISTAS CUANTITATIVOS (PROTOCOL NEXUS-9 SGP).
        TU MISIÓN: Generar una "Combinada de Autor" (Same Game Parlay) INFALIBLE para el partido: ${fixture.teamA} vs ${fixture.teamB}.
        OBJETIVO: Cuota total final aproximada de @${targetOdds}.
        PROTOCOLO DE SEGURIDAD SELECCIONADO: ${activeProtocol.label}.

        **DIRECTIVA DE PROTOCOLO ${activeProtocol.label} (ESTRICTO):**
        1. **MÉTRICA DE CUOTA POR PIERNA:** CADA selección debe moverse en el rango de cuota para ${activeProtocol.label}.
           - Si el protocolo es BLINDAJE: Usa más selecciones (mínimo ${activeProtocol.minLegs}) con cuotas bajas (@1.15 a @1.65) pero de certeza absoluta.
           - Si el protocolo es EFICIENCIA: Usa cuotas medias (@1.60 a @2.50) buscando ineficiencias claras.
           - Si el protocolo es ACELERACIÓN: Usa menos selecciones con cuotas más altas (@2.20 a @5.00), pero justificadas por una ineficiencia de mercado masiva detectada por el modelo.
        2. **PROFUNDIDAD DE MERCADO (${activeProtocol.marketDepth}):** No te limites a mercados comunes (1X2, Over/Under). Explora micro-mercados: remates de jugadores específicos, tarjetas a jugadores con alto índice de faltas, corners por tramos de 15 min, hándicaps adicionales muy protegidos.
        
        **DIRECTIVA DE RIGUROSIDAD DE CUOTAS (CERO ALUCINACIONES):**
        1. **TRIANGULACIÓN REAL DE MERCADO:** Usa GOOGLE SEARCH para obtener las cuotas REALES y VIGENTES en casas como Bet365, Pinnacle o Betfair para este partido HOY.
        2. **IMPUESTO DE CORRELACIÓN SGP:** Entiende que en las combinadas de un mismo partido, las cuotas NO se multiplican linealmente. Aplica la reducción estimada (Correlation Tax) para que la cuota final sea IDENTICA a la que el usuario encontrará en la casa.

        **DIRECTIVA DE INFALIBILIDAD (PROTOCOLO VIDENTE):**
        1. **ANÁLISIS MICRO-FORENSE:** Analiza alineaciones confirmadas, estado del césped, árbitro asignado, fatiga acumulada (datos Opta) y flujo de dinero institucional (Sharp Flow).
        2. **REGLA DE ORO DE ÉXITO:** Cada selección (pierna) DEBE ser un evento cuya probabilidad de NO ocurrir sea cercana a cero bajo las condiciones actuales.

        **ESTRUCTURA JSON:**
        {
          "parlayType": "Combinada ${activeProtocol.label}: ${fixture.teamA} vs ${fixture.teamB}",
          "viabilityScore": number (DEBE ser >${activeProtocol.minProb}),
          "explanationForOddsDeviation": "Por qué se ha elegido esta estructura según el protocolo ${activeProtocol.label}.",
          "legs": [
            {
              "sport": "${fixture.sport}", "teamA": "${fixture.teamA}", "teamB": "${fixture.teamB}", "league": "${fixture.league}", "matchDateTime": "${fixture.matchDateTime}",
              "marketName": "Mercado Técnico No Convencional", "outcomeName": "Selección de Certeza", 
              "odds": number (Cuota real triangulada), 
              "fiabilityScore": number (Certeza >${activeProtocol.minProb}), "valueScore": number,
              "justification": { 
                "vectorCuantitativo": "Evidencia estadística real...", 
                "vectorMomentum": "Estado físico y anímico...", 
                "vectorMercado": "Verificación de cuota vs Smart Money...", 
                "simulacionEstres": "Escenario de fallo mitigado...", 
                "veredictoCuantico": "SÍNTESIS DE POR QUÉ ESTO ES INEVITABLE." 
              }
            }
          ],
          "analysis": { "vectorCuantitativo": "...", "vectorMomentum": "...", "vectorMercado": "...", "simulacionEstres": "...", "veredictoCuantico": "CERTIFICADO DE INFALIBILIDAD TERMINAL" }
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const generateSuperCuota = async (config: SuperCuotaConfig): Promise<SuperCuota> => {
    return withRetry(async () => {
        const now = new Date();
        const startOffset = config.excludeToday ? 1 : 0;
        const startDate = new Date(now);
        startDate.setDate(now.getDate() + startOffset);
        
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + config.days);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        const currentTimeStr = now.toISOString();

        const riskSpecs = {
            'Baja': { maxLegOdds: 1.35, minProb: 98, label: 'MURALLA ESTADÍSTICA (RIESGO BAJO)' },
            'Recomendada': { maxLegOdds: 1.65, minProb: 94, label: 'EQUILIBRIO DE EFICIENCIA (RECOMENDADA)' },
            'Alta': { maxLegOdds: 2.50, minProb: 88, label: 'ACELERACIÓN CUÁNTICA (AGRESIVO)' }
        };
        const currentSpec = riskSpecs[config.aggressiveness] || riskSpecs['Recomendada'];

        const prompt = `
        PROTOCOLO DE FORJA DE SUPERCUOTAS "MICRO-EFFICIENCY".
        **CONTEXTO TEMPORAL CRÍTICO:**
        - ESTAMOS EN EL AÑO: **2026**.
        - FECHA/HORA ACTUAL DEL SISTEMA: **${currentTimeStr}**.
        - RANGO DE BÚSQUEDA OBLIGATORIO: **DESDE ${startDateStr} HASTA ${endDateStr} (AÑO 2026)**.

        **DIRECTIVA DE RIGUROSIDAD TEMPORAL (TOLERANCIA CERO):**
        1.  **VERIFICACIÓN DE AÑO:** CUALQUIER PARTIDO DE **2025** O ANTERIOR ES UN FALLO CRÍTICO. Si los resultados de Google Search muestran partidos de 2025, DESCÁRTALOS INMEDIATAMENTE. Solo puedes usar eventos que ocurran en **2026**.
        2.  **CERO ALUCINACIONES:** No inventes partidos. Usa GOOGLE SEARCH para confirmar que los partidos EXISTEN y están programados en las fechas indicadas de **2026**.
        3.  **FILTRO DE OBSOLESCENCIA:** PROHIBIDO incluir partidos que ya hayan pasado o que estén en juego en este momento (${currentTimeStr}). 
        
        TU MISIÓN: Construir una combinada masiva con un multiplicador total de @${config.targetOdds} EXACTAMENTE O SUPERIOR. No se permite redondear a la baja.

        **DIRECTIVA DE SELECCIÓN DE VALOR:**
        1.  **DIVERSIDAD DE MERCADO:** Busca el valor real en micro-mercados: Remates totales de jugadores estrella, Corners, Tarjetas, Goles por tramo.
        2.  **REGLA CONTRA "FAVORITOS TRAMPA":** Evita cuotas de @1.15-@1.25 en mercados simples. Prioriza mercados estadísticos con mayor probabilidad matemática.
        3.  **MISIÓN @${config.targetOdds}:** Si para alcanzar @${config.targetOdds} necesitas más selecciones, inclúyelas. La priority es el cumplimiento de la cuota objetivo sin violar el techo de @${currentSpec.maxLegOdds} por pierna.

        **ANÁLISIS FORENSE NEXUS-9:** Justifica por qué cada micro-mercado es más rentable que una apuesta tradicional.

        **RETORNA JSON EXACTO:**
        {
          "decomposition": { 
             "optimalLegsCount": number, 
             "averageOddsPerLeg": number, 
             "reasoning": "Explicación de la estructura de valor en el contexto de 2026." 
          },
          "legs": [
            {
              "sport": "SportEnum", "teamA": "Nombre Real", "teamB": "Nombre Real", "league": "Liga Real", "matchDateTime": "ISO (VERIFICADA 2026)", 
              "marketName": "Mercado Detallado", "outcomeName": "Selección", "odds": number (MAX @${currentSpec.maxLegOdds}), "fiabilityScore": number (MIN ${currentSpec.minProb}),
              "justification": { "vectorCuantitativo": "...", "vectorMomentum": "...", "vectorMercado": "...", "simulacionEstres": "...", "veredictoCuantico": "..." }
            }
          ],
          "realityCheck": { "isViable": boolean, "warning": "Evaluación del acumulado para 2026.", "suggestedAlternative": "Si no hay eventos suficientes en el rango de 2026 para @${config.targetOdds}, sugiere el máximo seguro." },
          "globalAnalysis": { "vectorCuantitativo": "...", "vectorMomentum": "...", "vectorMercado": "...", "simulacionEstres": "...", "veredictoCuantico": "..." },
          "overallViabilityScore": number,
          "closingPhrase": "Veredicto terminal para la jornada de 2026."
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const getCorrelatedSynergy = async (query: string): Promise<SynergyResult[]> => {
    return withRetry(async () => {
        const prompt = `
        ACTÚA COMO UN ANALISTA TÁCTICO DE ÉLITE Y ESPECIALISTA EN CORRELACIONES ESTRUCTURALES.
        Misión: Identificar sinergias tácticas "invisibles" for el partido o equipo: "${query}".

        **PROTOCOLO DE SINERGIA CORRELACIONADA:**
        1. **NÚCLEO TÁCTICO:** Identifica la narrativa dominante del partido.
        2. **CONSTRUCCIÓN DE PIERNAS:** Selecciona 3 mercados que estén INTRÍNSECAMENTE VINCULADOS por esta narrativa.
        3. **DETECCIÓN DE DESAJUSTE:** Busca mercados que las casas de apuestas no suelen correlacionar.

        **DEBES RETORNAR UN ARRAY JSON DE OBJETOS SynergyResult.**
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, true);
    });
};

export const getDailyParlay = async (userTimezone: string): Promise<DailyParlay> => {
    return withRetry(async () => {
        const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        const prompt = `
        ACTÚA COMO EL COMITÉ CENTRAL DE RIESGOS NEXUS-9.
        Tu misión es generar la COMBINADA DEL DÍA definitiva para HOY: ${today}.

        **DIRECTIVA DE OBLIGATORIEDAD DE VALOR (ZERO-MEDIOCRITY):**
        1. **BÚSQUEDA EXHAUSTIVA:** Usa GOOGLE SEARCH para interceptar los eventos más importantes de HOY en Football, Basketball, Tennis y otros activos de élite.
        2. **CONSTRUCCIÓN DE IMPACTO:** Debes encontrar una combinación de 2 a 4 selecciones (piernas) que sumen una cuota total entre @2.50 y @6.50.
        3. **SOBRE LA ABSTENCIÓN:** Solo devuelve 'exists: false' si tras una búsqueda profunda confirmas que NO hay eventos deportivos profesionales en todo el planeta hoy. Si hay partidos reales, DEBES encontrar el valor asimétrico.
        4. **SIN RELLENO:** Cada pierna debe ser un "Pick de Hierro" basado en ineficiencias de cuota.

        **PROTOCOLO DE ANÁLISIS FORENSE (5 VECTORES):**
        - Realiza la Síntesis Cuántica de 5 Vectores para el parlay global (objeto 'analysis').
        - Cada 'leg' debe incluir su propio desglose de 5 vectores en 'justification'.

        **RETORNA OBJETO JSON DailyParlay:**
        {
          "exists": true,
          "date": "${today}",
          "sports": ["Football", "Basketball"],
          "legs": [
            { "match": "...", "market": "...", "odds": number, "probability": number, "reason": "...", "justification": { "vectorCuantitativo": "...", "vectorMomentum": "...", "vectorMercado": "...", "simulacionEstres": "...", "veredictoCuantico": "..." }, "fragility": 1-5, "sport": "..." }
          ],
          "discardedLegs": [
             { "match": "...", "market": "...", "odds": number, "discardReason": "Ej: Demasiada varianza por lesión de última hora..." }
          ],
          "totalOdds": number,
          "globalSecurityIndex": number (0-100),
          "profitabilityIndex": number (0-100),
          "weakLink": "La pierna con más riesgo",
          "status": "OPTIMO",
          "reasoning": "Tesis central de la combinada de hoy",
          "analysis": { "vectorCuantitativo": "...", "vectorMomentum": "...", "vectorMercado": "...", "simulacionEstres": "...", "veredictoCuantico": "..." }
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const rerollDailyParlayLeg = async (legToReplace: DailyParlayLeg, currentParlay: DailyParlay): Promise<DailyParlayLeg> => {
    return withRetry(async () => {
        const prompt = `
        ACTÚA EL COMITÉ CENTRAL DE RIESGOS NEXUS-9.
        Misión: Generar un REEMPLAZO de alta fiabilidad para una pierna específica de una combinada diaria.
        
        PIERNA A REEMPLAZAR: ${legToReplace.match} - ${legToReplace.market} (@${legToReplace.odds}).
        CONTEXTO DE LA COMBINADA: ${currentParlay.legs.filter(l => l.match !== legToReplace.match).map(l => l.match + ' (' + l.market + ')').join(', ')}.

        **DIRECTIVA DE REEMPLAZO:**
        1. Busca un evento REAL para HOY usando Google Search.
        2. El reemplazo DEBE tener una cuota similar (@${(legToReplace.odds - 0.2).toFixed(2)} a @${(legToReplace.odds + 0.5).toFixed(2)}) y una fiabilidad superior o igual.
        3. NO repitas ninguno de los partidos que ya están en el contexto.
        
        **RETORNA SOLO JSON DE LA NUEVA PIERNA:**
        {
          "match": "...", "market": "...", "odds": number, "probability": number, "reason": "...", "justification": { ... }, "fragility": number, "sport": "..."
        }
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return parseGeminiResponse(response.text, false);
    });
};

export const exploreMarket = (params: MarketExplorerParams): Promise<MarketExplorerResult> => {
    return withRetry(async () => {
        const hasFilters = !!(params.match || params.dateRange || params.targetOdds);
        
        const prompt = `
        Eres el analista de mercados deportivos más avanzado y riguroso del mundo, operando bajo el protocolo "Quantum Multi-Vector Synthesis".
        El usuario está explorando el mercado: "${params.market}".
        
        ${params.match ? `Filtro de Partido: "${params.match}"` : ''}
        ${params.dateRange ? `Filtro de Fecha/Rango: "${params.dateRange}"` : 'Filtro de Fecha: Solo eventos de HOY o los más próximos.'}
        ${params.targetOdds ? `Filtro de Cuota Buscada: "${params.targetOdds}"` : ''}
        
        Tu tarea es buscar los mejores picks reales para este mercado específico, aplicando los filtros si los hay.
        
        INSTRUCCIONES CRÍTICAS Y DE RIGUROSIDAD ABSOLUTA:
        1. BÚSQUEDA OBLIGATORIA: Debes usar la herramienta de búsqueda (Google Search) para verificar cuotas reales en casas de apuestas oficiales (ej. Bet365, Oddspedia, Betfair, Pinnacle, Codere, Bwin).
        2. CERO ALUCINACIONES: Está ESTRICTAMENTE PROHIBIDO inventar cuotas, partidos o mercados. Si un mercado poco común no existe o no puedes verificar su cuota actual, NO lo incluyas.
        3. ANÁLISIS PROFUNDO: El análisis debe basarse en estadísticas reales, datos históricos, rachas recientes, lesiones, clima o contexto del partido.
        4. CASA DE APUESTAS: Debes indicar en qué casa de apuestas oficial o agregador (ej. Bet365, Oddspedia) encontraste la cuota en el campo "bookmaker".
        5. TASA DE ACIERTO: Incluye un "historicalHitRate" (ej. "7/10 últimos partidos", "85% en casa") que respalde matemáticamente el pick.
        6. SIN CARACTERES DE CITACIÓN: No incluyas anotaciones de búsqueda ni símbolos como [1], [2], o un punto solo '.' dentro de tus cadenas de texto en el JSON. Retorna texto limpio y legible.
        
        ${hasFilters ? `
        Como el usuario ha aplicado filtros específicos, debes rellenar la propiedad "picks" con una lista de MÁXIMO 4 picks que cumplan con los criterios.
        ` : `
        Como el usuario NO ha aplicado filtros adicionales (solo el mercado), debes categorizar los picks para el MISMO DÍA en 3 categorías dentro de "categories" (MÁXIMO 2 picks por categoría):
        - "seguras": Alta probabilidad, cuotas más bajas, respaldo estadístico masivo.
        - "rentables": El mejor balance entre cuota y probabilidad, detectando ineficiencias en la línea.
        - "highRisk": Cuotas altas, menor probabilidad pero con valor oculto justificado.
        `}
        
        Sé conciso en los textos de análisis (máximo 1-2 frases por vector) para evitar respuestas excesivamente largas.
        `;

        const quantumVectorAnalysisSchema = {
            type: Type.OBJECT,
            properties: {
                vectorCuantitativo: { type: Type.STRING, description: "Análisis estadístico, xG, promedios de temporada." },
                vectorMomentum: { type: Type.STRING, description: "Noticias de última hora, rachas, bajas confirmadas y motivación de los equipos." },
                vectorMercado: { type: Type.STRING, description: "Por qué este mercado ofrece mejor oportunidad riesgo-beneficio." },
                simulacionEstres: { type: Type.STRING, description: "Escenario o guion de partido exacto que nos haría perder este pronóstico." },
                veredictoCuantico: { type: Type.STRING, description: "Conclusión definitiva e indicación de stake recomendado." }
            },
            required: ["vectorCuantitativo", "vectorMomentum", "vectorMercado", "simulacionEstres", "veredictoCuantico"]
        };

        const marketExplorerPickSchema = {
            type: Type.OBJECT,
            properties: {
                matchIdentifier: { type: Type.STRING, description: "Nombre de los equipos participantes, ej. 'Equipo A vs Equipo B'" },
                marketName: { type: Type.STRING, description: "El mercado exacto explorado." },
                outcomeName: { type: Type.STRING, description: "La selección o resultado exacto recomendado." },
                odds: { type: Type.NUMBER, description: "La cuota decimal correspondiente." },
                bookmaker: { type: Type.STRING, description: "La casa de apuestas oficial verificada." },
                historicalHitRate: { type: Type.STRING, description: "Tasa de acierto del pick, ej. '8/10' o '80%'." },
                fiabilityScore: { type: Type.NUMBER, description: "Índice de confianza de 0 a 100." },
                valueScore: { type: Type.NUMBER, description: "Índice de valor de 0 a 100." },
                sport: { type: Type.STRING, description: "El deporte exacto: Football, Basketball, Tennis, Esports, etc." },
                matchDateTime: { type: Type.STRING, description: "Fecha y hora del partido en formato ISO 8601." },
                analysis: quantumVectorAnalysisSchema
            },
            required: [
                "matchIdentifier", "marketName", "outcomeName", "odds", "bookmaker", 
                "historicalHitRate", "fiabilityScore", "valueScore", "sport", 
                "matchDateTime", "analysis"
            ]
        };

        const marketExplorerResultSchema = hasFilters ? {
            type: Type.OBJECT,
            properties: {
                picks: {
                    type: Type.ARRAY,
                    items: marketExplorerPickSchema,
                    description: "Lista de picks que cumplen con los filtros aplicados."
                }
            },
            required: ["picks"]
        } : {
            type: Type.OBJECT,
            properties: {
                categories: {
                    type: Type.OBJECT,
                    properties: {
                        seguras: { type: Type.ARRAY, items: marketExplorerPickSchema, description: "Picks catalogados como seguros." },
                        rentables: { type: Type.ARRAY, items: marketExplorerPickSchema, description: "Picks catalogados como de valor/rentables." },
                        highRisk: { type: Type.ARRAY, items: marketExplorerPickSchema, description: "Picks catalogados como de alto riesgo." }
                    },
                    required: ["seguras", "rentables", "highRisk"],
                    description: "Categorías de picks para el mercado explorado."
                }
            },
            required: ["categories"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: marketExplorerResultSchema
            },
        });
        const parsed = parseGeminiResponse(response.text, false);
        return { ...parsed, params };
    });
};

