import { supabase, isSupabaseConfigured } from './supabase';
import { AssistanceRequest, RequestCategory, RequestPriority, RequestStatus } from '../types';
import { mockDb } from './mockDb';

export interface SubmitRequestPayload {
  category: RequestCategory;
  priority: RequestPriority;
  description: string;
  locationName: string;
  localityId?: string;
  contactName?: string;
  contactPhone?: string;
  userId?: string;
}

export interface SubmitRequestResult {
  success: boolean;
  request?: AssistanceRequest;
  error?: string;
  requestId?: string;
}

export interface StatusBadgeInfo {
  label: 'Submitted' | 'In Review' | 'Dispatched' | 'Resolved' | 'Cancelled';
  badgeClass: string;
  dotColor: string;
}

const STORAGE_KEY = 'heatshield_assistance_requests';

/**
 * Validates whether a string is a standard UUID v4
 */
function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

/**
 * Extracts embedded contact and dispatch metadata from a description string
 */
function parseRequestDescription(rawDescription: string): {
  cleanDescription: string;
  categoryOverride?: RequestCategory;
  parsedLocationName?: string;
  parsedContactName?: string;
  parsedContactPhone?: string;
} {
  let text = rawDescription || '';
  let categoryOverride: RequestCategory | undefined;

  if (text.includes('[Category: Medical Emergency Aid]')) {
    categoryOverride = 'medical';
    text = text.replace(/\[Category:\s*Medical Emergency Aid\]\s*/gi, '');
  }

  let parsedLocationName: string | undefined;
  let parsedContactName: string | undefined;
  let parsedContactPhone: string | undefined;

  const dispatchMarker = text.indexOf('[Dispatch Details]');
  if (dispatchMarker !== -1) {
    const metaBlock = text.slice(dispatchMarker);
    text = text.slice(0, dispatchMarker).trim();

    const locMatch = metaBlock.match(/(?:Landmark\s*\/\s*Location|Location)\s*:\s*([^\n\r]+)/i);
    if (locMatch) parsedLocationName = locMatch[1].trim();

    const contactMatch = metaBlock.match(/(?:Resident\s*\/\s*Contact|Contact)\s*:\s*([^\n\r]+)/i);
    if (contactMatch) parsedContactName = contactMatch[1].trim();

    const phoneMatch = metaBlock.match(/Phone\s*:\s*([^\n\r]+)/i);
    if (phoneMatch) parsedContactPhone = phoneMatch[1].trim();
  }

  return {
    cleanDescription: text.trim(),
    categoryOverride,
    parsedLocationName,
    parsedContactName,
    parsedContactPhone
  };
}

export class AssistanceRequestsService {
  /**
   * Human-friendly status display mapping
   * Standardizes legacy status keys ('open', 'assigned', 'in_progress') to HeatShield 2.0 UX standards:
   * 'Submitted' | 'In Review' | 'Dispatched' | 'Resolved' | 'Cancelled'
   */
  static getStatusDisplay(status: RequestStatus): StatusBadgeInfo {
    switch (status) {
      case 'resolved':
        return {
          label: 'Resolved',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dotColor: 'bg-emerald-500'
        };
      case 'dispatched':
      case 'in_progress':
        return {
          label: 'Dispatched',
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
          dotColor: 'bg-sky-500'
        };
      case 'in_review':
      case 'assigned':
        return {
          label: 'In Review',
          badgeClass: 'bg-blue-50 text-[#1E60F2] border-blue-200',
          dotColor: 'bg-blue-500'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
          dotColor: 'bg-slate-400'
        };
      case 'submitted':
      case 'open':
      default:
        return {
          label: 'Submitted',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          dotColor: 'bg-amber-500'
        };
    }
  }

