import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) return;

  const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized');
  } else {
    console.warn('Firebase service account not found at', serviceAccountPath);
    console.warn('Push notifications will not work until firebase-service-account.json is added');
  }
}

initFirebase();

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}

export async function sendPushToTokens(tokens: string[], payload: PushPayload): Promise<{ success: number; failure: number }> {
  if (!firebaseInitialized || tokens.length === 0) {
    return { success: 0, failure: 0 };
  }

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data || {},
    android: {
      priority: 'high',
      notification: {
        channelId: payload.channelId || 'default',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    return {
      success: response.successCount,
      failure: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return { success: 0, failure: tokens.length };
  }
}

export async function sendPushToAll(payload: PushPayload): Promise<{ success: number; failure: number }> {
  // Import User model here to avoid circular dependency
  const { User } = await import('../database/models');

  const users = await User.find({
    deviceToken: { $exists: true, $nin: [null, ''] },
    isActive: true,
    notificationsEnabled: true,
  }).select('deviceToken').lean();

  const tokens = users.map(u => u.deviceToken).filter(Boolean) as string[];

  if (tokens.length === 0) {
    return { success: 0, failure: 0 };
  }

  // FCM supports max 500 tokens per multicast
  let totalSuccess = 0;
  let totalFailure = 0;

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const result = await sendPushToTokens(batch, payload);
    totalSuccess += result.success;
    totalFailure += result.failure;
  }

  return { success: totalSuccess, failure: totalFailure };
}

export { firebaseInitialized };
