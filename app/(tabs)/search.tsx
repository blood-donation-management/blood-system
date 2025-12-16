import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  Animated,
  Clipboard,
} from 'react-native';
import { Search, MapPin, Phone, Droplet, Send, Star, CheckCircle, Filter, MessageCircle, Copy, PhoneCall } from 'lucide-react-native';
import { DonorService } from '@/services/DonorService';
import { router } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';

interface Donor {
  id: string;
  name: string;
  blood_group: string;
  location: string;
  phone_number: string;
  avg_rating?: number | null;
  rating_count?: number;
  eligible?: boolean;
  days_until_eligible?: number;
  lastDonationDate?: string;
  hasAcceptedRequest?: boolean;
}

export default function SearchDonors() {
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState<'city' | 'area' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [selectedDonorToReport, setSelectedDonorToReport] = useState<Donor | null>(null);

  // Animation refs
  const searchButtonScale = useRef(new Animated.Value(1)).current;
  const searchButtonGlow = useRef(new Animated.Value(0)).current;
  const requestButtonScales = useRef(new Map()).current;
  const viewRef = useRef<View>(null);

  useEffect(() => {
    startAnimations();
  }, []);

  // Check admin status and load all donors on mount
  useEffect(() => {
    checkAdminStatus();
    searchDonors(); // Load all donors initially
  }, []);

  const calculateAvailability = (lastDonationDate: string | undefined) => {
    if (!lastDonationDate) return { available: true, daysUntilEligible: 0, message: 'Available' };
    
    const lastDonation = new Date(lastDonationDate);
    const now = new Date();
    const diffMs = now.getTime() - lastDonation.getTime();
    const daysSinceDonation = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const requiredWaitDays = 90; // 3 months
    
    if (daysSinceDonation >= requiredWaitDays) {
      return { available: true, daysUntilEligible: 0, message: 'Available' };
    } else {
      const daysRemaining = requiredWaitDays - daysSinceDonation;
      return { 
        available: false, 
        daysUntilEligible: daysRemaining,
        message: `Available in ${daysRemaining} days`
      };
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { supabase } = await import('@/config/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: admin } = await supabase
          .from('admins')
          .select('id')
          .eq('id', user.id)
          .single();
        setIsAdmin(!!admin);
      }
    } catch (e) {
      setIsAdmin(false);
    }
  };

  const startAnimations = () => {
    // Glow animation for search button
    const searchGlowAnimation = () => {
      Animated.sequence([
        Animated.timing(searchButtonGlow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(searchButtonGlow, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => searchGlowAnimation());
    };

    searchGlowAnimation();
  };

  const handleSearchPress = () => {
    Animated.sequence([
      Animated.timing(searchButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(searchButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    searchDonors();
  };

  const getRequestButtonScale = (donorId: string) => {
    if (!requestButtonScales.has(donorId)) {
      requestButtonScales.set(donorId, new Animated.Value(1));
    }
    return requestButtonScales.get(donorId);
  };

  const handleRequestPress = (donor: Donor) => {
    const scale = getRequestButtonScale(donor.id);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    sendBloodRequest(donor);
  };

  const bdCities = useMemo(
    () => [
      { name: 'Dhaka', areas: ['Dhanmondi', 'Mirpur', 'Uttara', 'Gulshan', 'Banani', 'Mohakhali', 'Motijheel'] },
      { name: 'Chattogram', areas: ['Agrabad', 'Pahartali', 'Panchlaish', 'Kotwali', 'Halishahar'] },
      { name: 'Khulna', areas: ['Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali'] },
      { name: 'Rajshahi', areas: ['Boalia', 'Rajpara', 'Motihar', 'Shah Makhdum'] },
      { name: 'Sylhet', areas: ['Zindabazar', 'Shibganj', 'Amberkhana', 'Subid Bazar'] },
      { name: 'Barishal', areas: ['Band Road', 'Port Road', 'C&B Road'] },
      { name: 'Rangpur', areas: ['Dhap', 'Jahaj Company More', 'Lalbag'] },
      { name: 'Mymensingh', areas: ['Ganginar Par', 'Town Hall', 'Charpara'] },
    ],
    []
  );
  const cityOptions = bdCities.map((c) => c.name);
  const areaOptions = useMemo(() => (bdCities.find((c) => c.name === city)?.areas ?? []), [bdCities, city]);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const searchDonors = async () => {
    const composedLocation = area && city ? `${area}, ${city}` : undefined;

    setIsLoading(true);
    try {
      const results = await DonorService.searchDonors(composedLocation, bloodGroup || undefined);
      setDonors(results);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Error', 'Failed to search donors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScreenshot = async () => {
    if (!viewRef.current) {
      Alert.alert('Error', 'Screenshot not available');
      return;
    }

    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.9,
      });
      if (uri) {
        Alert.alert('Success', 'Search results screenshot saved to your gallery!');
      }
    } catch (error) {
      console.error('Screenshot failed:', error);
      Alert.alert('Error', 'Failed to capture screenshot');
    }
  };

  const sendBloodRequest = async (donor: Donor) => {
    try {
      if (!donor.id) {
        Alert.alert('Error', 'Invalid donor ID. Please try again.');
        return;
      }
      
      // Check donor availability before sending request
      const availability = calculateAvailability(donor.lastDonationDate);
      if (!availability.available) {
        Alert.alert(
          'Donor Not Available',
          `This donor is not eligible to donate yet. They will be available in ${availability.daysUntilEligible} days (${Math.ceil(availability.daysUntilEligible / 30)} months after last donation).`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      await DonorService.sendBloodRequest(donor.id);
      Alert.alert(
        'Request Sent',
        `Blood request sent to ${donor.name}. They will be notified of your request.`,
        [
          { text: 'OK', onPress: () => router.push('/(tabs)/requests') }
        ]
      );
    } catch (error) {
      console.error('Request failed:', error);
      Alert.alert('Error', 'Failed to send blood request');
    }
  };

  const handleWhatsAppPress = async (donor: Donor) => {
    try {
      await DonorService.openWhatsApp(donor.phone_number, `Hi ${donor.name}, I found your profile on Blood Donation App. I would like to discuss blood donation with you.`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to open WhatsApp');
    }
  };

  const handleCopyPhone = async (phoneNumber: string) => {
    try {
      await Clipboard.setString(phoneNumber);
      Alert.alert('Copied', `Phone number copied to clipboard: ${phoneNumber}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy phone number');
    }
  };

  const handleCallPress = async (phoneNumber: string) => {
    try {
      await DonorService.initiateCall(phoneNumber);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to initiate call');
    }
  };

  const handleReportUser = (donor: Donor) => {
    setSelectedDonorToReport(donor);
    setReportReason('');
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    if (!selectedDonorToReport) return;
    
    if (!reportReason || reportReason.trim().length < 10) {
      Alert.alert('Error', 'Please provide a detailed reason (at least 10 characters)');
      return;
    }
    
    try {
      await DonorService.reportUser(selectedDonorToReport.id, reportReason.trim());
      setReportModalVisible(false);
      setSelectedDonorToReport(null);
      setReportReason('');
      Alert.alert(
        'Report Submitted',
        'Thank you for your report. Our admin team will review it shortly.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit report');
    }
  };

  const renderDonor = ({ item }: { item: Donor }) => (
    <View style={styles.donorCard}>
      <View style={styles.donorCardGradient} />
      <View style={styles.donorHeader}>
        <View style={styles.donorInfo}>
          <Text style={styles.donorName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.bloodGroupBadge}>
            <Droplet size={14} color="#FFFFFF" />
            <Text style={styles.bloodGroupText}>{item.blood_group}</Text>
          </View>
          {/* Rating row */}
          <View style={styles.ratingRow}>
            <Star size={14} color={item.avg_rating ? '#F59E0B' : '#9CA3AF'} fill={item.avg_rating ? '#F59E0B' : 'none'} />
            <Text style={styles.ratingText}>
              {typeof item.avg_rating === 'number' ? `${item.avg_rating.toFixed(1)} / 5` : 'No ratings yet'}
              {` `}
              {typeof item.rating_count === 'number' && item.rating_count > 0 ? `(${item.rating_count})` : ''}
            </Text>
          </View>
          {/* Availability status - show eligibility with days since last donation */}
          <View style={styles.eligibilityRow}>
            {item.eligible === true ? (
              <>
                <CheckCircle size={14} color="#10B981" />
                <Text style={styles.eligibleText}>Ready to donate</Text>
              </>
            ) : item.eligible === false ? (
              <>
                <CheckCircle size={14} color="#F59E0B" />
                <Text style={styles.eligibleText}>Can donate in {item.days_until_eligible} days</Text>
              </>
            ) : (
              <>
                <CheckCircle size={14} color="#10B981" />
                <Text style={styles.eligibleText}>Available to donate</Text>
              </>
            )}
          </View>
        </View>
        <Animated.View
          style={{
            transform: [{ scale: getRequestButtonScale(item.id) }]
          }}
        >
          <TouchableOpacity
            style={[
              styles.requestButton, 
              styles.classyRequestButton,
              !calculateAvailability(item.lastDonationDate).available && styles.disabledRequestButton
            ]}
            onPress={() => handleRequestPress(item)}
            activeOpacity={0.8}
            disabled={!calculateAvailability(item.lastDonationDate).available}
          >
            <View style={styles.requestButtonGlow} />
            <View style={[styles.requestButtonInner, styles.classyRequestInner]}>
              <Send size={14} color="#FFFFFF" />
              <View style={styles.requestSparkle} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.donorDetails}>
        <View style={styles.detailRow}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        {(() => {
          const availability = calculateAvailability(item.lastDonationDate);
          return (
            <View style={styles.availabilityRow}>
              <View style={[styles.availabilityBadge, availability.available ? styles.availableBadge : styles.unavailableBadge]}>
                <View style={[styles.availabilityDot, { backgroundColor: availability.available ? '#10B981' : '#F59E0B' }]} />
                <Text style={[styles.availabilityText, { color: availability.available ? '#10B981' : '#F59E0B' }]}>
                  {availability.message}
                </Text>
              </View>
              {item.hasAcceptedRequest && (
                <View style={[styles.availabilityBadge, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                  <View style={[styles.availabilityDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={[styles.availabilityText, { color: '#D97706' }]}>Busy</Text>
                </View>
              )}
              {item.lastDonationDate && (
                <Text style={styles.lastDonationText}>
                  Last: {new Date(item.lastDonationDate).toLocaleDateString('en-BD', { month: 'short', day: 'numeric', timeZone: 'Asia/Dhaka' })}
                </Text>
              )}
            </View>
          );
        })()}
        <View style={[styles.detailRow, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            onPress={() => handleCallPress(item.phone_number)}
          >
            <Phone size={14} color="#16A34A" />
            <Text style={[styles.detailText, { color: '#16A34A', fontWeight: '600' }]}>{item.phone_number}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleCopyPhone(item.phone_number)}
            style={styles.copyButton}
          >
            <Copy size={14} color="#2563EB" />
          </TouchableOpacity>
        </View>
        {/* WhatsApp Contact Button */}
        <TouchableOpacity 
          style={styles.whatsappButton} 
          onPress={() => handleWhatsAppPress(item)}
          activeOpacity={0.7}
        >
          <MessageCircle size={16} color="#FFFFFF" />
          <Text style={styles.whatsappButtonText}>Message on WhatsApp</Text>
        </TouchableOpacity>
        
        {/* Report User Button */}
        {!isAdmin && (
          <TouchableOpacity 
            style={styles.reportButton} 
            onPress={() => handleReportUser(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.reportButtonText}>⚠️ Report User</Text>
          </TouchableOpacity>
        )}
        
        {/* Admin Controls */}
        {isAdmin && (
          <View style={styles.adminControls}>
            <TouchableOpacity
              style={[styles.adminButton, styles.verifyButton]}
              onPress={async () => {
                try {
                  const { AdminService } = await import('@/services/AdminService');
                  await AdminService.verifyDonor(item.id, true, 'Verified by admin');
                  Alert.alert('Success', 'Donor verified successfully');
                  searchDonors();
                } catch (e: any) {
                  Alert.alert('Error', e.message || 'Failed to verify donor');
                }
              }}
            >
              <CheckCircle size={14} color="#FFFFFF" />
              <Text style={styles.adminButtonText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adminButton, styles.deleteButton]}
              onPress={() => {
                Alert.alert(
                  'Delete Donor',
                  `Are you sure you want to delete ${item.name}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const { AdminService } = await import('@/services/AdminService');
                          await AdminService.deleteDonor(item.id);
                          Alert.alert('Success', 'Donor deleted successfully');
                          searchDonors();
                        } catch (e: any) {
                          Alert.alert('Error', e.message || 'Failed to delete donor');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.adminButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View ref={viewRef} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerGradient} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Find Blood Donors</Text>
            <Text style={styles.headerSubtitle}>Connect with life-savers in your area</Text>
          </View>
          <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterToggleBtn}>
            <Filter size={18} color={colors.primary[600]} />
            <Text style={styles.filterToggleText}>Filters</Text>
          </TouchableOpacity>
          </View>
      {/* Compact: filters hidden behind a modal; show a small search button */}
      <View style={styles.searchSection}>
        {/* Show a quick search button; full filters in modal */}
        <Animated.View
          style={{
            transform: [{ scale: searchButtonScale }]
          }}
        >
          <TouchableOpacity
            style={[styles.searchButton, styles.classySearchButton, isLoading && styles.searchButtonDisabled]}
            onPress={handleSearchPress}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Animated.View 
              style={[
                styles.searchButtonGlow,
                {
                  opacity: searchButtonGlow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.4]
                  })
                }
              ]}
            />
            <View style={[styles.searchButtonInner, styles.classySearchInner]}>
              <Search size={18} color="#FFFFFF" />
              <Text style={[styles.searchButtonText, styles.classySearchText]}>
                {isLoading ? 'Searching...' : 'Search Donors'}
              </Text>
              <View style={styles.searchSparkle} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <FlatList
        data={donors}
        renderItem={renderDonor}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.donorsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {city && area ? 'No donors found in this location' : 'Search for donors to get started'}
            </Text>
          </View>
        }
      />
      <PickerModal
        visible={pickerVisible === 'city'}
        title="Select City"
        options={cityOptions}
        onSelect={(value) => setCity(value)}
        onClose={() => setPickerVisible(null)}
      />
      <PickerModal
        visible={pickerVisible === 'area'}
        title="Select Area"
        options={areaOptions}
        onSelect={(value) => setArea(value)}
        onClose={() => setPickerVisible(null)}
      />

      {/* Filters Modal */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: 12 }}>Filters</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity style={[styles.inputContainer, { flex: 1 }]} onPress={() => setPickerVisible('city')}>
                <MapPin size={20} color="#6B7280" />
                <Text style={[styles.input, { paddingVertical: 0 }]}>{city || 'Select City'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputContainer, { flex: 1, opacity: city ? 1 : 0.5 }]}
                disabled={!city}
                onPress={() => setPickerVisible('area')}
              >
                <MapPin size={20} color="#6B7280" />
                <Text style={[styles.input, { paddingVertical: 0 }]}>{area || 'Select Area'}</Text>
              </TouchableOpacity>
            </View>
            {!!city && !!area && (
              <Text style={styles.helperText}>Selected: {area}, {city}</Text>
            )}

            <View style={styles.bloodGroupContainer}>
              <Text style={styles.bloodGroupLabel}>Blood Group (Optional)</Text>
              <View style={styles.bloodGroupGrid}>
                {bloodGroups.map((group) => (
                  <TouchableOpacity
                    key={group}
                    style={[
                      styles.bloodGroupButton,
                      bloodGroup === group && styles.bloodGroupButtonActive,
                    ]}
                    onPress={() => setBloodGroup(bloodGroup === group ? '' : group)}
                  >
                    <Text
                      style={[
                        styles.bloodGroupButtonText,
                        bloodGroup === group && styles.bloodGroupButtonTextActive,
                      ]}
                    >
                      {group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={{ color: colors.gray[600], fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowFilters(false); searchDonors(); }}>
                <Text style={{ color: colors.primary[600], fontWeight: '700' }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={reportModalVisible} transparent animationType="fade" onRequestClose={() => setReportModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 }}>Report User</Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
              {selectedDonorToReport ? `Report ${selectedDonorToReport.name}` : 'Report User'}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Reason for reporting (min 10 characters):
            </Text>
            <TextInput
              style={{
                backgroundColor: '#F9FAFB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                color: '#111827',
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 16
              }}
              placeholder="Please provide detailed reason..."
              placeholderTextColor="#9CA3AF"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              numberOfLines={4}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setReportModalVisible(false);
                  setSelectedDonorToReport(null);
                  setReportReason('');
                }}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#6B7280', fontWeight: '700', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitReport}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: '#DC2626',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </View>
  );
}

function PickerModal({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, maxHeight: '70%' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>{title}</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                style={{ paddingVertical: 12 }}
              >
                <Text style={{ fontSize: 16, color: '#111827' }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
            <Text style={{ color: '#DC2626', fontWeight: '600' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: hp(6),
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    overflow: 'hidden',
    ...shadows.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 10, backgroundColor: colors.gray[50], borderWidth: 1, borderColor: colors.gray[200] },
  filterToggleText: { color: colors.primary[600], fontWeight: '700' },
  searchSection: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  screenshotBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    marginTop: 0,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: '#FEF2F2',
  },
  headerContent: {
    zIndex: 1,
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    marginTop: spacing.xs,
    fontWeight: '400',
  },
  // Removed large inline search form in favor of modal
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.gray[50],
    ...shadows.sm,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    color: colors.gray[900],
  },
  bloodGroupContainer: {
    marginBottom: 16,
  },
  bloodGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodGroupButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
    ...shadows.sm,
  },
  bloodGroupButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
    ...shadows.md,
  },
  bloodGroupButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[500],
  },
  bloodGroupButtonTextActive: {
    color: colors.white,
  },
  requestButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  searchButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchButton: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    ...shadows.md,
  },
  classySearchButton: {
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  searchButtonGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    backgroundColor: '#DC2626',
    borderRadius: 20,
  },
  classySearchInner: {
    position: 'relative',
  },
  classySearchText: {
    fontWeight: '800',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchSparkle: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  requestButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  classyRequestButton: {
    borderWidth: 1.5,
    borderColor: '#1E40AF',
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  requestButtonGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: '#1D4ED8',
    borderRadius: 26,
    opacity: 0.3,
  },
  classyRequestInner: {
    position: 'relative',
  },
  requestSparkle: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  donorsList: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  donorCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  donorCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#FEF2F2',
  },
  donorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  ratingText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    fontWeight: '600',
  },
  bloodGroupBadge: {
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  bloodGroupText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
  eligibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  eligibleText: {
    fontSize: fontSize.xs,
    color: '#10B981',
    fontWeight: '600',
  },
  donorDetails: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
  },
  copyButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminControls: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  adminButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  verifyButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  adminButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#25D366',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  whatsappButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  reportButtonText: {
    color: '#DC2626',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  availableBadge: {
    backgroundColor: '#ECFDF5',
  },
  unavailableBadge: {
    backgroundColor: '#FEF3C7',
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  lastDonationText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontWeight: '600',
  },
  disabledRequestButton: {
    opacity: 0.4,
    backgroundColor: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    marginTop: spacing.md,
    textAlign: 'center',
  },
  helperText: {
    marginTop: -8,
    marginBottom: 8,
    fontSize: 12,
    color: '#6B7280',
    paddingHorizontal: 4,
  },
});