import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  bookingIntervalsFromDayBookings,
  buildHourlySlots,
  getSelectedEndHour,
  getSelectedStartHour,
  hourToTimeString,
  isRangeAvailable,
  isSlotInSelectedRange,
  slotEndTimeString,
  type HourlySlot,
} from '../lib/time-slots';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import { showToast } from '../utils/toast';

type BookingTimeSlotGridProps = {
  bookingDate: string;
  dayBookings: Array<{ start_time: string; end_time: string }>;
  totalCourts: number;
  startTime: string;
  endTime: string;
  onChange: (startTime: string, endTime: string) => void;
  loading?: boolean;
  isOwner?: boolean;
  maxHours?: number;
};

export default function BookingTimeSlotGrid({
  bookingDate,
  dayBookings,
  totalCourts,
  startTime,
  endTime,
  onChange,
  loading = false,
  isOwner = false,
  maxHours = 8,
}: BookingTimeSlotGridProps) {
  const slots = useMemo(() => {
    if (!bookingDate) return [];
    const intervals = bookingIntervalsFromDayBookings(dayBookings);
    return buildHourlySlots(totalCourts, intervals, bookingDate, isOwner);
  }, [bookingDate, dayBookings, totalCourts, isOwner]);

  const selectedStartHour = getSelectedStartHour(startTime);
  const selectedEndHour = getSelectedEndHour(startTime, endTime);

  const handleSlotClick = (slot: HourlySlot) => {
    if (!bookingDate) {
      showToast.error('Please select a booking date first', 'Date Required');
      return;
    }

    if (slot.isPast) {
      showToast.error(
        isOwner ? 'This time has already passed' : 'Please select a time at least 1 hour from now',
        'Invalid Time'
      );
      return;
    }

    if (slot.isBooked || !slot.available) {
      showToast.error('This slot is fully booked', 'Unavailable');
      return;
    }

    const { hour } = slot;

    if (selectedStartHour === null) {
      onChange(slot.startTime, slot.endTime);
      return;
    }

    if (selectedStartHour === hour && selectedEndHour === hour) {
      onChange('', '');
      return;
    }

    if (hour < selectedStartHour) {
      onChange(slot.startTime, slot.endTime);
      return;
    }

    const hourCount = hour - selectedStartHour + 1;
    if (hourCount > maxHours) {
      showToast.error(`Booking duration cannot exceed ${maxHours} hours`, 'Invalid Duration');
      return;
    }

    if (!isRangeAvailable(slots, selectedStartHour, hour)) {
      showToast.error('One or more slots in this range are not available', 'Unavailable');
      return;
    }

    onChange(hourToTimeString(selectedStartHour), slotEndTimeString(hour));
  };

  if (!bookingDate) {
    return (
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>Select a date to view available time slots</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Select Time Slot</Text>
        {startTime && endTime && selectedStartHour !== null && selectedEndHour !== null && (
          <Text style={styles.selectedDuration}>
            {selectedEndHour - selectedStartHour + 1}h selected
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading slots...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={styles.grid}>
            {slots.map((slot) => {
              const isSelected = isSlotInSelectedRange(slot.hour, startTime, endTime);
              const isDisabled = slot.isPast || slot.isBooked || !slot.available;

              return (
                <TouchableOpacity
                  key={slot.hour}
                  style={[
                    styles.slot,
                    isSelected && styles.slotSelected,
                    !isSelected && slot.isBooked && styles.slotBooked,
                    !isSelected && slot.isPast && styles.slotPast,
                    !isSelected && !isDisabled && styles.slotAvailable,
                  ]}
                  onPress={() => handleSlotClick(slot)}
                  disabled={isDisabled && !isSelected}
                  activeOpacity={0.7}
                >
                  {slot.isBooked ? (
                    <>
                      <Text style={[styles.slotLabel, styles.slotLabelBooked]}>{slot.label}</Text>
                      <Text style={styles.slotFullText}>Full</Text>
                    </>
                  ) : (
                    <Text
                      style={[
                        styles.slotLabel,
                        isSelected && styles.slotLabelSelected,
                        slot.isPast && styles.slotLabelPast,
                      ]}
                    >
                      {slot.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      <Text style={styles.hint}>
        Tap a slot for 1 hour, or tap a second slot to extend up to {maxHours} hours.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectedDuration: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  placeholderBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  placeholderText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  gridScroll: {
    maxHeight: 220,
  },
  gridContent: {
    paddingVertical: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  slot: {
    width: '23%',
    minHeight: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  slotAvailable: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  slotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  slotBooked: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  slotPast: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.divider,
    opacity: 0.6,
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  slotLabelSelected: {
    color: '#FFF',
  },
  slotLabelPast: {
    color: COLORS.textMuted,
  },
  slotLabelBooked: {
    color: '#B91C1C',
    fontSize: 10,
  },
  slotFullText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});
