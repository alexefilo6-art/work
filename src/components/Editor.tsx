import React, { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Document } from '../types';
import { FileText, Save, Clock, User } from 'lucide-react';

interface EditorProps {
  documentId: string | null;
}

export default function Editor({ documentId }: EditorProps) {
  const [docData, setDocData] = useState<Document | null>(null);
  const [localContent, setLocalContent] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!documentId) {
      setDocData(null);
      setLocalContent('');
      setLocalTitle('');
      return;
    }

    const unsub = onSnapshot(doc(db, 'documents', documentId), (snapshot) => {
      if (snapshot.exists()) {
        const data = { id: snapshot.id, ...snapshot.data() } as Document;
        setDocData(data);
        
        // Only update local if it's different and not currently being edited by us
        // In a real app, we'd use a more sophisticated conflict resolution
        if (document.activeElement !== textareaRef.current) {
          setLocalContent(data.content);
        }
        setLocalTitle(data.title);
      }
    });

    return () => unsub();
  }, [documentId]);

  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    
    if (!documentId) return;

    try {
      setIsSaving(true);
      await updateDoc(doc(db, 'documents', documentId), {
        content: newContent,
        updatedAt: serverTimestamp(),
        lastModifiedBy: auth.currentUser?.uid
      });
    } catch (err) {
      console.error('Error updating document:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
    
    if (!documentId) return;

    try {
      await updateDoc(doc(db, 'documents', documentId), {
        title: newTitle,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating title:', err);
    }
  };

  if (!documentId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-stone-50 text-stone-400">
        <FileText size={64} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">Select or create a document to start editing</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      <div className="border-b border-stone-200 p-4 flex items-center justify-between">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={localTitle}
            onChange={handleTitleChange}
            className="w-full text-2xl font-serif font-medium focus:outline-none placeholder-stone-300"
            placeholder="Document Title"
          />
          <div className="flex items-center gap-4 mt-1 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Last updated: {docData?.updatedAt?.toDate?.()?.toLocaleString() || 'Saving...'}
            </span>
            {isSaving && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Save size={12} className="animate-pulse" />
                Saving...
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleContentChange}
          className="absolute inset-0 w-full h-full p-8 font-mono text-base leading-relaxed resize-none focus:outline-none bg-stone-50/30"
          placeholder="Start writing your email or note here..."
        />
      </div>
    </div>
  );
}
