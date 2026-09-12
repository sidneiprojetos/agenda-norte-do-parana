import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Note, NoteCategory, AppUser, UserProfile, Division } from './types';
import { INITIAL_NOTES } from './data/initialNotes';
import { INITIAL_DIVISIONS } from './data/initialDivisions';
import { Calendar } from './components/Calendar';
import { NoteForm } from './components/NoteForm';
import { AdminHeader } from './components/AdminHeader';
import { ViewNoteModal } from './components/ViewNoteModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { RejectedScreen } from './components/RejectedScreen';
import { UserManagementDashboard } from './components/UserManagementDashboard';
import { ReportsModal } from './components/ReportsModal';
import { ViewScheduleScreen } from './components/ViewScheduleScreen';
import { DayEventsModal } from './components/DayEventsModal';
import { AuditDashboard } from './components/AuditDashboard';
import { DivisionManagerModal } from './components/DivisionManagerModal';
import { ToastContainer, ToastData, ToastType } from './components/Toast';
import { formatDateToISO } from './utils/dateUtils';
import { auth, isUserAdmin, ADMIN_EMAIL } from './firebase';
import {
  subscribeToNotes,
  createFirestoreNote,
  updateFirestoreNote,
  deleteFirestoreNote
} from './services/notesService';
import { subscribeToDivisions } from './services/divisionService';
import { logAuditEntry } from './services/auditService';
import {
  syncUserProfile,
  subscribeToUserProfile,
  subscribeToAllUsers
} from './services/userService';

// Lazy-load the login screen: large standalone asset, only fetched when not authenticated
const LoginScreen = lazy(() =>
  import('./components/LoginScreen').then((m) => ({ default: m.LoginScreen }))
);

