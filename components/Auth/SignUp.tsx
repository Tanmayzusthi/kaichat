import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !phone) {
        toast.error('All fields are required.');
        return;
    }
    setLoading(true);

    try {
        const usersRef = collection(db!, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);

        if(!querySnapshot.empty) {
            throw new Error('Username is already taken.');
        }

        await addDoc(collection(db!, 'users'), {
            name,
            username,
            phone,
            verified: false,
            status: 'offline',
            lastSeen: serverTimestamp(),
        });

        setSubmitted(true);
    } catch (error: any) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  };

  if (submitted) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 text-center space-y-4 bg-white border border-gray-200 rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold text-stone-800">Registration Submitted!</h1>
                <p className="text-gray-600">Your account is now pending admin approval. Please check back later.</p>
                <Link to="/login" className="inline-block mt-4 px-4 py-2 text-sm font-medium rounded-md text-white bg-stone-800 hover:bg-stone-700">
                    Back to Login
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white border border-gray-200 rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-stone-800">Create Account</h1>
          <p className="mt-2 text-gray-500">Join KAICHAT and start connecting.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="rounded-md -space-y-px">
            <div>
              <input
                name="name" type="text" required
                className="appearance-none rounded-none relative block w-full px-3 py-3 bg-gray-100 border border-gray-300 placeholder-gray-400 text-gray-800 rounded-t-md focus:outline-none focus:ring-stone-500 focus:border-stone-500 focus:z-10 sm:text-sm"
                placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
             <div>
              <input
                name="username" type="text" required
                className="appearance-none rounded-none relative block w-full px-3 py-3 bg-gray-100 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-stone-500 focus:border-stone-500 focus:z-10 sm:text-sm"
                placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                name="phone" type="tel" required
                className="appearance-none rounded-none relative block w-full px-3 py-3 bg-gray-100 border border-gray-300 placeholder-gray-400 text-gray-800 rounded-b-md focus:outline-none focus:ring-stone-500 focus:border-stone-500 focus:z-10 sm:text-sm"
                placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-stone-800 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-stone-600 transition-all duration-300 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Sign Up'}
            </button>
          </div>
        </form>
        <p className="mt-2 text-sm text-center text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-stone-600 hover:text-stone-800">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;