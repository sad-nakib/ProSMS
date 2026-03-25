import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  Timestamp, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Users, 
  History as HistoryIcon, 
  Send, 
  Plus, 
  Trash2, 
  LogOut, 
  LayoutDashboard,
  Search,
  Phone,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  FolderPlus,
  Wallet,
  Filter,
  Menu,
  X,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
      secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
        className
      )}
      {...props}
    />
  )
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden', className)}>
    {children}
  </div>
);

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// --- Mock User for Single User Mode ---
const mockUser = {
  uid: 'public-user',
  displayName: 'ProSMS User',
  email: 'user@prosms.local',
  photoURL: 'https://picsum.photos/seed/prosms/200'
};

// --- Main App ---

export default function App() {
  const user = mockUser;
  const [activeTab, setActiveTab] = useState<'send' | 'contacts' | 'history'>('send');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balance, setBalance] = useState<number | string | null>(null);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  const fetchBalance = async () => {
    setIsRefreshingBalance(true);
    try {
      const response = await fetch('/api/balance');
      const data = await response.json();
      if (data.success) {
        setBalance(data.balance);
      } else {
        setBalance(data.balance || 'Error');
      }
    } catch (error) {
      console.error("Failed to fetch balance", error);
      setBalance('Error');
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-[#f5f5f5] overflow-x-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">ProSMS</span>
        </div>
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "w-64 border-r border-slate-200 bg-white flex flex-col fixed h-full z-50 transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-lg tracking-tight block">ProSMS</span>
                <span className="text-[10px] text-slate-400 font-mono">v2.4.0</span>
              </div>
            </div>
            <button onClick={closeSidebar} className="lg:hidden p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="space-y-1">
            <SidebarItem 
              icon={<Send className="w-4 h-4" />} 
              label="Send SMS" 
              active={activeTab === 'send'} 
              onClick={() => { setActiveTab('send'); closeSidebar(); }} 
            />
            <SidebarItem 
              icon={<Users className="w-4 h-4" />} 
              label="Phonebook" 
              active={activeTab === 'contacts'} 
              onClick={() => { setActiveTab('contacts'); closeSidebar(); }} 
            />
            <SidebarItem 
              icon={<HistoryIcon className="w-4 h-4" />} 
              label="History" 
              active={activeTab === 'history'} 
              onClick={() => { setActiveTab('history'); closeSidebar(); }} 
            />
          </nav>

          <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">SMS Balance</span>
              <button 
                onClick={fetchBalance}
                disabled={isRefreshingBalance}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 transition-all disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3 h-3", isRefreshingBalance && "animate-spin")} />
              </button>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight">
                {balance === null ? '...' : balance}
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase">SMS</span>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 truncate">Local Instance</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 w-full">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'send' && (
              <div key="send">
                <SMSComposer user={user} />
              </div>
            )}
            {activeTab === 'contacts' && (
              <div key="contacts">
                <Phonebook user={user} />
              </div>
            )}
            {activeTab === 'history' && (
              <div key="history">
                <History user={user} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
        active ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// --- Views ---

function SMSComposer({ user }: { user: any }) {
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // Auto-save feature
  useEffect(() => {
    const savedDraft = localStorage.getItem(`sms_draft_${user.uid}`);
    if (savedDraft) {
      try {
        const { to: savedTo, body: savedBody } = JSON.parse(savedDraft);
        setTo(savedTo || '');
        setBody(savedBody || '');
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [user.uid]);

  useEffect(() => {
    localStorage.setItem(`sms_draft_${user.uid}`, JSON.stringify({ to, body }));
  }, [to, body, user.uid]);

  useEffect(() => {
    const qContacts = query(collection(db, 'contacts'), where('ownerId', '==', user.uid), orderBy('name'));
    const unsubscribeContacts = onSnapshot(qContacts, (snapshot) => {
      setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'contacts'));

    const qGroups = query(collection(db, 'groups'), where('ownerId', '==', user.uid), orderBy('name'));
    const unsubscribeGroups = onSnapshot(qGroups, (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'groups'));

    return () => {
      unsubscribeContacts();
      unsubscribeGroups();
    };
  }, [user.uid]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !body) return;

    setSending(true);
    setStatus(null);

    const recipients = to.split(',').map(n => n.trim()).filter(n => n);

    try {
      let successCount = 0;
      let lastErrorMessage = '';
      
      for (const recipient of recipients) {
        const response = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: recipient, body })
        });

        const result = await response.json();

        if (!result.success) {
          lastErrorMessage = result.message || result.error || 'Unknown error';
        }

        await addDoc(collection(db, 'messages'), {
          to: recipient,
          body,
          status: result.success ? 'sent' : 'failed',
          ownerId: user.uid,
          createdAt: Timestamp.now()
        });

        if (result.success) successCount++;
      }

      if (successCount === recipients.length) {
        setStatus({ type: 'success', message: `Successfully sent to ${successCount} recipient(s)!` });
        setBody('');
        setTo('');
        localStorage.removeItem(`sms_draft_${user.uid}`);
      } else {
        setStatus({ 
          type: 'error', 
          message: successCount === 0 
            ? `Failed to send: ${lastErrorMessage}` 
            : `Sent to ${successCount}/${recipients.length} recipients. Last error: ${lastErrorMessage}` 
        });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'An unexpected error occurred' });
      handleFirestoreError(error, OperationType.WRITE, 'messages');
    } finally {
      setSending(false);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    const groupContacts = contacts.filter(c => c.groupIds?.includes(groupId));
    const numbers = groupContacts.map(c => c.phoneNumber).join(', ');
    setTo(prev => prev ? `${prev}, ${numbers}` : numbers);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">Send Message</h2>
        <p className="text-slate-500">Compose and send an SMS to any number or group.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-6">
          <form onSubmit={handleSend} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">Recipient Number(s)</label>
                <span className="text-[10px] text-slate-400 uppercase">Separate with commas (e.g. 017...)</span>
              </div>
              <Input 
                placeholder="01712345678, 01812345678" 
                value={to} 
                onChange={e => setTo(e.target.value)} 
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Message</label>
              <textarea 
                className="flex min-h-[160px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                placeholder="Type your message here..."
                value={body}
                onChange={e => setBody(e.target.value)}
                maxLength={160}
                required
              />
              <div className="text-right text-xs text-slate-400">
                {body.length}/160 characters
              </div>
            </div>

            {status && (
              <div className={cn(
                "p-4 rounded-xl flex items-center gap-3 text-sm",
                status.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
              )}>
                {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {status.message}
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          {groups.length > 0 && (
            <Card className="p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Groups
              </h3>
              <div className="space-y-2">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelect(group.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-all text-left group"
                  >
                    <span className="text-sm font-medium">{group.name}</span>
                    <Plus className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Quick Contacts
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {contacts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No contacts found</p>
              ) : (
                contacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setTo(prev => prev ? `${prev}, ${contact.phoneNumber}` : contact.phoneNumber)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 transition-all">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-slate-500 truncate">{contact.phoneNumber}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function Phonebook({ user }: { user: any }) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | 'all'>('all');

  useEffect(() => {
    const qContacts = query(collection(db, 'contacts'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribeContacts = onSnapshot(qContacts, (snapshot) => {
      setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'contacts'));

    const qGroups = query(collection(db, 'groups'), where('ownerId', '==', user.uid), orderBy('name'));
    const unsubscribeGroups = onSnapshot(qGroups, (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'groups'));

    return () => {
      unsubscribeContacts();
      unsubscribeGroups();
    };
  }, [user.uid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    try {
      await addDoc(collection(db, 'contacts'), {
        name: newName,
        phoneNumber: newPhone,
        groupIds: selectedGroupId !== 'all' ? [selectedGroupId] : [],
        ownerId: user.uid,
        createdAt: Timestamp.now()
      });
      setNewName('');
      setNewPhone('');
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'contacts');
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    try {
      await addDoc(collection(db, 'groups'), {
        name: newGroupName,
        ownerId: user.uid,
        createdAt: Timestamp.now()
      });
      setNewGroupName('');
      setIsAddingGroup(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'groups');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contacts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'contacts');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'groups', id));
      if (selectedGroupId === id) setSelectedGroupId('all');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'groups');
    }
  };

  const toggleContactGroup = async (contact: any, groupId: string) => {
    const currentGroups = contact.groupIds || [];
    const newGroups = currentGroups.includes(groupId)
      ? currentGroups.filter((id: string) => id !== groupId)
      : [...currentGroups, groupId];
    
    try {
      await updateDoc(doc(db, 'contacts', contact.id), { groupIds: newGroups });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'contacts');
    }
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phoneNumber.includes(search);
    const matchesGroup = selectedGroupId === 'all' || c.groupIds?.includes(selectedGroupId);
    return matchesSearch && matchesGroup;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Phonebook</h2>
          <p className="text-slate-500">Manage your contacts and groups.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsAddingGroup(true)} className="gap-2">
            <FolderPlus className="w-4 h-4" />
            New Group
          </Button>
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search contacts..." 
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
          <button
            onClick={() => setSelectedGroupId('all')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              selectedGroupId === 'all' ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            All Contacts
          </button>
          {groups.map(group => (
            <div key={group.id} className="relative group">
              <button
                onClick={() => setSelectedGroupId(group.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all pr-8",
                  selectedGroupId === group.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                {group.name}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Groups</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No contacts found
                  </td>
                </tr>
              ) : (
                filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3 h-3" />
                        {contact.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {groups.map(g => (
                          <button
                            key={g.id}
                            onClick={() => toggleContactGroup(contact, g.id)}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium transition-all",
                              contact.groupIds?.includes(g.id) 
                                ? "bg-slate-900 text-white" 
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            )}
                          >
                            {g.name}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(contact.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">Add New Contact</h3>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <Input placeholder="John Doe" value={newName} onChange={e => setNewName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                    <Input placeholder="01712345678" value={newPhone} onChange={e => setNewPhone(e.target.value)} required />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1">Save Contact</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}

        {isAddingGroup && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">Create New Group</h3>
                <form onSubmit={handleAddGroup} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Group Name</label>
                    <Input placeholder="e.g. Marketing, Friends" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddingGroup(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1">Create Group</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function History({ user }: { user: any }) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'messages'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'messages'));
  }, [user.uid]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">Message History</h2>
        <p className="text-slate-500">Track all your sent and failed messages.</p>
      </header>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Message</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No message history found
                  </td>
                </tr>
              ) : (
                messages.map(msg => (
                  <tr key={msg.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm">{msg.to}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 max-w-md truncate">{msg.body}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                        msg.status === 'sent' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      )}>
                        {msg.status === 'sent' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {msg.status === 'sent' ? 'Sent' : 'Failed'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'MMM d, HH:mm') : 'Recently'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
