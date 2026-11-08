/**
 * HeatShield AI — Assistant Engine Re-Export & Adapter Binding
 */
import { mockDb } from './mockDb';
import { setAssistantMockDb } from '../../packages/core/assistantEngine';

setAssistantMockDb(mockDb);

export * from '../../packages/core/assistantEngine';
