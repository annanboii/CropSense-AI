import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  authProvider?: "local" | "google";
  avatarUrl?: string;
  farmerName: string;
  createdAt: string;
  farmSetupCompleted: boolean;
  token?: string;
  farm?: {
    name: string;
    farmerName?: string;
    location: string;
    latitude: number;
    longitude: number;
    totalArea: number;
    areaUnit: "acres" | "hectares";
    primarySoilType: string;
    establishedYear: number;
  };
  crops: Array<{
    id: string;
    cropName: string;
    fieldName: string;
    fieldSize: number;
    soilType: string;
    growthStage: string;
    plantingDate: string;
    lastIrrigationDate: string;
    targetYield?: string;
    healthStatus: string;
    notes?: string;
    createdAt: string;
  }>;
  scans: Array<{
    id: string;
    timestamp: string;
    cropType: string;
    cropId?: string;
    possibleCondition: string;
    diagnosis: string;
    pathogenType: string;
    severity: string;
    confidence: number;
    symptoms: string[];
    visibleSymptoms: string[];
    causes?: string[];
    recommendedNextSteps: string[];
    limitations: string;
    organicTreatments?: string[];
    conventionalTreatments?: string[];
    preventiveMeasures?: string[];
    urgency: string;
    imageUrl?: string;
    stageAssessment?: string;
  }>;
  irrigationRecords: Array<{
    id: string;
    cropId: string;
    cropName: string;
    fieldName?: string;
    date: string;
    volumeGallons?: number;
    volumeLiters?: number;
    depthMm?: number;
    notes?: string;
    createdAt: string;
  }>;
  alerts: Array<{
    id: string;
    category: string;
    severity: string;
    title: string;
    message: string;
    timestamp: string;
    cropId?: string;
    cropName?: string;
    actionTab?: string;
    actionLabel?: string;
    read?: boolean;
    dismissed?: boolean;
  }>;
}

interface DatabaseSchema {
  users: Record<string, UserRecord>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "cropsense_users.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state initialized from disk
let memoryDb: DatabaseSchema = { users: {} };

try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    memoryDb = JSON.parse(raw);
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), "utf-8");
  }
} catch (e) {
  console.warn("Failed to load cropsense_users.json on startup, initializing fresh:", e);
  memoryDb = { users: {} };
}

function persistDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving cropsense_users.json:", e);
  }
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "cropsense_salt_2026").digest("hex");
}

function generateToken(userId: string): string {
  return `${userId}_${crypto.randomBytes(16).toString("hex")}`;
}