  /**
   * Submit a new assistance request with honest error handling and cloud/local persistence.
   * Generates and returns a real Request ID ONLY upon successful persistence.
   */
  static async submitRequest(payload: SubmitRequestPayload): Promise<SubmitRequestResult> {
    // 1. Strict Validation
    if (!payload.category) {
      return {
        success: false,
        error: 'Please select a relief assistance category.'
      };
    }

    if (!payload.description || payload.description.trim().length < 5) {
      return {
        success: false,
        error: 'Please describe the required assistance (minimum 5 characters).'
      };
    }

    if (!payload.locationName || payload.locationName.trim().length < 3) {
      return {
        success: false,
        error: 'Please provide a valid location or landmark for dispatch (minimum 3 characters).'
      };
    }

    if (!payload.contactName || payload.contactName.trim().length < 2) {
      return {
        success: false,
        error: 'Please provide a contact or resident name (minimum 2 characters).'
      };
    }

    const cleanPhone = (payload.contactPhone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      return {
        success: false,
        error: 'Please provide a valid callback telephone or mobile number for responder coordination.'
      };
    }

    const nowIso = new Date().toISOString();
    // Deterministic UUID for database record
    const recordUuid = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');

    // Build rich, structured description embedding dispatch details
    const isMedical = payload.category === 'medical';
    const categoryTag = isMedical ? '[Category: Medical Emergency Aid]\n' : '';
    const formattedDescription = `${categoryTag}${payload.description.trim()}

[Dispatch Details]
Landmark / Location: ${payload.locationName.trim()}
Resident / Contact: ${payload.contactName.trim()}
Phone: ${payload.contactPhone?.trim() || ''}`;

    const localRequest: AssistanceRequest = {
      id: recordUuid,
      requested_by: payload.userId,
      locality_id: payload.localityId || 'loc-current',
      locality_name: payload.locationName.trim(),
      resident_name: payload.contactName.trim(),
      contact_phone: payload.contactPhone?.trim() || '',
      category: payload.category,
      priority: payload.priority || 'medium',
      description: payload.description.trim(),
      status: 'submitted',
      created_at: nowIso
    };

    // 2. Attempt Supabase live insert if client is active
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const activeUserId = sessionData?.session?.user?.id;

        // Resolve valid locality UUID from database if available
        let resolvedLocalityId: string | undefined = isValidUuid(payload.localityId) 
          ? payload.localityId 
          : undefined;

        if (!resolvedLocalityId) {
          const { data: locs, error: locErr } = await supabase
            .from('locations')
            .select('id, name, city')
            .limit(15);

          if (!locErr && locs && locs.length > 0) {
            const needle = payload.locationName.toLowerCase();
            const match = locs.find(l => 
              l.name.toLowerCase().includes(needle) || 
              needle.includes(l.name.toLowerCase()) ||
              (l.city && needle.includes(l.city.toLowerCase()))
            );
            resolvedLocalityId = match ? match.id : locs[0].id;
          }
        }

        // Database schema constraints:
        // status IN ('open', 'assigned', 'in_progress', 'resolved', 'cancelled')
        // category IN ('water', 'cooling', 'general_welfare', 'cooling_centre_transport', 'other')
        const dbCategory = isMedical ? 'other' : payload.category;

        const dbPayload: Record<string, any> = {
          id: recordUuid,
          category: dbCategory,
          priority: payload.priority || 'medium',
          description: formattedDescription,
          status: 'open',
          created_at: nowIso,
          updated_at: nowIso
        };

        // Attach foreign keys only if valid UUIDs
        if (activeUserId && isValidUuid(activeUserId)) {
          dbPayload.requested_by = activeUserId;
        } else if (payload.userId && isValidUuid(payload.userId)) {
          dbPayload.requested_by = payload.userId;
        } else {
          dbPayload.requested_by = null;
        }

        if (resolvedLocalityId && isValidUuid(resolvedLocalityId)) {
          dbPayload.locality_id = resolvedLocalityId;
        }

        const { data, error } = await supabase
          .from('assistance_requests')
          .insert(dbPayload)
          .select();

        if (error) {
          console.error('Supabase assistance_requests insert error:', error);
          // Return honest actionable error message — DO NOT falsely claim success
          return {
            success: false,
            error: `Database registration failed: ${error.message} ${error.hint ? `(${error.hint})` : ''}. Please sign in with an authenticated account or check network connection.`
          };
        }

        const returnedRow = data && data.length > 0 ? data[0] : null;
        const liveId = returnedRow?.id || recordUuid;

        const liveRequest: AssistanceRequest = {
          ...localRequest,
          id: liveId,
          status: 'submitted',
          created_at: returnedRow?.created_at || nowIso
        };

        // Persist to local cache for instant zero-latency UI updates
        mockDb.saveRequest(liveRequest);
        this.saveToLocalStorage(liveRequest);

        return {
          success: true,
          request: liveRequest,
          requestId: liveId
        };
      } catch (err: any) {
        console.error('Assistance request submission exception:', err);
        return {
          success: false,
          error: `Network or service error: ${err.message || 'Could not communicate with HeatShield relief database.'}`
        };
      }
    }

    // 3. Resilient Local Database Mode (Active when Supabase is not configured)
    try {
      mockDb.saveRequest(localRequest);
      this.saveToLocalStorage(localRequest);

      return {
        success: true,
        request: localRequest,
        requestId: localRequest.id
      };
    } catch (storageErr: any) {
      return {
        success: false,
        error: storageErr.message || 'Storage error: Could not save your assistance request to device.'
      };
    }
  }

  /**
   * Get all active and resolved requests (merging cloud & local, deduplicated by ID)
   */
  static async getAllRequests(): Promise<AssistanceRequest[]> {
    const localRequests = this.getFromLocalStorage();
    const mockList = mockDb.getRequests();

    // Map to deduplicate by ID
    const map = new Map<string, AssistanceRequest>();

    // Seed with mock and local cache
    mockList.forEach(r => map.set(r.id, r));
    localRequests.forEach(r => map.set(r.id, r));

    // Fetch from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assistance_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          data.forEach((d: any) => {
            const parsed = parseRequestDescription(d.description || '');

            // Standardize database status to UX lifecycle status
            let uxStatus: RequestStatus = 'submitted';
            if (d.status === 'resolved') uxStatus = 'resolved';
            else if (d.status === 'in_progress' || d.status === 'dispatched') uxStatus = 'dispatched';
            else if (d.status === 'assigned' || d.status === 'in_review') uxStatus = 'in_review';
            else if (d.status === 'cancelled') uxStatus = 'cancelled';
            else uxStatus = 'submitted';

            const resolvedCategory = parsed.categoryOverride || d.category || 'water';

            // Check if local cache has extra fields like assigned volunteer name or resident name
            const existing = map.get(d.id);

            map.set(d.id, {
              id: d.id,
              requested_by: d.requested_by,
              locality_id: d.locality_id,
              locality_name: parsed.parsedLocationName || existing?.locality_name || 'Designated Community Sector',
              resident_name: parsed.parsedContactName || existing?.resident_name || 'Community Resident',
              contact_phone: parsed.parsedContactPhone || existing?.contact_phone || '',
              category: resolvedCategory,
              priority: d.priority || 'medium',
              description: parsed.cleanDescription || d.description || '',
              status: uxStatus,
              assigned_volunteer_name: existing?.assigned_volunteer_name,
              assigned_volunteer_id: d.assigned_volunteer_id,
              resolution_notes: d.resolution_notes || existing?.resolution_notes,
              resolved_at: d.resolved_at || existing?.resolved_at,
              created_at: d.created_at
            });
          });
        } else if (error) {
          console.warn('Could not fetch cloud assistance requests:', error.message);
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
   * Update request status (e.g. submitted -> in_review -> dispatched -> resolved | cancelled)
   */
  static async updateStatus(
    id: string,
    status: RequestStatus,
    resolutionNotes?: string,
    volunteerName?: string
  ): Promise<{ success: boolean; error?: string }> {
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

    // 2. Map UX status to Supabase enum ('open', 'assigned', 'in_progress', 'resolved', 'cancelled')
    let dbStatus = 'open';
    if (status === 'resolved') dbStatus = 'resolved';
    else if (status === 'dispatched' || status === 'in_progress') dbStatus = 'in_progress';
    else if (status === 'in_review' || status === 'assigned') dbStatus = 'assigned';
    else if (status === 'cancelled') dbStatus = 'cancelled';
    else dbStatus = 'open';

    // 3. Sync to Supabase if connected
    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: Record<string, any> = {
          status: dbStatus,
          updated_at: nowIso
        };
        if (resolutionNotes) {
          updatePayload.resolution_notes = resolutionNotes;
        }
        if (status === 'resolved') {
          updatePayload.resolved_at = nowIso;
        }

        const { error } = await supabase
          .from('assistance_requests')
          .update(updatePayload)
          .eq('id', id);

        if (error) {
          console.warn('Supabase status update warning:', error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.warn('Cloud status update error:', e);
        return { success: false, error: e.message || 'Cloud update failed' };
      }
    }

    return { success: true };
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
