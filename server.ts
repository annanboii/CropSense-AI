import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db";

dotenv.config();

const app = express();
const PORT = 3000;

app.set("trust proxy", 1);

// Helper to determine accurate public origin
function getAppOrigin(req: express.Request): string {
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "";
  const forwardedProto = (req.headers["x-forwarded-proto"] as string) || (req.secure ? "https" : "http");
  if (host) {
    const proto = host.includes("run.app") ? "https" : forwardedProto;
    return `${proto}://${host}`;
  }
  return process.env.APP_URL || `http://localhost:${PORT}`;
}

// Enable JSON body parser with generous limit for smartphone leaf images
app.use(express.json({ limit: "25mb" }));

// Helper middleware to extract user from Authorization header
function getAuthenticatedUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  return db.findUserByToken(token);
}

// Lazy initialize Gemini client safely
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

// Resilient caller with automatic fallback for high-demand 503 / 429 spikes
async function generateContentWithResilience(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModels?: string[];
  }
) {
  const modelsToTry = params.preferredModels || [
    "gemini-3.1-flash-image",
    "gemini-2.5-flash",
    "gemini-3.8-flash",
  ];

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || err?.code || (err?.error && err.error.code);
      const message = (err?.message || (err?.error && err.error.message) || "").toLowerCase();
      const isTransient =
        status === 503 ||
        status === 429 ||
        status === 500 ||
        status === 504 ||
        message.includes("high demand") ||
        message.includes("unavailable") ||
        message.includes("resource_exhausted") ||
        message.includes("overloaded") ||
        message.includes("rate limit") ||
        message.includes("spikes in demand");

      if (isTransient && i < modelsToTry.length - 1) {
        console.warn(`[Gemini] Model ${model} is experiencing high demand (${message}). Attempting fallback to ${modelsToTry[i + 1]}...`);
        // Brief 400ms pause before fallback
        await new Promise((resolve) => setTimeout(resolve, 400));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// Weather WMO Code to human readable description
function getWeatherDescription(code: number): string {
  const codes: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return codes[code] || "Variable conditions";
}

// ----------------------------------------------------
// 1. API: HEALTH CHECK
// ----------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CropSense AI API",
    geminiAvailable: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// AUTHENTICATION & USER DATA MANAGEMENT ENDPOINTS
// ----------------------------------------------------
app.post("/api/auth/signup", (req, res) => {
  try {
    const { email, password, farmerName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists. Please log in instead." });
    }
    const displayName = farmerName && farmerName.trim() ? farmerName.trim() : cleanEmail.split("@")[0];
    const { user, token } = db.createUser(cleanEmail, password, displayName);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        farmerName: user.farmerName,
        createdAt: user.createdAt,
        farmSetupCompleted: user.farmSetupCompleted,
      },
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Unable to create account. Please try again." });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const authResult = db.validateCredentials(email, password);
    if (!authResult) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const { user, token } = authResult;
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        farmerName: user.farmerName,
        createdAt: user.createdAt,
        farmSetupCompleted: user.farmSetupCompleted,
      },
      farm: user.farm || null,
      crops: user.crops || [],
      scans: user.scans || [],
      alerts: user.alerts || [],
      irrigationRecords: user.irrigationRecords || [],
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

app.get("/api/auth/me", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      farmerName: user.farmerName,
      createdAt: user.createdAt,
      farmSetupCompleted: user.farmSetupCompleted,
      authProvider: user.authProvider || "local",
      avatarUrl: user.avatarUrl,
    },
    farm: user.farm || null,
    crops: user.crops || [],
    scans: user.scans || [],
    alerts: user.alerts || [],
    irrigationRecords: user.irrigationRecords || [],
  });
});

// ----------------------------------------------------
// GOOGLE OAUTH AUTHENTICATION ENDPOINTS
// ----------------------------------------------------
app.get("/api/auth/google/url", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
  const reqRedirect = req.query.redirect_uri as string;
  const origin = getAppOrigin(req);
  const redirectUri = reqRedirect || `${origin.replace(/\/$/, "")}/auth/callback`;

  if (!clientId) {
    return res.json({
      configured: false,
      error: "Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.",
      callbackUrl: redirectUri,
    });
  }

  const scope = encodeURIComponent("openid email profile");
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;

  return res.json({
    configured: true,
    url: authUrl,
    clientId,
    callbackUrl: redirectUri,
  });
});