export const db = {
  // Auth
  findUserByEmail(email: string): UserRecord | null {
    const normalized = email.trim().toLowerCase();
    for (const u of Object.values(memoryDb.users)) {
      if (u.email.toLowerCase() === normalized) {
        return u;
      }
    }
    return null;
  },

  findUserByToken(token: string): UserRecord | null {
    if (!token) return null;
    for (const u of Object.values(memoryDb.users)) {
      if (u.token === token) {
        return u;
      }
    }
    return null;
  },

  findUserById(id: string): UserRecord | null {
    return memoryDb.users[id] || null;
  },

  findUserByGoogleId(googleId: string): UserRecord | null {
    if (!googleId) return null;
    for (const u of Object.values(memoryDb.users)) {
      if (u.googleId === googleId) {
        return u;
      }
    }
    return null;
  },

  findOrCreateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  }): { user: UserRecord; token: string; isNewUser: boolean } {
    const normalizedEmail = googleUser.email.trim().toLowerCase();
    
    // Check if user exists by googleId first, or by email
    let existingUser = this.findUserByGoogleId(googleUser.googleId);
    if (!existingUser) {
      existingUser = this.findUserByEmail(normalizedEmail);
    }

    if (existingUser) {
      // Connect / link Google profile if not already linked
      if (!existingUser.googleId) {
        existingUser.googleId = googleUser.googleId;
      }
      if (googleUser.avatarUrl && !existingUser.avatarUrl) {
        existingUser.avatarUrl = googleUser.avatarUrl;
      }
      if ((!existingUser.farmerName || existingUser.farmerName === "Farmer") && googleUser.name) {
        existingUser.farmerName = googleUser.name;
      }
      const token = generateToken(existingUser.id);
      existingUser.token = token;
      persistDb();
      return { user: existingUser, token, isNewUser: !existingUser.farmSetupCompleted };
    }

    // New Google User
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const token = generateToken(id);
    const displayName = googleUser.name && googleUser.name.trim() ? googleUser.name.trim() : normalizedEmail.split("@")[0];

    const newUser: UserRecord = {
      id,
      email: normalizedEmail,
      googleId: googleUser.googleId,
      authProvider: "google",
      avatarUrl: googleUser.avatarUrl,
      farmerName: displayName,
      createdAt: new Date().toISOString(),
      farmSetupCompleted: false,
      token,
      crops: [],
      scans: [],
      irrigationRecords: [],
      alerts: [],
    };

    memoryDb.users[id] = newUser;
    persistDb();
    return { user: newUser, token, isNewUser: true };
  },

  createUser(email: string, password: string, farmerName: string): { user: UserRecord; token: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const token = generateToken(id);

    const newUser: UserRecord = {
      id,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      farmerName: farmerName.trim(),
      createdAt: new Date().toISOString(),
      farmSetupCompleted: false,
      token,
      crops: [],
      scans: [],
      irrigationRecords: [],
      alerts: [],
    };

    memoryDb.users[id] = newUser;
    persistDb();
    return { user: newUser, token };
  },

  validateCredentials(email: string, password: string): { user: UserRecord; token: string } | null {
    const user = this.findUserByEmail(email);
    if (!user) return null;

    if (user.passwordHash !== hashPassword(password)) {
      return null;
    }

    const token = generateToken(user.id);
    user.token = token;
    persistDb();
    return { user, token };
  },

  logoutUser(userId: string) {
    const user = memoryDb.users[userId];
    if (user) {
      user.token = undefined;
      persistDb();
    }
  },

  // Farm Setup
  saveFarmSetup(
    userId: string,
    farmData: {
      farmerName?: string;
      name: string;
      location: string;
      latitude: number;
      longitude: number;
      totalArea?: number;
      areaUnit?: "acres" | "hectares";
      primarySoilType?: string;
      establishedYear?: number;
    }
  ): UserRecord | null {
    const user = memoryDb.users[userId];
    if (!user) return null;

    if (farmData.farmerName) {
      user.farmerName = farmData.farmerName;
    }

    user.farm = {
      name: farmData.name || "My Farm",
      farmerName: user.farmerName,
      location: farmData.location || "Farm Coordinates",
      latitude: farmData.latitude,
      longitude: farmData.longitude,
      totalArea: farmData.totalArea || 10,
      areaUnit: farmData.areaUnit || "acres",
      primarySoilType: farmData.primarySoilType || "Loam",
      establishedYear: farmData.establishedYear || new Date().getFullYear(),
    };

    user.farmSetupCompleted = true;
    persistDb();
    return user;
  },

  // Crops
  addCrop(userId: string, cropData: any): UserRecord | null {
    const user = memoryDb.users[userId];
    if (!user) return null;

    const cropId = cropData.id || `crop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCrop = {
      ...cropData,
      id: cropId,
      createdAt: cropData.createdAt || new Date().toISOString(),
    };

    user.crops.push(newCrop);
    persistDb();
    return user;
  },

  updateCrop(userId: string, cropId: string, updates: any): UserRecord | null {
    const user = memoryDb.users[userId];
    if (!user) return null;

    const idx = user.crops.findIndex((c) => c.id === cropId);
    if (idx !== -1) {
      user.crops[idx] = { ...user.crops[idx], ...updates };
      persistDb();
    }
    return user;
  },

  deleteCrop(userId: string, cropId: string): UserRecord | null {
    const user = memoryDb.users[userId];
    if (!user) return null;

    user.crops = user.crops.filter((c) => c.id !== cropId);
    persistDb();
    return user;
  },

  // Scans
  addScan(userId: string, scanData: any): UserRecord | null {
    const user = memoryDb.users[userId];
    if (!user) return null;

    const scanId = scanData.id || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const scan = {
      ...scanData,
      id: scanId,
      timestamp: scanData.timestamp || new Date().toISOString(),
    };

    // Keep most recent scans first
    user.scans.unshift(scan);
    persistDb();
    return user;
  },

  deleteScan(userId: string, scanId: string): UserRecord | null {
    const user = memoryDb.users[userId];
    if (!user) return null;

    user.scans = user.scans.filter((s) => s.id !== scanId);
    persistDb();
    return user;
  },

  // Alerts
  addAlert(userId: string, alertData: any): UserRecord | null {
    const user = memoryDb.users[userId];
    if (!user) return null;

    const alertId = alertData.id || `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const alert = {
      ...alertData,
      id: alertId,
      timestamp: alertData.timestamp || "Just now",
      read: false,
      dismissed: false,
    };

    user.alerts.unshift(alert);
    persistDb();
    return user;
  },

  dismissAlert(userId: string, alertId: string): UserRecord | null {
    const user = memoryDb.users[userId];
    if (!user) return null;

    user.alerts = user.alerts.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a));
    persistDb();
    return user;
  },

  markAlertRead(userId: string, alertId: string): UserRecord | null {
    const user = memoryDb.users[userId];
    if (!user) return null;

    user.alerts = user.alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a));
    persistDb();
    return user;
  },

  // Irrigation Log
  logIrrigation(userId: string, record: any): UserRecord | null {
    const user = memoryDb.users[userId];
    if (!user) return null;

    const id = record.id || `irr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRecord = {
      ...record,
      id,
      createdAt: record.createdAt || new Date().toISOString(),
    };

    user.irrigationRecords.unshift(newRecord);

    // Also update lastIrrigationDate for matching crop
    if (record.cropId) {
      const crop = user.crops.find((c) => c.id === record.cropId);
      if (crop) {
        crop.lastIrrigationDate = record.date || new Date().toISOString().split("T")[0];
      }
    }

    persistDb();
    return user;
  },
};
