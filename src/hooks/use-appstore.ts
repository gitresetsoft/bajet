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
  setUserDetails: (userDetails: UserDetails | null) => void;
  hydrateUserFromLocalStorage: () => void;
  clearUserDetails: () => void; // ADD NEW EXPLICIT LOGOUT CLEAR
}

const USER_DETAILS_STORAGE_KEY = 'budget_user_details';

export const useAppStore = create<AppStore>((set) => ({
  appState: 'loading',
  userDetails: (() => {
    // Attempt to hydrate userDetails from localStorage/sessionStorage on initialization
    try {
      const item = localStorage.getItem(USER_DETAILS_STORAGE_KEY) || sessionStorage.getItem(USER_DETAILS_STORAGE_KEY);
      if (item) {
        return JSON.parse(item);
      }
    } catch (err) {
      // fallback to null
    }
    return null;
  })(),

  setAppState: (appState: AppState) => set({ appState }),

  setUserDetails: (userDetails: UserDetails | null) => {
    if (userDetails) {
      try {
        localStorage.setItem(USER_DETAILS_STORAGE_KEY, JSON.stringify(userDetails));
      } catch (e) {
        // Fallback to sessionStorage if quota is full
        try {
          sessionStorage.setItem(USER_DETAILS_STORAGE_KEY, JSON.stringify(userDetails));
        } catch {
          // Fallback to memory storage if quota is full
          set({ userDetails });
        }
      }
      set({ userDetails });
    } else {
      // Only set userDetails to null, but do NOT clear localStorage/sessionStorage here. Use clearUserDetails for logout.
      set({ userDetails: null });
    }
  },
  hydrateUserFromLocalStorage: () => {
    try {
      const item = localStorage.getItem(USER_DETAILS_STORAGE_KEY) || sessionStorage.getItem(USER_DETAILS_STORAGE_KEY);
      if (item) {
        set({ userDetails: JSON.parse(item) });
      } else {
        set({ userDetails: null });
      }
    } catch {
      set({ userDetails: null });
    }
  },
  clearUserDetails: () => {
    // Explicitly clear both storages and set to null
    localStorage.removeItem(USER_DETAILS_STORAGE_KEY);
    sessionStorage.removeItem(USER_DETAILS_STORAGE_KEY);
    set({ userDetails: null });
  },
}));