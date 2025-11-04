import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, or } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { User, ChatRequest } from '../../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface SidebarProps {
  onSelectUser: (user: User) => void;
  selectedUserId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectUser, selectedUserId }) => {
  const { user: currentUser, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    // Listen for all verified users except the current one
    const usersRef = collection(db!, 'users');
    const usersQuery = query(usersRef, where('verified', '==', true), where('__name__', '!=', currentUser.id));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(userList);
    });

    // Listen for chat requests where the current user is either sender or receiver
    const requestsRef = collection(db!, 'chatRequests');
    const requestsQuery = query(requestsRef, or(where('fromUserId', '==', currentUser.id), where('toUserId', '==', currentUser.id)));
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requestList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRequest));
      setRequests(requestList);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRequests();
    };
  }, [currentUser]);
  
  const handleRequest = async (toUserId: string) => {
    if (!currentUser) return;
    try {
        await addDoc(collection(db!, 'chatRequests'), {
            fromUserId: currentUser.id,
            toUserId: toUserId,
            status: 'pending',
            timestamp: serverTimestamp(),
        });
        toast.success('Chat request sent!');
    } catch (error) {
        toast.error('Failed to send request.');
    }
  };
  
  const handleAccept = async (requestId: string) => {
    try {
        const requestRef = doc(db!, 'chatRequests', requestId);
        await updateDoc(requestRef, { status: 'accepted' });
        toast.success('Request accepted!');
    } catch (error) {
        toast.error('Failed to accept request.');
    }
  };
  
  const handleDecline = async (requestId: string) => {
     try {
        const requestRef = doc(db!, 'chatRequests', requestId);
        await updateDoc(requestRef, { status: 'rejected' });
        toast('Request declined.', { icon: '🚫' });
    } catch (error) {
        toast.error('Failed to decline request.');
    }
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const { contacts, incomingRequests, otherUsers } = useMemo(() => {
    const contacts: User[] = [];
    const incomingRequests: { user: User, request: ChatRequest }[] = [];
    const otherUsers: User[] = [];
    
    const requestMap = new Map<string, ChatRequest>();
    requests.forEach(req => {
        const otherUserId = req.fromUserId === currentUser!.id ? req.toUserId : req.fromUserId;
        requestMap.set(otherUserId, req);
    });

    users.forEach(user => {
        const request = requestMap.get(user.id);
        if (request) {
            if (request.status === 'accepted') {
                contacts.push(user);
            } else if (request.status === 'pending' && request.toUserId === currentUser!.id) {
                incomingRequests.push({ user, request });
            } else {
                otherUsers.push(user); // These are users with pending sent requests or rejected requests
            }
        } else {
            otherUsers.push(user); // Users with no interaction yet
        }
    });
    
    return { contacts, incomingRequests, otherUsers };

  }, [users, requests, currentUser]);
  
  const getRequestStatus = (userId: string) => {
    const request = requests.find(r => (r.fromUserId === currentUser!.id && r.toUserId === userId) || (r.fromUserId === userId && r.toUserId === currentUser!.id));
    return request;
  };

  return (
    <div className="flex flex-col w-full sm:w-80 bg-stone-50 border-r border-gray-200 rounded-l-none sm:rounded-l-2xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center font-bold text-white uppercase">
                {currentUser?.name?.charAt(0) ?? '?'}
            </div>
            <span className="ml-2 font-semibold text-gray-800">{currentUser?.name}</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-600 transition">Logout</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {incomingRequests.length > 0 && (
            <>
                <h2 className="p-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">Requests</h2>
                <ul>
                    {incomingRequests.map(({ user, request }) => (
                        <li key={user.id} className="flex items-center justify-between p-3 hover:bg-stone-100">
                           <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold uppercase">{user.name?.charAt(0) ?? '?'}</div>
                                <span className="ml-3 font-medium">{user.name}</span>
                           </div>
                           <div className="flex items-center space-x-2">
                               <button onClick={() => handleAccept(request.id)} className="px-3 py-1 text-xs text-white bg-stone-700 rounded-md hover:bg-stone-600">Accept</button>
                               <button onClick={() => handleDecline(request.id)} className="px-3 py-1 text-xs text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Decline</button>
                           </div>
                        </li>
                    ))}
                </ul>
            </>
        )}

        <h2 className="p-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">Contacts</h2>
        <ul>
          {contacts.map(user => (
            <li key={user.id} onClick={() => onSelectUser(user)} className={`flex items-center p-3 cursor-pointer hover:bg-stone-100 transition-colors ${selectedUserId === user.id ? 'bg-stone-200' : ''}`}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold uppercase">{user.name?.charAt(0) ?? '?'}</div>
                <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-300'} ring-2 ring-stone-50`}></span>
              </div>
              <span className="ml-3 font-medium">{user.name}</span>
            </li>
          ))}
        </ul>

        <h2 className="p-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">Other Users</h2>
        <ul>
            {otherUsers.map(user => {
                const request = getRequestStatus(user.id);
                return (
                    <li key={user.id} className="flex items-center justify-between p-3 hover:bg-stone-100">
                        <div className="flex items-center">
                           <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold uppercase">{user.name?.charAt(0) ?? '?'}</div>
                           <span className="ml-3 font-medium">{user.name}</span>
                        </div>
                        {request?.status === 'pending' ?
                            <span className="text-xs text-gray-400">Request Sent</span> :
                        request?.status === 'rejected' ?
                             <span className="text-xs text-red-400">Declined</span> :
                            <button onClick={() => handleRequest(user.id)} className="px-3 py-1 text-xs text-stone-700 border border-stone-300 rounded-md hover:bg-stone-200">Request</button>
                        }
                    </li>
                );
            })}
        </ul>

      </div>
    </div>
  );
};

export default Sidebar;
