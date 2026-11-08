import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { fetchSafeRoute, formatDistance, formatDuration } from '../services/routingService';
import { RouteResult } from '../types';

export default function SafeRouteScreen() {
  const [origin, setOrigin] = useState('Yelahanka Satellite Town');
  const [destination, setDestination] = useState('Chokkanahalli Health Centre');
  const [mode, setMode] = useState<'walk' | 'cycle' | 'drive'>('walk');
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);

  // Default coordinates for Bengaluru demonstration
  const originCoords: [number, number] = [13.1007, 77.5963];
  const destCoords: [number, number] = [13.0872, 77.6265];

  const calculateRoute = async (selectedMode = mode) => {
    setLoading(true);
    try {
      const res = await fetchSafeRoute(originCoords, destCoords, selectedMode);
      setRoute(res);
    } catch {
      // handled inside service
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateRoute(mode);
  }, [mode]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    calculateRoute(mode);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CANOPY SAFE ROUTING</Text>
        <Text style={styles.headerSub}>Live Road AI with Continuous Tree Shade</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Origin / Destination Search Box */}
        <View style={styles.searchCard}>
          <View style={styles.inputGroup}>
            <View style={styles.indicatorCol}>
              <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
              <View style={styles.verticalLine} />
              <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            </View>

            <View style={styles.inputsCol}>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  value={origin}
                  onChangeText={setOrigin}
                  placeholder="Starting point"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Destination"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.swapBtn} onPress={handleSwap}>
              <Ionicons name="swap-vertical" size={20} color="#06B6D4" />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'walk' && styles.modeTabActive]}
              onPress={() => setMode('walk')}
            >
              <MaterialCommunityIcons
                name="walk"
                size={18}
                color={mode === 'walk' ? '#10B981' : '#94A3B8'}
              />
              <Text style={[styles.modeLabel, mode === 'walk' && styles.modeLabelActive]}>
                Walk (Max Shade)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'cycle' && styles.modeTabActive]}
              onPress={() => setMode('cycle')}
            >
              <Ionicons
                name="bicycle"
                size={18}
                color={mode === 'cycle' ? '#10B981' : '#94A3B8'}
              />
              <Text style={[styles.modeLabel, mode === 'cycle' && styles.modeLabelActive]}>
                Cycle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'drive' && styles.modeTabActive]}
              onPress={() => setMode('drive')}
            >
              <Ionicons
                name="car"
                size={18}
                color={mode === 'drive' ? '#10B981' : '#94A3B8'}
              />
              <Text style={[styles.modeLabel, mode === 'drive' && styles.modeLabelActive]}>
                Drive
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#06B6D4" />
            <Text style={styles.loadingText}>Computing road shade topology via OSRM...</Text>
          </View>
        ) : route ? (
          <>
            {/* Route Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View>
                  <Text style={styles.summaryDuration}>
                    {formatDuration(route.durationSeconds)}
                  </Text>
                  <Text style={styles.summaryDistance}>
                    {formatDistance(route.distanceMeters)} road distance
                  </Text>
                </View>

                <View style={styles.shadePill}>
                  <Feather name="umbrella" size={14} color="#10B981" />
                  <Text style={styles.shadePillText}>
                    {route.shadeCoveragePercent}% Tree Canopy
                  </Text>
                </View>
              </View>

              <View style={styles.summaryStatsRow}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatLabel}>Route Temp</Text>
                  <Text style={styles.miniStatVal}>{route.averageHeatIndex}°C</Text>
                  <Text style={styles.miniStatSub}>-3.8°C vs Asphalt</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.miniStat}>
                  <Text style={styles.miniStatLabel}>Cooling Stops</Text>
                  <Text style={styles.miniStatVal}>{route.coolingStopsCount} Verified</Text>
                  <Text style={styles.miniStatSub}>Water & ORS</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.miniStat}>
                  <Text style={styles.miniStatLabel}>Heat Exposure</Text>
                  <Text style={[styles.miniStatVal, { color: '#10B981' }]}>Low Risk</Text>
                  <Text style={styles.miniStatSub}>Canopy Shield</Text>
                </View>
              </View>
            </View>

            {/* Waypoint Cooling Stops Badge */}
            <View style={styles.respiteBanner}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#06B6D4" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.respiteTitle}>2 Hydration Stations On This Path</Text>
                <Text style={styles.respiteSub}>
                  BBMP Shaded Pavilion at 1.1km • Primary Health Centre at 2.4km
                </Text>
              </View>
            </View>

            {/* Turn-by-Turn Instruction List */}
            <View style={styles.stepsCard}>
              <Text style={styles.stepsTitle}>TURN-BY-TURN HEAT-SAFE GUIDANCE</Text>

              {route.steps.map((step, idx) => {
                const isHighShade = step.shadeLevel === 'HIGH';
                return (
                  <View key={idx} style={styles.stepItem}>
                    <View style={styles.stepNumCol}>
                      <View style={[styles.stepNumCircle, isHighShade && styles.stepNumCanopy]}>
                        <Text style={styles.stepNumText}>{idx + 1}</Text>
                      </View>
                      {idx < route.steps.length - 1 && <View style={styles.stepStepLine} />}
                    </View>

                    <View style={styles.stepContent}>
                      <Text style={styles.stepInstruction}>{step.instruction}</Text>
                      <View style={styles.stepMetaRow}>
                        <Text style={styles.stepDist}>{formatDistance(step.distanceMeters)}</Text>
                        <View
                          style={[
                            styles.stepShadeBadge,
                            {
                              backgroundColor:
                                step.shadeLevel === 'HIGH'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.stepShadeText,
                              {
                                color: step.shadeLevel === 'HIGH' ? '#10B981' : '#F59E0B',
                              },
                            ]}
                          >
                            {step.shadeLevel === 'HIGH' ? 'High Tree Cover' : 'Moderate Sun'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060D1E',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B1329',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  searchCard: {
    backgroundColor: '#0B1329',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  verticalLine: {
    width: 2,
    height: 28,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  inputsCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  inputWrap: {
    paddingVertical: 4,
  },
  textInput: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 4,
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 4,
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#132147',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#060D1E',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: '#0E2829',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modeLabelActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  loadingBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1329',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  loadingText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 12,
  },
  summaryCard: {
    backgroundColor: '#0B1329',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryDuration: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  summaryDistance: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  shadePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  shadePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#060D1E',
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  miniStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    marginVertical: 2,
  },
  miniStatSub: {
    fontSize: 10,
    color: '#64748B',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#1E293B',
    height: '80%',
    alignSelf: 'center',
  },
  respiteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#082535',
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  respiteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CFFAFE',
  },
  respiteSub: {
    fontSize: 11,
    color: '#67E8F9',
    marginTop: 2,
  },
  stepsCard: {
    backgroundColor: '#0B1329',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  stepsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
  },
  stepNumCol: {
    alignItems: 'center',
    width: 28,
  },
  stepNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumCanopy: {
    backgroundColor: '#0E2829',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  stepStepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1E293B',
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 18,
  },
  stepInstruction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 20,
  },
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  stepDist: {
    fontSize: 12,
    color: '#94A3B8',
  },
  stepShadeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stepShadeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
