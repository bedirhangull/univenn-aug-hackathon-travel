import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { TravelPlan, TravelerProfile } from '../helpers/travel/types';

/**
 * The state the Ritmo flow carries between screens.
 *
 * Onboarding writes the profile, the chat screen reads it into the plan prompt,
 * and the map screen reads the plan the chat screen produced. Keeping it in one
 * context is what lets those three be independent routes instead of one screen.
 *
 * In memory only — the app ships no storage dependency, so a profile lasts for
 * the session and the flow runs again on a cold start.
 */
type TravelSessionValue = {
  profile: TravelerProfile | null;
  hasOnboarded: boolean;
  setProfile: (profile: TravelerProfile) => void;
  activePlan: TravelPlan | null;
  setActivePlan: (plan: TravelPlan | null) => void;
  resetSession: () => void;
};

const TravelSessionContext = createContext<TravelSessionValue | undefined>(
  undefined
);

export const TravelSessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfileState] = useState<TravelerProfile | null>(null);
  const [activePlan, setActivePlan] = useState<TravelPlan | null>(null);

  const setProfile = useCallback((next: TravelerProfile) => {
    setProfileState(next);
  }, []);

  const resetSession = useCallback(() => {
    setProfileState(null);
    setActivePlan(null);
  }, []);

  const value = useMemo<TravelSessionValue>(
    () => ({
      profile,
      hasOnboarded: profile !== null,
      setProfile,
      activePlan,
      setActivePlan,
      resetSession,
    }),
    [profile, setProfile, activePlan, resetSession]
  );

  return (
    <TravelSessionContext.Provider value={value}>
      {children}
    </TravelSessionContext.Provider>
  );
};

export const useTravelSession = () => {
  const context = useContext(TravelSessionContext);
  if (!context) {
    throw new Error(
      'useTravelSession must be used within a TravelSessionProvider'
    );
  }
  return context;
};
