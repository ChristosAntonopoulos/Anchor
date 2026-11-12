import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { guardTokens } from '../../features/distraction-guard/guardTokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  onBypass: (seconds: number) => void;
  onEndRestriction: () => void;
};

export function BypassSheet({ visible, onClose, onBypass, onEndRestriction }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Need access?</Text>
          <Text style={styles.hint}>Temporary access — no shame, no punishment.</Text>
          {[
            { label: '2 minutes', seconds: 120 },
            { label: '5 minutes', seconds: 300 },
            { label: '15 minutes', seconds: 900 },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.seconds}
              style={styles.btn}
              onPress={() => {
                onBypass(opt.seconds);
                onClose();
              }}
            >
              <Text style={styles.btnText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.btn, styles.danger]}
            onPress={() => {
              onEndRestriction();
              onClose();
            }}
          >
            <Text style={styles.btnText}>End restriction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: guardTokens.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderColor: guardTokens.divider,
    borderWidth: 1,
  },
  title: {
    color: guardTokens.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    color: guardTokens.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  btn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: guardTokens.elevated,
    borderWidth: 1,
    borderColor: guardTokens.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  danger: {
    borderColor: guardTokens.warning,
  },
  btnText: {
    color: guardTokens.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    color: guardTokens.textSecondary,
  },
});
