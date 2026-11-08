/**
 * HEATSHIELD AI — SHARED CORE PACKAGE
 * Algorithmic engines, weather APIs, heat routing, emergency directories,
 * AI triage assistants, and notification pipelines shared across Web, Mobile & Server.
 */

// 1. Action Engine & Risk Engine
export * as actionEngine from './actionEngine';
export * from './actionEngine';

export * as riskEngine from './riskEngine';
export * from './riskEngine';

// 2. Weather & Environmental Telemetry
export * as weatherApi from './weatherApi';
export * from './weatherApi';

// 3. Heat-Safe Routing Service (OSRM, Shade, Waypoints)
export * as safeRoutingService from './safeRoutingService';
export * from './safeRoutingService';

// 4. Versioning & Mandatory Update Control
export * as versionService from './versionService';
export * from './versionService';

// 5. Emergency Contacts & First-Aid Guidelines
export * as emergencyContacts from './emergencyContacts';
export * from './emergencyContacts';

// 6. Cooling Centres & Public Water Access Directory
export * as coolingCentresData from './coolingCentresData';
export * from './coolingCentresData';

// 7. Assistance Requests & Citizen Relief Dispatch
export * as assistanceRequestsService from './assistanceRequestsService';
export * from './assistanceRequestsService';

// 8. Resident Notification Engine (Hourly SMS, Email, WhatsApp)
export * as notificationEngine from './notificationEngine';
export * from './notificationEngine';

// 9. Multilingual AI Assistant Engine (Hindi, Kannada, English)
export * as assistantEngine from './assistantEngine';
export * from './assistantEngine';

// 10. WhatsApp Messaging Gateway Client
export * as whatsappGateway from './whatsappGateway';
export * from './whatsappGateway';

// 11. Expo Push Notifications Dispatcher
export * as pushDispatcher from './notifications/pushDispatcher';
export * from './notifications/pushDispatcher';
