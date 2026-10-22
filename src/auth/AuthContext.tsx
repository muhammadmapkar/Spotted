import { createContext, useContext } from 'react';

import { UserProfile } from '../db/types';

// Who is signed in, for any screen. The root layout fills this in.
export interface AuthValue {
  user: UserProfile | null;
  signIn: (user: UserProfile) => Promise<void>; // remember this person on the phone and sign them in
  signOut: () => Promise<void>; // sign out (their name and email are remembered)
  clearLocal: () => void; // only update the app's state (used after "Delete all my data" already erased everything)
}

export const AuthContext = createContext<AuthValue>({
  user: null,
  signIn: async () => {},
  signOut: async () => {},
  clearLocal: () => {},
});

export const useAuth = () => useContext(AuthContext);
