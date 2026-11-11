import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { guardTokens } from '../../features/distraction-guard/guardTokens';

type Props = {
  options: { label: string; value: number }[];
  value: number;
  onChange: (value: number) => void;
};

export function PresetChips({ options, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, selected && styles.selected]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: guardTokens.divider,
    backgroundColor: guardTokens.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderColor: guardTokens.focus,
    backgroundColor: '#8BB8A822',
  },
  label: {
    color: guardTokens.textSecondary,
    fontSize: 14,
  },
  labelSelected: {
    color: guardTokens.textPrimary,
    fontWeight: '600',
  },
});
