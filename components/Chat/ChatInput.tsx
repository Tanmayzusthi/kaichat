import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageType } from '../../types';
import { SendIcon, EmojiIcon, PaperclipIcon, MicIcon } from '../UI/Icons';
import toast from 'react-hot-toast';

interface ChatInputProps {
  onSendMessage: (content: string, type: MessageType, file?: File) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(prev => (prev ? prev + ' ' : '') + transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            toast.error('Microphone access denied. Please allow microphone permissions in your browser settings.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast.error(`Voice recognition failed: ${event.error}.`);
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim()) {
      onSendMessage(message, 'text');
      setMessage('');
      setShowEmojiPicker(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type.split('/')[0] as 'image' | 'video';
      if (fileType === 'image' || fileType === 'video') {
        onSendMessage('', fileType, file);
      } else {
        toast.error('Unsupported file type.');
      }
    }
    // Reset file input to allow selecting the same file again
    if(e.target) e.target.value = '';
  };
  
  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported on this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        // This can happen if permission is not granted or it's already started
        console.error("Could not start speech recognition:", error);
        toast.error('Could not start voice input. Please allow microphone access.');
      }
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200 relative">
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-4 z-10"
          >
            <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.LIGHT} />
          </motion.div>
        )}
      </AnimatePresence>
      <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-500 hover:text-stone-800 transition-colors rounded-full hover:bg-gray-100">
          <EmojiIcon />
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-stone-800 transition-colors rounded-full hover:bg-gray-100">
          <PaperclipIcon />
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
        </button>
         <button type="button" onClick={handleMicClick} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-stone-800'}`}>
          <MicIcon />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-stone-500 focus:border-stone-500 transition-all"
        />
        <button type="submit" className="p-3 bg-stone-800 rounded-full text-white hover:bg-stone-700 transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:scale-100" disabled={!message.trim()}>
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;