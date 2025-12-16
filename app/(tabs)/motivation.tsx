import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Heart, Droplet, Users, Award, Activity, TrendingUp, Star, CheckCircle } from 'lucide-react-native';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp } from '@/utils/responsive';

export default function Motivation() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Heart size={moderateScale(32)} color={colors.primary[600]} fill={colors.primary[600]} />
            <Text style={styles.headerTitle}>Why Donate Blood?</Text>
            <Text style={styles.headerSubtitle}>Every donation saves up to 3 lives</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconContainer}>
            <Droplet size={moderateScale(48)} color={colors.white} fill={colors.white} />
          </View>
          <Text style={styles.heroTitle}>Be a Hero</Text>
          <Text style={styles.heroText}>
            Your single blood donation can save up to three lives. Be the reason someone smiles today.
          </Text>
        </View>

        {/* Impact Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Users size={moderateScale(24)} color={colors.primary[600]} />
            </View>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Lives Saved</Text>
            <Text style={styles.statSubtext}>Per donation</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Activity size={moderateScale(24)} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>90</Text>
            <Text style={styles.statLabel}>Days</Text>
            <Text style={styles.statSubtext}>Between donations</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Award size={moderateScale(24)} color="#F59E0B" />
            </View>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Pint</Text>
            <Text style={styles.statSubtext}>Standard donation</Text>
          </View>
        </View>

        {/* Why Donate Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Star size={moderateScale(24)} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.sectionTitle}>Why Your Blood Matters</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <CheckCircle size={moderateScale(20)} color={colors.success} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Emergency Situations</Text>
              <Text style={styles.benefitText}>
                Blood is crucial for accident victims, surgery patients, and emergency medical procedures.
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <CheckCircle size={moderateScale(20)} color={colors.success} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Cancer Treatment</Text>
              <Text style={styles.benefitText}>
                Cancer patients often need blood transfusions during chemotherapy and treatment.
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <CheckCircle size={moderateScale(20)} color={colors.success} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Chronic Illnesses</Text>
              <Text style={styles.benefitText}>
                Patients with blood disorders like anemia and thalassemia require regular transfusions.
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <CheckCircle size={moderateScale(20)} color={colors.success} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Maternal Health</Text>
              <Text style={styles.benefitText}>
                Blood donations help mothers experiencing complications during childbirth.
              </Text>
            </View>
          </View>
        </View>

        {/* Blood Types Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Droplet size={moderateScale(24)} color={colors.primary[600]} fill={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Know Your Blood Type</Text>
          </View>

          <View style={styles.bloodTypeGrid}>
            <View style={styles.bloodTypeCard}>
              <Text style={styles.bloodType}>O+</Text>
              <Text style={styles.bloodTypeLabel}>Most Common</Text>
              <Text style={styles.bloodTypeDesc}>Universal RBC donor</Text>
            </View>
            <View style={styles.bloodTypeCard}>
              <Text style={styles.bloodType}>O-</Text>
              <Text style={styles.bloodTypeLabel}>Universal Donor</Text>
              <Text style={styles.bloodTypeDesc}>Can donate to anyone</Text>
            </View>
            <View style={styles.bloodTypeCard}>
              <Text style={styles.bloodType}>AB+</Text>
              <Text style={styles.bloodTypeLabel}>Universal Recipient</Text>
              <Text style={styles.bloodTypeDesc}>Can receive from all</Text>
            </View>
            <View style={styles.bloodTypeCard}>
              <Text style={styles.bloodType}>AB-</Text>
              <Text style={styles.bloodTypeLabel}>Rare Type</Text>
              <Text style={styles.bloodTypeDesc}>Only 1% have it</Text>
            </View>
          </View>
        </View>

        {/* Health Benefits */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={moderateScale(24)} color="#10B981" />
            <Text style={styles.sectionTitle}>Health Benefits for You</Text>
          </View>

          <Text style={styles.benefitText}>
            Regular blood donation isn't just altruistic—it also benefits your own health:
          </Text>

          <View style={styles.healthBenefitsList}>
            <View style={styles.healthBenefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.healthBenefitText}>
                <Text style={styles.boldText}>Reduces Heart Disease Risk:</Text> Helps maintain healthy iron levels
              </Text>
            </View>
            <View style={styles.healthBenefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.healthBenefitText}>
                <Text style={styles.boldText}>Free Health Screening:</Text> Get checked for blood pressure, hemoglobin, and infections
              </Text>
            </View>
            <View style={styles.healthBenefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.healthBenefitText}>
                <Text style={styles.boldText}>Burns Calories:</Text> Donating blood burns approximately 650 calories
              </Text>
            </View>
            <View style={styles.healthBenefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.healthBenefitText}>
                <Text style={styles.boldText}>Stimulates Blood Cell Production:</Text> Helps your body create fresh, new blood cells
              </Text>
            </View>
            <View style={styles.healthBenefitItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.healthBenefitText}>
                <Text style={styles.boldText}>Emotional Well-being:</Text> Feel good knowing you've saved lives
              </Text>
            </View>
          </View>
        </View>

        {/* Donation Guidelines */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Activity size={moderateScale(24)} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Donation Guidelines</Text>
          </View>

          <View style={styles.guidelinesList}>
            <View style={styles.guidelineItem}>
              <Text style={styles.guidelineNumber}>1</Text>
              <Text style={styles.guidelineText}>Must be 18-65 years old</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Text style={styles.guidelineNumber}>2</Text>
              <Text style={styles.guidelineText}>Weigh at least 110 lbs (50 kg)</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Text style={styles.guidelineNumber}>3</Text>
              <Text style={styles.guidelineText}>Wait 90 days between donations</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Text style={styles.guidelineNumber}>4</Text>
              <Text style={styles.guidelineText}>Be in good health with no fever</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Text style={styles.guidelineNumber}>5</Text>
              <Text style={styles.guidelineText}>Eat well and stay hydrated before donating</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Text style={styles.guidelineNumber}>6</Text>
              <Text style={styles.guidelineText}>Avoid strenuous activities for 24 hours after</Text>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaCard}>
          <Heart size={moderateScale(40)} color={colors.white} fill={colors.white} />
          <Text style={styles.ctaTitle}>Ready to Save Lives?</Text>
          <Text style={styles.ctaText}>
            Join thousands of donors making a difference every day. Your donation could be someone's second chance at life.
          </Text>
          <View style={styles.ctaBadge}>
            <Text style={styles.ctaBadgeText}>Be a Hero Today ❤️</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </>
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
    paddingBottom: spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    ...shadows.sm,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.gray[900],
    marginTop: spacing.md,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  heroCard: {
    backgroundColor: colors.primary[600],
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    padding: spacing['2xl'],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  heroIconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '900',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  heroText: {
    fontSize: fontSize.md,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  statIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: fontSize['3xl'],
    fontWeight: '900',
    color: colors.gray[900],
    marginVertical: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.gray[700],
  },
  statSubtext: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.gray[900],
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  benefitIcon: {
    marginTop: spacing.xs,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  benefitText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  bloodTypeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  bloodType: {
    fontSize: fontSize['2xl'],
    fontWeight: '900',
    color: colors.primary[600],
    marginBottom: spacing.xs,
  },
  bloodTypeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  bloodTypeDesc: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  healthBenefitsList: {
    marginTop: spacing.lg,
  },
  healthBenefitItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  bulletPoint: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: colors.primary[600],
    marginTop: moderateScale(8),
  },
  healthBenefitText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
    color: colors.gray[900],
  },
  guidelinesList: {
    marginTop: spacing.md,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  guidelineNumber: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: colors.primary[600],
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: moderateScale(32),
  },
  guidelineText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.gray[700],
    fontWeight: '600',
  },
  ctaCard: {
    backgroundColor: colors.primary[600],
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    padding: spacing['2xl'],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  ctaTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '900',
    color: colors.white,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  ctaText: {
    fontSize: fontSize.md,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
    marginBottom: spacing.lg,
  },
  ctaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  ctaBadgeText: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.white,
  },
  bottomSpacing: {
    height: spacing['2xl'],
  },
});
