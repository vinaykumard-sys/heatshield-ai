/**
 * HeatShield AI — Assistance Requests Service Re-Export & Adapter Binding
 */
import { mockDb } from './mockDb';
import { setAssistanceMockDbAdapter } from '../../packages/core/assistanceRequestsService';

setAssistanceMockDbAdapter(mockDb);

export * from '../../packages/core/assistanceRequestsService';
