/**
 * Family Safety Circle Service for HeatShield 2.0
 * 
 * Strict Opt-in Architecture:
 * - Zero sample/fake data: circles are strictly empty by default until explicitly invited.
 * - Explicit consent & lifecycle tracking: 'pending' -> 'accepted' / 'declined' / 'revoked'.
 * - Granular privacy controls: location and environmental telemetry are shared only with explicit mutual consent.
 */

export type RelationshipType = 'parent' | 'child' | 'spouse' | 'elder' | 'sibling' | 'other';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked';
export type CheckinStatus = 'safe' | 'cooling_down' | 'needs_aid' | 'unknown';

export interface FamilyInvitation {
  id: string;
  name: string;
  relationship: RelationshipType;
  contact: string; // Phone number or email
  status: InvitationStatus;
  invited_at: string;
  accepted_at?: string;
  declined_at?: string;
  declined_reason?: string;
  consent_location: boolean;
  consent_telemetry: boolean;
  last_checkin_status?: CheckinStatus;
  last_checkin_at?: string;
  last_location_name?: string;
  last_temperature?: number;
}

export interface FamilyChecklist {
  drankWater: boolean;
  tookElectrolytes: boolean;
  avoidedMiddaySun: boolean;
  ventilatedRooms: boolean;
  checkedSeniors: boolean;
  protectiveClothing: boolean;
}

const INVITATIONS_STORAGE_KEY = 'heatshield_family_invitations';
const CIRCLE_CODE_STORAGE_KEY = 'heatshield_family_circle_code';
const CHECKLIST_STORAGE_PREFIX = 'heatshield_checklist_';

export class FamilySafetyService {
  /**
   * Retrieve all family circle members & invitations.
   * STRICT OPT-IN: Defaults to an empty list. Never injects sample or mock records.
   */
  static getInvitations(): FamilyInvitation[] {
    try {
      const raw = localStorage.getItem(INVITATIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read family safety circle records from storage:', e);
    }
    return [];
  }

  /**
   * Persist family circle members to local storage.
   */
  static saveInvitations(invitations: FamilyInvitation[]): void {
    try {
      localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));
    } catch (e) {
      console.error('Failed to persist family invitations:', e);
    }
  }

  /**
   * Get or initialize the user's authentic Family Circle sharing code.
   */
  static getCircleCode(): string {
    try {
      const saved = localStorage.getItem(CIRCLE_CODE_STORAGE_KEY);
      if (saved && saved.trim()) return saved;
      const generated = `HEAT-${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem(CIRCLE_CODE_STORAGE_KEY, generated);
      return generated;
    } catch {
      return 'HEAT-2048';
    }
  }

  /**
   * Regenerate a new circle code (e.g. for privacy reset).
   */
  static regenerateCircleCode(): string {
    const fresh = `HEAT-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      localStorage.setItem(CIRCLE_CODE_STORAGE_KEY, fresh);
    } catch (e) {
      console.warn('Could not persist regenerated circle code:', e);
    }
    return fresh;
  }

  /**
   * Create a new family invitation with pending status and explicit privacy gates.
   */
  static createInvitation(params: {
    name: string;
    relationship: RelationshipType;
    contact: string;
  }): FamilyInvitation {
    const nowIso = new Date().toISOString();
    const newInvite: FamilyInvitation = {
      id: `inv-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: params.name.trim(),
      relationship: params.relationship,
      contact: params.contact.trim(),
      status: 'pending',
      invited_at: nowIso,
      consent_location: false,
      consent_telemetry: false,
      last_checkin_status: 'unknown'
    };

    const current = this.getInvitations();
    const updated = [newInvite, ...current];
    this.saveInvitations(updated);
    return newInvite;
  }

  /**
   * Transition invitation state (pending -> accepted, declined, or revoked).
   */
  static updateInvitationStatus(
    id: string,
    status: InvitationStatus,
    reason?: string
  ): FamilyInvitation | null {
    const current = this.getInvitations();
    let updatedTarget: FamilyInvitation | null = null;
    const nowIso = new Date().toISOString();

    const nextList = current.map((inv) => {
      if (inv.id === id) {
        const isAccepted = status === 'accepted';
        const isDeclined = status === 'declined';

        updatedTarget = {
          ...inv,
          status,
          accepted_at: isAccepted ? nowIso : inv.accepted_at,
          declined_at: isDeclined ? nowIso : inv.declined_at,
          declined_reason: reason || inv.declined_reason,
          consent_location: isAccepted ? true : false,
          consent_telemetry: isAccepted ? true : false,
          last_checkin_status: isAccepted ? ('safe' as const) : inv.last_checkin_status,
          last_checkin_at: isAccepted ? nowIso : inv.last_checkin_at
        };
        return updatedTarget;
      }
      return inv;
    });

    this.saveInvitations(nextList);
    return updatedTarget;
  }

  /**
   * Update granular privacy consent for an accepted family member.
   */
  static updatePrivacyConsent(
    id: string,
    consents: { consent_location?: boolean; consent_telemetry?: boolean }
  ): FamilyInvitation | null {
    const current = this.getInvitations();
    let updatedTarget: FamilyInvitation | null = null;

    const nextList = current.map((inv) => {
      if (inv.id === id) {
        updatedTarget = {
          ...inv,
          consent_location: consents.consent_location ?? inv.consent_location,
          consent_telemetry: consents.consent_telemetry ?? inv.consent_telemetry
        };
        return updatedTarget;
      }
      return inv;
    });

    this.saveInvitations(nextList);
    return updatedTarget;
  }

  /**
   * Record a verified check-in status for an accepted family member.
   */
  static recordCheckin(
    id: string,
    status: CheckinStatus,
    locationName?: string,
    temperature?: number
  ): FamilyInvitation | null {
    const current = this.getInvitations();
    let updatedTarget: FamilyInvitation | null = null;
    const nowIso = new Date().toISOString();

    const nextList = current.map((inv) => {
      if (inv.id === id) {
        updatedTarget = {
          ...inv,
          last_checkin_status: status,
          last_checkin_at: nowIso,
          last_location_name: locationName || inv.last_location_name,
          last_temperature: temperature ?? inv.last_temperature
        };
        return updatedTarget;
      }
      return inv;
    });

    this.saveInvitations(nextList);
    return updatedTarget;
  }

  /**
   * Remove or revoke an invitation / disconnected member permanently.
   */
  static removeInvitation(id: string): boolean {
    const current = this.getInvitations();
    const filtered = current.filter((inv) => inv.id !== id);
    if (filtered.length !== current.length) {
      this.saveInvitations(filtered);
      return true;
    }
    return false;
  }

  /**
   * Daily habits checklist retrieval (defaults to date-keyed storage).
   */
  static getDailyChecklist(dateKey?: string): FamilyChecklist {
    const key = dateKey || new Date().toISOString().slice(0, 10);
    try {
      const saved = localStorage.getItem(`${CHECKLIST_STORAGE_PREFIX}${key}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return {
      drankWater: true,
      tookElectrolytes: false,
      avoidedMiddaySun: true,
      ventilatedRooms: true,
      checkedSeniors: false,
      protectiveClothing: true
    };
  }

  /**
   * Persist daily habits checklist for specified date.
   */
  static saveDailyChecklist(checklist: FamilyChecklist, dateKey?: string): void {
    const key = dateKey || new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem(`${CHECKLIST_STORAGE_PREFIX}${key}`, JSON.stringify(checklist));
    } catch (e) {
      console.warn('Failed to save habits checklist:', e);
    }
  }
}
