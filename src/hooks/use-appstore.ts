import { create } from 'zustand';

type AppState = 'loading' | 'authenticated' | 'unauthenticated';

export interface UserDetails {
  id: string;
  email: string;
  name?: string;
  profile_picture?: string;
  role?: string;
}

interface AppStore {
  appState: AppState;
  userDetails: UserDetails | null;

  setAppState: (appState: AppState) => void;
  setUserDetails: (userDetails: UserDetails) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  appState: 'loading',
  userDetails: null,

  setAppState: (appState: AppState) => set({ appState }),
  setUserDetails: (userDetails: UserDetails) => set({ userDetails }),
}));