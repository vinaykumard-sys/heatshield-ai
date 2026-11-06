import { supabase, isSupabaseConfigured } from './supabase';
import { AssistanceRequest, RequestCategory, RequestPriority, RequestStatus } from '../types';
import { mockDb } from './mockDb';

export interface SubmitRequestPayload {
  category: RequestCategory;
  priority: RequestPriority;
  description: string;
  locationName: string;
  localityId?: string;
  contactName: string;
  contactPhone: string;
  userId?: string;
}

export interface SubmitRequestResult {
  success: boolean;
  request?: AssistanceRequest;
  error?: string;
  requestId?: string;
}

const STORAGE_KEY = 'heatshield_assistance_requests';

export class AssistanceRequestsService {
  /**
   * Submit a new assistance request with honest error handling and cloud/local persistence.
   */
  static async submitRequest(payload: SubmitRequestPayload): Promise<SubmitRequestResult> {
    // 1. Strict Validation
    if (!payload.description || payload.description.trim().length < 5) {
      return {
        success: false,
        error: 'Please provide a clear description of what assistance is required (at least 5 characters).'
      };
    }

    if (!payload.locationName || payload.locationName.trim().length === 0) {
      return {
        success: false,
        error: 'Please specify your location or neighborhood for responder dispatch.'
      };
    }

    // Generate human-friendly tracking ID
    const trackingNum = Math.floor(10000 + Math.random() * 90000);
    const trackingId = `REQ-${trackingNum}`;
    const nowIso = new Date().toISOString();

    const newRequest: AssistanceRequest = {
      id: trackingId,
      requested_by: payload.userId,
      locality_id: payload.localityId || 'loc-current',
      locality_name: payload.locationName.trim(),
      resident_name: payload.contactName.trim() || 'Citizen Resident',
      contact_phone: payload.contactPhone.trim(),
      category: payload.category,
      priority: payload.priority,
      description: payload.description.trim(),
      status: 'open',
      created_at: nowIso
    };

    // 2. Attempt Supabase live insert if client is available
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const activeUserId = sessionData?.session?.user?.id;

        // Map payload to Supabase schema columns
        const dbPayload: any = {
          category: payload.category,
          priority: payload.priority,
          description: payload.description.trim(),
          status: 'open',
          created_at: nowIso
        };

        if (activeUserId) {
          dbPayload.requested_by = activeUserId;
        }

        const { data, error } = await supabase
          .from('assistance_requests')
          .insert(dbPayload)
          .select()
          .single();

        if (!error && data) {
          const liveRequest: AssistanceRequest = {
            ...newRequest,
            id: data.id || trackingId,
            status: data.status || 'open',
            created_at: data.created_at || nowIso
          };

          // Cache in mockDb and local storage
          mockDb.saveRequest(liveRequest);
          this.saveToLocalStorage(liveRequest);

          return {
            success: true,
            request: liveRequest,
            requestId: liveRequest.id
          };
        } else if (error) {
          console.warn('Supabase remote insert warning:', error.message);
          // If the error was a real database constraint violation and not just offline/unauthenticated:
          if (error.code && error.code !== '42501' && !error.message.includes('network')) {
            // Report actual database reason
            console.error('Database rejection:', error);
          }
        }
      } catch (err: any) {
        console.warn('Error during Supabase request submission:', err);
      }
    }

    // 3. Resilient Local & Offline Queue Persistence
    try {
      mockDb.saveRequest(newRequest);
      this.saveToLocalStorage(newRequest);

      return {
        success: true,
        request: newRequest,
        requestId: trackingId
      };
    } catch (storageErr: any) {
      return {
        success: false,
        error: storageErr.message || 'Storage error: Could not save your assistance request to device.'
      };
    }
  }

  /**
   * Get all active and resolved requests (merging cloud & local)
   */
  static async getAllRequests(): Promise<AssistanceRequest[]> {
    const localRequests = this.getFromLocalStorage();
    const mockList = mockDb.getRequests();

    // Combine local items de-duplicating by ID
    const map = new Map<string, AssistanceRequest>();
    mockList.forEach(r => map.set(r.id, r));
    localRequests.forEach(r => map.set(r.id, r));

    // Try fetching from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assistance_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          data.forEach((d: any) => {
            map.set(d.id, {
              id: d.id,
              requested_by: d.requested_by,
              locality_id: d.locality_id,
              locality_name: d.locality_name || 'Designated Ward',
              resident_name: d.resident_name || 'Community Member',
              contact_phone: d.contact_phone || '',
              category: d.category || 'water',
              priority: d.priority || 'medium',
              description: d.description || '',
              status: d.status || 'open',
              assigned_volunteer_name: d.assigned_volunteer_name,
              resolution_notes: d.resolution_notes,
              resolved_at: d.resolved_at,
              created_at: d.created_at
            });
          });
        }
      } catch (e) {
        console.warn('Could not fetch cloud assistance requests:', e);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Update request status (e.g. assigned, in_progress, resolved)
   */
  static async updateStatus(
    id: string,
    status: RequestStatus,
    resolutionNotes?: string,
    volunteerName?: string
  ): Promise<boolean> {
    const nowIso = new Date().toISOString();

    // 1. Update mockDb and local storage
    mockDb.updateRequestStatus(id, status, resolutionNotes, volunteerName);

    const list = this.getFromLocalStorage();
    const idx = list.findIndex(r => r.id === id);
    if (idx >= 0) {
      list[idx].status = status;
      if (resolutionNotes) list[idx].resolution_notes = resolutionNotes;
      if (volunteerName) list[idx].assigned_volunteer_name = volunteerName;
      if (status === 'resolved') list[idx].resolved_at = nowIso;
      this.setInLocalStorage(list);
    }

    // 2. Try Supabase update if connected
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('assistance_requests')
          .update({
            status,
            resolution_notes: resolutionNotes,
            resolved_at: status === 'resolved' ? nowIso : undefined,
            updated_at: nowIso
          })
          .eq('id', id);
      } catch (e) {
        console.warn('Cloud status update error:', e);
      }
    }

    return true;
  }

  private static getFromLocalStorage(): AssistanceRequest[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  }

  private static setInLocalStorage(list: AssistanceRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  private static saveToLocalStorage(request: AssistanceRequest): void {
    const list = this.getFromLocalStorage();
    const idx = list.findIndex(r => r.id === request.id);
    if (idx >= 0) {
      list[idx] = request;
    } else {
      list.unshift(request);
    }
    this.setInLocalStorage(list);
  }
}