// Handle Google OAuth Direct Token / Credential Verification
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential, code, redirectUri } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET;

    // Option A: Verification via Google ID Token (Google Identity Services)
    if (credential) {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (!verifyRes.ok) {
        return res.status(401).json({ error: "Invalid Google ID token." });
      }
      const tokenInfo = await verifyRes.json();
      if (!tokenInfo.email) {
        return res.status(400).json({ error: "No email associated with this Google credential." });
      }

      const { user, token, isNewUser } = db.findOrCreateGoogleUser({
        googleId: tokenInfo.sub || tokenInfo.user_id,
        email: tokenInfo.email,
        name: tokenInfo.name || tokenInfo.given_name,
        avatarUrl: tokenInfo.picture,
      });

      return res.json({
        success: true,
        token,
        isNewUser,
        user: {
          id: user.id,
          email: user.email,
          farmerName: user.farmerName,
          createdAt: user.createdAt,
          farmSetupCompleted: user.farmSetupCompleted,
          authProvider: "google",
          avatarUrl: user.avatarUrl,
        },
        farm: user.farm || null,
        crops: user.crops || [],
        scans: user.scans || [],
        alerts: user.alerts || [],
        irrigationRecords: user.irrigationRecords || [],
      });
    }

    // Option B: Authorization code exchange
    if (code) {
      if (!clientId || !clientSecret) {
        return res.status(500).json({
          error: "Google OAuth credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) are missing on the server.",
        });
      }

      const origin = process.env.APP_URL || (req.headers.origin as string) || `http://localhost:${PORT}`;
      const effectiveRedirect = redirectUri || `${origin.replace(/\/$/, "")}/auth/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: effectiveRedirect,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        return res.status(400).json({
          error: tokenData.error_description || tokenData.error || "Failed to exchange authorization code with Google.",
        });
      }

      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await userRes.json();
      if (!profile.email) {
        return res.status(400).json({ error: "Failed to retrieve email from Google profile." });
      }

      const { user, token, isNewUser } = db.findOrCreateGoogleUser({
        googleId: profile.sub || profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
      });

      return res.json({
        success: true,
        token,
        isNewUser,
        user: {
          id: user.id,
          email: user.email,
          farmerName: user.farmerName,
          createdAt: user.createdAt,
          farmSetupCompleted: user.farmSetupCompleted,
          authProvider: "google",
          avatarUrl: user.avatarUrl,
        },
        farm: user.farm || null,
        crops: user.crops || [],
        scans: user.scans || [],
        alerts: user.alerts || [],
        irrigationRecords: user.irrigationRecords || [],
      });
    }

    return res.status(400).json({ error: "Either credential token or authorization code must be provided." });
  } catch (err: any) {
    console.error("Google auth endpoint error:", err);
    return res.status(500).json({ error: err.message || "Failed to process Google sign-in." });
  }
});

// OAuth Callback Route for Popup Window
app.get(["/auth/callback", "/auth/callback/", "/api/auth/google/callback"], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    const errorMsg = (error_description as string) || (error as string) || "Google sign-in was cancelled.";
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Google Sign-In</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { text-align: center; max-width: 380px; padding: 24px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; }
            h3 { color: #f43f5e; margin: 0 0 8px; font-size: 18px; }
            p { color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h3>Sign-In Cancelled</h3>
            <p>${errorMsg}</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${errorMsg}' }, '*');
              setTimeout(function() { window.close(); }, 1500);
            }
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Sign-In</title></head>
        <body style="font-family: system-ui; background: #0f172a; color: #94a3b8; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <p>No authorization code received. You can close this window.</p>
        </body>
      </html>
    `);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const errorMsg = "Google OAuth credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) are not configured on the server.";
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Sign-In</title></head>
        <body style="font-family: system-ui; background: #0f172a; color: #f43f5e; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center;">
          <div>
            <h3>Configuration Error</h3>
            <p style="color: #94a3b8; font-size: 13px;">${errorMsg}</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${errorMsg}' }, '*');
              setTimeout(function() { window.close(); }, 2000);
            }
          </script>
        </body>
      </html>
    `);
  }

  try {
    const origin = getAppOrigin(req);
    const redirectUri = `${origin.replace(/\/$/, "")}/auth/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange authorization token.");
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userInfoRes.json();

    if (!profile.email) {
      throw new Error("Unable to retrieve email address from Google account.");
    }

    const { user, token, isNewUser } = db.findOrCreateGoogleUser({
      googleId: profile.sub || profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    });

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Google Sign-In Successful</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { text-align: center; max-width: 360px; padding: 28px 24px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; }
            .icon { width: 44px; height: 44px; border-radius: 50%; background: #059669; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 22px; font-weight: bold; }
            h3 { color: #34d399; margin: 0 0 6px; font-size: 18px; }
            p { color: #94a3b8; font-size: 13px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h3>Signed In Successfully</h3>
            <p>Welcome, ${profile.name || profile.email}! Redirecting to CropSense AI...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                token: '${token}',
                isNewUser: ${isNewUser},
                email: '${profile.email}'
              }, '*');
              setTimeout(function() { window.close(); }, 600);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    const errorMsg = err.message || "Failed to complete Google authentication.";
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Sign-In Error</title></head>
        <body style="font-family: system-ui; background: #0f172a; color: #f43f5e; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center;">
          <div>
            <h3>Sign-In Failed</h3>
            <p style="color: #94a3b8; font-size: 13px;">${errorMsg}</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${errorMsg}' }, '*');
              setTimeout(function() { window.close(); }, 2000);
            }
          </script>
        </body>
      </html>
    `);
  }
});

app.post("/api/auth/logout", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (user) {
    db.logoutUser(user.id);
  }
  return res.json({ success: true });
});

// Farm Setup & Updates
app.post("/api/user/farm-setup", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in to save farm profile." });
  }
  try {
    const farmData = req.body;
    const updatedUser = db.saveFarmSetup(user.id, farmData);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({
      success: true,
      farm: updatedUser.farm,
      farmerName: updatedUser.farmerName,
      farmSetupCompleted: updatedUser.farmSetupCompleted,
    });
  } catch (err: any) {
    console.error("Farm setup error:", err);
    return res.status(500).json({ error: "Unable to save farm setup." });
  }
});

app.put("/api/user/farm", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in." });
  }
  try {
    const updatedUser = db.saveFarmSetup(user.id, req.body);
    return res.json({ success: true, farm: updatedUser?.farm });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update farm." });
  }
});

// User Crops CRUD
app.get("/api/user/crops", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in." });
  }
  return res.json({ crops: user.crops || [] });
});

app.post("/api/user/crops", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in." });
  }
  try {
    const updatedUser = db.addCrop(user.id, req.body);
    return res.json({ success: true, crops: updatedUser?.crops || [] });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to add crop." });
  }
});

app.put("/api/user/crops/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in." });
  }
  try {
    const updatedUser = db.updateCrop(user.id, req.params.id, req.body);
    return res.json({ success: true, crops: updatedUser?.crops || [] });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update crop." });
  }
});

app.delete("/api/user/crops/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in." });
  }
  try {
    const updatedUser = db.deleteCrop(user.id, req.params.id);
    return res.json({ success: true, crops: updatedUser?.crops || [] });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to delete crop." });
  }
});

// User Scans CRUD
app.get("/api/user/scans", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in." });
  }
  return res.json({ scans: user.scans || [] });
});

app.post("/api/user/scans", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in." });
  }
  try {
    const updatedUser = db.addScan(user.id, req.body);
    return res.json({ success: true, scans: updatedUser?.scans || [] });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to save scan." });
  }
});

app.delete("/api/user/scans/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in." });
  }
  try {
    const updatedUser = db.deleteScan(user.id, req.params.id);
    return res.json({ success: true, scans: updatedUser?.scans || [] });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to delete scan." });
  }
});

// User Alerts
app.post("/api/user/alerts/dismiss", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Please log in." });
  const { alertId } = req.body;
  const updatedUser = db.dismissAlert(user.id, alertId);
  return res.json({ success: true, alerts: updatedUser?.alerts || [] });
});

app.post("/api/user/alerts/read", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Please log in." });
  const { alertId } = req.body;
  const updatedUser = db.markAlertRead(user.id, alertId);
  return res.json({ success: true, alerts: updatedUser?.alerts || [] });
});

// User Irrigation
app.post("/api/user/irrigation/log", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Please log in." });
  const updatedUser = db.logIrrigation(user.id, req.body);
  return res.json({
    success: true,
    crops: updatedUser?.crops || [],
    irrigationRecords: updatedUser?.irrigationRecords || [],
  });
});

// ----------------------------------------------------
// 2. API: REAL WEATHER DATA VIA OPEN-METEO (FREE & NO KEY NEEDED)
// ----------------------------------------------------
app.get("/api/weather", async (req, res) => {
  try {
    const lat = parseFloat((req.query.lat as string) || "36.6777"); // Default: Salinas Valley / Central Valley CA agricultural hub
    const lon = parseFloat((req.query.lon as string) || "-121.6555");

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m,et0_fao_evapotranspiration&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,et0_fao_evapotranspiration,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,uv_index_max,wind_speed_10m_max&timezone=auto&forecast_days=7`;

    const weatherResponse = await fetch(openMeteoUrl);
    if (!weatherResponse.ok) {
      throw new Error(`Open-Meteo API returned status ${weatherResponse.status}`);
    }

    const data = await weatherResponse.json();

    const current = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    const temp = current.temperature_2m ?? 21.5;
    const humidity = current.relative_humidity_2m ?? 65;
    const windSpeed = current.wind_speed_10m ?? 8.5;
    const precip = current.precipitation ?? 0;
    const weatherCode = current.weather_code ?? 0;
    const et0 = current.et0_fao_evapotranspiration ?? 4.2;

    // Evaluate agricultural spraying window quality
    // Ideal: Wind between 3-14 km/h, Temp 12-26°C, Rain prob < 20%
    let sprayingQuality: "Good" | "Moderate" | "Poor" = "Good";
    let sprayRec = "Favorable conditions. Wind drift is minimal and absorption is optimal.";

    if (windSpeed > 18 || temp > 30 || precip > 0.5) {
      sprayingQuality = "Poor";
      sprayRec = windSpeed > 18
        ? "High wind risk: Chemical spray drift likely. Delay spraying until wind drops below 15 km/h."
        : temp > 30
        ? "High temperature: Rapid droplet evaporation and volatilization risk. Spray during early morning."
        : "Precipitation occurring: Wash-off risk. Delay foliar application.";
    } else if (windSpeed < 3 || temp > 26 || humidity < 40) {
      sprayingQuality = "Moderate";
      sprayRec = windSpeed < 3
        ? "Low wind inversion risk: Small droplets may linger in air. Exercise caution with fine nozzles."
        : "Moderate humidity: Suitable for systemic applications during cooler hours.";
    }

    // Growing Degree Days (Base 10°C)
    const maxToday = daily.temperature_2m_max?.[0] ?? temp + 4;
    const minToday = daily.temperature_2m_min?.[0] ?? temp - 6;
    const meanTemp = (maxToday + minToday) / 2;
    const gddToday = Math.max(0, Math.round((meanTemp - 10) * 10) / 10);

    const frostRisk = minToday <= 2;
    const heatStressRisk = maxToday >= 34;

    const rainSum3Days = (daily.precipitation_sum?.slice(0, 3) || []).reduce((a: number, b: number) => a + (b || 0), 0);
    const fieldWorkability = rainSum3Days > 25 ? "Wet / Impassable" : rainSum3Days > 10 ? "Caution" : "Favorable";

    // Format daily array
    const formattedDaily = (daily.time || []).map((t: string, idx: number) => ({
      date: t,
      tempMax: daily.temperature_2m_max?.[idx] ?? 24,
      tempMin: daily.temperature_2m_min?.[idx] ?? 12,
      precipitationSum: daily.precipitation_sum?.[idx] ?? 0,
      precipitationProbMax: daily.precipitation_probability_max?.[idx] ?? 10,
      et0: daily.et0_fao_evapotranspiration?.[idx] ?? 4.0,
      uvIndexMax: daily.uv_index_max?.[idx] ?? 6,
      weatherCode: daily.weather_code?.[idx] ?? 1,
      windSpeedMax: daily.wind_speed_10m_max?.[idx] ?? 12,
      description: getWeatherDescription(daily.weather_code?.[idx] ?? 0),
    }));

    // Format next 24 hourly records
    const formattedHourly = (hourly.time || []).slice(0, 24).map((t: string, idx: number) => ({
      time: t,
      temp: hourly.temperature_2m?.[idx] ?? 20,
      humidity: hourly.relative_humidity_2m?.[idx] ?? 60,
      precipitationProb: hourly.precipitation_probability?.[idx] ?? 0,
      precipitation: hourly.precipitation?.[idx] ?? 0,
      weatherCode: hourly.weather_code?.[idx] ?? 0,
      et0: hourly.et0_fao_evapotranspiration?.[idx] ?? 0.3,
      windSpeed: hourly.wind_speed_10m?.[idx] ?? 8,
    }));

    res.json({
      current: {
        temp,
        apparentTemp: current.apparent_temperature ?? temp,
        humidity,
        precipitation: precip,
        weatherCode,
        weatherDescription: getWeatherDescription(weatherCode),
        surfacePressure: current.surface_pressure ?? 1013,
        cloudCover: current.cloud_cover ?? 20,
        windSpeed,
        windDirection: current.wind_direction_10m ?? 240,
        et0,
        uvIndex: daily.uv_index_max?.[0] ?? 6,
      },
      hourly: formattedHourly,
      daily: formattedDaily,
      agriculturalMetrics: {
        sprayingWindowQuality: sprayingQuality,
        sprayRecommendation: sprayRec,
        gddToday,
        frostRisk,
        heatStressRisk,
        fieldWorkability,
      },
      locationName: (req.query.locationName as string) || "Farm Coordinates",
      coordinates: { latitude: lat, longitude: lon },
      isLive: true,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Open-Meteo live weather fetch failed:", err);
    res.status(502).json({
      error: "Unable to retrieve live weather data from Open-Meteo API",
      message: err.message || "Failed to reach weather service",
      isLive: false,
    });
  }
});

