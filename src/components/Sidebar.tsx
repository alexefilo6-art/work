import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth, logout } from '../firebase';
import { Document } from '../types';
import { Plus, FileText, Trash2, LogOut, User as UserIcon, UserPlus, X } from 'lucide-react';

interface SidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function Sidebar({ selectedId, onSelect }: SidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const isAdmin = auth.currentUser?.email === 'filoama36@gmail.com';

  useEffect(() => {
    const q = query(collection(db, 'documents'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
      setDocuments(docs);
    });
    return () => unsub();
  }, []);

  const createNewDoc = async () => {
    try {
      const docRef = await addDoc(collection(db, 'documents'), {
        title: 'Untitled Document',
        content: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastModifiedBy: auth.currentUser?.uid
      });
      onSelect(docRef.id);
    } catch (err) {
      console.error('Error creating document:', err);
    }
  };

  const deleteDocument = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    try {
      // Optimistically clear selection if it's the one being deleted
      if (selectedId === id) onSelect('');
      await deleteDoc(doc(db, 'documents', id));
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document. You might not have permission.');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !isAdmin) return;

    setInviteStatus('loading');
    try {
      await setDoc(doc(db, 'invites', inviteEmail.trim().toLowerCase()), {
        email: inviteEmail.trim().toLowerCase(),
        invitedAt: serverTimestamp(),
        invitedBy: auth.currentUser?.uid
      });
      setInviteStatus('success');
      setInviteEmail('');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteStatus('idle');
      }, 1500);
    } catch (err) {
      console.error('Invite error:', err);
      setInviteStatus('error');
    }
  };

  return (
    <div className="w-64 border-r border-stone-200 bg-stone-50 flex flex-col h-full relative">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-serif font-bold text-stone-900">CollabEdit</h1>
          {isAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              title="Invite participants"
            >
              <UserPlus size={18} />
            </button>
          )}
        </div>
        <button
          onClick={createNewDoc}
          className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-2.5 rounded-xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 active:scale-[0.98]"
        >
          <Plus size={18} />
          <span>New Document</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <div className="px-3 mb-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Recent Documents</span>
        </div>
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
              selectedId === doc.id
                ? 'bg-white shadow-sm text-stone-900 ring-1 ring-stone-200'
                : 'text-stone-500 hover:bg-stone-200/50'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText size={18} className={selectedId === doc.id ? 'text-emerald-600' : 'text-stone-400'} />
              <span className="truncate text-sm font-medium">{doc.title || 'Untitled'}</span>
            </div>
            <button
              onClick={(e) => deleteDocument(e, doc.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-stone-200 bg-white">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
            <UserIcon size={16} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-stone-900 truncate">{auth.currentUser?.displayName || 'User'}</p>
            <p className="text-[10px] text-stone-400 truncate">{auth.currentUser?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-stone-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-bold text-stone-900">Invite Participant</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-stone-400 hover:text-stone-900">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-stone-500 mb-6">Enter the email address of the person you want to invite to this workspace.</p>
            <form onSubmit={handleInvite}>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="submit"
                disabled={inviteStatus === 'loading'}
                className={`w-full py-2.5 rounded-xl font-medium transition-all ${
                  inviteStatus === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
              >
                {inviteStatus === 'loading' ? 'Inviting...' : inviteStatus === 'success' ? 'Invited!' : 'Send Invitation'}
              </button>
              {inviteStatus === 'error' && (
                <p className="text-xs text-red-600 mt-2 text-center">Failed to send invitation. Try again.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
