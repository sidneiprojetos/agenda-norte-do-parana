export type NoteCategory = 'Reunião' | 'Pub' | 'Evento' | 'Ação Social' | 'Geral';

export const CATEGORIES: NoteCategory[] = ['Reunião', 'Pub', 'Evento', 'Ação Social', 'Geral'];

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string; // ISO date format YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  category?: NoteCategory;
  priority?: 'normal' | 'alta';
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  createdBy: string;
  authorEmail?: string;
  authorName?: string;
  authorPhoto?: string;
  authorId?: string;
}

export type UserRole = 'admin' | 'member';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string; // ISO string
  lastLogin?: string; // ISO string
  approvedAt?: string; // ISO string
  approvedBy?: string; // email of approver
  division?: string; // e.g. 'Londrina', 'Maringá', 'Apucarana'
  notes?: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  role: UserRole;
  status: UserStatus;
  division?: string;
}

export interface DayInfo {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasNotes: boolean;
  notesCount: number;
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'reset'
  | 'approve'
  | 'reject'
  | 'block'
  | 'user_update'
  | 'user_delete';

export type AuditEntityType = 'note' | 'user' | 'auth' | 'data';

export interface AuditActor {
  uid?: string | null;
  name?: string | null;
  email?: string | null;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityTitle?: string | null;
  actorUid?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  details?: string | null;
  timestamp: string; // ISO string
}