// API: REAL LOCATION SEARCH VIA OPEN-METEO GEOCODING
app.get("/api/weather/search", async (req, res) => {
  try {
    const query = ((req.query.q as string) || "").trim();
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
    const response = await fetch(geoUrl);
    if (!response.ok) {
      throw new Error(`Open-Meteo Geocoding failed with status ${response.status}`);
    }

    const data = await response.json();
    const results = (data.results || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country || "",
      admin1: r.admin1 || "",
      admin2: r.admin2 || "",
      formattedLocation: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
      elevation: r.elevation,
      timezone: r.timezone,
    }));

    res.json({ results });
  } catch (err: any) {
    console.error("Geocoding lookup error:", err);
    res.status(502).json({ error: "Failed to search location", message: err.message });
  }
});

// ----------------------------------------------------
// 3. API: CROP SCANNER (REAL AI MULTIMODAL VISION ASSESSMENT)
// ----------------------------------------------------
app.post("/api/scan-crop", async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = "image/jpeg",
      cropHint = "Crop Specimen",
      stageHint = "Vegetative",
      cropId,
      language = "en",
    } = req.body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({
        error: "Missing image data",
        message: "Please upload or capture a crop leaf photo to analyze.",
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured",
        message:
          "Real AI multimodal image analysis requires GEMINI_API_KEY. Please add your GEMINI_API_KEY in the AI Studio Settings > Secrets panel to enable real crop vision diagnostics.",
      });
    }

    // Extract clean base64 data and normalize mimeType
    let cleanBase64 = imageBase64;
    let detectedMimeType = mimeType;

    const mimeMatch = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (mimeMatch) {
      detectedMimeType = mimeMatch[1];
      cleanBase64 = imageBase64.substring(mimeMatch[0].length);
    } else if (imageBase64.startsWith("data:")) {
      const commaIdx = imageBase64.indexOf(",");
      if (commaIdx !== -1) {
        cleanBase64 = imageBase64.substring(commaIdx + 1);
      }
    }

    // Clean whitespace
    cleanBase64 = cleanBase64.trim().replace(/\s/g, "");

    const isUrdu = language === "ur";

    const prompt = `You are CropSense AI's Expert Agronomic Multimodal Vision Assistant.
You must analyze the provided crop image (leaf, canopy, stem, or fruit specimen) to evaluate its health status, detect any visible foliar diseases, pests, nutritional deficiencies, abiotic stresses, or confirm healthy plant tissue.

CONTEXT PROVIDED BY USER:
- Target Crop: "${cropHint || "Unknown Crop"}"
- Growth Stage: "${stageHint || "Unknown"}"
- Requested Language: "${isUrdu ? "Urdu (اردو)" : "English"}"

EXAMINE VISIBLE FEATURES IN THE IMAGE:
1. Leaf color and vigor (chlorosis, necrosis, yellowing, browning, mottling, bronzing, interveinal discoloration).
2. Spots, lesions, pustules, concentric rings, halo margins, water-soaked margins, or blights.
3. Holes, chewed margins, webbing, insect frass, or visible pest damage.
4. Wilting, curled margins, distortion, or vascular stress.
5. Overall image quality, lighting, and focus.

STRICT ACCURACY & SAFETY INSTRUCTIONS:
- Never present this as a confirmed laboratory diagnosis.
- Always use cautious phrasing such as "Possible [Condition Name]", "AI assessment", "Based on visible features in this image".
- If the image is blurry, out of focus, too dark, or does not clearly show a plant/crop leaf:
  * Set "image_quality": "poor"
  * Set "possible_condition": ${isUrdu ? '"تصویر واضح نہیں ہے / درست جائزہ ممکن نہیں"' : '"Unclear image / Unable to assess crop health confidently"'}
  * Set "confidence": "low"
  * In "visible_observations", explain why the image cannot be evaluated (e.g., blur, poor lighting, or subject not recognized as a plant).
  * In "recommended_actions", provide actionable tips for taking a sharper, well-lit leaf photo.
  * DO NOT invent a disease name when the image is poor or uncertain.
- If the foliage looks completely healthy:
  * Set "image_quality": "good"
  * Set "possible_condition": ${isUrdu ? '"صحت مند پودے کا پتہ / نارمل نشوونما"' : '"Healthy Crop Foliage"'}
  * Set "confidence": "high"
  * Set "severity": "low"
  * Note normal coloration, turgor, and lack of lesions in "visible_observations".

LANGUAGE INSTRUCTION:
${
  isUrdu
    ? "IMPORTANT: Output all text values (possible_condition, visible_observations, recommended_actions, when_to_seek_expert_help, limitations) in clear, simple Urdu (اردو) so that farmers with basic literacy can easily understand."
    : "Output all text values in clear, professional English."
}

You MUST respond strictly with a valid JSON object matching this schema:
{
  "crop_type": "string (identified or confirmed crop name)",
  "image_quality": "good | acceptable | poor",
  "possible_condition": "string (e.g. Possible Early Blight (Alternaria solani) or Healthy Crop Foliage)",
  "confidence": "low | medium | high",
  "severity": "low | moderate | high",
  "visible_observations": [
    "string (observable feature 1)",
    "string (observable feature 2)"
  ],
  "recommended_actions": [
    "string (actionable next step 1)",
    "string (actionable next step 2)"
  ],
  "when_to_seek_expert_help": "string (when the farmer should consult an agronomist or extension specialist)",
  "limitations": "string (clear notice explaining that 2D visual assessment cannot replace laboratory diagnostic assays or field agronomist confirmation)"
}`;

    const response = await generateContentWithResilience(ai, {
      preferredModels: [
        "gemini-3.1-flash-image",
        "gemini-2.5-flash",
      ],
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: detectedMimeType.includes("png")
                  ? "image/png"
                  : detectedMimeType.includes("webp")
                  ? "image/webp"
                  : "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text || "";
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Gemini AI did not return a valid JSON response.");
      }
    }

    // Map fields for robust compatibility with frontend
    const confidenceLevel: "low" | "medium" | "high" =
      parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
        ? parsed.confidence
        : "medium";

    const numericConfidence =
      typeof parsed.confidence === "number"
        ? parsed.confidence
        : confidenceLevel === "high"
        ? 92
        : confidenceLevel === "medium"
        ? 78
        : 45;

    const rawSeverity = (parsed.severity || "low").toLowerCase();
    const severityMapped: "Healthy" | "Mild" | "Moderate" | "Severe" =
      parsed.possible_condition?.toLowerCase().includes("healthy") || parsed.possible_condition?.includes("صحت مند")
        ? "Healthy"
        : rawSeverity === "high"
        ? "Severe"
        : rawSeverity === "moderate"
        ? "Moderate"
        : "Mild";

    const urgency: "Immediate" | "Within 48h" | "Routine" | "None" =
      severityMapped === "Severe"
        ? "Immediate"
        : severityMapped === "Moderate"
        ? "Within 48h"
        : severityMapped === "Healthy"
        ? "None"
        : "Routine";

    const formattedDiagnosis = parsed.possible_condition?.startsWith("Possible") ||
      parsed.possible_condition?.startsWith("ممکنہ") ||
      parsed.possible_condition?.toLowerCase().includes("healthy") ||
      parsed.possible_condition?.includes("صحت مند")
      ? parsed.possible_condition
      : `Possible condition: ${parsed.possible_condition}`;

    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullImageUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:${detectedMimeType};base64,${cleanBase64}`;

    const formattedResult = {
      id: scanId,
      timestamp: new Date().toISOString(),
      cropId: cropId || undefined,
      imageUrl: fullImageUrl,
      crop_type: parsed.crop_type || cropHint || "Crop Specimen",
      cropType: parsed.crop_type || cropHint || "Crop Specimen",
      image_quality: parsed.image_quality || "good",
      possible_condition: parsed.possible_condition || "Possible Crop Health Assessment",
      possibleCondition: parsed.possible_condition || "Possible Crop Health Assessment",
      diagnosis: formattedDiagnosis,
      confidenceLevel,
      confidence: numericConfidence,
      severity: severityMapped,
      severityLevel: rawSeverity,
      visible_observations: parsed.visible_observations || [],
      visibleSymptoms: parsed.visible_observations || [],
      symptoms: parsed.visible_observations || [],
      recommended_actions: parsed.recommended_actions || [],
      recommendedNextSteps: parsed.recommended_actions || [],
      when_to_seek_expert_help: parsed.when_to_seek_expert_help || "",
      limitations:
        parsed.limitations ||
        (isUrdu
          ? "یہ ایک ابتدائی AI پر مبنی جائزہ ہے اور اسے تصدیق شدہ زرعی تشخیص نہیں سمجھا جانا چاہیے۔ کیمیائی اسپرے سے پہلے مقامی ماہر زراعت سے تصدیق لازمی ہے۔"
          : "This is an AI-based preliminary assessment and should not be considered a confirmed agricultural diagnosis. Photographic analysis cannot verify microscopic pathogens without laboratory assay."),
      urgency,
      stageAssessment: stageHint
        ? isUrdu
          ? `پودے کے ${stageHint} مرحلے کے دوران جائزہ لیا گیا۔`
          : `Canopy assessed during ${stageHint} stage.`
        : undefined,
    };

    return res.json(formattedResult);
  } catch (err: any) {
    console.error("Real AI crop scan error:", err);
    return res.status(500).json({
      error: "AI image analysis failed",
      message:
        err.message ||
        "Failed to analyze the crop leaf photo with Gemini AI. Please check your image clarity or connection and try again.",
    });
  }
});

// ----------------------------------------------------
// 4. API: FARM ADVISOR (CONVERSATIONAL AGRONOMY EXPERT)
// ----------------------------------------------------
app.post("/api/farm-advisor", async (req, res) => {
  try {
    const { messages = [], farmContext = {} } = req.body;
    const latestMessage = messages[messages.length - 1]?.content || "Help with crop management";

    const ai = getGeminiClient();

    if (ai) {
      const isUrdu = farmContext.language === "ur" || /[\u0600-\u06FF]/.test(latestMessage);
      const systemInstruction = `You are CropSense AI's Chief Agronomist and Crop Management Advisor.
