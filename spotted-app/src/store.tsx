import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PLACES, REWARD_RATES, Place } from './data';

export type Spot = { placeId: string; dish: string; reelUrl: string; createdAt: number };
export type VisitProof = { placeId: string; method: 'location' | 'receipt'; at: number };
export type CollabStatus = 'accepted' | 'declined';

type State = {
  handle: string;
  spots: Spot[];
  visits: VisitProof[];
  collabs: Record<string, CollabStatus>;
  referralsJoined: number;
};

const initial: State = { handle: 'yourname', spots: [], visits: [], collabs: {}, referralsJoined: 0 };
const KEY = 'spotted-state-v1';

type Ctx = State & {
  ready: boolean;
  referralCode: string;
  earnings: number;
  tier: string;
  nextTier: { name: string; visits: number } | null;
  tagSpot: (placeId: string, dish: string, reelUrl: string) => void;
  removeSpot: (placeId: string) => void;
  verifyVisit: (placeId: string, method: VisitProof['method']) => boolean;
  respondCollab: (id: string, status: CollabStatus) => void;
  setHandle: (h: string) => void;
  placeOf: (id: string) => Place | undefined;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setState({ ...initial, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const tagSpot = useCallback((placeId: string, dish: string, reelUrl: string) => {
    setState((s) => ({
      ...s,
      spots: [{ placeId, dish: dish.trim(), reelUrl: reelUrl.trim(), createdAt: Date.now() }, ...s.spots.filter((x) => x.placeId !== placeId)],
    }));
  }, []);

  const removeSpot = useCallback((placeId: string) => {
    setState((s) => ({ ...s, spots: s.spots.filter((x) => x.placeId !== placeId) }));
  }, []);

  // One verified visit per place per day, so repeat check-ins can't farm rewards.
  const verifyVisit = useCallback((placeId: string, method: VisitProof['method']) => {
    let accepted = false;
    setState((s) => {
      const today = new Date().toDateString();
      if (s.visits.some((v) => v.placeId === placeId && new Date(v.at).toDateString() === today)) return s;
      accepted = true;
      return { ...s, visits: [{ placeId, method, at: Date.now() }, ...s.visits] };
    });
    return accepted;
  }, []);

  const respondCollab = useCallback((id: string, status: CollabStatus) => {
    setState((s) => ({ ...s, collabs: { ...s.collabs, [id]: status } }));
  }, []);

  const setHandle = useCallback((h: string) => {
    setState((s) => ({ ...s, handle: h.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase() || 'yourname' }));
  }, []);

  const value = useMemo<Ctx>(() => {
    const earnings = state.visits.length * REWARD_RATES.perVerifiedVisit + state.referralsJoined * REWARD_RATES.referralBonus;
    const tiers = REWARD_RATES.freeMealTiers;
    const reached = tiers.filter((t) => state.visits.length >= t.visits);
    const tier = reached[reached.length - 1].name;
    const nextTier = tiers.find((t) => state.visits.length < t.visits) ?? null;
    return {
      ...state, ready, earnings, tier, nextTier,
      referralCode: `SPOT-${state.handle.slice(0, 6).toUpperCase()}`,
      tagSpot, removeSpot, verifyVisit, respondCollab, setHandle,
      placeOf: (id) => PLACES.find((p) => p.id === id),
    };
  }, [state, ready, tagSpot, removeSpot, verifyVisit, respondCollab, setHandle]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore must be used inside StoreProvider');
  return c;
}
