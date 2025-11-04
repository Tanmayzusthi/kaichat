import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { User, Message, MessageType } from '../../types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { ArrowLeftIcon } from '../UI/Icons';

interface ChatWindowProps {
  partner: User;
  chatId: string;
  onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ partner, chatId, onBack }) => {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const messagesRef = collection(db!, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching messages:", error);
        toast.error("Could not load messages.");
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string, type: MessageType, file?: File) => {
    if (!currentUser) return;
    
    // Optimistic UI update
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
        id: tempId,
        from: currentUser.id,
        content: file ? URL.createObjectURL(file) : content,
        type,
        timestamp: Timestamp.now(),
    };
    setMessages(prev => [...prev, optimisticMessage]);

    let messageContent = content;

    if (file) {
      const toastId = toast.loading('Uploading 0%');
      try {
        let processedFile = file;
        // Compress image before uploading
        if (type === 'image') {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true
            }
            processedFile = await imageCompression(file, options);
        }

        const storageRef = ref(storage!, `chat_media/${chatId}/${Date.now()}_${processedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, processedFile);
        
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                toast.loading(`Uploading ${Math.round(progress)}%`, { id: toastId });
            },
            (error) => {
                toast.error('File upload failed.', { id: toastId });
                setMessages(prev => prev.filter(m => m.id !== tempId)); // Rollback optimistic update
            },
            async () => {
                messageContent = await getDownloadURL(uploadTask.snapshot.ref);
                await addDoc(collection(db!, 'chats', chatId, 'messages'), {
                  from: currentUser.id,
                  content: messageContent,
                  type,
                  timestamp: serverTimestamp(),
                  reactions: {},
                });
                toast.success('Upload complete!', { id: toastId });
                setMessages(prev => prev.filter(m => m.id !== tempId));
            }
        );

      } catch (error) {
        toast.error('File processing failed.', { id: toastId });
        setMessages(prev => prev.filter(m => m.id !== tempId)); // Rollback
        return;
      }
    } else {
        if (!messageContent.trim()) {
            setMessages(prev => prev.filter(m => m.id !== tempId)); // Rollback
            return;
        }
        try {
            await addDoc(collection(db!, 'chats', chatId, 'messages'), {
              from: currentUser.id,
              content: messageContent,
              type,
              timestamp: serverTimestamp(),
              reactions: {},
            });
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } catch (error) {
            toast.error("Message failed to send.");
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    const messageRef = doc(db!, 'chats', chatId, 'messages', messageId);
    
    try {
      await runTransaction(db!, async (transaction) => {
        const messageDoc = await transaction.get(messageRef);
        if (!messageDoc.exists()) throw "Document does not exist!";
        
        const data = messageDoc.data();
        const reactions = data.reactions || {};
        let userPreviousReaction = null;

        for (const key in reactions) {
            if (reactions[key].includes(currentUser.id)) {
                userPreviousReaction = key;
                reactions[key] = reactions[key].filter((id: string) => id !== currentUser.id);
                if (reactions[key].length === 0) delete reactions[key];
                break;
            }
        }
        
        if (userPreviousReaction !== emoji) {
            if (!reactions[emoji]) reactions[emoji] = [];
            reactions[emoji].push(currentUser.id);
        }
        
        transaction.update(messageRef, { reactions });
      });
    } catch (error) {
      console.error("Reaction failed: ", error);
      toast.error('Could not set reaction.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-r-none sm:rounded-r-2xl">
      <div className="flex items-center p-4 border-b border-gray-200">
        <button onClick={onBack} className="mr-2 p-2 sm:hidden rounded-full hover:bg-gray-100">
            <ArrowLeftIcon className="w-6 h-6 text-gray-600"/>
        </button>
        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold uppercase">
          {partner.name?.charAt(0) ?? '?'}
        </div>
        <div className="ml-3">
          <p className="font-semibold text-gray-800">{partner.name}</p>
          <p className={`text-xs ${partner.status === 'online' ? 'text-green-500' : 'text-gray-500'}`}>
            {partner.status}
          </p>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {isLoading && <div className="text-center text-gray-400">Loading messages...</div>}
        {!isLoading && messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.from === currentUser?.id} onReaction={handleReaction} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;
