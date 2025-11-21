// src/lib/firebase.ts
import { browser } from '$app/environment';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyBb4N0krmiRyXzQ5clwfIwBYvPQAqbds8Y',
	authDomain: 'sam-chf.firebaseapp.com',
	projectId: 'sam-chf',
	storageBucket: 'sam-chf.firebasestorage.app',
	messagingSenderId: '988789734032',
	appId: '1:988789734032:web:fd836df22610557848b615',
	measurementId: 'G-JK38FB92SB'
};

// Ensure we don't re-initialize during HMR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore & Auth work on both client and server (though you’ll typically use them in the browser)
export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics: browser-only, guarded so SSR doesn’t explode
let analytics: Analytics | null = null;
if (browser) {
	analytics = getAnalytics(app);
}

export { analytics };
