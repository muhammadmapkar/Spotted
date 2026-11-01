import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { REWARD_RATES } from '../src/data';
import { useStore } from '../src/store';
import { font, radius, space, useTheme } from '../src/theme';
import { Button, T } from '../src/ui';

export default function Rewards() {
  const c = useTheme();
  const { visits, referralsJoined, earnings, tier, nextTier, referralCode } = useStore();
  const [copied, setCopied] = useState(false);
  const toNext = nextTier ? nextTier.visits - visits.length : 0;
  const card = { backgroundColor: c.surface, borderRadius: radius.md, padding: space.md, gap: space.sm } as const;

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <View style={card}>
        <T style={{ color: c.muted, fontSize: 12 }}>Total earned</T>
        <T style={{ fontFamily: font.bold, fontSize: 32 }}>{earnings} rupees</T>
        <T style={{ fontSize: 12, color: c.muted }}>{visits.length} verified visits · {referralsJoined} creators joined with your code</T>
      </View>

      <View style={card}>
        <T style={{ fontFamily: font.semi, fontSize: 18 }}>How you earn</T>
        <T>{REWARD_RATES.perVerifiedVisit} rupees for every verified visit.</T>
        <T>{REWARD_RATES.referralBonus} rupees when a creator joins with your code.</T>
        <T>Free-meal rewards at higher levels.</T>
      </View>

      <View style={card}>
        <T style={{ fontFamily: font.semi, fontSize: 18 }}>Level: {tier}</T>
        {REWARD_RATES.freeMealTiers.map((t) => (
          <T key={t.name} style={{ color: visits.length >= t.visits ? c.visit : c.muted }}>{t.name}: {t.visits} verified visits</T>
        ))}
        {nextTier && <T style={{ fontSize: 12, color: c.muted }}>{toNext} more verified visits to reach {nextTier.name}.</T>}
      </View>

      <View style={card}>
        <T style={{ fontFamily: font.semi, fontSize: 18 }}>Your referral code</T>
        <T style={{ fontFamily: font.bold, fontSize: 24, color: c.primary }}>{referralCode}</T>
        <Button label={copied ? 'Copied' : 'Copy code'} icon="copy" onPress={async () => { await Clipboard.setStringAsync(referralCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }} />
      </View>
    </ScrollView>
  );
}
