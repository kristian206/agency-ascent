import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile, AgencyConfig, ChatMessage } from '../types';
import { getGoalSettingAdvice, getPerformanceAnalysis } from '../services/geminiService';
import { getRecentActivities } from '../services/firebaseService';
import { CloseIcon, HeadsetIcon } from './ui/Icons';

interface AscentCoachModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    agencyConfig: AgencyConfig;
}

const AscentCoachModal: React.FC<AscentCoachModalProps> = ({ isOpen, onClose, userProfile, agencyConfig }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { id: 'welcome', sender: 'ai', text: `Hi ${userProfile.displayName}! I'm your Ascent Coach. How can I help you today? You can ask for a "game plan" or "how am I doing?".` }
            ]);
        }
    }, [isOpen, userProfile.displayName, messages.length]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!isOpen) return null;
    
    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;
        
        const userMessage: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const question = input.toLowerCase();
        setInput('');
        setIsLoading(true);
        setMessages(prev => [...prev, {id: `ai-loading-${Date.now()}`, sender: 'ai', text: 'Coach is thinking...', isLoading: true}]);

        let aiResponseText = "Sorry, I'm not sure how to help with that. Try asking for a 'game plan' or 'how am I doing?'.";

        try {
            if (question.includes('game plan')) {
                aiResponseText = await getGoalSettingAdvice(userProfile, agencyConfig);
            } else if (question.includes('how am i doing') || question.includes('performance')) {
                const recentActivities = await getRecentActivities(userProfile.uid, 5);
                aiResponseText = await getPerformanceAnalysis(userProfile, recentActivities);
            }
        } catch (error) {
            console.error("Coach AI error:", error);
            aiResponseText = "There was an error getting a response. Please try again."
        } finally {
            const aiMessage: ChatMessage = { id: `ai-${Date.now()}`, sender: 'ai', text: aiResponseText };
            setMessages(prev => prev.filter(m => !m.isLoading));
            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-brand-surface w-full max-w-2xl h-[80vh] rounded-lg shadow-2xl flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-brand-muted">
                    <div className="flex items-center gap-3">
                        <HeadsetIcon className="w-6 h-6 text-brand-primary" />
                        <h2 className="text-xl font-bold text-white">Ascent Coach</h2>
                    </div>
                    <button onClick={onClose} className="text-brand-text hover:text-white" aria-label="Close chat">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="flex flex-col gap-4">
                        {messages.map((msg) => (
                           <div key={msg.id} className={`flex gap-3 ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                                {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-brand-primary flex-shrink-0 flex items-center justify-center"><HeadsetIcon className="w-5 h-5 text-white"/></div>}
                                <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'ai' ? 'bg-brand-background text-brand-text' : 'bg-brand-primary text-white'}`}>
                                    {msg.isLoading ? (
                                        <div className="flex items-center gap-2" aria-label="Loading response">
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    )}
                                </div>
                           </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                </div>

                <footer className="p-4 border-t border-brand-muted">
                    <form onSubmit={handleSend} className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask the coach for a 'game plan'..."
                            className="flex-1 px-3 py-2 text-white bg-brand-background border border-brand-muted rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            disabled={isLoading}
                            aria-label="Chat input"
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="py-2 px-6 bg-brand-primary hover:bg-indigo-700 text-white font-semibold rounded-md disabled:bg-brand-muted disabled:cursor-not-allowed">
                            Send
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default AscentCoachModal;
