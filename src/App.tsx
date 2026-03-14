import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, loginWithGoogle, db } from './firebase';
import Sidebar from './components/Sidebar.tsx';
import Editor from './components/Editor.tsx';
import Chat from './components/Chat.tsx';
import { LogIn, Sparkles, Users, Zap, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isInvited, setIsInvited] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if user is invited
        if (user.email === 'filoama36@gmail.com') {
          setIsInvited(true);
        } else {
          const inviteDoc = await getDoc(doc(db, 'invites', user.email || ''));
          setIsInvited(inviteDoc.exists());
        }
      } else {
        setIsInvited(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex bg-stone-50">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white p-10 rounded-[2rem] shadow-2xl shadow-stone-200 border border-stone-100"
          >
            <div className="flex items-center gap-2 mb-8 justify-center">
              <div className="bg-stone-900 p-2 rounded-xl">
                <Zap className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-serif font-bold text-stone-900">CollabEdit</h1>
            </div>
            
            <h2 className="text-xl font-medium text-center text-stone-800 mb-2">Welcome back</h2>
            <p className="text-stone-500 text-center mb-8 text-sm">
              Sign in to start collaborating on emails and notes with your team and AI.
            </p>

            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white border border-stone-200 py-3 rounded-xl hover:bg-stone-50 transition-all font-medium text-stone-700 active:scale-[0.98]"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isInvited === false) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50 p-8">
        <div className="max-w-md w-full bg-white p-10 rounded-[2rem] shadow-xl border border-stone-100 text-center">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">Access Restricted</h2>
          <p className="text-stone-500 mb-8">
            Sorry, you haven't been invited to this workspace yet. Please contact the administrator to get access.
          </p>
          <button
            onClick={() => auth.signOut()}
            className="text-stone-500 hover:text-stone-900 font-medium underline"
          >
            Sign out and try another account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-white font-sans text-stone-900">
      {/* Mobile Header */}
      <header className="md:hidden h-14 border-b border-stone-200 flex items-center justify-between px-4 bg-white shrink-0 z-30">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-stone-500 hover:bg-stone-50 rounded-lg"
          aria-label="Open Sidebar"
        >
          <Users size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Zap className="text-stone-900 fill-stone-900" size={18} />
          <span className="font-serif font-bold text-lg tracking-tight">CollabEdit</span>
        </div>
        <button 
          onClick={() => setIsChatOpen(true)}
          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
          aria-label="Open AI Chat"
        >
          <Sparkles size={20} />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with mobile overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 md:hidden"
            />
          )}
        </AnimatePresence>
        
        <div className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out bg-white
          md:relative md:translate-x-0 md:z-0 md:w-64
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar 
            selectedId={selectedDocId} 
            onSelect={(id) => {
              setSelectedDocId(id);
              setIsSidebarOpen(false);
            }} 
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>

        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <Editor documentId={selectedDocId} />
        </main>

        {/* Chat with mobile overlay */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        <div className={`
          fixed inset-y-0 right-0 z-50 w-80 transform transition-transform duration-300 ease-in-out bg-white
          md:relative md:translate-x-0 md:z-0
          ${isChatOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <Chat onClose={() => setIsChatOpen(false)} />
        </div>
      </div>
    </div>
  );
}