You assist commercial and smallholder farmers with practical, evidence-based agricultural recommendations.
Farm Context:
- Farm Name: ${farmContext.name || "Commercial Farm"}
- Location: ${farmContext.location || "California"} (${farmContext.latitude || 36.67}°N, ${farmContext.longitude || -121.65}°W)
- Soil Type: ${farmContext.primarySoilType || "Loam"}
- Active Crops: ${JSON.stringify(farmContext.crops || [])}

Provide clear, professional, direct, and actionable farming advice. Use concise bullet points, specific scientific rationale (e.g. soil texture, water infiltration rate, nutrient uptake kinetics), and practical field steps. Do not invent hardware or sensor references. Keep advice grounded in real agronomic science.
${isUrdu ? "The farmer prefers Urdu language. Provide all advice in simple, easy-to-understand Urdu suitable for Pakistani farmers, retaining key technical or chemical names in English in parentheses if necessary." : ""}`;

      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await generateContentWithResilience(ai, {
        preferredModels: [
          "gemini-3.8-flash",
          "gemini-2.5-flash",
        ],
        contents,
        config: {
          systemInstruction,
        },
      });

      return res.json({
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: response.text || "I recommend monitoring soil moisture and adjusting your irrigation schedule accordingly.",
        timestamp: new Date().toISOString(),
      });
    }

    // Agronomic Rules Engine Fallback
    const query = latestMessage.toLowerCase();
    let responseText = "Here are tailored agronomic recommendations for your field:";

    if (query.includes("irrigation") || query.includes("water") || query.includes("dry")) {
      responseText = `### Irrigation & Water Management Strategy
