declare module 'react-native' {
  export const StyleSheet: any;
  export const Text: any;
  export const View: any;
  export const ScrollView: any;
  export type ScrollView = any;
  export type ScrollView = any;
  export const TouchableOpacity: any;
  export const Modal: any;
  export const FlatList: any;
  export const TextInput: any;
  export const ActivityIndicator: any;
  export const Linking: any;
  export const Alert: any;
  export const Switch: any;
  export const SafeAreaView: any;
  export const Platform: any;
  export const Image: any;
  export const Keyboard: any;
  export const KeyboardAvoidingView: any;
  export const Dimensions: any;
  export const Share: any;
  export const Pressable: any;
  export const Animated: any;
  export const PanResponder: any;
  export const useWindowDimensions: any;
  export const RefreshControl: any;
}

declare module 'expo-status-bar' {
  export const StatusBar: any;
}

declare module '@expo/vector-icons' {
  export const Ionicons: any;
  export const MaterialCommunityIcons: any;
  export const Feather: any;
  export const FontAwesome: any;
}

declare module 'lucide-react-native' {
  export const Shield: any;
  export const Sun: any;
  export const Thermometer: any;
  export const Droplets: any;
  export const Navigation: any;
  export const AlertTriangle: any;
  export const Heart: any;
  export const PhoneCall: any;
  export const Settings: any;
  export const User: any;
}

declare module 'expo-notifications' {
  export const AndroidImportance: {
    DEFAULT: number;
    HIGH: number;
    LOW: number;
    MAX: number;
    MIN: number;
    NONE: number;
    UNSPECIFIED: number;
  };
  export function setNotificationHandler(handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }): void;
  export function setNotificationChannelAsync(
    channelId: string,
    channel: any
  ): Promise<any>;
  export function getPermissionsAsync(): Promise<{ status: string; granted: boolean }>;
  export function requestPermissionsAsync(): Promise<{ status: string; granted: boolean }>;
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<{ data: string }>;
  export function addNotificationReceivedListener(listener: (event: any) => void): { remove: () => void };
  export function addNotificationResponseReceivedListener(listener: (response: any) => void): { remove: () => void };
  export function scheduleNotificationAsync(request: any): Promise<string>;
}

declare module 'expo-device' {
  export const isDevice: boolean;
  export const brand: string | null;
  export const manufacturer: string | null;
  export const modelName: string | null;
  export const deviceName: string | null;
  export const osName: string | null;
  export const osVersion: string | null;
}

declare module 'expo-constants' {
  const Constants: {
    expoConfig?: {
      extra?: {
        eas?: {
          projectId?: string;
        };
      };
      name?: string;
      slug?: string;
    };
    installationId?: string;
    [key: string]: any;
  };
  export default Constants;
}

declare module 'react-native-svg' {
  export const Svg: any;
  export const Path: any;
  export const Circle: any;
  export const Rect: any;
  export const Line: any;
  export const Polyline: any;
  export const Polygon: any;
  export const G: any;
  export const Text: any;
  export const TSpan: any;
  export const Defs: any;
  export const LinearGradient: any;
  export const RadialGradient: any;
  export const Stop: any;
  export const ClipPath: any;
  export const Pattern: any;
  export const Mask: any;
  export const Marker: any;
  export default Svg;
}

declare module '@heatshield/core' {
  export const processAssistantQuery: any;
  export const generateAssistantReply: any;
  export const SUGGESTED_PROMPTS: any;
  export interface AssistantResponse {
    [key: string]: any;
  }
  export interface AssistantContext {
    [key: string]: any;
  }
  export const fetchHeatSafeRoutes: any;
  export const PRESET_ROUTES: any;
  export const VERIFIED_COOLING_FACILITIES: any;
  export type HeatSafeRoute = any;
  export type RouteStep = any;
  export type RouteCheckpoint = any;
  export type PresetRoute = any;
  export const formatDistance: any;
  export const formatDuration: any;
}
