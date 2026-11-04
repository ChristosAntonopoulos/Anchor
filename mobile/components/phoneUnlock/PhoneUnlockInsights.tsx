import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Rect, G } from 'react-native-svg';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import {
  UNLOCK_CATEGORY_COLORS,
  UNLOCK_CATEGORY_ORDER,
  buildUnlockInsights,
  formatUnlockCount,
  formatUnlockShare,
  formatUnlockTime,
  type UnlockPeriod,
} from '../../utils/unlockInsights';
import type { PhoneUnlockEntry } from '../../types';

interface PhoneUnlockInsightsProps {
  entries: PhoneUnlockEntry[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function PhoneUnlockInsights({ entries, refreshing, onRefresh }: PhoneUnlockInsightsProps) {
  const [period, setPeriod] = useState<UnlockPeriod>('day');
  const insights = useMemo(() => buildUnlockInsights(entries, period), [entries, period]);
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - spacing.m * 4, 260);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} tintColor={colors.category.stability} />
        ) : undefined
      }
    >
      <View style={styles.periodRow}>
        {(['day', 'week'] as const).map((value) => {
          const selected = period === value;
          return (
            <Pressable
              key={value}
              onPress={() => setPeriod(value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={value === 'day' ? 'Day' : 'Week'}
              style={[styles.periodChip, selected ? styles.periodChipOn : null]}
            >
              <Text style={[styles.periodText, selected ? styles.periodTextOn : null]}>
                {value === 'day' ? 'Day' : 'Week'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroCount}>{insights.totalCount}</Text>
        <Text style={styles.heroLabel}>
          {period === 'day' ? 'unlocks today' : 'unlocks in the last 7 days'}
        </Text>
        <View style={styles.heroMeta}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatUnlockTime(insights.totalDurationMs)}</Text>
            <Text style={styles.heroStatLabel}>Unlocked</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatUnlockTime(insights.averageDurationMs)}</Text>
            <Text style={styles.heroStatLabel}>Average</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        {insights.totalCount === 0 ? (
          <Text style={styles.empty}>No unlocks in this stretch yet.</Text>
        ) : period === 'day' ? (
          <DayMixChart insights={insights} />
        ) : (
          <WeekBars insights={insights} width={chartWidth} />
        )}
      </View>

      {insights.categories.map((category) => {
        const dayMax = Math.max(
          ...insights.days.map((day) => day.byCategory[category.id].count),
          1,
        );
        return (
          <View key={category.id} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={[styles.swatch, { backgroundColor: category.color }]} />
              <Text style={styles.categoryLabel}>{category.label}</Text>
              <Text style={styles.categoryShare}>{formatUnlockShare(category.share)}</Text>
            </View>
            <View style={styles.categoryMeta}>
              <Text style={styles.categoryCount}>{formatUnlockCount(category.count)}</Text>
              <Text style={styles.categoryTime}>{formatUnlockTime(category.durationMs)}</Text>
            </View>
            {period === 'week' ? (
              <View style={styles.sparkRow}>
                {insights.days.map((day) => {
                  const count = day.byCategory[category.id].count;
                  const height = Math.max((count / dayMax) * 28, count > 0 ? 4 : 2);
                  return (
                    <View key={day.key} style={styles.sparkSlot}>
                      <View style={styles.sparkTrack}>
                        <View
                          style={[
                            styles.sparkBar,
                            {
                              height,
                              backgroundColor: category.color,
                              opacity: count > 0 ? 1 : 0.22,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.sparkLabel}>
                        {day.label === 'Today' ? 'Now' : day.weekday}
                      </Text>
                      <Text style={styles.sparkCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.track}>
                <View
                  style={[
                    styles.trackFill,
                    {
                      width: `${Math.max(Math.round(category.share * 100), 4)}%`,
                      backgroundColor: category.color,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function DayMixChart({
  insights,
}: {
  insights: ReturnType<typeof buildUnlockInsights>;
}) {
  const size = 168;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const top = insights.categories[0];

  return (
    <View style={styles.mixWrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#252B38"
          strokeWidth={stroke}
          fill="none"
        />
        {insights.categories.map((category) => {
          const length = category.share * circumference;
          const dashOffset = -offset;
          offset += length;
          return (
            <Circle
              key={category.id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={category.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          );
        })}
      </Svg>
      <View style={styles.mixCenter} pointerEvents="none">
        <Text style={styles.mixCenterValue}>{top ? formatUnlockShare(top.share) : '0%'}</Text>
        <Text style={styles.mixCenterLabel} numberOfLines={2}>
          {top?.label ?? '—'}
        </Text>
      </View>
    </View>
  );
}

function WeekBars({
  insights,
  width,
}: {
  insights: ReturnType<typeof buildUnlockInsights>;
  width: number;
}) {
  const height = 148;
  const axis = 22;
  const max = Math.max(...insights.days.map((day) => day.count), 1);
  const slot = width / insights.days.length;
  const barWidth = Math.max(Math.min(slot - 10, 28), 14);

  return (
    <View>
      <Svg width={width} height={height + axis}>
        {insights.days.map((day, index) => {
          const x = index * slot + (slot - barWidth) / 2;
          let y = height;
          const stacks = UNLOCK_CATEGORY_ORDER.filter((id) => day.byCategory[id].count > 0).map((id) => {
            const count = day.byCategory[id].count;
            const h = (count / max) * (height - 8);
            y -= h;
            return { id, x, y, h, color: UNLOCK_CATEGORY_COLORS[id] };
          });
          return (
            <G key={day.key}>
              <Rect x={x} y={8} width={barWidth} height={height - 8} rx={8} fill="#252B38" />
              {stacks.map((stack) => (
                <Rect
                  key={stack.id}
                  x={x}
                  y={stack.y}
                  width={barWidth}
                  height={Math.max(stack.h, 0)}
                  fill={stack.color}
                />
              ))}
            </G>
          );
        })}
      </Svg>
      <View style={styles.weekLabels}>
        {insights.days.map((day) => (
          <View key={day.key} style={[styles.weekLabelSlot, { width: slot }]}>
            <Text style={styles.weekLabel}>{day.label === 'Today' ? 'Now' : day.weekday}</Text>
            <Text style={styles.weekCount}>{day.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 4,
    marginBottom: spacing.m,
  },
  periodChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipOn: {
    backgroundColor: '#31443C',
  },
  periodText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  periodTextOn: {
    color: '#C7E5CD',
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  heroCount: {
    color: '#C7E5CD',
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    marginTop: 2,
  },
  heroMeta: {
    flexDirection: 'row',
    marginTop: spacing.m,
  },
  heroStat: {
    flex: 1,
  },
  heroStatValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
  },
  heroStatLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.m,
    marginBottom: spacing.m,
    alignItems: 'center',
  },
  empty: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    paddingVertical: spacing.l,
  },
  mixWrap: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixCenter: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixCenterValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  mixCenterLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    textAlign: 'center',
    marginTop: 2,
  },
  weekLabels: {
    flexDirection: 'row',
    marginTop: spacing.s,
  },
  weekLabelSlot: {
    alignItems: 'center',
  },
  weekLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  weekCount: {
    color: colors.textPrimary,
    fontSize: 11,
    marginTop: 2,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.m,
    marginBottom: spacing.s,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.s,
  },
  categoryLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  categoryShare: {
    color: '#C7E5CD',
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  categoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.s,
  },
  categoryCount: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
  },
  categoryTime: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    marginTop: spacing.s,
    overflow: 'hidden',
  },
  trackFill: {
    height: 6,
    borderRadius: 3,
  },
  sparkRow: {
    flexDirection: 'row',
    marginTop: spacing.m,
  },
  sparkSlot: {
    flex: 1,
    alignItems: 'center',
  },
  sparkTrack: {
    height: 28,
    width: 10,
    justifyContent: 'flex-end',
  },
  sparkBar: {
    width: 10,
    borderRadius: 5,
  },
  sparkLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  sparkCount: {
    color: colors.textPrimary,
    fontSize: 10,
    marginTop: 1,
  },
});
