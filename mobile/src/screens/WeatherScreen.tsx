import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LOCALITIES } from '../data/mockData';
import { Locality } from '../types';
import {
  fetchWeatherForLocality,
  WeatherDataBundle,
  DetailedWeatherReading,
  HourlyWeatherPoint,
  DailyWeatherPoint,
  HeatSafetyAdvice,
} from '../services/weatherService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WeatherScreenProps {
  selectedLocality?: Locality;
  initialLocality?: Locality;
  onSelectLocality?: (locality: Locality) => void;
  onNavigateToRoute?: () => void;
  onNavigateToSOS?: () => void;
}

export default function WeatherScreen({
  selectedLocality: propSelectedLocality,
  initialLocality,
  onSelectLocality,
  onNavigateToRoute,
  onNavigateToSOS,
}: WeatherScreenProps) {
  const [selectedLocality, setSelectedLocality] = useState<Locality>(
    propSelectedLocality || initialLocality || LOCALITIES[0]
  );
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherDataBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHourlyIndex, setSelectedHourlyIndex] = useState<number>(0);

  // Sync when prop selectedLocality changes from external parent
  useEffect(() => {
    if (propSelectedLocality && propSelectedLocality.id !== selectedLocality.id) {
      setSelectedLocality(propSelectedLocality);
    }
  }, [propSelectedLocality]);

  const loadWeather = useCallback(
    async (locality: Locality, forceRefresh: boolean = false) => {
      try {
        if (!forceRefresh) setLoading(true);
        const data = await fetchWeatherForLocality(locality, forceRefresh);
        setWeatherData(data);
        setSelectedHourlyIndex(0);
      } catch (err) {
        console.error('Error fetching weather data:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadWeather(selectedLocality, false);
  }, [selectedLocality, loadWeather]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWeather(selectedLocality, true);
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'EXTREME':
        return '#EF4444';
      case 'HIGH':
        return '#F97316';
      case 'MODERATE':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  const getUVBadge = (uv: number) => {
    if (uv >= 11) return { label: 'Extreme', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.2)' };
    if (uv >= 8) return { label: 'Very High', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' };
    if (uv >= 6) return { label: 'High', color: '#F97316', bg: 'rgba(249, 115, 22, 0.2)' };
    if (uv >= 3) return { label: 'Moderate', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' };
    return { label: 'Low', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' };
  };

  const current: DetailedWeatherReading | undefined = weatherData?.current;
  const hourly: HourlyWeatherPoint[] = weatherData?.hourly || [];
  const daily: DailyWeatherPoint[] = weatherData?.daily || [];
  const advice: HeatSafetyAdvice | undefined = weatherData?.safetyAdvice;
  const activeRiskColor = getRiskColor(current?.risk_level || selectedLocality.riskLevel);
  const uvBadge = getUVBadge(current?.uv_index || 8.5);

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEyebrow}>LIVE ATMOSPHERIC TELEMETRY</Text>
          <TouchableOpacity
            style={styles.localitySelectorChip}
            onPress={() => setSelectorVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="location-sharp" size={17} color="#06B6D4" />
            <Text style={styles.localityChipText} numberOfLines={1}>
              {selectedLocality.name}
            </Text>
            <Feather name="chevron-down" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={() => onRefresh()}
            activeOpacity={0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#06B6D4" />
            ) : (
              <Ionicons name="sync" size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {onNavigateToSOS && (
            <TouchableOpacity
              style={styles.sosCompactBtn}
              onPress={onNavigateToSOS}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="alert-octagon" size={16} color="#FFF" />
              <Text style={styles.sosCompactText}>SOS</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#06B6D4"
            colors={['#06B6D4', '#EF4444']}
          />
        }
      >
        {loading && !refreshing && !weatherData ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#06B6D4" />
            <Text style={styles.loaderText}>Syncing Open-Meteo High-Resolution Telemetry...</Text>
          </View>
        ) : (
          <>
            {/* 1. CURRENT WEATHER HERO */}
            <View style={[styles.heroCard, { borderColor: `${activeRiskColor}40` }]}>
              {/* Background Glow Ring */}
              <View
                style={[
                  styles.heroGlow,
                  { backgroundColor: activeRiskColor, opacity: 0.08 },
                ]}
              />

              {/* Status Header: Data Source & Risk Badge */}
              <View style={styles.heroTopRow}>
                <View style={styles.liveBadge}>
                  <View style={[styles.liveDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.liveBadgeText}>
                    {weatherData?.source === 'Open-Meteo Live' ? 'OPEN-METEO LIVE' : 'STATION TELEMETRY'}
                  </Text>
                  <Text style={styles.liveTimeText}>• {current?.updated_at || 'Now'}</Text>
                </View>

                <View
                  style={[
                    styles.riskBadge,
                    {
                      backgroundColor: `${activeRiskColor}22`,
                      borderColor: activeRiskColor,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="shield-alert-outline"
                    size={14}
                    color={activeRiskColor}
                  />
                  <Text style={[styles.riskBadgeText, { color: activeRiskColor }]}>
                    {current?.risk_level || selectedLocality.riskLevel} RISK
                  </Text>
                </View>
              </View>

              {/* Temperature & Condition Centerpiece */}
              <View style={styles.heroMainRow}>
                <View style={styles.heroTempCol}>
                  <View style={styles.tempNumbersWrap}>
                    <Text style={styles.largeTempNumber}>
                      {current?.temperature_c.toFixed(0) ?? selectedLocality.currentTemp.toFixed(0)}
                    </Text>
                    <Text style={styles.tempDegreeSymbol}>°C</Text>
                  </View>
                  <Text style={styles.conditionTitle}>
                    {current?.weather_condition ?? 'Mainly Clear & Sunny'}
                  </Text>
                </View>

                <View style={styles.heroEmojiCol}>
                  <Text style={styles.heroEmojiText}>{current?.emoji || '☀️'}</Text>
                  <View style={styles.cityWardSubChip}>
                    <Ionicons name="business-outline" size={12} color="#94A3B8" />
                    <Text style={styles.cityWardText} numberOfLines={1}>
                      {selectedLocality.city} Ward
                    </Text>
                  </View>
                </View>
              </View>

              {/* Thermal Breakdown Tri-Pill Grid */}
              <View style={styles.heroThermalStats}>
                {/* Feels-like */}
                <View style={styles.thermalPill}>
                  <View style={styles.thermalPillTop}>
                    <Ionicons name="thermometer-outline" size={14} color="#38BDF8" />
                    <Text style={styles.thermalPillLabel}>FEELS LIKE</Text>
                  </View>
                  <Text style={styles.thermalPillValue}>
                    {current?.apparent_temperature_c.toFixed(1) ?? selectedLocality.heatIndex.toFixed(1)}°C
                  </Text>
                  <Text style={styles.thermalPillSub}>Apparent Temp</Text>
                </View>

                {/* Wet Bulb */}
                <View style={[styles.thermalPill, styles.thermalPillBordered]}>
                  <View style={styles.thermalPillTop}>
                    <MaterialCommunityIcons name="water-thermometer" size={14} color="#06B6D4" />
                    <Text style={styles.thermalPillLabel}>WET BULB</Text>
                  </View>
                  <Text
                    style={[
                      styles.thermalPillValue,
                      (current?.wet_bulb_c || 0) >= 29 && { color: '#EF4444' },
                    ]}
                  >
                    {current?.wet_bulb_c.toFixed(1) ?? selectedLocality.wetBulb.toFixed(1)}°C
                  </Text>
                  <Text style={styles.thermalPillSub}>
                    {(current?.wet_bulb_c || 0) >= 29 ? 'Evap. Limit' : 'Safe Sweat'}
                  </Text>
                </View>

                {/* Heat Index */}
                <View style={styles.thermalPill}>
                  <View style={styles.thermalPillTop}>
                    <MaterialCommunityIcons name="fire" size={14} color={activeRiskColor} />
                    <Text style={styles.thermalPillLabel}>HEAT INDEX</Text>
                  </View>
                  <Text style={[styles.thermalPillValue, { color: activeRiskColor }]}>
                    {current?.heat_index_c.toFixed(1) ?? selectedLocality.heatIndex.toFixed(1)}°C
                  </Text>
                  <Text style={styles.thermalPillSub}>Biothermal</Text>
                </View>
              </View>
            </View>

            {/* 2. HOURLY FORECAST STRIP (24 Hours Scrollable) */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWrap}>
                  <MaterialCommunityIcons name="clock-time-four-outline" size={18} color="#06B6D4" />
                  <Text style={styles.sectionTitle}>24-HOUR HOURLY HEAT CURVE</Text>
                </View>
                <Text style={styles.sectionSub}>Horizontal Swipe</Text>
              </View>

              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourlyScrollContent}
              >
                {hourly.map((h, idx) => {
                  const isSelected = selectedHourlyIndex === idx;
                  const itemRiskColor = getRiskColor(h.risk_level);

                  return (
                    <TouchableOpacity
                      key={`hour-${idx}-${h.time}`}
                      style={[
                        styles.hourlyCard,
                        isSelected && [
                          styles.hourlyCardSelected,
                          { borderColor: itemRiskColor },
                        ],
                      ]}
                      onPress={() => setSelectedHourlyIndex(idx)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.hourlyTimeText, isSelected && styles.hourlyTimeSelected]}>
                        {h.timeShort}
                      </Text>

                      <Text style={styles.hourlyEmoji}>{h.emoji}</Text>

                      <Text style={styles.hourlyTempText}>{h.temperature_c.toFixed(0)}°</Text>

                      {/* Small Heat Risk Dot & Metric */}
                      <View style={styles.hourlyRiskPill}>
                        <View
                          style={[
                            styles.hourlyRiskDot,
                            { backgroundColor: itemRiskColor },
                          ]}
                        />
                        <Text style={[styles.hourlyHiText, { color: itemRiskColor }]}>
                          {h.heat_index_c.toFixed(0)}°
                        </Text>
                      </View>

                      {/* Rain Probability Badge */}
                      {h.precipitation_prob > 0 ? (
                        <View style={styles.hourlyRainBadge}>
                          <Ionicons name="water" size={10} color="#38BDF8" />
                          <Text style={styles.hourlyRainText}>{h.precipitation_prob}%</Text>
                        </View>
                      ) : (
                        <View style={styles.hourlyWindBadge}>
                          <Feather name="wind" size={10} color="#64748B" />
                          <Text style={styles.hourlyWindText}>{h.wind_speed_kmh.toFixed(0)}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Selected Hour Insight Banner */}
              {hourly[selectedHourlyIndex] && (
                <View style={styles.hourDetailSnippet}>
                  <View style={styles.snippetLeft}>
                    <Text style={styles.snippetTitle}>
                      {hourly[selectedHourlyIndex].timeShort} Detailed Forecast
                    </Text>
                    <Text style={styles.snippetCondition}>
                      {hourly[selectedHourlyIndex].condition} • Ambient{' '}
                      {hourly[selectedHourlyIndex].temperature_c.toFixed(1)}°C (Feels{' '}
                      {hourly[selectedHourlyIndex].apparent_temp_c.toFixed(1)}°C)
                    </Text>
                  </View>
                  <View style={styles.snippetRight}>
                    <Text style={styles.snippetUV}>
                      UV {hourly[selectedHourlyIndex].uv_index.toFixed(1)}
                    </Text>
                    <Text style={styles.snippetRH}>
                      RH {hourly[selectedHourlyIndex].humidity_pct}%
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* 3. COMPREHENSIVE WEATHER METRICS GRID */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWrap}>
                  <Ionicons name="stats-chart" size={18} color="#06B6D4" />
                  <Text style={styles.sectionTitle}>ATMOSPHERIC & BIOMETRIC VITALS</Text>
                </View>
                <Text style={styles.sectionSub}>Live Sensors</Text>
              </View>

              <View style={styles.metricsGrid}>
                {/* Card 1: UV Index */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <Feather name="sun" size={18} color="#F59E0B" />
                    <View style={[styles.miniBadge, { backgroundColor: uvBadge.bg }]}>
                      <Text style={[styles.miniBadgeText, { color: uvBadge.color }]}>
                        {uvBadge.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.metricValue}>
                    {current?.uv_index.toFixed(1) ?? '8.5'}
                  </Text>
                  <Text style={styles.metricLabel}>UV Radiation Index</Text>
                  {/* UV Severity Meter Bar */}
                  <View style={styles.meterTrack}>
                    <View
                      style={[
                        styles.meterFill,
                        {
                          width: `${Math.min(100, Math.max(10, ((current?.uv_index || 8.5) / 12) * 100))}%`,
                          backgroundColor: uvBadge.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.metricHint}>
                    {(current?.uv_index || 8.5) >= 8 ? 'Protection mandatory' : 'Moderate protection'}
                  </Text>
                </View>

                {/* Card 2: Relative Humidity */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <Ionicons name="water-outline" size={18} color="#38BDF8" />
                    <Text style={styles.metricSubTag}>SWEAT EVAP</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {current?.relative_humidity_pct ?? selectedLocality.humidity}%
                  </Text>
                  <Text style={styles.metricLabel}>Relative Humidity</Text>
                  {/* Humidity Meter Bar */}
                  <View style={styles.meterTrack}>
                    <View
                      style={[
                        styles.meterFill,
                        {
                          width: `${Math.min(100, current?.relative_humidity_pct || selectedLocality.humidity)}%`,
                          backgroundColor: '#38BDF8',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.metricHint}>
                    {(current?.relative_humidity_pct || 50) > 60
                      ? 'High sweat resistance'
                      : 'Moderate evaporation'}
                  </Text>
                </View>

                {/* Card 3: Wind Speed & Direction */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <Feather name="wind" size={18} color="#10B981" />
                    <View style={styles.compassChip}>
                      <Ionicons name="navigate" size={11} color="#10B981" />
                      <Text style={styles.compassChipText}>
                        {current?.wind_direction_compass || 'WSW'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.metricValue}>
                    {current?.wind_speed_kmh.toFixed(1) ?? '14.2'}{' '}
                    <Text style={styles.metricUnit}>km/h</Text>
                  </Text>
                  <Text style={styles.metricLabel}>Surface Wind Speed</Text>
                  <View style={styles.meterTrack}>
                    <View
                      style={[
                        styles.meterFill,
                        {
                          width: `${Math.min(100, ((current?.wind_speed_kmh || 14) / 40) * 100)}%`,
                          backgroundColor: '#10B981',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.metricHint}>
                    Bearing {current?.wind_direction_deg ?? 240}° • Gust relief
                  </Text>
                </View>

                {/* Card 4: Rain & Storm Probability */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <Ionicons name="cloud-outline" size={18} color="#818CF8" />
                    <Text style={styles.metricSubTag}>PRECIPITATION</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {current?.precipitation_probability ?? 10}%
                  </Text>
                  <Text style={styles.metricLabel}>Rain / Storm Chance</Text>
                  <View style={styles.meterTrack}>
                    <View
                      style={[
                        styles.meterFill,
                        {
                          width: `${Math.min(100, current?.precipitation_probability || 10)}%`,
                          backgroundColor: '#818CF8',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.metricHint}>
                    Precip volume: {current?.precipitation_mm.toFixed(1) ?? '0.0'} mm
                  </Text>
                </View>

                {/* Card 5: Heat Exposure / Bio-Thermal Stress */}
                <View style={[styles.metricCard, styles.metricCardWide]}>
                  <View style={styles.metricCardHeader}>
                    <MaterialCommunityIcons name="heart-pulse" size={18} color="#EC4899" />
                    <View
                      style={[
                        styles.miniBadge,
                        {
                          backgroundColor:
                            (current?.air_quality_score || 50) >= 70
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.miniBadgeText,
                          {
                            color:
                              (current?.air_quality_score || 50) >= 70
                                ? '#EF4444'
                                : '#F59E0B',
                          },
                        ]}
                      >
                        {current?.air_quality_label || 'Moderate Heat Strain'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.exposureValueRow}>
                    <Text style={styles.exposureNumber}>
                      {current?.air_quality_score ?? 68}
                    </Text>
                    <Text style={styles.exposureMax}>/ 100 Heat Stress Index</Text>
                  </View>
                  <Text style={styles.metricHint}>
                    Composite biothermal score based on heat index, humidity stagnation, and solar radiation burden.
                  </Text>
                </View>
              </View>
            </View>

            {/* 4. 7-DAY VERTICAL FORECAST */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWrap}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#06B6D4" />
                  <Text style={styles.sectionTitle}>7-DAY HEAT & WEATHER OUTLOOK</Text>
                </View>
                <Text style={styles.sectionSub}>Extended View</Text>
              </View>

              <View style={styles.dailyStack}>
                {daily.map((d, index) => {
                  const dayRiskColor = getRiskColor(d.risk_level);
                  // Calculate range bar width relative to 20°C - 45°C
                  const minPct = Math.max(0, Math.min(80, ((d.min_temp_c - 18) / (46 - 18)) * 100));
                  const maxPct = Math.max(minPct + 15, Math.min(100, ((d.max_temp_c - 18) / (46 - 18)) * 100));

                  return (
                    <View
                      key={`daily-${index}-${d.isoDate}`}
                      style={[
                        styles.dailyRowCard,
                        d.isToday && styles.dailyRowCardToday,
                      ]}
                    >
                      {/* Day & Date Label */}
                      <View style={styles.dailyDayCol}>
                        <Text style={[styles.dailyDayName, d.isToday && styles.dailyDayNameToday]}>
                          {d.dayName}
                        </Text>
                        <Text style={styles.dailyDateSub}>{d.dateStr}</Text>
                      </View>

                      {/* Emoji & Weather Condition */}
                      <View style={styles.dailyCondCol}>
                        <Text style={styles.dailyEmoji}>{d.emoji}</Text>
                        <Text style={styles.dailyCondText} numberOfLines={1}>
                          {d.condition}
                        </Text>
                        {d.precipitation_prob_max > 15 && (
                          <Text style={styles.dailyRainText}>
                            💧 {d.precipitation_prob_max}%
                          </Text>
                        )}
                      </View>

                      {/* Temperature Range Bar */}
                      <View style={styles.dailyRangeCol}>
                        <Text style={styles.dailyMinTemp}>{d.min_temp_c}°</Text>
                        <View style={styles.dailyRangeBarTrack}>
                          <View
                            style={[
                              styles.dailyRangeBarFill,
                              {
                                left: `${minPct}%`,
                                width: `${maxPct - minPct}%`,
                                backgroundColor: dayRiskColor,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.dailyMaxTemp}>{d.max_temp_c}°</Text>
                      </View>

                      {/* Risk Badge Dot */}
                      <View
                        style={[
                          styles.dailyRiskTag,
                          {
                            backgroundColor: `${dayRiskColor}22`,
                            borderColor: dayRiskColor,
                          },
                        ]}
                      >
                        <Text style={[styles.dailyRiskTagText, { color: dayRiskColor }]}>
                          {d.risk_level.slice(0, 3)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 5. ACTIONABLE HEAT SAFETY ADVICE */}
            {advice && (
              <View style={[styles.adviceCard, { borderColor: `${activeRiskColor}60` }]}>
                {/* Header Badge */}
                <View style={styles.adviceHeaderRow}>
                  <View style={[styles.advicePulseDot, { backgroundColor: activeRiskColor }]} />
                  <Text style={[styles.adviceHeadline, { color: activeRiskColor }]}>
                    {advice.headline}
                  </Text>
                </View>

                {/* Peak Hours Restriction Banner */}
                <View style={styles.peakHoursBox}>
                  <Ionicons name="time" size={18} color="#F59E0B" />
                  <View style={styles.peakHoursTextWrap}>
                    <Text style={styles.peakHoursTitle}>CRITICAL PEAK SUN HOURS</Text>
                    <Text style={styles.peakHoursValue}>{advice.peakHoursRange}</Text>
                  </View>
                </View>

                {/* Tips Stack */}
                <View style={styles.adviceList}>
                  {/* Hydration */}
                  <View style={styles.adviceItem}>
                    <View style={styles.adviceIconWrap}>
                      <Ionicons name="water" size={18} color="#38BDF8" />
                    </View>
                    <View style={styles.adviceTextWrap}>
                      <Text style={styles.adviceItemTitle}>TARGETED HYDRATION</Text>
                      <Text style={styles.adviceItemDesc}>{advice.hydrationAction}</Text>
                    </View>
                  </View>

                  {/* Sun Protection */}
                  <View style={styles.adviceItem}>
                    <View style={styles.adviceIconWrap}>
                      <Feather name="shield" size={18} color="#F59E0B" />
                    </View>
                    <View style={styles.adviceTextWrap}>
                      <Text style={styles.adviceItemTitle}>UV & SUN DEFENSE</Text>
                      <Text style={styles.adviceItemDesc}>{advice.sunProtectionAction}</Text>
                    </View>
                  </View>

                  {/* Outdoor Work / Physical Exertion */}
                  <View style={styles.adviceItem}>
                    <View style={styles.adviceIconWrap}>
                      <MaterialCommunityIcons name="run" size={18} color="#EF4444" />
                    </View>
                    <View style={styles.adviceTextWrap}>
                      <Text style={styles.adviceItemTitle}>EXERTION PROTOCOL</Text>
                      <Text style={styles.adviceItemDesc}>{advice.activityRecommendation}</Text>
                    </View>
                  </View>

                  {/* High Risk Demographics */}
                  <View style={styles.adviceItem}>
                    <View style={styles.adviceIconWrap}>
                      <Ionicons name="people-outline" size={18} color="#10B981" />
                    </View>
                    <View style={styles.adviceTextWrap}>
                      <Text style={styles.adviceItemTitle}>VULNERABLE INDIVIDUALS</Text>
                      <Text style={styles.adviceItemDesc}>{advice.vulnerableCare}</Text>
                    </View>
                  </View>
                </View>

                {/* Navigation CTA to Safe Route Screen */}
                {onNavigateToRoute && (
                  <TouchableOpacity
                    style={styles.actionCtaBtn}
                    onPress={onNavigateToRoute}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="navigate-circle" size={22} color="#060D1E" />
                    <Text style={styles.actionCtaBtnText}>
                      Route Through Shaded Tree Canopies
                    </Text>
                    <Feather name="arrow-right" size={16} color="#060D1E" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>

      {/* Locality Selector Modal */}
      <Modal
        visible={selectorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Ward or Locality</Text>
                <Text style={styles.modalSub}>
                  Fetch real-time micro-climate telemetry
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectorVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={LOCALITIES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedLocality.id;
                const locRiskColor = getRiskColor(item.riskLevel);

                return (
                  <TouchableOpacity
                    style={[
                      styles.localityModalItem,
                      isSelected && styles.localityModalItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedLocality(item);
                      if (onSelectLocality) {
                        onSelectLocality(item);
                      }
                      setSelectorVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.locModalLeft}>
                      <Text
                        style={[
                          styles.locModalName,
                          isSelected && styles.locModalNameSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.locModalSub}>
                        {item.city}, {item.state} • Urban Heat Island +{item.urbanHeatIslandFactor}x
                      </Text>
                    </View>

                    <View style={styles.locModalRight}>
                      <Text style={[styles.locModalTemp, { color: locRiskColor }]}>
                        {item.currentTemp.toFixed(1)}°C
                      </Text>
                      <View
                        style={[
                          styles.locModalRiskBadge,
                          {
                            backgroundColor: `${locRiskColor}22`,
                            borderColor: locRiskColor,
                          },
                        ]}
                      >
                        <Text style={[styles.locModalRiskText, { color: locRiskColor }]}>
                          {item.riskLevel}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060D1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B1329',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#06B6D4',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  localitySelectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  localityChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginHorizontal: 6,
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosCompactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  sosCompactText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loaderContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
  },

  /* 1. HERO WEATHER CARD */
  heroCard: {
    backgroundColor: '#0B1329',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveTimeText: {
    color: '#64748B',
    fontSize: 11,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 4,
  },
  heroTempCol: {
    flex: 1,
  },
  tempNumbersWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  largeTempNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#F8FAFC',
    lineHeight: 68,
    letterSpacing: -2,
  },
  tempDegreeSymbol: {
    fontSize: 26,
    fontWeight: '700',
    color: '#06B6D4',
    marginTop: 8,
    marginLeft: 2,
  },
  conditionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 4,
  },
  heroEmojiCol: {
    alignItems: 'center',
  },
  heroEmojiText: {
    fontSize: 56,
  },
  cityWardSubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    gap: 4,
  },
  cityWardText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  heroThermalStats: {
    flexDirection: 'row',
    backgroundColor: '#060D1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  thermalPill: {
    flex: 1,
    alignItems: 'center',
  },
  thermalPillBordered: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1E293B',
  },
  thermalPillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  thermalPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  thermalPillValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  thermalPillSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },

  /* 2. HOURLY FORECAST STRIP */
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  hourlyScrollContent: {
    paddingRight: 16,
    gap: 10,
  },
  hourlyCard: {
    width: 78,
    backgroundColor: '#0B1329',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  hourlyCardSelected: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1.5,
  },
  hourlyTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
  },
  hourlyTimeSelected: {
    color: '#06B6D4',
  },
  hourlyEmoji: {
    fontSize: 24,
    marginVertical: 4,
  },
  hourlyTempText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginVertical: 3,
  },
  hourlyRiskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 6,
  },
  hourlyRiskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hourlyHiText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hourlyRainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hourlyRainText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
  },
  hourlyWindBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  hourlyWindText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  hourDetailSnippet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B1329',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 10,
    marginTop: 10,
  },
  snippetLeft: {
    flex: 1,
  },
  snippetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#06B6D4',
  },
  snippetCondition: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  snippetRight: {
    alignItems: 'flex-end',
  },
  snippetUV: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  snippetRH: {
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 2,
  },

  /* 3. METRICS GRID */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#0B1329',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
  },
  metricCardWide: {
    width: SCREEN_WIDTH - 32,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricSubTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    lineHeight: 28,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 8,
  },
  meterTrack: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  meterFill: {
    height: '100%',
    borderRadius: 2,
  },
  metricHint: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  compassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compassChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  exposureValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  exposureNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#EC4899',
  },
  exposureMax: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },

  /* 4. 7-DAY FORECAST */
  dailyStack: {
    backgroundColor: '#0B1329',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  dailyRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  dailyRowCardToday: {
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  dailyDayCol: {
    width: 64,
  },
  dailyDayName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  dailyDayNameToday: {
    color: '#06B6D4',
  },
  dailyDateSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  dailyCondCol: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyEmoji: {
    fontSize: 18,
  },
  dailyCondText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
  },
  dailyRainText: {
    fontSize: 9,
    color: '#38BDF8',
    fontWeight: '600',
  },
  dailyRangeCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 8,
  },
  dailyMinTemp: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    width: 22,
    textAlign: 'right',
  },
  dailyRangeBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    position: 'relative',
  },
  dailyRangeBarFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 2,
  },
  dailyMaxTemp: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '700',
    width: 22,
  },
  dailyRiskTag: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    width: 36,
    alignItems: 'center',
  },
  dailyRiskTagText: {
    fontSize: 9,
    fontWeight: '800',
  },

  /* 5. ACTIONABLE SAFETY ADVICE */
  adviceCard: {
    backgroundColor: '#0B1329',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  advicePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  adviceHeadline: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    flex: 1,
  },
  peakHoursBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    padding: 10,
    gap: 10,
    marginBottom: 14,
  },
  peakHoursTextWrap: {
    flex: 1,
  },
  peakHoursTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  peakHoursValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  adviceList: {
    gap: 12,
    marginBottom: 16,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  adviceIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  adviceTextWrap: {
    flex: 1,
  },
  adviceItemTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  adviceItemDesc: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 17,
    marginTop: 2,
  },
  actionCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionCtaBtnText: {
    color: '#060D1E',
    fontSize: 13,
    fontWeight: '800',
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0B1329',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  localityModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#060D1E',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  localityModalItemSelected: {
    borderColor: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  locModalLeft: {
    flex: 1,
  },
  locModalName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  locModalNameSelected: {
    color: '#06B6D4',
  },
  locModalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  locModalRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  locModalTemp: {
    fontSize: 15,
    fontWeight: '800',
  },
  locModalRiskBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  locModalRiskText: {
    fontSize: 9,
    fontWeight: '800',
  },
});