export default function App() {
  // Authentication states
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Admin User Management dashboard view toggle
  const [isViewingUserManagement, setIsViewingUserManagement] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isViewingSchedule, setIsViewingSchedule] = useState(false);
  const [isViewingAudit, setIsViewingAudit] = useState(false);
  const [isDivisionManagerOpen, setIsDivisionManagerOpen] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  // Notes state synchronized from Firebase Firestore
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);

  // Divisions available for notes (admin-managed, synchronized realtime)
  const [divisionOptions, setDivisionOptions] = useState<string[]>(INITIAL_DIVISIONS);
  const [divisionList, setDivisionList] = useState<Division[]>([]);

  // Calendar month view (defaults to today)
  const [viewDate, setViewDate] = useState<Date>(() => new Date());

  // Selected date (starts today)
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateToISO(new Date()));

  // Currently editing note
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Modal states for Read & Delete operations
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [dayEventsDate, setDayEventsDate] = useState<string | null>(null);
  const [isDayEventsOpen, setIsDayEventsOpen] = useState(false);

  // Notification toasts with type (success/error/info)
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showNotification = useCallback((msg: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message: msg, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Safety watchdog: ensure authLoading is never stuck permanently
  useEffect(() => {
    const watchdog = setTimeout(() => {
      setAuthLoading(false);
    }, 2500);
    return () => clearTimeout(watchdog);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (fbUser) => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (fbUser) {
        try {
          // Sync or create user profile in Firestore
          const profile = await syncUserProfile(fbUser);
          setUserProfile(profile);

          const isAdmin = isUserAdmin(fbUser.email) || profile.role === 'admin';
          const appUser: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: profile.displayName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Membro',
            photoURL: fbUser.photoURL,
            isAdmin,
            role: profile.role,
            status: profile.status,
            division: profile.division
          };
          setCurrentUser(appUser);

          // Audit: log user access to the system
          logAuditEntry({
            action: 'login',
            entityType: 'auth',
            actorUid: fbUser.uid,
            actorName: profile.displayName || fbUser.displayName || undefined,
            actorEmail: profile.email || fbUser.email || undefined,
            details: isAdmin ? 'Acesso ao sistema (ADM)' : 'Acesso ao sistema'
          });

          // Real-time listener for profile updates (so if admin approves in real-time, user unlocks immediately)
          profileUnsub = await subscribeToUserProfile(fbUser.uid, (updated) => {
            if (updated) {
              setUserProfile(updated);
              const isStillAdmin = isUserAdmin(updated.email) || updated.role === 'admin';
              setCurrentUser({
                uid: updated.uid,
                email: updated.email,
                displayName: updated.displayName,
                photoURL: updated.photoURL,
                isAdmin: isStillAdmin,
                role: updated.role,
                status: updated.status,
                division: updated.division
              });
            }
          });
        } catch (e) {
          console.error('Error syncing user on auth state change:', e);
        } finally {
          setAuthLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsViewingUserManagement(false);
        setAuthLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  // For Admin: subscribe to user list to update pending count badge in real time
  useEffect(() => {
    if (currentUser?.isAdmin) {
      let cancelled = false;
      let unsubUsers: (() => void) | null = null;
      subscribeToAllUsers((userList) => {
        const pending = userList.filter((u) => u.status === 'pending').length;
        setPendingUsersCount(pending);
      }).then((unsub) => {
        if (cancelled) {
          unsub();
          return;
        }
        unsubUsers = unsub;
      });
      return () => {
        cancelled = true;
        if (unsubUsers) unsubUsers();
      };
    }
  }, [currentUser?.isAdmin]);

  // Listen to Firestore real-time updates for notes (only when approved or admin)
  useEffect(() => {
    const isApprovedOrAdmin = currentUser?.isAdmin || userProfile?.status === 'approved';
    if (!currentUser || !isApprovedOrAdmin) {
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    subscribeToNotes((firestoreNotes) => {
      setNotes(firestoreNotes);
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.isAdmin, userProfile?.status]);

  // Listen to Firestore real-time updates for divisions (when approved or admin)
  useEffect(() => {
    const isApprovedOrAdmin = currentUser?.isAdmin || userProfile?.status === 'approved';
    if (!currentUser || !isApprovedOrAdmin) {
      return;
    }

    let cancelled = false;
    let unsubscribeDivisions: (() => void) | null = null;
    subscribeToDivisions((firestoreDivisions) => {
      setDivisionList(firestoreDivisions);
      setDivisionOptions(
        firestoreDivisions.map((div) => div.name).filter((name): name is string => Boolean(name))
      );
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribeDivisions = unsub;
    });

    return () => {
      cancelled = true;
      if (unsubscribeDivisions) unsubscribeDivisions();
    };
  }, [currentUser?.isAdmin, userProfile?.status]);

  const handleRefreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      const profile = await syncUserProfile(auth.currentUser);
      setUserProfile(profile);
    }
  }, []);

  // Open a note's details and register the access in the audit log
  const handleViewNote = useCallback(
    (note: Note) => {
      setViewingNote(note);
      logAuditEntry({
        action: 'view',
        entityType: 'note',
        entityId: note.id,
        entityTitle: note.title,
        actorUid: currentUser?.uid,
        actorName: currentUser?.displayName,
        actorEmail: currentUser?.email,
        details: 'Visualizou os detalhes da anotação'
      });
    },
    [currentUser]
  );

  // Mutually exclusive full-screen views (User Management / Audit / Schedule)
  const handleToggleUserManagement = useCallback(() => {
    setIsViewingSchedule(false);
    setIsViewingAudit(false);
    setIsViewingUserManagement((prev) => !prev);
  }, []);

  const handleToggleAudit = useCallback(() => {
    setIsViewingSchedule(false);
    setIsViewingUserManagement(false);
    setIsViewingAudit((prev) => !prev);
  }, []);

  const handleToggleSchedule = useCallback(() => {
    setIsViewingAudit(false);
    setIsViewingUserManagement(false);
    setIsViewingSchedule((prev) => !prev);
  }, []);

  // Calendar navigation
  const handleChangeMonth = useCallback((increment: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + increment, 1));
  }, []);

  const handleChangeYear = useCallback((increment: number) => {
    setViewDate((prev) => new Date(prev.getFullYear() + increment, prev.getMonth(), 1));
  }, []);

  const handleGoToToday = useCallback(() => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const todayISO = formatDateToISO(today);
    setSelectedDate(todayISO);
  }, []);

  const handleSelectDate = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    const notesForDate = notes.filter((note) => note.date === dateStr);
    if (notesForDate.length > 0) {
      setDayEventsDate(dateStr);
      setIsDayEventsOpen(true);
    }
  }, [notes]);

  // CRUD - Create & Update with Firebase
  const handleSaveNote = useCallback(async (data: {
    title: string;
    content: string;
    date: string;
    time?: string;
    location?: string;
    category?: NoteCategory;
    priority?: 'normal' | 'alta';
    division?: string;
  }) => {
    const userEmail = currentUser?.email || ADMIN_EMAIL;
    const userName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Sidnei (ADM)');
    const userPhoto = currentUser?.photoURL || undefined;
    const userId = currentUser?.uid || 'admin-default';

    if (editingNote) {
      const previousNote = editingNote;
      // Optimistic update in UI
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? {
                ...n,
                title: data.title,
                content: data.content,
                date: data.date,
                time: data.time,
                location: data.location,
                category: data.category || n.category,
                priority: data.priority || n.priority || 'normal',
                division: data.division || n.division,
                updatedAt: new Date().toISOString()
              }
            : n
        )
      );
      // UPDATE in Firestore
      try {
        await updateFirestoreNote(
          editingNote.id,
          {
            title: data.title,
            content: data.content,
            date: data.date,
            time: data.time,
            location: data.location,
            category: data.category || editingNote.category,
            priority: data.priority || editingNote.priority || 'normal',
            division: data.division || editingNote.division,
            updatedAt: new Date().toISOString()
          },
          {
            title: data.title,
            actor: { uid: userId, name: userName, email: userEmail },
            details: 'Editou a anotação'
          }
        );
      } catch (error) {
        setNotes((prev) => prev.map((note) => (note.id === previousNote.id ? previousNote : note)));
        showNotification('Não foi possível salvar a alteração no Firebase.', 'error');
        throw error;
      }
      setEditingNote(null);
      showNotification(`Anotação "${data.title}" atualizada com sucesso!`);
    } else {
      // Optimistic create in UI
      const tempId = 'note-' + Date.now();
      const optimisticNote: Note = {
        id: tempId,
        title: data.title,
        content: data.content,
        date: data.date,
        time: data.time,
        location: data.location,
        category: data.category || 'Geral',
        priority: data.priority || 'normal',
        division: data.division || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userEmail,
        authorEmail: userEmail,
        authorName: userName,
        authorPhoto: userPhoto,
        authorId: userId
      };
      setNotes((prev) => [optimisticNote, ...prev]);

      // CREATE in Firestore
      let realId: string;
      try {
        realId = await createFirestoreNote(
          {
            title: data.title,
            content: data.content,
            date: data.date,
            time: data.time,
            location: data.location,
            category: data.category || 'Geral',
            priority: data.priority || 'normal',
            division: data.division || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userEmail,
            authorEmail: userEmail,
            authorName: userName,
            authorPhoto: userPhoto,
            authorId: userId
          },
          {
            actor: { uid: userId, name: userName, email: userEmail },
            details: 'Criou uma nova anotação'
          }
        );
      } catch (error) {
        setNotes((prev) => prev.filter((note) => note.id !== tempId));
        showNotification('Não foi possível publicar a anotação no Firebase.', 'error');
        throw error;
      }

      // Update with real Firestore ID
      setNotes((prev) => prev.map((n) => (n.id === tempId ? { ...n, id: realId } : n)));
      showNotification(`Anotação "${data.title}" publicada online!`);
    }
  }, [currentUser, editingNote, showNotification]);

  // CRUD - Delete with Firebase
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingNote) return;
    const title = deletingNote.title;
    const targetId = deletingNote.id;

    // Optimistic delete in UI
    setNotes((prev) => prev.filter((n) => n.id !== targetId));
    if (editingNote?.id === targetId) {
      setEditingNote(null);
    }
    if (viewingNote?.id === targetId) {
      setViewingNote(null);
    }
    setDeletingNote(null);

    try {
      await deleteFirestoreNote(targetId, {
        title,
        actor: {
          uid: currentUser?.uid,
          name: currentUser?.displayName,
          email: currentUser?.email
        },
        details: 'Excluiu a anotação'
      });
      showNotification(`Anotação "${title}" excluída com sucesso!`);
    } catch {
      showNotification('Anotação removida da visualização.', 'error');
    }
  }, [deletingNote, editingNote, viewingNote, showNotification, currentUser]);

  // CRUD - Start Edit
  const handleStartEdit = useCallback((note: Note) => {
    setViewingNote(null);
    setEditingNote(note);
    setSelectedDate(note.date);
    document.getElementById('note-form-container')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, []);

  // Admin: Export backup
  const handleExportData = useCallback(() => {
    try {
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `backup_agenda_firebase_${formatDateToISO(new Date())}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification('Backup da agenda exportado com sucesso!');
      logAuditEntry({
        action: 'export',
        entityType: 'data',
        actorUid: currentUser?.uid,
        actorName: currentUser?.displayName,
        actorEmail: currentUser?.email,
        details: `Exportou backup com ${notes.length} anotações`
      });
    } catch (e) {
      showNotification('Erro ao exportar backup da agenda.', 'error');
    }
  }, [notes, showNotification, currentUser]);

  // Admin: Import backup to Firestore
  const handleImportData = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          showNotification(`Importando ${parsed.length} anotações para o Firebase...`, 'info');
          for (const item of parsed) {
            if (item.title && item.date) {
              await createFirestoreNote({
                title: item.title,
                content: item.content || '',
                date: item.date,
                time: item.time,
                location: item.location,
                category: item.category || 'Geral',
                priority: item.priority || 'normal',
                division: item.division || undefined,
                createdAt: item.createdAt || new Date().toISOString(),
                createdBy: item.createdBy || currentUser?.email || ADMIN_EMAIL,
                authorEmail: item.authorEmail || item.createdBy || currentUser?.email || ADMIN_EMAIL,
                authorName: item.authorName || undefined,
                authorId: currentUser?.uid || undefined
              });
            }
          }
          showNotification(`${parsed.length} anotações importadas com sucesso!`);
          logAuditEntry({
            action: 'import',
            entityType: 'data',
            actorUid: currentUser?.uid,
            actorName: currentUser?.displayName,
            actorEmail: currentUser?.email,
            details: `Importou backup com ${parsed.length} anotações`
          });
        } else {
          showNotification('Formato de arquivo inválido. Deve ser um array de anotações.', 'error');
        }
      } catch (err) {
        showNotification('Erro ao ler arquivo JSON.', 'error');
      }
    };
    reader.readAsText(file);
  }, [currentUser, showNotification]);

  // Admin: Reset to default in Firestore
  const handleResetData = useCallback(async () => {
    if (
      window.confirm(
        'Deseja restaurar as anotações padrão no Firebase? Isso adicionará os registros iniciais.'
      )
    ) {
      for (const note of INITIAL_NOTES) {
        await createFirestoreNote({
          ...note,
          authorEmail: ADMIN_EMAIL,
          authorName: 'Sidnei (ADM)',
          authorId: 'admin-seed'
        });
      }
      showNotification('Anotações padrão reinseridas no Firebase!');
      logAuditEntry({
        action: 'reset',
        entityType: 'data',
        actorUid: currentUser?.uid,
        actorName: currentUser?.displayName,
        actorEmail: currentUser?.email,
        details: `Restaurou ${INITIAL_NOTES.length} anotações padrão`
      });
    }
  }, [showNotification, currentUser]);

  const handleOpenCreateForm = useCallback(() => {
    setEditingNote(null);
    document.getElementById('note-title-input')?.focus();
    document.getElementById('note-form-container')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, []);

  // If still checking authentication state, show branded loading splash
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#09090b] text-zinc-100 p-4 font-sans text-center">

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span>Verificando autenticação Google...</span>
        </div>
      </div>
    );
  }

  // 1. Mandatory Google Authentication Gate before showing any app screens
  if (!currentUser) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen w-full items-center justify-center bg-[#09090b]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        }
      >
        <LoginScreen
          onLoginSuccess={() => {
            setAuthLoading(true);
            setTimeout(() => setAuthLoading(false), 1500);
          }}
        />
      </Suspense>
    );
  }

  // 2. Pending Approval Gate (if not admin and status is pending)
  if (!currentUser.isAdmin && userProfile && userProfile.status === 'pending') {
    return <PendingApprovalScreen userProfile={userProfile} onRefresh={handleRefreshProfile} />;
  }

  // 3. Rejected/Blocked Screen (if not admin and status is rejected)
  if (!currentUser.isAdmin && userProfile && userProfile.status === 'rejected') {
    return <RejectedScreen userProfile={userProfile} />;
  }

  return (
    <div className="relative min-h-screen w-full bg-[#09090b] px-3 py-6 sm:px-6 md:py-10 text-zinc-100 antialiased font-sans selection:bg-amber-500 selection:text-black">


      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Outer Card Container */}
      <main className="relative z-10 mx-auto max-w-5xl rounded-3xl border border-zinc-800/80 bg-[#121215]/90 p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-md">
        {/* Admin Header with user imc.sidnei@gmail.com, Google login for guests, and Firestore sync */}
        <AdminHeader
          currentUser={currentUser}
          totalNotes={notes.length}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onResetData={handleResetData}
          onOpenCreateForm={handleOpenCreateForm}
          onOpenReports={() => setIsReportsOpen(true)}
          onOpenUserManagement={handleToggleUserManagement}
          onViewSchedule={handleToggleSchedule}
          onOpenAudit={handleToggleAudit}
          onOpenDivisions={() => setIsDivisionManagerOpen(true)}
          pendingUsersCount={pendingUsersCount}
          isViewingUserManagement={isViewingUserManagement}
          isViewingSchedule={isViewingSchedule}
          isViewingAudit={isViewingAudit}
        />

        {/* Conditional View: Admin User Management Dashboard OR Audit OR Schedule OR Normal Agenda */}
        {isViewingUserManagement && currentUser?.isAdmin ? (
          <UserManagementDashboard
            currentAdminEmail={currentUser.email || ADMIN_EMAIL}
            onBackToAgenda={() => setIsViewingUserManagement(false)}
            onShowToast={showNotification}
          />
        ) : isViewingAudit && currentUser?.isAdmin ? (
          <AuditDashboard
            onBackToAgenda={() => setIsViewingAudit(false)}
          />
        ) : isViewingSchedule ? (
          <ViewScheduleScreen
            notes={notes}
            currentUser={currentUser}
            onBack={() => setIsViewingSchedule(false)}
            onViewNote={(note) => {
              setIsViewingSchedule(false);
              handleViewNote(note);
            }}
            onEditNote={(note) => {
              setIsViewingSchedule(false);
              handleStartEdit(note);
            }}
            onDeleteNote={(note) => setDeletingNote(note)}
          />
        ) : (
          <>
            {/* Top Grid: Calendar (Left) and Note Form (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {/* Left Column: Interactive Calendar */}
              <Calendar
                currentDate={viewDate}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onChangeMonth={handleChangeMonth}
                onChangeYear={handleChangeYear}
                onGoToToday={handleGoToToday}
                notes={notes}
              />

              {/* Right Column: Note Form (Create & Update directly to Firebase) */}
              <NoteForm
                selectedDate={selectedDate}
                editingNote={editingNote}
                currentUser={currentUser}
                divisions={divisionOptions}
                onSaveNote={handleSaveNote}
                onCancelEdit={() => setEditingNote(null)}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto mt-6 max-w-5xl flex flex-row flex-wrap items-center justify-center gap-2 pb-4">
        <p className="text-sm sm:text-base text-zinc-400 tracking-wide whitespace-nowrap">
          Desenvolvido por
        </p>

        <span className="text-sm sm:text-base text-zinc-200 tracking-wide whitespace-nowrap">
          Siluar Core
        </span>
      </footer>

      {/* Modal: View Details (Read) */}
      <ViewNoteModal
        note={viewingNote}
        isOpen={!!viewingNote}
        currentUser={currentUser}
        onClose={() => setViewingNote(null)}
        onEdit={(note) => handleStartEdit(note)}
        onDelete={(note) => {
          setViewingNote(null);
          setDeletingNote(note);
        }}
      />

      <ReportsModal
        notes={notes}
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        notify={showNotification}
        onViewNote={(note) => {
          setIsReportsOpen(false);
          handleViewNote(note);
        }}
      />

      <DayEventsModal
        date={dayEventsDate}
        notes={notes}
        isOpen={isDayEventsOpen}
        onClose={() => {
          setIsDayEventsOpen(false);
          setDayEventsDate(null);
        }}
        onViewNote={(note) => {
          setIsDayEventsOpen(false);
          handleViewNote(note);
        }}
      />

      {/* Modal: Delete Confirmation (Delete) */}
      <DeleteConfirmModal
        note={deletingNote}
        isOpen={!!deletingNote}
        onClose={() => setDeletingNote(null)}
        onConfirm={handleConfirmDelete}
      />

      <DivisionManagerModal
        isOpen={isDivisionManagerOpen}
        onClose={() => setIsDivisionManagerOpen(false)}
        divisions={divisionList}
        notes={notes}
        currentUser={currentUser}
        onShowToast={showNotification}
      />
    </div>
  );
}
