// src/lib/server/firebase-admin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '$env/dynamic/private';

const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKeyRaw) {
	console.error('❌ Missing Firebase Admin environment variables:', {
		projectId,
		clientEmail: !!clientEmail,
		privateKeyPresent: !!privateKeyRaw
	});
	throw new Error('Firebase Admin env vars are not configured correctly');
}

// Convert "\n" sequences into real newlines
const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

if (!getApps().length) {
	initializeApp({
		credential: cert({
			projectId,
			clientEmail,
			privateKey
		})
	});
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
