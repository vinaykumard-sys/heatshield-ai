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
        return '#DC2626';
      case 'HIGH':
        return '#EA580C';
      case 'MODERATE':
        return '#D97706';
      default:
        return '#059669';
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'EXTREME':
        return '#FEF2F2';
      case 'HIGH':
        return '#FFF7ED';
      case 'MODERATE':
        return '#FFFBEB';
      default:
        return '#ECFDF5';
    }
  };

  const getUVBadge = (uv: number) => {
    if (uv >= 11) return { label: 'Extreme', color: '#DC2626', bg: '#FEF2F2' };
    if (uv >= 8) return { label: 'Very High', color: '#EA580C', bg: '#FFF7ED' };
    if (uv >= 6) return { label: 'High', color: '#D97706', bg: '#FFFBEB' };
    if (uv >= 3) return { label: 'Moderate', color: '#0284C7', bg: '#E0F2FE' };
    return { label: 'Low', color: '#059669', bg: '#ECFDF5' };
  };

  const current: DetailedWeatherReading | undefined = weatherData?.current;
  const hourly: HourlyWeatherPoint[] = weatherData?.hourly || [];
  const daily: DailyWeatherPoint[] = weatherData?.daily || [];
  const advice: HeatSafetyAdvice | undefined = weatherData?.safetyAdvice;
  const activeRiskColor = getRiskColor(current?.risk_level || selectedLocality.riskLevel);
  const activeRiskBg = getRiskBg(current?.risk_level || selectedLocality.riskLevel);
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
            <Ionicons name="location-sharp" size={16} color="#0284C7" />
            <Text style={styles.localityChipText} numberOfLines={1}>
              {selectedLocality.name}
            </Text>
            <Feather name="chevron-down" size={15} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={() => onRefresh()}
            activeOpacity={0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#0284C7" />
            ) : (
              <Ionicons name="sync" size={18} color="#64748B" />
            )}
          </TouchableOpacity>

          {onNavigateToSOS && (
            <TouchableOpacity
              style={styles.sosCompactBtn}
              onPress={onNavigateToSOS}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="alert-octagon" size={15} color="#FFF" />
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
            tintColor="#0284C7"
            colors={['#0284C7', '#DC2626']}
          />
        }
      >
        {loading && !refreshing && !weatherData ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.loaderText}>Syncing Open-Meteo High-Resolution Telemetry...</Text>
          </View>
        ) : (
          <>
            {/* 1. CURRENT WEATHER HERO */}
            <View style={[styles.heroCard, { borderColor: '#E2E8F0' }]}>
              {/* Status Header: Data Source & Risk Badge */}
              <View style={styles.heroTopRow}>
                <View style={styles.liveBadge}>
                  <View style={[styles.liveDot, { backgroundColor: '#059669' }]} />
                  <Text style={styles.liveBadgeText}>
                    {weatherData?.source === 'Open-Meteo Live' ? 'OPEN-METEO LIVE' : 'STATION TELEMETRY'}
                  </Text>
                  <Text style={styles.liveTimeText}>• {current?.updated_at || 'Now'}</Text>
                </View>

                <View
                  style={[
                    styles.riskBadge,
                    {
                      backgroundColor: activeRiskBg,
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
                    <Ionicons name="business-outline" size={12} color="#64748B" />
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
                    <Ionicons name="thermometer-outline" size={14} color="#0284C7" />
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
                    <MaterialCommunityIcons name="water-thermometer" size={14} color="#0284C7" />
                    <Text style={styles.thermalPillLabel}>WET BULB</Text>
                  </View>
                  <Text
                    style={[
                      styles.thermalPillValue,
                      (current?.wet_bulb_c || 0) >= 29 && { color: '#DC2626' },
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
                  <MaterialCommunityIcons name="clock-time-four-outline" size={18} color="#0284C7" />
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
                          { borderColor: '#0284C7', backgroundColor: '#E0F2FE' },
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
                          <Ionicons name="water" size={10} color="#0284C7" />
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
                  <Ionicons name="stats-chart" size={18} color="#0284C7" />
                  <Text style={styles.sectionTitle}>ATMOSPHERIC & BIOMETRIC VITALS</Text>
                </View>
                <Text style={styles.sectionSub}>Live Sensors</Text>
              </View>

              <View style={styles.metricsGrid}>
                {/* Card 1: UV Index */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <Feather name="sun" size={18} color="#EA580C" />
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
                    <Ionicons name="water" size={18} color="#0284C7" />
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
                          backgroundColor: '#0284C7',
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
                    <Feather name="wind" size={18} color="#059669" />
                    <View style={styles.compassChip}>
                      <Ionicons name="navigate" size={11} color="#059669" />
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
                          backgroundColor: '#059669',
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
                    <Ionicons name="cloud-outline" size={18} color="#6366F1" />
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
                          backgroundColor: '#6366F1',
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
                    <MaterialCommunityIcons name="heart-pulse" size={18} color="#DC2626" />
                    <View
                      style={[
                        styles.miniBadge,
                        {
                          backgroundColor:
                            (current?.air_quality_score || 50) >= 70
                              ? '#FEF2F2'
                              : '#FFFBEB',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.miniBadgeText,
                          {
                            color:
                              (current?.air_quality_score || 50) >= 70
                                ? '#DC2626'
                                : '#D97706',
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
                  <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#0284C7" />
                  <Text style={styles.sectionTitle}>7-DAY HEAT & WEATHER OUTLOOK</Text>
                </View>
                <Text style={styles.sectionSub}>Extended View</Text>
              </View>

              <View style={styles.dailyStack}>
                {daily.map((d, index) => {
                  const dayRiskColor = getRiskColor(d.risk_level);
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
                            backgroundColor: `${dayRiskColor}15`,
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
              <View style={[styles.adviceCard, { borderColor: '#E2E8F0' }]}>
                {/* Header Badge */}
                <View style={styles.adviceHeaderRow}>
                  <View style={[styles.advicePulseDot, { backgroundColor: activeRiskColor }]} />
                  <Text style={[styles.adviceHeadline, { color: activeRiskColor }]}>
                    {advice.headline}
                  </Text>
                </View>

                {/* Peak Hours Restriction Banner */}
                <View style={styles.peakHoursBox}>
                  <Ionicons name="time" size={18} color="#EA580C" />
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
                      <Ionicons name="water" size={18} color="#0284C7" />
                    </View>
                    <View style={styles.adviceTextWrap}>
                      <Text style={styles.adviceItemTitle}>TARGETED HYDRATION</Text>
                      <Text style={styles.adviceItemDesc}>{advice.hydrationAction}</Text>
                    </View>
                  </View>

                  {/* Sun Protection */}
                  <View style={styles.adviceItem}>
                    <View style={styles.adviceIconWrap}>
                      <Feather name="shield" size={18} color="#EA580C" />
                    </View>
                    <View style={styles.adviceTextWrap}>
                      <Text style={styles.adviceItemTitle}>UV & SUN DEFENSE</Text>
                      <Text style={styles.adviceItemDesc}>{advice.sunProtectionAction}</Text>
                    </View>
                  </View>

                  {/* Outdoor Work / Physical Exertion */}
                  <View style={styles.adviceItem}>
                    <View style={styles.adviceIconWrap}>
                      <MaterialCommunityIcons name="run" size={18} color="#DC2626" />
                    </View>
                    <View style={styles.adviceTextWrap}>
                      <Text style={styles.adviceItemTitle}>EXERTION PROTOCOL</Text>
                      <Text style={styles.adviceItemDesc}>{advice.activityRecommendation}</Text>
                    </View>
                  </View>

                  {/* High Risk Demographics */}
                  <View style={styles.adviceItem}>
                    <View style={styles.adviceIconWrap}>
                      <Ionicons name="people-outline" size={18} color="#059669" />
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
                    activeOpacity={0.88}
                  >
                    <Ionicons name="navigate-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.actionCtaBtnText}>
                      Route Through Shaded Tree Canopies
                    </Text>
                    <Feather name="arrow-right" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={{ height: 36 }} />
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
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={LOCALITIES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedLocality.id;
                const locRiskColor = getRiskColor(item.riskLevel);
                const locRiskBg = getRiskBg(item.riskLevel);

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
                            backgroundColor: locRiskBg,
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
    backgroundColor: '#F0F6FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 1.0,
    marginBottom: 4,
  },
  localitySelectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  localityChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
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
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sosCompactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
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
    paddingTop: 14,
  },
  loaderContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
  },

  /* 1. HERO WEATHER CARD */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    color: '#059669',
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
    marginBottom: 16,
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
    fontSize: 60,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 64,
    letterSpacing: -2,
  },
  tempDegreeSymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 8,
    marginLeft: 2,
  },
  conditionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  heroEmojiCol: {
    alignItems: 'center',
  },
  heroEmojiText: {
    fontSize: 52,
  },
  cityWardSubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    gap: 4,
  },
  cityWardText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  heroThermalStats: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  thermalPill: {
    flex: 1,
    alignItems: 'center',
  },
  thermalPillBordered: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#64748B',
    letterSpacing: 0.5,
  },
  thermalPillValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  thermalPillSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },

  /* 2. HOURLY FORECAST STRIP */
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  hourlyScrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  hourlyCard: {
    width: 78,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  hourlyCardSelected: {
    borderWidth: 1.5,
  },
  hourlyTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  hourlyTimeSelected: {
    color: '#0284C7',
    fontWeight: '800',
  },
  hourlyEmoji: {
    fontSize: 22,
    marginVertical: 4,
  },
  hourlyTempText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 2,
  },
  hourlyRiskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 4,
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
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hourlyRainText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284C7',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginTop: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  snippetLeft: {
    flex: 1,
  },
  snippetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  snippetCondition: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  snippetRight: {
    alignItems: 'flex-end',
  },
  snippetUV: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  snippetRH: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
  },

  /* 3. METRICS GRID */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 26,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  meterTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
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
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compassChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  exposureValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  exposureNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#DC2626',
  },
  exposureMax: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  /* 4. 7-DAY FORECAST */
  dailyStack: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dailyRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dailyRowCardToday: {
    backgroundColor: '#E0F2FE',
  },
  dailyDayCol: {
    width: 64,
  },
  dailyDayName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dailyDayNameToday: {
    color: '#0284C7',
    fontWeight: '800',
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
    color: '#475569',
    flex: 1,
  },
  dailyRainText: {
    fontSize: 9,
    color: '#0284C7',
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
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    position: 'relative',
  },
  dailyRangeBarFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 3,
  },
  dailyMaxTemp: {
    fontSize: 12,
    color: '#0F172A',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
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
    color: '#EA580C',
    letterSpacing: 0.5,
  },
  peakHoursValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
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
    backgroundColor: '#F1F5F9',
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
    color: '#475569',
    letterSpacing: 0.5,
  },
  adviceItemDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    marginTop: 2,
  },
  actionCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  localityModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  localityModalItemSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  locModalLeft: {
    flex: 1,
  },
  locModalName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  locModalNameSelected: {
    color: '#0284C7',
    fontWeight: '800',
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
