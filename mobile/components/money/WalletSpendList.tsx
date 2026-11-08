import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { formatMoney } from '../../utils/walletSpend';
import type { WalletSpend } from '../../types';

interface WalletSpendListProps {
  spend: WalletSpend[];
}

export function WalletSpendList({ spend }: WalletSpendListProps) {
  if (spend.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.sectionTitle}>Google Wallet</Text>
        <Text style={styles.emptyText}>
          Pay with Google Wallet and the receipt lands here automatically.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Google Wallet</Text>
      {spend.map((entry) => {
        const formattedDate = new Date(`${entry.date}T12:00:00`).toLocaleDateString('en-GB', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        return (
          <View key={entry.id} style={styles.card}>
            <LinearGradient
              colors={[colors.surface, colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <View style={styles.content}>
                <Text style={styles.merchant}>{entry.merchant}</Text>
                <Text style={styles.date}>{formattedDate}</Text>
              </View>
              <Text style={styles.amount}>{formatMoney(entry.amount, entry.currency || 'EUR')}</Text>
            </LinearGradient>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.l,
    marginBottom: spacing.l,
  },
  emptyContainer: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    marginBottom: spacing.s,
  },
  sectionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  card: {
    marginBottom: spacing.s,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
    paddingRight: spacing.m,
  },
  merchant: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.danger,
  },
});
