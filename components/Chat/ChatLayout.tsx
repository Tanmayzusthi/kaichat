import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const ChatLayout: React.FC = () => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const { user: currentUser } = useAuth();
    
    const chatId = selectedUser && currentUser ? [currentUser.id, selectedUser.id].sort().join('_') : null;

    const WelcomeScreen = () => (
      <div className="flex flex-col items-center justify-center h-full text-center bg-white rounded-r-2xl p-4">
          <div className="w-24 h-24 mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <span className="text-5xl text-stone-500">{(currentUser?.name?.charAt(0) ?? 'K').toUpperCase()}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome, {currentUser?.name}!</h2>
          <p className="text-gray-500">Select a contact to start messaging or view chat requests.</p>
      </div>
    );

    return (
        <div className="flex h-screen antialiased text-gray-800 bg-gray-50 p-0 sm:p-4">
            <div className="flex flex-no-wrap w-full h-full max-w-7xl mx-auto shadow-none sm:shadow-2xl rounded-none sm:rounded-2xl border-none sm:border sm:border-gray-200">
                <div className={`${selectedUser ? 'hidden sm:flex' : 'flex'} w-full sm:w-auto`}>
                    <Sidebar onSelectUser={setSelectedUser} selectedUserId={selectedUser?.id || null} />
                </div>
                <div className={`flex-1 ${selectedUser ? 'flex' : 'hidden sm:flex'}`}>
                    {selectedUser && chatId ? (
                        <ChatWindow 
                            partner={selectedUser} 
                            chatId={chatId} 
                            onBack={() => setSelectedUser(null)}
                        />
                    ) : (
                        <WelcomeScreen />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatLayout;
