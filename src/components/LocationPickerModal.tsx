import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';

interface Option {
  id: string;
  name: string;
}

interface LocationPickerModalProps {
  label: string;
  placeholder: string;
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export default function LocationPickerModal({
  label,
  placeholder,
  options,
  value,
  onSelect,
  icon,
  disabled = false,
}: LocationPickerModalProps) {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.id === value);

  const handleSelect = (id: string) => {
    onSelect(id);
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={[styles.inputButton, disabled && styles.disabledInput]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.inputContent}>
          <Ionicons 
            name={icon} 
            size={20} 
            color={disabled ? COLORS.textMuted : (value ? COLORS.primary : COLORS.textMuted)} 
          />
          <Text style={[
            styles.inputText, 
            !value && styles.placeholderText,
            disabled && styles.disabledText
          ]}>
            {selectedOption ? selectedOption.name : placeholder}
          </Text>
        </View>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? COLORS.textMuted : COLORS.textMuted} 
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.dragIndicator} />
            <Text style={styles.modalTitle}>Select {label}</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setVisible(false)}
            >
              <Ionicons name="close-circle" size={28} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {options.length > 0 ? (
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item.id === value && styles.selectedOption
                  ]}
                  onPress={() => handleSelect(item.id)}
                >
                  <Text style={[
                    styles.optionText,
                    item.id === value && styles.selectedOptionText
                  ]}>
                    {item.name}
                  </Text>
                  {item.id === value && (
                    <Ionicons name="checkmark" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No options available</Text>
            </View>
          )}
          <SafeAreaView />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  disabledInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  inputText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  placeholderText: {
    color: COLORS.textMuted,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingTop: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative',
    marginHorizontal: SPACING.lg,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  listContent: {
    padding: SPACING.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  selectedOption: {
    backgroundColor: `${COLORS.primary}10`,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
});
