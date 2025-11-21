// src/lib/auth.ts
import { auth, db } from '$lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { writable } from 'svelte/store';

export type Role = 'admin' | 'pi' | 'coordinator' | 'data_entry' | 'viewer' | 'vendor' | 'lab';

export type AppUser = {
	uid: string;
	email: string;
	displayName?: string | null;
	role: Role;
};

export const currentUser = writable<AppUser | null>(null);
export const authReady = writable(false);
export const authError = writable<string | null>(null);

/**
 * Load /users/{uid} doc. If missing, user is NOT authorised.
 */
async function loadUserDoc(user: User): Promise<AppUser | null> {
	const ref = doc(db, 'users', user.uid);
	const snap = await getDoc(ref);

	if (!snap.exists()) {
		// Unknown user => not allowed
		return null;
	}

	const data = snap.data() as Partial<AppUser>;

	// Extra safety: email in Firestore must match Auth email
	if (data.email && data.email !== user.email) {
		return null;
	}

	return {
		uid: user.uid,
		email: user.email ?? '',
		displayName: user.displayName,
		role: (data.role as Role) ?? 'viewer'
	};
}

export async function loginWithEmailPassword(email: string, password: string) {
	authError.set(null);

	const cred = await signInWithEmailAndPassword(auth, email, password);
	const appUser = await loadUserDoc(cred.user);

	if (!appUser) {
		// Immediately sign out unknown users
		await signOut(auth);
		authError.set('Your email is not authorised to access this system.');
		throw new Error('Unauthorised email');
	}

	currentUser.set(appUser);
	return appUser;
}

export async function logout() {
	await signOut(auth);
	currentUser.set(null);
}

/**
 * Call once in +layout.svelte
 */
export function initAuthListener() {
	onAuthStateChanged(auth, async (user) => {
		if (!user) {
			currentUser.set(null);
			authReady.set(true);
			return;
		}

		const appUser = await loadUserDoc(user);

		if (!appUser) {
			// Unknown / unapproved user
			await signOut(auth);
			currentUser.set(null);
			authError.set('Your email is not authorised to access this system.');
		} else {
			currentUser.set(appUser);
			authError.set(null);
		}

		authReady.set(true);
	});
}
