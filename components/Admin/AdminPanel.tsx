import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { User } from '../../types';

const AdminPanel: React.FC = () => {
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Use the correctly prefixed environment variable for client-side access
  const ADMIN_SECRET = process.env.REACT_APP_ADMIN_SECRET || 'kaichatadmin';

  const fetchPendingUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersRef = collection(db!, 'users');
      const q = query(usersRef, where('verified', '==', false));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setPendingUsers(users);
    } catch (error) {
      toast.error('Failed to fetch pending users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingUsers();
    }
  }, [isAuthenticated, fetchPendingUsers]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret === ADMIN_SECRET) {
      setIsAuthenticated(true);
      toast.success('Admin access granted.');
    } else {
      toast.error('Incorrect secret code.');
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const userRef = doc(db!, 'users', userId);
      await updateDoc(userRef, { verified: true });
      toast.success('User approved.');
      fetchPendingUsers();
    } catch (error) {
      toast.error('Failed to approve user.');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const userRef = doc(db!, 'users', userId);
      await deleteDoc(userRef);
      toast.success('User rejected and removed.');
      fetchPendingUsers();
    } catch (error) {
      toast.error('Failed to reject user.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white border border-gray-200 rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold text-center text-stone-800">Admin Access</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter Admin Secret"
              className="w-full px-3 py-3 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-stone-500 focus:border-stone-500"
            />
            <button type="submit" className="w-full py-2 px-4 text-sm font-medium rounded-md text-white bg-stone-800 hover:bg-stone-700">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-stone-800">Pending Approvals</h1>
            <Link to="/" className="text-sm text-stone-600 hover:text-stone-800 border border-stone-300 px-3 py-1 rounded-md hover:bg-stone-100 transition-colors">
                &larr; Back to App
            </Link>
        </div>
        {loading ? (
          <p className="text-center">Loading users...</p>
        ) : pendingUsers.length === 0 ? (
          <p className="text-center text-gray-400">No pending user approvals.</p>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl">
                <div>
                  <p className="font-semibold text-gray-800">{user.name} <span className="text-sm text-gray-400">@{user.username}</span></p>
                  <p className="text-sm text-gray-600">{user.phone}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleApprove(user.id)} className="px-3 py-1 text-sm text-white bg-stone-700 rounded-md hover:bg-stone-600">Approve</button>
                  <button onClick={() => handleReject(user.id)} className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-500">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;