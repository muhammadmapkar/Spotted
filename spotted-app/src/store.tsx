import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PLACES, REWARD_RATES, Place } from './data';

export type Spot = { placeId: string; dish: string; reelUrl: string; createdAt: number };
export type VisitProof = { placeId: string; method: 'location' | 'receipt'; at: number };
export type CollabStatus = 'accepted' | 'declined';
export type SpotList = { id: string; name: string; placeIds: string[] };
export type Plan = { id: string; title: string; placeIds: string[]; votes: Record<string, number> };

type State = {
  handle: string;
  spots: Spot[];
  visits: VisitProof[];
  collabs: Record<string, CollabStatus>;
  referralsJoined: number;
  lists: SpotList[];
  toVisit: string[];
  plans: Plan[];
  lastReminded: Record<string, number>;
};

const initial: State = { handle: 'yourname', spots: [], visits: [], collabs: {}, referralsJoined: 0, lists: [], toVisit: [], plans: [], lastReminded: {} };
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
  streak: number;
  createList: (name: string) => string;
  deleteList: (id: string) => void;
  toggleInList: (listId: string, placeId: string) => void;
  toggleToVisit: (placeId: string) => void;
  markReminded: (placeId: string) => void;
  createPlan: (title: string, placeIds: string[]) => string;
  deletePlan: (id: string) => void;
  adjustVote: (planId: string, placeId: string, delta: 1 | -1) => void;
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

  const uid = () => Math.random().toString(36).slice(2, 10);

  const createList = useCallback((name: string) => {
    const id = uid();
    setState((s) => ({ ...s, lists: [...s.lists, { id, name: name.trim() || 'My list', placeIds: [] }] }));
    return id;
  }, []);
  const deleteList = useCallback((id: string) => setState((s) => ({ ...s, lists: s.lists.filter((l) => l.id !== id) })), []);
  const toggleInList = useCallback((listId: string, placeId: string) => {
    setState((s) => ({
      ...s,
      lists: s.lists.map((l) => l.id !== listId ? l : { ...l, placeIds: l.placeIds.includes(placeId) ? l.placeIds.filter((x) => x !== placeId) : [...l.placeIds, placeId] }),
    }));
  }, []);
  const toggleToVisit = useCallback((placeId: string) => {
    setState((s) => ({ ...s, toVisit: s.toVisit.includes(placeId) ? s.toVisit.filter((x) => x !== placeId) : [...s.toVisit, placeId] }));
  }, []);
  const markReminded = useCallback((placeId: string) => setState((s) => ({ ...s, lastReminded: { ...s.lastReminded, [placeId]: Date.now() } })), []);
  const createPlan = useCallback((title: string, placeIds: string[]) => {
    const id = uid();
    setState((s) => ({ ...s, plans: [{ id, title: title.trim() || 'Group plan', placeIds, votes: {} }, ...s.plans] }));
    return id;
  }, []);
  const deletePlan = useCallback((id: string) => setState((s) => ({ ...s, plans: s.plans.filter((p) => p.id !== id) })), []);
  const adjustVote = useCallback((planId: string, placeId: string, delta: 1 | -1) => {
    setState((s) => ({
      ...s,
      plans: s.plans.map((p) => p.id !== planId ? p : { ...p, votes: { ...p.votes, [placeId]: Math.max(0, (p.votes[placeId] ?? 0) + delta) } }),
    }));
  }, []);

  const value = useMemo<Ctx>(() => {
    const earnings = state.visits.length * REWARD_RATES.perVerifiedVisit + state.referralsJoined * REWARD_RATES.referralBonus;
    const tiers = REWARD_RATES.freeMealTiers;
    const reached = tiers.filter((t) => state.visits.length >= t.visits);
    const tier = reached[reached.length - 1].name;
    const nextTier = tiers.find((t) => state.visits.length < t.visits) ?? null;
    // Streak: consecutive days, ending today or yesterday, with a spot added or a visit verified.
    const days = new Set([...state.spots.map((x) => x.createdAt), ...state.visits.map((v) => v.at)].map((t) => new Date(t).toDateString()));
    let streak = 0;
    const d = new Date();
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
    return {
      ...state, ready, earnings, tier, nextTier, streak,
      createList, deleteList, toggleInList, toggleToVisit, markReminded, createPlan, deletePlan, adjustVote,
      referralCode: `SPOT-${state.handle.slice(0, 6).toUpperCase()}`,
      tagSpot, removeSpot, verifyVisit, respondCollab, setHandle,
      placeOf: (id) => PLACES.find((p) => p.id === id),
    };
  }, [state, ready, tagSpot, removeSpot, verifyVisit, respondCollab, setHandle, createList, deleteList, toggleInList, toggleToVisit, markReminded, createPlan, deletePlan, adjustVote]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore must be used inside StoreProvider');
  return c;
}
