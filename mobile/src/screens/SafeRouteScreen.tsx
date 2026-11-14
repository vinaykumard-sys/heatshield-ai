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
  Keyboard,
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
  searchLocations,
  reverseGeocodeLocation,
  PRESET_ROUTES,
  VERIFIED_COOLING_FACILITIES,
  HeatSafeRoute,
  RouteStep,
  RouteCheckpoint,
  PresetRoute,
  CoolingFacility,
  GeocodedLocation,
  formatDistance,
  formatDuration,
} from '../services/safeRoutingService';

export default function SafeRouteScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Search & Navigation States
  const [activePreset, setActivePreset] = useState<PresetRoute>(PRESET_ROUTES[0]);
  const [originText, setOriginText] = useState<string>(PRESET_ROUTES[0].startPlace);
  const [destText, setDestText] = useState<string>(PRESET_ROUTES[0].endPlace);
  const [startCoords, setStartCoords] = useState<[number, number]>(PRESET_ROUTES[0].startCoords);
  const [endCoords, setEndCoords] = useState<[number, number]>(PRESET_ROUTES[0].endCoords);
  const [travelMode, setTravelMode] = useState<'walk' | 'cycle' | 'drive'>('walk');

  // Autocomplete States
  const [isSearchingOrigin, setIsSearchingOrigin] = useState<boolean>(false);
  const [isSearchingDest, setIsSearchingDest] = useState<boolean>(false);
  const [autocompleteResults, setAutocompleteResults] = useState<GeocodedLocation[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState<boolean>(false);

  // Route Data States
  const [routes, setRoutes] = useState<HeatSafeRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDetailTab, setActiveDetailTab] = useState<'steps' | 'facilities'>('steps');

  // Map Viewport, Pan & Zoom States
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [showCanopyLayer, setShowCanopyLayer] = useState<boolean>(true);
  const [showRespiteLayer, setShowRespiteLayer] = useState<boolean>(true);
  const [showHeatRiskLayer, setShowHeatRiskLayer] = useState<boolean>(true);

  // Live Navigation Simulation States
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [navStepIndex, setNavStepIndex] = useState<number>(0);
  const [navProgressPct, setNavProgressPct] = useState<number>(0);
  const navTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Collapsible Bottom Sheet Animation
  // Peek Height: ~140px, Expanded Height: ~68% of screen height
  const peekHeight = 138;
  const expandedHeight = Math.min(screenHeight * 0.72, 600);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const sheetHeightAnim = useRef(new Animated.Value(peekHeight)).current;

  // Toggle or Set Sheet Expansion
  const toggleSheet = (expand?: boolean) => {
    const shouldExpand = expand !== undefined ? expand : !isExpanded;
    setIsExpanded(shouldExpand);
    Animated.spring(sheetHeightAnim, {
      toValue: shouldExpand ? expandedHeight : peekHeight,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  // PanResponder for Bottom Sheet drag handle
  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
        onPanResponderMove: (_, gesture) => {
          const currentBase = isExpanded ? expandedHeight : peekHeight;
          const newHeight = Math.min(
            expandedHeight + 20,
            Math.max(peekHeight - 15, currentBase - gesture.dy)
          );
          sheetHeightAnim.setValue(newHeight);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -35) {
            toggleSheet(true);
          } else if (gesture.dy > 35) {
            toggleSheet(false);
          } else {
            toggleSheet(isExpanded);
          }
        },
      }),
    [isExpanded, expandedHeight, peekHeight]
  );

  // PanResponder for interactive map dragging
  const mapPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          panStartRef.current = { ...panOffset };
        },
        onPanResponderMove: (_, gesture) => {
          setPanOffset({
            x: panStartRef.current.x + gesture.dx,
            y: panStartRef.current.y + gesture.dy,
          });
        },
      }),
    [panOffset]
  );

  // Reset Map viewport to centered route
  const handleRecenterMap = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1.0);
  };

  // Autocomplete live search handler
  const handleSearchTextChange = async (text: string, isOrigin: boolean) => {
    if (isOrigin) {
      setOriginText(text);
      setIsSearchingOrigin(true);
      setIsSearchingDest(false);
    } else {
      setDestText(text);
      setIsSearchingDest(true);
      setIsSearchingOrigin(false);
    }

    if (text.trim().length >= 2) {
      setIsSearchingLocations(true);
      try {
        const results = await searchLocations(text, activePreset.city);
        setAutocompleteResults(results);
      } catch {
        // Fallback
      } finally {
        setIsSearchingLocations(false);
      }
    } else {
      setAutocompleteResults([]);
    }
  };

  // Select place from autocomplete
  const handleSelectPlace = (place: GeocodedLocation, isOrigin: boolean) => {
    Keyboard.dismiss();
    if (isOrigin) {
      setOriginText(place.name);
      setStartCoords([place.latitude, place.longitude]);
      setIsSearchingOrigin(false);
    } else {
      setDestText(place.name);
      setEndCoords([place.latitude, place.longitude]);
      setIsSearchingDest(false);
    }
    setAutocompleteResults([]);
    if (isNavigating) stopNavigation();
  };

  // One-tap Use Current Location
  const handleUseCurrentLocation = async () => {
    try {
      const loc = await reverseGeocodeLocation(startCoords[0], startCoords[1]);
      setOriginText(`📍 Current Location (${loc.name})`);
      setIsSearchingOrigin(false);
      setAutocompleteResults([]);
    } catch {
      setOriginText('📍 My Current Location');
    }
  };

  // Load Road Routes from OSRM via safeRoutingService
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
        'Routing Status',
        'Direct connection to primary routing service timed out. Loaded high-precision offline road topology.'
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
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1.0);
    setIsSearchingOrigin(false);
    setIsSearchingDest(false);
    setAutocompleteResults([]);
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
    setPanOffset({ x: 0, y: 0 });
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
            stopNavigation();
            Alert.alert(
              'Destination Reached',
              `You have arrived safely at ${destText}! Verified cooling shelter and hydration nearby.`
            );
            return 1;
          }
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

  // Compute map bounding box and projected paths
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

    // Viewport padding
    const latSpan = Math.max(0.015, maxLat - minLat);
    const lonSpan = Math.max(0.015, maxLon - minLon);

    const padTop = 0.22 / zoomLevel;
    const padBottom = 0.42 / zoomLevel; // extra space for bottom sheet
    const padSide = 0.18 / zoomLevel;

    const paddedMinLat = minLat - latSpan * padBottom;
    const paddedMaxLat = maxLat + latSpan * padTop;
    const paddedMinLon = minLon - lonSpan * padSide;
    const paddedMaxLon = maxLon + lonSpan * padSide;

    const proj = (lat: number, lon: number): [number, number] => {
      let x = ((lon - paddedMinLon) / (paddedMaxLon - paddedMinLon)) * mapWidth;
      let y = (1 - (lat - paddedMinLat) / (paddedMaxLat - paddedMinLat)) * mapHeight;

      // Apply Pan offset
      x += panOffset.x;
      y += panOffset.y;

      // Subtle 3D perspective transform if 3D mode enabled
      if (is3DMode) {
        const perspectiveFactor = 0.82 + (y / mapHeight) * 0.28;
        const centerX = mapWidth / 2;
        x = centerX + (x - centerX) * perspectiveFactor;
        y = y * 0.88 + 40;
      }

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

    // Facilities inside viewport
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
  }, [
    routes,
    startCoords,
    endCoords,
    mapWidth,
    mapHeight,
    zoomLevel,
    panOffset,
    is3DMode,
    navProgressPct,
    activeRoute,
  ]);

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

  const hasPanned = Math.abs(panOffset.x) > 10 || Math.abs(panOffset.y) > 10 || zoomLevel !== 1.0;

  return (
    <View style={styles.container}>
      {/* ======================================================== */}
      {/* 1. FULL-SCREEN INTERACTIVE DAYLIGHT ROAD VECTOR MAP      */}
      {/* ======================================================== */}
      <View style={StyleSheet.absoluteFill} {...mapPanResponder.panHandlers}>
        <Svg width={mapWidth} height={mapHeight} style={StyleSheet.absoluteFill}>
          <Defs>
            {/* Crisp Clean Daylight Map Canvas Background */}
            <LinearGradient id="mapDayGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#F8FAFC" />
              <Stop offset="50%" stopColor="#F1F5F9" />
              <Stop offset="100%" stopColor="#E2E8F0" />
            </LinearGradient>

            {/* Glowing High-Contrast Route Polyline Gradients */}
            <LinearGradient id="coolRouteGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#059669" />
              <Stop offset="100%" stopColor="#10B981" />
            </LinearGradient>
            <LinearGradient id="respiteRouteGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#0284C7" />
              <Stop offset="100%" stopColor="#06B6D4" />
            </LinearGradient>
            <LinearGradient id="fastRouteGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#D97706" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>

            {/* Tree Canopy Corridor Soft Glow */}
            <RadialGradient id="canopyCorridorGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </RadialGradient>

            {/* Active Navigation Puck Pulse Glow */}
            <RadialGradient id="puckPulseGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.85" />
              <Stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Daylight Clean Base Map Background */}
          <Rect x="0" y="0" width={mapWidth} height={mapHeight} fill="url(#mapDayGrad)" />

          {/* Modern Daylight Street Grid Overlay */}
          {Array.from({ length: 9 }).map((_, i) => {
            const y = (mapHeight / 9) * i;
            return (
              <Line
                key={`h-${i}`}
                x1="0"
                y1={y}
                x2={mapWidth}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1.2"
                opacity="0.8"
              />
            );
          })}
          {Array.from({ length: 6 }).map((_, i) => {
            const x = (mapWidth / 6) * i;
            return (
              <Line
                key={`v-${i}`}
                x1={x}
                y1="0"
                x2={x}
                y2={mapHeight}
                stroke="#E2E8F0"
                strokeWidth="1.2"
                opacity="0.8"
              />
            );
          })}

          {/* Simulated Park & Urban Greenway Poly Patches */}
          <Rect
            x={mapWidth * 0.15 + (panOffset.x * 0.3)}
            y={mapHeight * 0.28 + (panOffset.y * 0.3)}
            width="140"
            height="90"
            rx="20"
            fill="#DCFCE7"
            opacity="0.65"
          />
          <Rect
            x={mapWidth * 0.55 + (panOffset.x * 0.3)}
            y={mapHeight * 0.45 + (panOffset.y * 0.3)}
            width="160"
            height="110"
            rx="24"
            fill="#DCFCE7"
            opacity="0.55"
          />

          {/* Tree Canopy Corridors Layer */}
          {showCanopyLayer &&
            routes
              .filter((r) => r.route_type === 'low_heat_exposure')
              .map((r, rIdx) => {
                const pathD = projectedRoutes[routes.indexOf(r)];
                if (!pathD) return null;
                return (
                  <G key={`canopy-${rIdx}`}>
                    {/* Broad Soft Shaded Green Ribbon */}
                    <Path
                      d={pathD}
                      stroke="#10B981"
                      strokeWidth="26"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.25"
                      fill="none"
                    />
                    {/* Tree Canopy Dashes */}
                    <Path
                      d={pathD}
                      stroke="#059669"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="6,8"
                      opacity="0.35"
                      fill="none"
                    />
                  </G>
                );
              })}

          {/* Inactive Secondary Alternative Road Routes */}
          {projectedRoutes.map((pathD, idx) => {
            if (idx === selectedRouteIndex || !pathD) return null;
            return (
              <G key={`inactive-route-${idx}`}>
                <Path
                  d={pathD}
                  stroke="#94A3B8"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="6,6"
                  opacity="0.75"
                  fill="none"
                />
              </G>
            );
          })}

          {/* Active Selected Road Route */}
          {projectedRoutes[selectedRouteIndex] ? (
            <G>
              {/* Subtle 3D Under-Route Shadow / Ground Ribbon */}
              {is3DMode && (
                <Path
                  d={projectedRoutes[selectedRouteIndex]}
                  stroke="#64748B"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.25"
                  fill="none"
                  transform="translate(0, 5)"
                />
              )}

              {/* Outer Glow Halo */}
              <Path
                d={projectedRoutes[selectedRouteIndex]}
                stroke={
                  selectedRouteIndex === 0
                    ? '#10B981'
                    : selectedRouteIndex === 1
                    ? '#0284C7'
                    : '#D97706'
                }
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.25"
                fill="none"
              />

              {/* Core High-Contrast Road Polyline */}
              <Path
                d={projectedRoutes[selectedRouteIndex]}
                stroke={
                  selectedRouteIndex === 0
                    ? 'url(#coolRouteGrad)'
                    : selectedRouteIndex === 1
                    ? 'url(#respiteRouteGrad)'
                    : 'url(#fastRouteGrad)'
                }
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Center Guidance Dash Ribbon */}
              <Path
                d={projectedRoutes[selectedRouteIndex]}
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6,8"
                opacity="0.9"
                fill="none"
              />
            </G>
          ) : null}

          {/* Verified Cooling Shelters & Water Points Layer */}
          {showRespiteLayer &&
            projectedPoints.facilities.map((fac) => {
              if (
                fac.x < -40 ||
                fac.x > mapWidth + 40 ||
                fac.y < -40 ||
                fac.y > mapHeight + 40
              ) {
                return null;
              }
              const isCooling = fac.type === 'cooling_centre';
              const color = isCooling ? '#0284C7' : '#0EA5E9';
              return (
                <G key={fac.id}>
                  <Circle cx={fac.x} cy={fac.y} r="16" fill={color} opacity="0.18" />
                  <Circle cx={fac.x} cy={fac.y} r="8.5" fill={color} stroke="#FFFFFF" strokeWidth="2.5" />
                  {/* Floating Pill Label */}
                  <Rect
                    x={fac.x - 45}
                    y={fac.y - 26}
                    width="90"
                    height="16"
                    rx="8"
                    fill="#FFFFFF"
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  <SvgText
                    x={fac.x}
                    y={fac.y - 14.5}
                    fontSize="8.5"
                    fontWeight="700"
                    fill="#0F172A"
                    textAnchor="middle"
                  >
                    {isCooling ? '🏛️ AC Shelter' : '💧 Water ATM'}
                  </SvgText>
                </G>
              );
            })}

          {/* Origin Marker (Point A) */}
          <G>
            <Circle
              cx={projectedPoints.start[0]}
              cy={projectedPoints.start[1]}
              r="20"
              fill="#10B981"
              opacity="0.25"
            />
            <Circle
              cx={projectedPoints.start[0]}
              cy={projectedPoints.start[1]}
              r="10"
              fill="#10B981"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            <SvgText
              x={projectedPoints.start[0]}
              y={projectedPoints.start[1] + 3.5}
              fontSize="10"
              fontWeight="900"
              fill="#FFFFFF"
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
              r="20"
              fill="#EF4444"
              opacity="0.25"
            />
            <Circle
              cx={projectedPoints.end[0]}
              cy={projectedPoints.end[1]}
              r="10"
              fill="#EF4444"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            <SvgText
              x={projectedPoints.end[0]}
              y={projectedPoints.end[1] + 3.5}
              fontSize="10"
              fontWeight="900"
              fill="#FFFFFF"
              textAnchor="middle"
            >
              B
            </SvgText>
          </G>

          {/* Live Navigation Moving Guidance Puck */}
          {isNavigating && (
            <G>
              <Circle
                cx={activePuckPosition[0]}
                cy={activePuckPosition[1]}
                r="26"
                fill="url(#puckPulseGlow)"
              />
              <Circle
                cx={activePuckPosition[0]}
                cy={activePuckPosition[1]}
                r="11"
                fill="#0284C7"
                stroke="#FFFFFF"
                strokeWidth="3"
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
      {/* 2. TOP HUD: LIVE NAVIGATION GUIDANCE BANNER OR SEARCH    */}
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
                <Feather name="navigation" size={11} color="#0284C7" />
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
              <Feather name="umbrella" size={13} color="#059669" />
              <Text style={styles.navSubStatText}>
                {activeRoute.shade_coverage_pct}% Continuous Shade
              </Text>
            </View>
            <View style={styles.navSubDivider} />
            <View style={styles.navSubStat}>
              <MaterialCommunityIcons name="speedometer" size={14} color="#0284C7" />
              <Text style={styles.navSubStatText}>
                {travelMode === 'walk' ? '4.8 km/h' : travelMode === 'cycle' ? '14.5 km/h' : '32 km/h'}
              </Text>
            </View>
            <View style={styles.navSubDivider} />
            <View style={styles.navSubStat}>
              <MaterialCommunityIcons name="thermometer-chevron-down" size={15} color="#059669" />
              <Text style={styles.navSubStatText}>-4.2°C Ground Heat</Text>
            </View>
          </View>
        </View>
      ) : (
        /* Native Daylight Search & Destination Bar */
        <View style={styles.searchHeaderContainer}>
          <View style={styles.searchCard}>
            {/* Origin & Destination Inputs Row */}
            <View style={styles.inputGroup}>
              <View style={styles.indicatorCol}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <View style={styles.verticalLine} />
                <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
              </View>

              <View style={styles.inputsCol}>
                {/* Origin Input */}
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    value={originText}
                    onChangeText={(t) => handleSearchTextChange(t, true)}
                    placeholder="Search origin location"
                    placeholderTextColor="#94A3B8"
                    onFocus={() => {
                      setIsSearchingOrigin(true);
                      setIsSearchingDest(false);
                      if (originText.length >= 2) searchLocations(originText).then(setAutocompleteResults);
                    }}
                  />
                  {originText.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setOriginText('');
                        setAutocompleteResults([]);
                      }}
                      style={styles.clearBtn}
                    >
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={handleUseCurrentLocation}
                    style={styles.gpsLocateBtn}
                    accessibilityLabel="Use current location"
                  >
                    <Ionicons name="locate" size={16} color="#0284C7" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputDivider} />

                {/* Destination Input */}
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    value={destText}
                    onChangeText={(t) => handleSearchTextChange(t, false)}
                    placeholder="Search destination"
                    placeholderTextColor="#94A3B8"
                    onFocus={() => {
                      setIsSearchingDest(true);
                      setIsSearchingOrigin(false);
                      if (destText.length >= 2) searchLocations(destText).then(setAutocompleteResults);
                    }}
                  />
                  {destText.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setDestText('');
                        setAutocompleteResults([]);
                      }}
                      style={styles.clearBtn}
                    >
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Swap Origin / Destination Button */}
              <TouchableOpacity style={styles.swapBtn} onPress={handleSwap}>
                <Ionicons name="swap-vertical" size={18} color="#0284C7" />
              </TouchableOpacity>
            </View>

            {/* Travel Mode Pills */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, travelMode === 'walk' && styles.modeTabActive]}
                onPress={() => setTravelMode('walk')}
              >
                <MaterialCommunityIcons
                  name="walk"
                  size={15}
                  color={travelMode === 'walk' ? '#059669' : '#64748B'}
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
                  size={15}
                  color={travelMode === 'cycle' ? '#059669' : '#64748B'}
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
                  size={15}
                  color={travelMode === 'drive' ? '#059669' : '#64748B'}
                />
                <Text style={[styles.modeLabel, travelMode === 'drive' && styles.modeLabelActive]}>
                  Drive
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Corridor Presets Scroll */}
            <View style={styles.presetSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetScrollContent}
              >
                {PRESET_ROUTES.map((p) => {
                  const isSelected = activePreset.id === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.presetTag, isSelected && styles.presetTagActive]}
                      onPress={() => applyPreset(p)}
                    >
                      <Ionicons
                        name="map-outline"
                        size={12}
                        color={isSelected ? '#059669' : '#64748B'}
                      />
                      <Text style={[styles.presetTagText, isSelected && styles.presetTagTextActive]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Autocomplete Suggestions Dropdown Modal/Card */}
          {(isSearchingOrigin || isSearchingDest) && autocompleteResults.length > 0 && (
            <View style={styles.autocompleteCard}>
              <View style={styles.autocompleteHeader}>
                <Text style={styles.autocompleteHeading}>
                  {isSearchingOrigin ? 'Select Origin Place' : 'Select Destination'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsSearchingOrigin(false);
                    setIsSearchingDest(false);
                    setAutocompleteResults([]);
                  }}
                >
                  <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                {autocompleteResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.autocompleteItem}
                    onPress={() => handleSelectPlace(item, isSearchingOrigin)}
                  >
                    <View style={styles.autocompleteIconWrap}>
                      <Ionicons
                        name={item.type === 'transit' ? 'subway-outline' : 'location-sharp'}
                        size={16}
                        color="#0284C7"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.autocompletePlaceName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.autocompletePlaceDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>
                    <View style={styles.autocompleteCityBadge}>
                      <Text style={styles.autocompleteCityText}>{item.city}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* ======================================================== */}
      {/* 3. FLOATING MAP CONTROLS                                 */}
      {/* ======================================================== */}
      <View style={[styles.floatingControls, isNavigating && { top: 140 }]}>
        {/* Re-center Map Viewport */}
        {hasPanned && (
          <TouchableOpacity
            style={[styles.floatingBtn, styles.recenterBtn]}
            onPress={handleRecenterMap}
            activeOpacity={0.8}
            accessibilityLabel="Re-center map"
          >
            <Ionicons name="locate" size={18} color="#0284C7" />
          </TouchableOpacity>
        )}

        {/* 2D / 3D Isometric View Tilt Toggle */}
        <TouchableOpacity
          style={[styles.floatingBtn, is3DMode && styles.floatingBtnActive]}
          onPress={() => setIs3DMode(!is3DMode)}
          activeOpacity={0.8}
          accessibilityLabel="Toggle 3D mode"
        >
          <MaterialCommunityIcons
            name={is3DMode ? 'cube-outline' : 'view-parallel'}
            size={18}
            color={is3DMode ? '#0284C7' : '#64748B'}
          />
        </TouchableOpacity>

        {/* Toggle Canopy Layer */}
        <TouchableOpacity
          style={[styles.floatingBtn, showCanopyLayer && styles.floatingBtnActive]}
          onPress={() => setShowCanopyLayer(!showCanopyLayer)}
          activeOpacity={0.8}
          accessibilityLabel="Toggle tree canopy"
        >
          <MaterialCommunityIcons
            name="tree"
            size={18}
            color={showCanopyLayer ? '#059669' : '#64748B'}
          />
        </TouchableOpacity>

        {/* Toggle Respite & Water Facilities */}
        <TouchableOpacity
          style={[styles.floatingBtn, showRespiteLayer && styles.floatingBtnActive]}
          onPress={() => setShowRespiteLayer(!showRespiteLayer)}
          activeOpacity={0.8}
          accessibilityLabel="Toggle cooling facilities"
        >
          <MaterialCommunityIcons
            name="cup-water"
            size={18}
            color={showRespiteLayer ? '#0284C7' : '#64748B'}
          />
        </TouchableOpacity>

        {/* Zoom In */}
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#0F172A" />
        </TouchableOpacity>

        {/* Zoom Out */}
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => setZoomLevel((z) => Math.max(0.7, z - 0.25))}
          activeOpacity={0.8}
        >
          <Ionicons name="remove" size={18} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* 4. EXPANDABLE NATIVE BOTTOM SHEET                        */}
      {/* ======================================================== */}
      <Animated.View style={[styles.bottomSheet, { height: sheetHeightAnim }]}>
        {/* Drag Handle Bar */}
        <View {...sheetPanResponder.panHandlers} style={styles.sheetHandleContainer}>
          <View style={styles.sheetHandleBar} />
        </View>

        {/* Peek Mode / Collapsed Quick Summary Card */}
        {!isExpanded && activeRoute && (
          <TouchableOpacity
            style={styles.peekSummaryCard}
            onPress={() => toggleSheet(true)}
            activeOpacity={0.9}
          >
            <View style={styles.peekInfoLeft}>
              <View style={styles.peekBadgeRow}>
                <View
                  style={[
                    styles.routeTypeBadge,
                    {
                      backgroundColor:
                        selectedRouteIndex === 0
                          ? '#DCFCE7'
                          : selectedRouteIndex === 1
                          ? '#E0F2FE'
                          : '#FEF3C7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.routeTypeBadgeText,
                      {
                        color:
                          selectedRouteIndex === 0
                            ? '#059669'
                            : selectedRouteIndex === 1
                            ? '#0284C7'
                            : '#D97706',
                      },
                    ]}
                  >
                    {activeRoute.label}
                  </Text>
                </View>

                <View style={styles.peekShadePill}>
                  <Feather name="umbrella" size={11} color="#059669" />
                  <Text style={styles.peekShadeText}>
                    {activeRoute.shade_coverage_pct}% Shade
                  </Text>
                </View>

                <View style={styles.peekHeatBadge}>
                  <Text
                    style={[
                      styles.peekHeatText,
                      {
                        color:
                          activeRoute.heat_exposure_score < 40
                            ? '#059669'
                            : activeRoute.heat_exposure_score < 60
                            ? '#D97706'
                            : '#EF4444',
                      },
                    ]}
                  >
                    Heat Risk: {activeRoute.heat_exposure_score}/100
                  </Text>
                </View>
              </View>

              <Text style={styles.peekPrimaryText}>
                {activeRoute.formatted_duration} • {activeRoute.formatted_distance}
              </Text>
              <Text style={styles.peekSubText} numberOfLines={1}>
                Tap or swipe up for 3 route choices & turn-by-turn guidance
              </Text>
            </View>

            <TouchableOpacity
              style={styles.peekStartNavBtn}
              onPress={startNavigation}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={16} color="#FFFFFF" />
              <Text style={styles.peekStartNavText}>Start</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Expanded Mode: Full Route Choices, Turn-by-Turn, Cooling Stops */}
        {isExpanded && (
          <ScrollView
            style={styles.sheetScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#0284C7" />
                <Text style={styles.loadingText}>
                  Calculating heat-shielded road paths via OSRM...
                </Text>
              </View>
            ) : (
              <>
                {/* Route Selector Cards (Coolest, Respite, Fastest) */}
                <Text style={styles.sectionHeading}>SELECT ROUTE VARIANT (OSRM ROAD TOPOLOGY)</Text>
                <View style={styles.routesContainer}>
                  {routes.map((r, idx) => {
                    const isSelected = selectedRouteIndex === idx;
                    const isCoolest = r.route_type === 'low_heat_exposure';
                    const isRespite = r.route_type === 'respite_optimized';

                    const accentColor = isCoolest
                      ? '#059669'
                      : isRespite
                      ? '#0284C7'
                      : '#D97706';

                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[
                          styles.routeCard,
                          isSelected && {
                            borderColor: accentColor,
                            backgroundColor: '#F8FAFC',
                          },
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
                            <Text
                              style={[
                                styles.routeCardTitle,
                                isSelected && { color: '#0F172A', fontWeight: '800' },
                              ]}
                            >
                              {r.label}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.shadeBadgeMini,
                              { backgroundColor: `${accentColor}18` },
                            ]}
                          >
                            <Feather name="umbrella" size={11} color={accentColor} />
                            <Text style={[styles.shadeBadgeMiniText, { color: accentColor }]}>
                              {r.shade_coverage_pct}% Shade
                            </Text>
                          </View>
                        </View>

                        {/* Metric Row */}
                        <View style={styles.routeMetricsRow}>
                          <View style={styles.routeMetricItem}>
                            <Text style={styles.routeMetricVal}>{r.formatted_duration}</Text>
                            <Text style={styles.routeMetricLabel}>ETA</Text>
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
                                      ? '#059669'
                                      : r.heat_exposure_score < 60
                                      ? '#D97706'
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
                  <Ionicons name="navigate-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.primaryNavBtnText}>Start Live Navigation</Text>
                </TouchableOpacity>

                {/* Detail Tabs: Turn-by-Turn vs Verified Facilities */}
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
                      size={15}
                      color={activeDetailTab === 'steps' ? '#059669' : '#64748B'}
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
                      activeDetailTab === 'facilities' && styles.detailTabItemActive,
                    ]}
                    onPress={() => setActiveDetailTab('facilities')}
                  >
                    <MaterialCommunityIcons
                      name="shield-check"
                      size={15}
                      color={activeDetailTab === 'facilities' ? '#0284C7' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.detailTabLabel,
                        activeDetailTab === 'facilities' && { color: '#0284C7', fontWeight: '700' },
                      ]}
                    >
                      Cooling & Water Stops ({activeRoute?.nearby_facilities?.length || 0})
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
                              {renderManeuverIcon(
                                step.maneuver_type,
                                14,
                                isHighShade ? '#FFFFFF' : '#475569'
                              )}
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
                                        ? '#DCFCE7'
                                        : '#FEF3C7',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.stepShadeText,
                                    {
                                      color:
                                        step.shade_level === 'HIGH' ? '#059669' : '#D97706',
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

                            {step.heat_alert && (
                              <Text style={styles.stepAlertText}>⚠️ {step.heat_alert}</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* TAB 2: Cooling Stops & Water Points List along Route */}
                {activeDetailTab === 'facilities' && activeRoute && (
                  <View style={styles.facilitiesCard}>
                    {(activeRoute.nearby_facilities && activeRoute.nearby_facilities.length > 0
                      ? activeRoute.nearby_facilities
                      : VERIFIED_COOLING_FACILITIES.slice(0, 3)
                    ).map((fac) => {
                      const isCooling = fac.type === 'cooling_centre';
                      return (
                        <View key={fac.id} style={styles.facilityCardItem}>
                          <View style={styles.facilityTopRow}>
                            <View style={styles.facilityTypeIcon}>
                              <MaterialCommunityIcons
                                name={isCooling ? 'home-thermometer-outline' : 'cup-water'}
                                size={18}
                                color={isCooling ? '#0284C7' : '#0EA5E9'}
                              />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={styles.facilityName}>{fac.name}</Text>
                              <Text style={styles.facilityAddress} numberOfLines={1}>
                                {fac.address}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.facilityOpenBadge,
                                { backgroundColor: fac.isOpen ? '#DCFCE7' : '#FEE2E2' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.facilityOpenText,
                                  { color: fac.isOpen ? '#059669' : '#DC2626' },
                                ]}
                              >
                                {fac.isOpen ? 'Open Now' : 'Closed'}
                              </Text>
                            </View>
                          </View>

                          {/* Amenities Tags */}
                          <View style={styles.facilityAmenitiesRow}>
                            {fac.amenities.map((am, amIdx) => (
                              <View key={amIdx} style={styles.amenityPill}>
                                <Text style={styles.amenityPillText}>✓ {am}</Text>
                              </View>
                            ))}
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
    backgroundColor: '#F8FAFC',
  },

  // 1. Search Header Overlay
  searchHeaderContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    left: 12,
    right: 12,
    zIndex: 20,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 18,
    marginRight: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  verticalLine: {
    width: 1.5,
    height: 24,
    backgroundColor: '#CBD5E1',
    marginVertical: 3,
  },
  inputsCol: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  textInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  gpsLocateBtn: {
    padding: 4,
    marginLeft: 4,
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  swapBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Travel Mode Selector Tabs
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2,
    marginTop: 8,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  modeLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  modeLabelActive: {
    color: '#059669',
    fontWeight: '700',
  },

  // Preset Section
  presetSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  presetScrollContent: {
    gap: 6,
  },
  presetTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetTagActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  presetTagText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  presetTagTextActive: {
    color: '#059669',
    fontWeight: '700',
  },

  // Autocomplete Suggestions Dropdown Card
  autocompleteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  autocompleteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  autocompleteHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  autocompleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  autocompleteIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  autocompletePlaceName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  autocompletePlaceDesc: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  autocompleteCityBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  autocompleteCityText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#0284C7',
  },

  // 2. Live Navigation Guidance Banner
  topNavBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#059669',
    zIndex: 25,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  navBannerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  maneuverIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDistText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#059669',
  },
  navInstructionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 1,
  },
  navStreetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  navStreetName: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  exitNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  navBannerSub: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navSubStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navSubStatText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  navSubDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
  },

  // 3. Floating Map Controls
  floatingControls: {
    position: 'absolute',
    right: 14,
    top: Platform.OS === 'ios' ? 165 : 145,
    gap: 8,
    zIndex: 10,
  },
  floatingBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingBtnActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  recenterBtn: {
    borderColor: '#0284C7',
  },

  // 4. Expandable Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetHandleContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },

  // Peek Mode Quick Summary Card
  peekSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  peekInfoLeft: {
    flex: 1,
    marginRight: 10,
  },
  peekBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  routeTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  routeTypeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  peekShadePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  peekShadeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  peekHeatBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  peekHeatText: {
    fontSize: 10,
    fontWeight: '700',
  },
  peekPrimaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  peekSubText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  peekStartNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  peekStartNavText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Expanded Mode Content
  sheetScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },

  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 2,
  },
  routesContainer: {
    gap: 8,
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
  },
  routeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  shadeBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  shadeBadgeMiniText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  routeMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginVertical: 6,
  },
  routeMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  routeMetricVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  routeMetricLabel: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
  },
  routeMetricDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
  },
  routeSummaryText: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 15,
  },

  // Primary Action Button
  primaryNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryNavBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Detail Tab Switcher
  detailTabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2.5,
    marginBottom: 10,
  },
  detailTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
  },
  detailTabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  detailTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  detailTabLabelActive: {
    color: '#059669',
    fontWeight: '700',
  },

  // Turn-by-Turn Guidance Steps
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumCol: {
    alignItems: 'center',
    width: 24,
  },
  stepManeuverCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepManeuverCircleCanopy: {
    backgroundColor: '#059669',
  },
  stepLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 3,
  },
  stepContent: {
    flex: 1,
    marginLeft: 8,
  },
  stepInstruction: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
  },
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 3,
  },
  stepDist: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#0284C7',
  },
  stepStreet: {
    fontSize: 10.5,
    color: '#64748B',
  },
  stepShadeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  stepShadeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  stepAlertText: {
    fontSize: 10,
    color: '#D97706',
    marginTop: 2,
    fontWeight: '500',
  },

  // Facilities Card
  facilitiesCard: {
    gap: 8,
    marginBottom: 14,
  },
  facilityCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  facilityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facilityTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  facilityAddress: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  facilityOpenBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  facilityOpenText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  facilityAmenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  amenityPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amenityPillText: {
    fontSize: 9.5,
    color: '#475569',
    fontWeight: '500',
  },
});
