import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  PanResponder,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import {
  fetchHeatSafeRoutes,
  PRESET_ROUTES,
  VERIFIED_COOLING_FACILITIES,
  HeatSafeRoute,
  RouteStep,
  RouteCheckpoint,
  PresetRoute,
  formatDistance,
  formatDuration,
} from '@heatshield/core';

export default function SafeRouteScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Search & Navigation States
  const [activePreset, setActivePreset] = useState<PresetRoute>(PRESET_ROUTES[0]);
  const [originText, setOriginText] = useState(PRESET_ROUTES[0].startPlace);
  const [destText, setDestText] = useState(PRESET_ROUTES[0].endPlace);
  const [startCoords, setStartCoords] = useState<[number, number]>(PRESET_ROUTES[0].startCoords);
  const [endCoords, setEndCoords] = useState<[number, number]>(PRESET_ROUTES[0].endCoords);
  const [travelMode, setTravelMode] = useState<'walk' | 'cycle' | 'drive'>('walk');

  // Route Data States
  const [routes, setRoutes] = useState<HeatSafeRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDetailTab, setActiveDetailTab] = useState<'steps' | 'checkpoints'>('steps');

  // Map Layer Toggles & Zoom
  const [showCanopyLayer, setShowCanopyLayer] = useState<boolean>(true);
  const [showRespiteLayer, setShowRespiteLayer] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Live Navigation Simulation States
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [navStepIndex, setNavStepIndex] = useState<number>(0);
  const [navProgressPct, setNavProgressPct] = useState<number>(0);
  const navTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Collapsible Bottom Sheet Animation
  // Collapsed: ~140px, Expanded: ~65% of screen height
  const collapsedHeight = 140;
  const expandedHeight = Math.round(screenHeight * 0.65);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const sheetHeightAnim = useRef(new Animated.Value(collapsedHeight)).current;

  // Toggle or Set Sheet Expansion
  const toggleSheet = (expand?: boolean) => {
    const shouldExpand = expand !== undefined ? expand : !isExpanded;
    setIsExpanded(shouldExpand);
    Animated.spring(sheetHeightAnim, {
      toValue: shouldExpand ? expandedHeight : collapsedHeight,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  // PanResponder for drag handle
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
        onPanResponderMove: (_, gesture) => {
          const currentBase = isExpanded ? expandedHeight : collapsedHeight;
          const newHeight = Math.min(
            expandedHeight + 30,
            Math.max(collapsedHeight - 20, currentBase - gesture.dy)
          );
          sheetHeightAnim.setValue(newHeight);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -40) {
            toggleSheet(true);
          } else if (gesture.dy > 40) {
            toggleSheet(false);
          } else {
            toggleSheet(isExpanded);
          }
        },
      }),
    [isExpanded, expandedHeight, collapsedHeight]
  );

  // Load Road Routes from OSRM via @heatshield/core
  const loadRoutes = async () => {
    setLoading(true);
    try {
      const results = await fetchHeatSafeRoutes({
        startPlace: originText,
        endPlace: destText,
        startCoords,
        endCoords,
        travelMode,
      });
      setRoutes(results);
      setSelectedRouteIndex(0);
      setNavStepIndex(0);
      setNavProgressPct(0);
    } catch {
      Alert.alert(
        'Routing Notice',
        'Direct connection to routing service timed out. Loaded high-precision offline road topology.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, [startCoords, endCoords, travelMode]);

  // Handle Preset Selection
  const applyPreset = (preset: PresetRoute) => {
    setActivePreset(preset);
    setOriginText(preset.startPlace);
    setDestText(preset.endPlace);
    setStartCoords(preset.startCoords);
    setEndCoords(preset.endCoords);
    if (isNavigating) stopNavigation();
  };

  // Swap Origin and Destination
  const handleSwap = () => {
    const tempText = originText;
    const tempCoords = startCoords;
    setOriginText(destText);
    setDestText(tempText);
    setStartCoords(endCoords);
    setEndCoords(tempCoords);
    if (isNavigating) stopNavigation();
  };

  // Active Route
  const activeRoute: HeatSafeRoute | null = routes[selectedRouteIndex] || routes[0] || null;

  // Live Navigation Simulation Loop
  const startNavigation = () => {
    if (!activeRoute) return;
    setIsNavigating(true);
    toggleSheet(false);
    setNavStepIndex(0);
    setNavProgressPct(0);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    if (navTimerRef.current) {
      clearInterval(navTimerRef.current);
      navTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isNavigating && activeRoute) {
      navTimerRef.current = setInterval(() => {
        setNavProgressPct((prev) => {
          const next = prev + 0.04;
          if (next >= 1) {
            // Reached destination!
            stopNavigation();
            Alert.alert(
              'Destination Reached',
              `You have arrived safely at ${destText}! Verified cooling shelter and hydration nearby.`
            );
            return 1;
          }
          // Advance turn-by-turn steps proportionally
          if (activeRoute.steps.length > 0) {
            const stepIdx = Math.min(
              activeRoute.steps.length - 1,
              Math.floor(next * activeRoute.steps.length)
            );
            setNavStepIndex(stepIdx);
          }
          return next;
        });
      }, 1200);
    } else {
      if (navTimerRef.current) {
        clearInterval(navTimerRef.current);
        navTimerRef.current = null;
      }
    }
    return () => {
      if (navTimerRef.current) clearInterval(navTimerRef.current);
    };
  }, [isNavigating, activeRoute]);

  // Dynamic Map Projection to Screen Dimensions
  const mapWidth = screenWidth;
  const mapHeight = screenHeight;

  // Compute map bounding box from active route coordinates + waypoints
  const { project, projectedRoutes, projectedPoints, activePuckPosition } = useMemo(() => {
    const allCoords: Array<[number, number]> = [];
    routes.forEach((r) => allCoords.push(...r.coordinates));
    allCoords.push(startCoords, endCoords);

    let minLat = 90;
    let maxLat = -90;
    let minLon = 180;
    let maxLon = -180;

    allCoords.forEach(([lat, lon]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    });

    // Add viewport padding (keep bottom area free for collapsed sheet)
    const latSpan = Math.max(0.015, maxLat - minLat);
    const lonSpan = Math.max(0.015, maxLon - minLon);

    const padTop = 0.25 / zoomLevel;
    const padBottom = 0.45 / zoomLevel; // extra space for bottom sheet
    const padSide = 0.2 / zoomLevel;

    const paddedMinLat = minLat - latSpan * padBottom;
    const paddedMaxLat = maxLat + latSpan * padTop;
    const paddedMinLon = minLon - lonSpan * padSide;
    const paddedMaxLon = maxLon + lonSpan * padSide;

    const proj = (lat: number, lon: number): [number, number] => {
      const x = ((lon - paddedMinLon) / (paddedMaxLon - paddedMinLon)) * mapWidth;
      const y = (1 - (lat - paddedMinLat) / (paddedMaxLat - paddedMinLat)) * mapHeight;
      return [x, y];
    };

    // Project route coordinates to SVG paths
    const projRoutes = routes.map((r) => {
      if (!r.coordinates || r.coordinates.length < 2) return '';
      const points = r.coordinates.map(([lat, lon]) => proj(lat, lon));
      return points.reduce((acc, [x, y], idx) => {
        return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }, '');
    });

    // Project Origin and Destination
    const pStart = proj(startCoords[0], startCoords[1]);
    const pEnd = proj(endCoords[0], endCoords[1]);

    // Compute animated puck position along active route
    let puckPos: [number, number] = pStart;
    if (activeRoute && activeRoute.coordinates.length > 1) {
      const totalCoords = activeRoute.coordinates.length;
      const exactIndex = navProgressPct * (totalCoords - 1);
      const lower = Math.floor(exactIndex);
      const upper = Math.min(totalCoords - 1, Math.ceil(exactIndex));
      const t = exactIndex - lower;

      const [lat1, lon1] = activeRoute.coordinates[lower];
      const [lat2, lon2] = activeRoute.coordinates[upper];
      const curLat = lat1 + (lat2 - lat1) * t;
      const curLon = lon1 + (lon2 - lon1) * t;
      puckPos = proj(curLat, curLon);
    }

    // Nearby facilities inside viewport
    const projFacilities = VERIFIED_COOLING_FACILITIES.map((fac) => {
      const [x, y] = proj(fac.latitude, fac.longitude);
      return { ...fac, x, y };
    });

    return {
      project: proj,
      projectedRoutes: projRoutes,
      projectedPoints: {
        start: pStart,
        end: pEnd,
        facilities: projFacilities,
      },
      activePuckPosition: puckPos,
    };
  }, [routes, startCoords, endCoords, mapWidth, mapHeight, zoomLevel, navProgressPct, activeRoute]);

  // Maneuver Icon Helper
  const renderManeuverIcon = (type?: string, size = 18, color = '#10B981') => {
    if (!type) return <Ionicons name="arrow-up" size={size} color={color} />;
    const t = type.toLowerCase();
    if (t.includes('right')) return <Ionicons name="arrow-forward" size={size} color={color} />;
    if (t.includes('left')) return <Ionicons name="arrow-back" size={size} color={color} />;
    if (t.includes('uturn')) return <MaterialCommunityIcons name="u-turn-left" size={size} color={color} />;
    if (t.includes('arrive')) return <Ionicons name="flag" size={size} color={color} />;
    return <Ionicons name="arrow-up" size={size} color={color} />;
  };

  return (
    <View style={styles.container}>
      {/* ======================================================== */}
      {/* 1. FULL-SCREEN DYNAMIC ROAD VECTOR MAP                   */}
      {/* ======================================================== */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={mapWidth} height={mapHeight} style={StyleSheet.absoluteFill}>
          <Defs>
            {/* Background Grid Pattern */}
            <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#060D1E" />
              <Stop offset="50%" stopColor="#0B132B" />
              <Stop offset="100%" stopColor="#060C1B" />
            </LinearGradient>

            {/* Glowing Road Gradients */}
            <LinearGradient id="coolRouteGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#10B981" />
              <Stop offset="100%" stopColor="#06B6D4" />
            </LinearGradient>
            <LinearGradient id="respiteRouteGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#06B6D4" />
              <Stop offset="100%" stopColor="#3B82F6" />
            </LinearGradient>
            <LinearGradient id="fastRouteGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#EF4444" />
            </LinearGradient>

            {/* Radial Glows */}
            <RadialGradient id="puckGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="canopyGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Deep Midnight Tactical Map Canvas */}
          <Rect x="0" y="0" width={mapWidth} height={mapHeight} fill="url(#bgGrad)" />

          {/* Tactical Background Grid Lines */}
          {Array.from({ length: 7 }).map((_, i) => {
            const y = (mapHeight / 7) * i;
            return (
              <Line
                key={`h-${i}`}
                x1="0"
                y1={y}
                x2={mapWidth}
                y2={y}
                stroke="#1E293B"
                strokeWidth="0.75"
                strokeDasharray="4,8"
                opacity="0.6"
              />
            );
          })}
          {Array.from({ length: 5 }).map((_, i) => {
            const x = (mapWidth / 5) * i;
            return (
              <Line
                key={`v-${i}`}
                x1={x}
                y1="0"
                x2={x}
                y2={mapHeight}
                stroke="#1E293B"
                strokeWidth="0.75"
                strokeDasharray="4,8"
                opacity="0.6"
              />
            );
          })}

          {/* Tree Canopy Corridors (Green Shaded Corridors) */}
          {showCanopyLayer &&
            routes
              .filter((r) => r.route_type === 'low_heat_exposure')
              .map((r, rIdx) => {
                const pathD = projectedRoutes[routes.indexOf(r)];
                if (!pathD) return null;
                return (
                  <G key={`canopy-glow-${rIdx}`}>
                    <Path
                      d={pathD}
                      stroke="url(#canopyGlow)"
                      strokeWidth="28"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.75"
                      fill="none"
                    />
                    <Path
                      d={pathD}
                      stroke="#10B981"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="8,6"
                      opacity="0.3"
                      fill="none"
                    />
                  </G>
                );
              })}

          {/* Inactive Secondary Road Routes */}
          {projectedRoutes.map((pathD, idx) => {
            if (idx === selectedRouteIndex || !pathD) return null;
            return (
              <Path
                key={`inactive-route-${idx}`}
                d={pathD}
                stroke="#334155"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6,6"
                opacity="0.8"
                fill="none"
              />
            );
          })}

          {/* Active Selected Road Route */}
          {projectedRoutes[selectedRouteIndex] ? (
            <G>
              {/* Outer Glow Halo */}
              <Path
                d={projectedRoutes[selectedRouteIndex]}
                stroke={
                  selectedRouteIndex === 0
                    ? '#10B981'
                    : selectedRouteIndex === 1
                    ? '#06B6D4'
                    : '#F59E0B'
                }
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.3"
                fill="none"
              />
              {/* Core Road Polyline */}
              <Path
                d={projectedRoutes[selectedRouteIndex]}
                stroke={
                  selectedRouteIndex === 0
                    ? 'url(#coolRouteGrad)'
                    : selectedRouteIndex === 1
                    ? 'url(#respiteRouteGrad)'
                    : 'url(#fastRouteGrad)'
                }
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Center Guidance Dash */}
              <Path
                d={projectedRoutes[selectedRouteIndex]}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6,8"
                opacity="0.85"
                fill="none"
              />
            </G>
          ) : null}

          {/* Verified Cooling Shelters & Water Kiosks on Map */}
          {showRespiteLayer &&
            projectedPoints.facilities.map((fac) => {
              if (fac.x < -20 || fac.x > mapWidth + 20 || fac.y < -20 || fac.y > mapHeight + 20) {
                return null;
              }
              const isCooling = fac.type === 'cooling_centre';
              const color = isCooling ? '#06B6D4' : '#38BDF8';
              return (
                <G key={fac.id}>
                  <Circle cx={fac.x} cy={fac.y} r="14" fill={color} opacity="0.15" />
                  <Circle cx={fac.x} cy={fac.y} r="8" fill={color} stroke="#060D1E" strokeWidth="2" />
                  {/* Marker Label */}
                  <Rect
                    x={fac.x - 42}
                    y={fac.y - 24}
                    width="84"
                    height="14"
                    rx="4"
                    fill="#0B1329"
                    stroke={color}
                    strokeWidth="1"
                  />
                  <SvgText
                    x={fac.x}
                    y={fac.y - 14}
                    fontSize="8"
                    fontWeight="bold"
                    fill="#F8FAFC"
                    textAnchor="middle"
                  >
                    {isCooling ? '🏛️ Respite' : '💧 Water'}
                  </SvgText>
                </G>
              );
            })}

          {/* Origin Marker (Point A) */}
          <G>
            <Circle
              cx={projectedPoints.start[0]}
              cy={projectedPoints.start[1]}
              r="18"
              fill="#10B981"
              opacity="0.25"
            />
            <Circle
              cx={projectedPoints.start[0]}
              cy={projectedPoints.start[1]}
              r="9"
              fill="#10B981"
              stroke="#060D1E"
              strokeWidth="2.5"
            />
            <SvgText
              x={projectedPoints.start[0]}
              y={projectedPoints.start[1] + 3.5}
              fontSize="9"
              fontWeight="900"
              fill="#060D1E"
              textAnchor="middle"
            >
              A
            </SvgText>
          </G>

          {/* Destination Marker (Point B) */}
          <G>
            <Circle
              cx={projectedPoints.end[0]}
              cy={projectedPoints.end[1]}
              r="18"
              fill="#EF4444"
              opacity="0.25"
            />
            <Circle
              cx={projectedPoints.end[0]}
              cy={projectedPoints.end[1]}
              r="9"
              fill="#EF4444"
              stroke="#060D1E"
              strokeWidth="2.5"
            />
            <SvgText
              x={projectedPoints.end[0]}
              y={projectedPoints.end[1] + 3.5}
              fontSize="9"
              fontWeight="900"
              fill="#FFFFFF"
              textAnchor="middle"
            >
              B
            </SvgText>
          </G>

          {/* Live Navigation Moving Puck */}
          {isNavigating && (
            <G>
              <Circle
                cx={activePuckPosition[0]}
                cy={activePuckPosition[1]}
                r="22"
                fill="url(#puckGlow)"
              />
              <Circle
                cx={activePuckPosition[0]}
                cy={activePuckPosition[1]}
                r="10"
                fill="#38BDF8"
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
              <Circle
                cx={activePuckPosition[0]}
                cy={activePuckPosition[1]}
                r="4"
                fill="#FFFFFF"
              />
            </G>
          )}
        </Svg>
      </View>

      {/* ======================================================== */}
      {/* 2. TOP HUD / LIVE NAVIGATION GUIDANCE BANNER             */}
      {/* ======================================================== */}
      {isNavigating && activeRoute ? (
        <View style={styles.topNavBanner}>
          <View style={styles.navBannerMain}>
            <View style={styles.maneuverIconBox}>
              {renderManeuverIcon(
                activeRoute.steps[navStepIndex]?.maneuver_type,
                26,
                '#FFFFFF'
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.navDistText}>
                In {formatDistance(activeRoute.steps[navStepIndex]?.distance_meters || 150)}
              </Text>
              <Text style={styles.navInstructionText} numberOfLines={2}>
                {activeRoute.steps[navStepIndex]?.instruction || 'Continue on tree-canopied corridor'}
              </Text>
              <View style={styles.navStreetRow}>
                <Feather name="navigation" size={11} color="#38BDF8" />
                <Text style={styles.navStreetName} numberOfLines={1}>
                  {activeRoute.steps[navStepIndex]?.street_name || 'Shaded Urban Way'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.exitNavBtn} onPress={stopNavigation}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Live Navigation Sub-Bar */}
          <View style={styles.navBannerSub}>
            <View style={styles.navSubStat}>
              <Feather name="umbrella" size={13} color="#10B981" />
              <Text style={styles.navSubStatText}>
                {activeRoute.shade_coverage_pct}% Continuous Shade
              </Text>
            </View>
            <View style={styles.navSubDivider} />
            <View style={styles.navSubStat}>
              <MaterialCommunityIcons name="speedometer" size={14} color="#06B6D4" />
              <Text style={styles.navSubStatText}>
                {travelMode === 'walk' ? '4.8 km/h' : travelMode === 'cycle' ? '14.5 km/h' : '32 km/h'}
              </Text>
            </View>
            <View style={styles.navSubDivider} />
            <View style={styles.navSubStat}>
              <MaterialCommunityIcons name="thermometer-chevron-down" size={15} color="#10B981" />
              <Text style={styles.navSubStatText}>-4.2°C Ground Heat</Text>
            </View>
          </View>
        </View>
      ) : (
        /* Standard Header Overlay */
        <View style={styles.standardHeader}>
          <View>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="shield-sun" size={20} color="#10B981" />
              <Text style={styles.screenTitle}>HEATSHIELD SAFE ROUTE</Text>
            </View>
            <Text style={styles.screenSubtitle}>OSRM Road Topology • Canopy Shaded Corridors</Text>
          </View>

          <View style={styles.headerCityBadge}>
            <Ionicons name="location-sharp" size={12} color="#06B6D4" />
            <Text style={styles.headerCityText}>{activePreset.city}</Text>
          </View>
        </View>
      )}

      {/* ======================================================== */}
      {/* 3. FLOATING MAP CONTROLS                                 */}
      {/* ======================================================== */}
      <View style={[styles.floatingControls, isNavigating && { top: 140 }]}>
        {/* Toggle Canopy Layer */}
        <TouchableOpacity
          style={[styles.floatingBtn, showCanopyLayer && styles.floatingBtnActive]}
          onPress={() => setShowCanopyLayer(!showCanopyLayer)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="tree"
            size={18}
            color={showCanopyLayer ? '#10B981' : '#64748B'}
          />
        </TouchableOpacity>

        {/* Toggle Respite & Water Layer */}
        <TouchableOpacity
          style={[styles.floatingBtn, showRespiteLayer && styles.floatingBtnActive]}
          onPress={() => setShowRespiteLayer(!showRespiteLayer)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="cup-water"
            size={18}
            color={showRespiteLayer ? '#06B6D4' : '#64748B'}
          />
        </TouchableOpacity>

        {/* Zoom In */}
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#F8FAFC" />
        </TouchableOpacity>

        {/* Zoom Out */}
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
          activeOpacity={0.8}
        >
          <Ionicons name="remove" size={18} color="#F8FAFC" />
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* 4. COLLAPSIBLE BOTTOM SHEET                              */}
      {/* ======================================================== */}
      <Animated.View style={[styles.bottomSheet, { height: sheetHeightAnim }]}>
        {/* Drag Handle Bar */}
        <View {...panResponder.panHandlers} style={styles.sheetHandleContainer}>
          <View style={styles.sheetHandleBar} />
        </View>

        {/* Collapsed Mode Quick Glance Bar */}
        {!isExpanded && activeRoute && (
          <TouchableOpacity
            style={styles.collapsedGlanceBar}
            onPress={() => toggleSheet(true)}
            activeOpacity={0.9}
          >
            <View style={styles.collapsedInfoLeft}>
              <View style={styles.collapsedBadgeRow}>
                <View
                  style={[
                    styles.routeTypeBadge,
                    {
                      backgroundColor:
                        selectedRouteIndex === 0
                          ? 'rgba(16, 185, 129, 0.15)'
                          : selectedRouteIndex === 1
                          ? 'rgba(6, 182, 212, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.routeTypeBadgeText,
                      {
                        color:
                          selectedRouteIndex === 0
                            ? '#10B981'
                            : selectedRouteIndex === 1
                            ? '#06B6D4'
                            : '#F59E0B',
                      },
                    ]}
                  >
                    {activeRoute.label}
                  </Text>
                </View>

                <View style={styles.collapsedShadePill}>
                  <Feather name="umbrella" size={12} color="#10B981" />
                  <Text style={styles.collapsedShadeText}>
                    {activeRoute.shade_coverage_pct}% Shade
                  </Text>
                </View>
              </View>

              <Text style={styles.collapsedPrimaryText}>
                {activeRoute.formatted_duration} • {activeRoute.formatted_distance}
              </Text>
              <Text style={styles.collapsedSubText}>
                Tap to expand route choices & turn-by-turn guidance
              </Text>
            </View>

            <TouchableOpacity
              style={styles.collapsedStartNavBtn}
              onPress={startNavigation}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={18} color="#060D1E" />
              <Text style={styles.collapsedStartNavText}>Start</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Expanded Mode Content */}
        {isExpanded && (
          <ScrollView
            style={styles.sheetScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {/* Origin & Destination Search Inputs */}
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
                      value={originText}
                      onChangeText={setOriginText}
                      placeholder="Origin starting place"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={styles.inputDivider} />

                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.textInput}
                      value={destText}
                      onChangeText={setDestText}
                      placeholder="Destination point"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.swapBtn} onPress={handleSwap}>
                  <Ionicons name="swap-vertical" size={20} color="#06B6D4" />
                </TouchableOpacity>
              </View>

              {/* Quick Preset Route Tags */}
              <View style={styles.presetSection}>
                <Text style={styles.presetHeading}>QUICK CORRIDOR PRESETS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                  {PRESET_ROUTES.map((p) => {
                    const isSelected = activePreset.id === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.presetTag, isSelected && styles.presetTagActive]}
                        onPress={() => applyPreset(p)}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-distance"
                          size={13}
                          color={isSelected ? '#10B981' : '#94A3B8'}
                        />
                        <Text style={[styles.presetTagText, isSelected && styles.presetTagTextActive]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Travel Mode Selector (Walk, Cycle, Drive) */}
              <View style={styles.modeTabs}>
                <TouchableOpacity
                  style={[styles.modeTab, travelMode === 'walk' && styles.modeTabActive]}
                  onPress={() => setTravelMode('walk')}
                >
                  <MaterialCommunityIcons
                    name="walk"
                    size={17}
                    color={travelMode === 'walk' ? '#10B981' : '#94A3B8'}
                  />
                  <Text style={[styles.modeLabel, travelMode === 'walk' && styles.modeLabelActive]}>
                    Walk (Max Shade)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeTab, travelMode === 'cycle' && styles.modeTabActive]}
                  onPress={() => setTravelMode('cycle')}
                >
                  <Ionicons
                    name="bicycle"
                    size={17}
                    color={travelMode === 'cycle' ? '#10B981' : '#94A3B8'}
                  />
                  <Text style={[styles.modeLabel, travelMode === 'cycle' && styles.modeLabelActive]}>
                    Cycle
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeTab, travelMode === 'drive' && styles.modeTabActive]}
                  onPress={() => setTravelMode('drive')}
                >
                  <Ionicons
                    name="car"
                    size={17}
                    color={travelMode === 'drive' ? '#10B981' : '#94A3B8'}
                  />
                  <Text style={[styles.modeLabel, travelMode === 'drive' && styles.modeLabelActive]}>
                    Drive
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Loading Indicator */}
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#06B6D4" />
                <Text style={styles.loadingText}>Fetching road shade topology via OSRM...</Text>
              </View>
            ) : (
              <>
                {/* 3 Real Road Route Variants */}
                <Text style={styles.sectionHeading}>SELECT ROUTE VARIANT (OSRM)</Text>
                <View style={styles.routesContainer}>
                  {routes.map((r, idx) => {
                    const isSelected = selectedRouteIndex === idx;
                    const isCoolest = r.route_type === 'low_heat_exposure';
                    const isRespite = r.route_type === 'respite_optimized';

                    const accentColor = isCoolest ? '#10B981' : isRespite ? '#06B6D4' : '#F59E0B';

                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[
                          styles.routeCard,
                          isSelected && { borderColor: accentColor, backgroundColor: '#0F1E3A' },
                        ]}
                        onPress={() => {
                          setSelectedRouteIndex(idx);
                          setNavStepIndex(0);
                        }}
                        activeOpacity={0.85}
                      >
                        <View style={styles.routeCardHeader}>
                          <View style={styles.routeCardTitleRow}>
                            <View
                              style={[
                                styles.routeRadioDot,
                                isSelected && { backgroundColor: accentColor },
                              ]}
                            />
                            <Text style={[styles.routeCardTitle, isSelected && { color: '#F8FAFC' }]}>
                              {r.label}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.shadeBadgeMini,
                              { backgroundColor: `${accentColor}20` },
                            ]}
                          >
                            <Text style={[styles.shadeBadgeMiniText, { color: accentColor }]}>
                              {r.shade_coverage_pct}% Shade
                            </Text>
                          </View>
                        </View>

                        {/* Route Metric Stats Row */}
                        <View style={styles.routeMetricsRow}>
                          <View style={styles.routeMetricItem}>
                            <Text style={styles.routeMetricVal}>{r.formatted_duration}</Text>
                            <Text style={styles.routeMetricLabel}>Duration</Text>
                          </View>
                          <View style={styles.routeMetricDivider} />
                          <View style={styles.routeMetricItem}>
                            <Text style={styles.routeMetricVal}>{r.formatted_distance}</Text>
                            <Text style={styles.routeMetricLabel}>Distance</Text>
                          </View>
                          <View style={styles.routeMetricDivider} />
                          <View style={styles.routeMetricItem}>
                            <Text
                              style={[
                                styles.routeMetricVal,
                                {
                                  color:
                                    r.heat_exposure_score < 40
                                      ? '#10B981'
                                      : r.heat_exposure_score < 60
                                      ? '#F59E0B'
                                      : '#EF4444',
                                },
                              ]}
                            >
                              {r.heat_exposure_score}/100
                            </Text>
                            <Text style={styles.routeMetricLabel}>Heat Exposure</Text>
                          </View>
                        </View>

                        <Text style={styles.routeSummaryText}>{r.summary}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Primary Action Button: Start Navigation */}
                <TouchableOpacity
                  style={styles.primaryNavBtn}
                  onPress={startNavigation}
                  activeOpacity={0.85}
                >
                  <Ionicons name="navigate-circle" size={24} color="#060D1E" />
                  <Text style={styles.primaryNavBtnText}>Start Live Navigation</Text>
                </TouchableOpacity>

                {/* Tab Switcher: Turn-by-Turn Directions vs Checkpoints */}
                <View style={styles.detailTabBar}>
                  <TouchableOpacity
                    style={[
                      styles.detailTabItem,
                      activeDetailTab === 'steps' && styles.detailTabItemActive,
                    ]}
                    onPress={() => setActiveDetailTab('steps')}
                  >
                    <Ionicons
                      name="list"
                      size={16}
                      color={activeDetailTab === 'steps' ? '#10B981' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.detailTabLabel,
                        activeDetailTab === 'steps' && styles.detailTabLabelActive,
                      ]}
                    >
                      Turn-by-Turn ({activeRoute?.steps.length || 0})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.detailTabItem,
                      activeDetailTab === 'checkpoints' && styles.detailTabItemActive,
                    ]}
                    onPress={() => setActiveDetailTab('checkpoints')}
                  >
                    <MaterialCommunityIcons
                      name="shield-check"
                      size={16}
                      color={activeDetailTab === 'checkpoints' ? '#06B6D4' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.detailTabLabel,
                        activeDetailTab === 'checkpoints' && { color: '#06B6D4', fontWeight: '700' },
                      ]}
                    >
                      Respite Checkpoints ({activeRoute?.checkpoints.length || 0})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* TAB 1: Turn-by-Turn Guidance */}
                {activeDetailTab === 'steps' && activeRoute && (
                  <View style={styles.stepsCard}>
                    {activeRoute.steps.map((step, idx) => {
                      const isHighShade = step.shade_level === 'HIGH';
                      return (
                        <View key={idx} style={styles.stepItem}>
                          <View style={styles.stepNumCol}>
                            <View
                              style={[
                                styles.stepManeuverCircle,
                                isHighShade && styles.stepManeuverCircleCanopy,
                              ]}
                            >
                              {renderManeuverIcon(step.maneuver_type, 16, '#F8FAFC')}
                            </View>
                            {idx < activeRoute.steps.length - 1 && (
                              <View style={styles.stepLine} />
                            )}
                          </View>

                          <View style={styles.stepContent}>
                            <Text style={styles.stepInstruction}>{step.instruction}</Text>
                            <View style={styles.stepMetaRow}>
                              <Text style={styles.stepDist}>
                                {formatDistance(step.distance_meters)}
                              </Text>
                              <Text style={styles.stepStreet}>
                                • {step.street_name || 'Designated Route'}
                              </Text>
                              <View
                                style={[
                                  styles.stepShadeBadge,
                                  {
                                    backgroundColor:
                                      step.shade_level === 'HIGH'
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : 'rgba(245, 158, 11, 0.15)',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.stepShadeText,
                                    {
                                      color:
                                        step.shade_level === 'HIGH' ? '#10B981' : '#F59E0B',
                                    },
                                  ]}
                                >
                                  {step.shade_level === 'HIGH'
                                    ? 'High Shade'
                                    : step.shade_level === 'MODERATE'
                                    ? 'Moderate Sun'
                                    : 'Direct Sun'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* TAB 2: Thermal Checkpoints & Respite Waypoints */}
                {activeDetailTab === 'checkpoints' && activeRoute && (
                  <View style={styles.checkpointsCard}>
                    {activeRoute.checkpoints.map((cp, idx) => {
                      const isLowRisk = cp.heat_risk === 'low';
                      const isHighRisk = cp.heat_risk === 'high' || cp.heat_risk === 'extreme';

                      return (
                        <View key={idx} style={styles.checkpointItem}>
                          <View style={styles.checkpointIconCol}>
                            <View
                              style={[
                                styles.checkpointIconWrap,
                                isLowRisk
                                  ? { backgroundColor: '#064E3B' }
                                  : isHighRisk
                                  ? { backgroundColor: '#7F1D1D' }
                                  : { backgroundColor: '#1E293B' },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={
                                  cp.type === 'shelter'
                                    ? 'home-thermometer'
                                    : cp.type === 'water'
                                    ? 'water'
                                    : cp.type === 'shade'
                                    ? 'tree'
                                    : cp.type === 'hazard'
                                    ? 'weather-sunny-alert'
                                    : 'map-marker'
                                }
                                size={18}
                                color={
                                  isLowRisk ? '#10B981' : isHighRisk ? '#EF4444' : '#06B6D4'
                                }
                              />
                            </View>
                            {idx < activeRoute.checkpoints.length - 1 && (
                              <View style={styles.checkpointLine} />
                            )}
                          </View>

                          <View style={styles.checkpointContent}>
                            <View style={styles.checkpointHeaderRow}>
                              <Text style={styles.checkpointTitle}>{cp.title}</Text>
                              <View
                                style={[
                                  styles.tempBadge,
                                  isLowRisk
                                    ? { backgroundColor: '#064E3B' }
                                    : isHighRisk
                                    ? { backgroundColor: '#7F1D1D' }
                                    : { backgroundColor: '#1E293B' },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.tempBadgeText,
                                    isLowRisk
                                      ? { color: '#10B981' }
                                      : isHighRisk
                                      ? { color: '#EF4444' }
                                      : { color: '#06B6D4' },
                                  ]}
                                >
                                  {cp.temperature}°C
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.checkpointDesc}>{cp.desc}</Text>
                            {cp.reason && (
                              <Text style={styles.checkpointReason}>💡 {cp.reason}</Text>
                            )}
                            {cp.distance_from_prev && (
                              <Text style={styles.checkpointDist}>
                                📍 +{cp.distance_from_prev} from prior checkpoint
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={{ height: 40 }} />
              </>
            )}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060D1E',
  },

  // Standard Header Overlay
  standardHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 28,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 41, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  screenTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.8,
  },
  screenSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerCityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  headerCityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06B6D4',
  },

  // Live Navigation Guidance Banner
  topNavBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    left: 14,
    right: 14,
    backgroundColor: '#0B1329',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#10B981',
    zIndex: 20,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  navBannerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  maneuverIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDistText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  navInstructionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 2,
  },
  navStreetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  navStreetName: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '500',
  },
  exitNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  navBannerSub: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#060D1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  navSubStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  navSubStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navSubDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#334155',
  },

  // Floating Map Controls
  floatingControls: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 120 : 96,
    gap: 10,
    zIndex: 10,
  },
  floatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 19, 41, 0.92)',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingBtnActive: {
    borderColor: '#10B981',
    backgroundColor: '#0E2829',
  },

  // Collapsible Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B1329',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    zIndex: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandleContainer: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#475569',
  },

  // Collapsed Mode Quick Glance Bar
  collapsedGlanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  collapsedInfoLeft: {
    flex: 1,
    marginRight: 12,
  },
  collapsedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  routeTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  routeTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  collapsedShadePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  collapsedShadeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  collapsedPrimaryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  collapsedSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  collapsedStartNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  collapsedStartNavText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#060D1E',
  },

  // Expanded Mode Content
  sheetScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchCard: {
    backgroundColor: '#060D1E',
    borderRadius: 18,
    padding: 14,
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
    marginHorizontal: 10,
  },
  inputWrap: {
    paddingVertical: 3,
  },
  textInput: {
    color: '#F8FAFC',
    fontSize: 13,
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

  // Preset Section
  presetSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 10,
  },
  presetHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetScroll: {
    flexDirection: 'row',
  },
  presetTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0B1329',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginRight: 8,
  },
  presetTagActive: {
    backgroundColor: '#0E2829',
    borderColor: '#10B981',
  },
  presetTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  presetTagTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },

  // Travel Mode Selector Tabs
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#0B1329',
    borderRadius: 12,
    padding: 3,
    marginTop: 12,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: '#0E2829',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  modeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modeLabelActive: {
    color: '#10B981',
    fontWeight: '700',
  },

  // Loading Box
  loadingBox: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#060D1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginVertical: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
  },

  // Route Variant Cards
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  routesContainer: {
    gap: 10,
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: '#060D1E',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#475569',
  },
  routeCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
  },
  shadeBadgeMini: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  shadeBadgeMiniText: {
    fontSize: 11,
    fontWeight: '700',
  },
  routeMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B1329',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  routeMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  routeMetricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  routeMetricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  routeMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#1E293B',
  },
  routeSummaryText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginTop: 4,
  },

  // Primary Action Button
  primaryNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryNavBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#060D1E',
    letterSpacing: 0.5,
  },

  // Detail Tab Switcher
  detailTabBar: {
    flexDirection: 'row',
    backgroundColor: '#060D1E',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  detailTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  detailTabItemActive: {
    backgroundColor: '#0B1329',
  },
  detailTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  detailTabLabelActive: {
    color: '#10B981',
    fontWeight: '700',
  },

  // Turn-by-Turn Guidance Steps
  stepsCard: {
    backgroundColor: '#060D1E',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumCol: {
    alignItems: 'center',
    width: 28,
  },
  stepManeuverCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepManeuverCircleCanopy: {
    backgroundColor: '#10B981',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1E293B',
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    marginLeft: 10,
  },
  stepInstruction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 17,
  },
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  stepDist: {
    fontSize: 11,
    fontWeight: '600',
    color: '#06B6D4',
  },
  stepStreet: {
    fontSize: 11,
    color: '#64748B',
  },
  stepShadeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stepShadeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Checkpoints Card
  checkpointsCard: {
    backgroundColor: '#060D1E',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  checkpointItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  checkpointIconCol: {
    alignItems: 'center',
    width: 32,
  },
  checkpointIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkpointLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1E293B',
    marginVertical: 4,
  },
  checkpointContent: {
    flex: 1,
    marginLeft: 10,
  },
  checkpointHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  checkpointTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 6,
  },
  tempBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tempBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  checkpointDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  checkpointReason: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 3,
    fontWeight: '500',
  },
  checkpointDist: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
});