Based on your soil and crop profile:
1. **Soil Infiltration & Field Capacity**: In loam to clay-loam soils, allow top 5-7 cm to dry slightly between cycles to promote deeper root penetration and prevent hypoxic root stress.
2. **Evapotranspiration Alignment**: During peak vegetative growth, crops consume 4.5–6.0 mm/day ($ET_0$). Apply irrigation during pre-dawn (04:00–07:00 AM) to cut evaporative losses by up to 28%.
3. **Rain Offset Check**: Always inspect the 72-hour forecast before running heavy cycles. If >10 mm precipitation is forecasted within 48h, postpone irrigation to conserve water and prevent nutrient leaching.`;
    } else if (query.includes("fertilizer") || query.includes("nitrogen") || query.includes("npk") || query.includes("nutrient")) {
      responseText = `### Nutrient & Fertilizer Application Guidelines
1. **Nitrogen Timing**: Split nitrogen applications into 2-3 split doses (at planting, mid-vegetative, and early reproductive) rather than a single large basal dose to prevent nitrate leaching into groundwater.
2. **Soil Moisture Condition**: Never broadcast granular urea or ammonium nitrate onto bone-dry soil or immediately prior to heavy torrential downpours.
3. **Foliar Micronutrients**: If leaves exhibit interveinal chlorosis (Magnesium/Iron deficiency), apply chelated micronutrient sprays in the early morning when stomata are fully open.`;
    } else if (query.includes("blight") || query.includes("fungus") || query.includes("disease") || query.includes("mildew")) {
      responseText = `### Disease Management & Canopy Protection
