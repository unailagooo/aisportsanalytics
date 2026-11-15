import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';

import firebaseConfigData from '../firebase-applet-config.json';

let firebaseConfig = {
  apiKey: "placeholder",
  authDomain: "placeholder",
  projectId: "placeholder"
};

try {
  if (firebaseConfigData) {
      firebaseConfig = firebaseConfigData;
  }
} catch (e) {
  console.warn("firebase-applet-config.json errors");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// --- Google Sheets Operations ---

export interface ExportResult {
  url: string;
  rowsAdded: number;
  isNew: boolean;
  spreadsheetTitle?: string;
}

export const extractSpreadsheetId = (urlOrId: string): string => {
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  return trimmed;
};

export const getSavedSpreadsheetId = (): string | null => {
  try {
    return localStorage.getItem('linkedGoogleSheetId');
  } catch {
    return null;
  }
};

export const saveSpreadsheetId = (idOrUrl: string | null) => {
  try {
    if (!idOrUrl) {
      localStorage.removeItem('linkedGoogleSheetId');
    } else {
      localStorage.setItem('linkedGoogleSheetId', extractSpreadsheetId(idOrUrl));
    }
  } catch (e) {
    console.warn('Could not save spreadsheet ID to localStorage', e);
  }
};

export const exportBetsToGoogleSheets = async (bets: any[], customIdOrUrl?: string): Promise<ExportResult> => {
  let token = await getAccessToken();
  if (!token) {
    const authRes = await googleSignIn();
    if (authRes) {
      token = authRes.accessToken;
    }
    if (!token) throw new Error("Acceso denegado. Por favor, inicia sesión con tu cuenta de Google.");
  }

  let spreadsheetId: string | null = null;
  let spreadsheetUrl: string | null = null;
  let isNew = false;
  let sheetTitle = 'picks ai';

  // 1. Check if user provided an ID/URL or has one saved in localStorage
  const preferredId = customIdOrUrl ? extractSpreadsheetId(customIdOrUrl) : getSavedSpreadsheetId();

  if (preferredId) {
    // Verify the preferred spreadsheet exists and is accessible
    const testRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${preferredId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (testRes.ok) {
      const data = await testRes.json();
      spreadsheetId = preferredId;
      spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      sheetTitle = data.properties?.title || 'picks ai';
      saveSpreadsheetId(spreadsheetId);
    } else {
      console.warn(`Preferred sheet ID ${preferredId} could not be loaded (${testRes.status}). Falling back to search.`);
    }
  }

  // 2. If no preferred ID, search Drive for any spreadsheet containing 'picks' or 'ai'
  if (!spreadsheetId) {
    const query = encodeURIComponent("(name contains 'picks' or name contains 'Picks' or name contains 'picks ai') and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&orderBy=modifiedTime desc`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        // Find best match (exact or containing 'picks ai')
        const bestMatch = searchData.files.find((f: any) => 
          f.name?.toLowerCase().includes('picks ai') || f.name?.toLowerCase() === 'picks ai'
        ) || searchData.files[0];

        spreadsheetId = bestMatch.id;
        spreadsheetUrl = bestMatch.webViewLink || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
        sheetTitle = bestMatch.name || 'picks ai';
        saveSpreadsheetId(spreadsheetId);
      }
    }
  }

  // 3. Create if not found anywhere
  if (!spreadsheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: `picks ai`
        }
      })
    });

    if (!createRes.ok) {
       const text = await createRes.text();
       throw new Error(`Error al crear el documento 'picks ai': ${text}`);
    }

    const created = await createRes.json();
    spreadsheetId = created.spreadsheetId;
    spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    sheetTitle = 'picks ai';
    isNew = true;
    saveSpreadsheetId(spreadsheetId);
  }

  // 4. Get the first sheet's name to avoid localization issues
  const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!getRes.ok) {
     throw new Error(`Error al obtener información de la hoja: ${await getRes.text()}`);
  }
  
  const sheetInfo = await getRes.json();
  const firstSheetTitle = sheetInfo.sheets?.[0]?.properties?.title || 'Hoja 1';

  // 5. Check if the sheet already has data/headers in row 1
  let hasHeaders = false;
  try {
    const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetTitle)}!A1:I1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (checkData.values && checkData.values.length > 0 && checkData.values[0].length > 0) {
        hasHeaders = true;
      }
    }
  } catch (e) {
    console.warn("Could not check existing headers", e);
  }

  // 6. Format data for the sheet
  const headers = ['ID', 'Deporte', 'Combinación', 'Acontecimiento', 'Mercado', 'Selección', 'Cuota', 'Confianza (%)', 'Fecha'];
  const values = bets.map(b => [
      b.id || Math.random().toString(36).substring(7),
      b.sport || 'Unknown',
      b.parlayId ? 'Sí' : 'No',
      b.matchIdentifier || b.match || `${b.homeTeam || ''} vs ${b.awayTeam || ''}`,
      b.marketName || b.market || '',
      b.outcomeName || b.selection || '',
      b.odds || 1.0,
      b.fiabilityScore || b.probability || 'N/A',
      b.matchDateTime ? new Date(b.matchDateTime).toLocaleString() : new Date().toLocaleString()
  ]);

  const payloadValues = (!hasHeaders || isNew) ? [headers, ...values] : values;
  const body = {
    values: payloadValues
  };

  // 7. Append data to the sheet (adds new rows to the existing ones)
  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetTitle)}!A1:I:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!updateRes.ok) {
     const errorText = await updateRes.text();
     throw new Error(`Error al añadir filas al documento: ${errorText}`);
  }

  return {
    url: spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    rowsAdded: values.length,
    isNew,
    spreadsheetTitle: sheetTitle
  };
};
