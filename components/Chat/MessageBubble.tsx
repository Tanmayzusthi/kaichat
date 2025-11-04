import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../../types';
import { Timestamp } from 'firebase/firestore';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onReaction: (messageId: string, emoji: string) => void;
}

const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage, onReaction }) => {
  const [showPicker, setShowPicker] = useState(false);
  const availableReactions = ['❤️', '😂', '🔥', '👍', '😢'];

  const bubbleAlignment = isOwnMessage ? 'justify-end' : 'justify-start';
  const bubbleColor = isOwnMessage ? 'bg-stone-800' : 'bg-stone-100';
  const textColor = isOwnMessage ? 'text-white' : 'text-gray-800';

  const renderContent = () => {
    switch (message.type) {
        case 'image':
            return <img src={message.content} alt="sent" className="rounded-lg max-w-xs cursor-pointer" onClick={() => window.open(message.content, '_blank')}/>;
        case 'video':
            return <video src={message.content} controls className="rounded-lg max-w-xs" />;
        case 'text':
        default:
            return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
    }
  }

  return (
    <motion.div 
      className={`flex ${bubbleAlignment}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className={`flex flex-col max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
      >
        <div className="relative">
            <AnimatePresence>
            {showPicker && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute z-10 flex items-center p-1 space-x-1 bg-white border border-gray-200 rounded-full shadow-lg ${isOwnMessage ? 'right-2' : 'left-2'} -top-5`}
                >
                    {availableReactions.map(emoji => (
                        <button 
                            key={emoji} 
                            onClick={() => onReaction(message.id, emoji)}
                            className="text-lg transition-transform transform hover:scale-125 focus:outline-none"
                        >
                            {emoji}
                        </button>
                    ))}
                </motion.div>
            )}
            </AnimatePresence>
            <div className={`px-4 py-2 rounded-2xl ${bubbleColor} ${textColor} ${isOwnMessage ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                {renderContent()}
            </div>
        </div>

        <div className={`flex items-center space-x-2 mt-1 px-1 w-full ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className={`flex items-center space-x-1`}>
                {Object.entries(message.reactions).map(([emoji, reactors]) => 
                reactors.length > 0 && (
                    <div key={emoji} className="flex items-center px-1.5 py-0.5 text-xs bg-stone-200 rounded-full border border-gray-300 cursor-default">
                    <span>{emoji}</span>
                    <span className="ml-1 text-gray-700 font-medium">{reactors.length}</span>
                    </div>
                )
                )}
            </div>
            )}
            <span className="text-xs text-gray-500">
                {formatTime(message.timestamp)}
            </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;