import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, TextInput } from 'react-native';
import { guardTokens } from '../../features/distraction-guard/guardTokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: { purpose: string; durationSeconds: number; note?: string }) => void;
};

const purposes = ['Work / research', 'Learning', 'Communication', 'Entertainment', 'Other'];
const durations = [
  { label: '2 λεπτά', seconds: 120 },
  { label: '5 λεπτά', seconds: 300 },
  { label: '10 λεπτά', seconds: 600 },
];

export function IntentionalUseSheet({ visible, onClose, onSave }: Props) {
  const [purpose, setPurpose] = useState(purposes[0]);
  const [durationSeconds, setDurationSeconds] = useState(300);
  const [note, setNote] = useState('');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Το χρειάζομαι για κάτι συγκεκριμένο</Text>
          <Text style={styles.label}>Purpose</Text>
          <View style={styles.row}>
            {purposes.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, purpose === p && styles.chipOn]}
                onPress={() => setPurpose(p)}
              >
                <Text style={styles.chipText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Planned duration</Text>
          <View style={styles.row}>
            {durations.map((d) => (
              <TouchableOpacity
                key={d.seconds}
                style={[styles.chip, durationSeconds === d.seconds && styles.chipOn]}
                onPress={() => setDurationSeconds(d.seconds)}
              >
                <Text style={styles.chipText}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>What do you want to do? (optional)</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Σύντομη σημείωση"
            placeholderTextColor={guardTokens.textSecondary}
          />
          <TouchableOpacity
            style={styles.save}
            onPress={() => {
              onSave({ purpose, durationSeconds, note: note.trim() || undefined });
              onClose();
            }}
          >
            <Text style={styles.saveText}>Αποθήκευση πρόθεσης</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: guardTokens.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderColor: guardTokens.divider,
    borderWidth: 1,
  },
  title: { color: guardTokens.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  label: { color: guardTokens.textSecondary, fontSize: 12, marginTop: 8, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: guardTokens.divider,
    backgroundColor: guardTokens.elevated,
  },
  chipOn: { borderColor: guardTokens.focus, backgroundColor: '#8BB8A822' },
  chipText: { color: guardTokens.textPrimary, fontSize: 13 },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: guardTokens.divider,
    paddingHorizontal: 12,
    color: guardTokens.textPrimary,
    backgroundColor: guardTokens.elevated,
  },
  save: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: guardTokens.focus,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#0D1117', fontWeight: '700', fontSize: 15 },
});
