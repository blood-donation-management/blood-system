import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Droplet, MapPin, Phone, Calendar, CheckCircle, Clock } from 'lucide-react-native';
import { Card } from './Card';
import { COLORS, SPACING, FONTS } from '@/constants';
import { DonorProfile } from '@/types';

interface DonorCardProps {
  donor: DonorProfile;
  onPress?: () => void;
  onRequestPress?: () => void;
  showActions?: boolean;
}

export function DonorCard({ donor, onPress, onRequestPress, showActions = true }: DonorCardProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{donor.name}</Text>
          {donor.verified && (
            <View style={styles.verifiedBadge}>
              <CheckCircle size={14} color={COLORS.success} />
            </View>
          )}
        </View>
        <View style={[styles.bloodBadge, { backgroundColor: COLORS.primary }]}>
          <Droplet size={16} color={COLORS.white} fill={COLORS.white} />
          <Text style={styles.bloodText}>{donor.bloodGroup}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MapPin size={16} color={COLORS.textSecondary} />
        <Text style={styles.infoText}>{donor.location}</Text>
      </View>

      <View style={styles.infoRow}>
        <Phone size={16} color={COLORS.textSecondary} />
        <Text style={styles.infoText}>{donor.phoneNumber}</Text>
      </View>

      {donor.lastDonationDate && (
        <View style={styles.infoRow}>
          <Calendar size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            Last donation: {new Date(donor.lastDonationDate).toLocaleDateString()}
          </Text>
        </View>
      )}

      {donor.eligible !== undefined && (
        <View style={styles.eligibilityContainer}>
          {donor.eligible ? (
            <View style={[styles.eligibilityBadge, styles.eligible]}>
              <CheckCircle size={14} color={COLORS.success} />
              <Text style={styles.eligibleText}>Eligible to donate</Text>
            </View>
          ) : (
            <View style={[styles.eligibilityBadge, styles.notEligible]}>
              <Clock size={14} color={COLORS.warning} />
              <Text style={styles.notEligibleText}>
                Eligible in {donor.daysUntilEligible} days
              </Text>
            </View>
          )}
        </View>
      )}

      {showActions && onRequestPress && (
        <TouchableOpacity style={styles.requestButton} onPress={onRequestPress}>
          <Text style={styles.requestButtonText}>Send Request</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  verifiedBadge: {
    marginLeft: SPACING.xs,
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bloodText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  eligibilityContainer: {
    marginTop: SPACING.sm,
  },
  eligibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  eligible: {
    backgroundColor: '#D1FAE5',
  },
  notEligible: {
    backgroundColor: '#FEF3C7',
  },
  eligibleText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  notEligibleText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  requestButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
});