1. **Foliar Moisture Control**: Fungal spores require 4–8 continuous hours of leaf wetness to germinate. Avoid overhead sprinklers and thin dense lower canopy foliage.
2. **Preventive Bio-controls**: Apply biological fungicides (*Bacillus subtilis* or *Trichoderma*) preventively before symptoms expand beyond 5% of leaf area.
3. **Chemical Rotation**: If using conventional fungicides, alternate FRAC codes (e.g. QoI Strobilurins with DMI Triazoles) to prevent pathogen resistance build-up.`;
    } else {
      responseText = `### CropSense Agronomic Assessment
- **Field Priority**: Maintain balanced soil aeration and monitor weekly canopy growth rates.
- **Crop Scouting**: Scout fields twice weekly along a 'W' shaped walking path to catch pest hotspots before they reach economic injury thresholds.
- **Weather Watch**: Keep an eye on upcoming temperature fluctuations and potential rain windows to optimize field trafficability.`;
    }

    res.json({
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Farm advisor error:", err);
    res.status(500).json({ error: "Failed to generate advisor response" });
  }
});

// ----------------------------------------------------
// 5. API: IRRIGATION ADVICE CALCULATOR (FAO-56 WATER BALANCE METHOD)
// ----------------------------------------------------
app.post("/api/irrigation-calculate", (req, res) => {
  try {
    const { crops = [], weatherData = {} } = req.body;

    const et0 = weatherData.current?.et0 || 4.2; // mm/day
    const rainForecastNext3Days = (weatherData.daily || [])
      .slice(0, 3)
      .reduce((sum: number, d: any) => sum + (d.precipitationSum || 0), 0);

    // Soil available water capacity (AWC in mm/meter of soil depth)
    const soilAWC: Record<string, number> = {
      Sandy: 70,
      "Sandy Loam": 110,
      Loam: 160,
      "Silt Loam": 190,
      "Clay Loam": 175,
      Clay: 150,
      Peat: 220,
      Chalky: 120,
    };

    // Crop growth stage coefficient (Kc)
    const stageKc: Record<string, number> = {
      Germination: 0.4,
      Vegetative: 0.75,
      Flowering: 1.15,
      "Fruit Development": 1.1,
      Ripening: 0.8,
      "Maturity / Harvest": 0.5,
    };

    const adviceList = crops.map((crop: any) => {
      const soilWaterCapacity = soilAWC[crop.soilType] || 150;
      const kc = stageKc[crop.growthStage] || 0.8;
      const dailyWaterUse = Math.round(et0 * kc * 10) / 10; // mm/day

      // Days since last irrigation
      const lastIrrigated = crop.lastIrrigationDate ? new Date(crop.lastIrrigationDate) : new Date(Date.now() - 4 * 86400000);
      const daysSince = Math.max(1, Math.floor((Date.now() - lastIrrigated.getTime()) / (1000 * 60 * 60 * 24)));

      // Cumulative soil moisture depletion
      const accumulatedDeficit = Math.round(daysSince * dailyWaterUse * 10) / 10;
      const maxAllowableDepletion = Math.round(soilWaterCapacity * 0.45); // 45% depletion threshold (MAD)

      let action: "Irrigate Now" | "Irrigate Soon" | "Delay - Rain Forecasted" | "Adequate Moisture" = "Adequate Moisture";
      let waterStressIndex = Math.min(100, Math.round((accumulatedDeficit / maxAllowableDepletion) * 70));

      if (rainForecastNext3Days >= accumulatedDeficit * 0.7 && rainForecastNext3Days >= 8) {
        action = "Delay - Rain Forecasted";
        waterStressIndex = Math.max(10, waterStressIndex - 30);
      } else if (accumulatedDeficit >= maxAllowableDepletion) {
        action = "Irrigate Now";
        waterStressIndex = 88;
      } else if (accumulatedDeficit >= maxAllowableDepletion * 0.75) {
        action = "Irrigate Soon";
        waterStressIndex = 65;
      }

      // Calculate required water volume
      const recMm = Math.max(12, Math.min(45, Math.round(accumulatedDeficit)));
      // 1 mm on 1 m² = 1 Liter. 1 acre = 4046.86 m². 1 hectare = 10,000 m²
      const fieldAreaM2 = (crop.fieldSize || 5) * 4046.86;
      const liters = Math.round(recMm * fieldAreaM2);
      const gallons = Math.round(liters * 0.264172);

      const daysUntilNext = action === "Irrigate Now" ? 0 : action === "Irrigate Soon" ? 1 : Math.max(2, Math.round((maxAllowableDepletion - accumulatedDeficit) / dailyWaterUse));
      const nextDate = new Date(Date.now() + daysUntilNext * 86400000).toISOString().split("T")[0];

      let reasoning = "";
      if (action === "Delay - Rain Forecasted") {
        reasoning = `Upcoming ${rainForecastNext3Days.toFixed(1)} mm rainfall will satisfy soil moisture requirement; postpone irrigation to conserve water.`;
      } else if (action === "Irrigate Now") {
        reasoning = `Soil root zone depletion (${accumulatedDeficit} mm) has reached the 45% management threshold for ${crop.soilType} soil.`;
      } else if (action === "Irrigate Soon") {
        reasoning = `Crop is in active ${crop.growthStage} ($K_c=${kc}$) consuming ~${dailyWaterUse} mm/day. Schedule irrigation within 24–48 hours.`;
      } else {
        reasoning = `Soil moisture profile is currently optimal. Current depletion is well within safe buffering capacity.`;
      }

      return {
        cropId: crop.id,
        cropName: crop.cropName,
        fieldName: crop.fieldName,
        fieldSize: crop.fieldSize,
        soilType: crop.soilType,
        growthStage: crop.growthStage,
        daysSinceIrrigated: daysSince,
        soilMoistureEstimatePercent: Math.max(30, 100 - waterStressIndex),
        cropWaterRequirementMm: dailyWaterUse,
        forecastRainNext3DaysMm: rainForecastNext3Days,
        recommendedAction: action,
        recommendedVolumeMm: recMm,
        recommendedVolumeLiters: liters,
        recommendedVolumeGallons: gallons,
        waterStressIndex,
        nextIrrigationDate: nextDate,
        reasoning,
      };
    });

    res.json(adviceList);
  } catch (err: any) {
    console.error("Irrigation calculate error:", err);
    res.status(500).json({ error: "Failed to calculate irrigation recommendation" });
  }
});

// ----------------------------------------------------
// 6. SERVER BOOT & VITE MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌾 CropSense AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
