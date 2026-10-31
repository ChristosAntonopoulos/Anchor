import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import * as Location from 'expo-location';
import { colors, spacing, typography, borderRadius, shadows, gradients } from '../../constants/designTokens';
import type { Location as LocationType } from '../../types';

interface LocationPickerProps {
  visible: boolean;
  location: LocationType | undefined;
  onClose: () => void;
  onSave: (location: LocationType) => void;
}

export function LocationPicker({ visible, location, onClose, onSave }: LocationPickerProps) {
  const [placeName, setPlaceName] = useState(location?.placeName || '');
  const [address, setAddress] = useState(location?.address || '');
  const [loading, setLoading] = useState(false);

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get your current location.');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocode to get address
      const geocodeResult = await Location.reverseGeocodeAsync({ latitude, longitude });
      const firstResult = geocodeResult[0];
      const fullAddress = firstResult
        ? `${firstResult.street || ''} ${firstResult.city || ''} ${firstResult.region || ''} ${firstResult.postalCode || ''}`.trim()
        : '';

      setAddress(fullAddress);
      onSave({
        latitude,
        longitude,
        address: fullAddress,
        placeName: placeName || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!address.trim() && !placeName.trim()) {
      Alert.alert('Error', 'Please enter a location name or address.');
      return;
    }

    onSave({
      latitude: location?.latitude,
      longitude: location?.longitude,
      address: address.trim() || undefined,
      placeName: placeName.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AppIcon name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Location</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>Place Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Coffee Shop, Office"
                placeholderTextColor={colors.textSecondary}
                value={placeName}
                onChangeText={setPlaceName}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter address..."
                placeholderTextColor={colors.textSecondary}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleGetCurrentLocation}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.category.work, colors.category.work + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.locationButtonGradient}
              >
                <AppIcon name="location" size={20} color={colors.background} />
                <Text style={styles.locationButtonText}>
                  {loading ? 'Getting location...' : 'Use Current Location'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.hint}>
              You can enter a place name and address manually, or use your current location.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  saveButton: {
    padding: spacing.xs,
  },
  saveButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.work,
  },
  content: {
    flex: 1,
    padding: spacing.l,
  },
  section: {
    marginBottom: spacing.l,
  },
  label: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationButton: {
    borderRadius: borderRadius.medium,
    marginBottom: spacing.m,
    ...shadows.small,
  },
  locationButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    borderRadius: borderRadius.medium,
  },
  locationButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  hint: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
