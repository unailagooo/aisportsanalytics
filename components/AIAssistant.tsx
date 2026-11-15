import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Sport, Fixture, SportAnalyticsDashboardData, AIAction, MatchPrediction } from '../types';
import { getChatResponse } from '../services/geminiService';
import { BrainCircuitIcon, MessageCircleIcon } from './IconComponents';
import { LoadingSpinner } from './LoadingSpinner';

interface AIAssistantProps {
    selectedSport: Sport | null;
    visibleFixtures: Fixture[];
    analytics: SportAnalyticsDashboardData | null;
    onAiAction: (action: AIAction) => void;
    detailedPrediction: MatchPrediction | null;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ selectedSport, visibleFixtures, analytics, onAiAction, detailedPrediction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const context = {
                sport: selectedSport,
                fixtures: visibleFixtures,
                analytics: analytics,
                detailedPrediction: detailedPrediction,
            };
            const modelMessage = await getChatResponse(newMessages, context);
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="fixed bottom-6 left-6 bg-brand-accent text-brand-primary rounded-full w-16 h-16 flex items-center justify-center shadow-lg z-40 transition-transform hover:scale-110"
                aria-label="Toggle AI Assistant"
            >
                <MessageCircleIcon className="w-8 h-8" />
            </button>

            <div className={`fixed bottom-24 left-6 w-full max-w-sm bg-brand-secondary shadow-2xl z-40 rounded-lg transform transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <header className="p-4 flex justify-between items-center border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        <BrainCircuitIcon className="w-6 h-6 text-brand-accent" />
                        <h2 className="text-lg font-bold text-white">AI Forecaster</h2>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
                </header>

                <div className="flex-grow h-80 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-sm text-brand-text-secondary h-full flex items-center justify-center">
                            <p>Ask me anything about sports betting, strategy, or specific matches!</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                         <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-xs md:max-w-sm rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-brand-accent text-brand-primary' : 'bg-gray-700 text-white'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            {msg.action && msg.role === 'model' && (
                                <button 
                                    onClick={() => onAiAction(msg.action!)}
                                    className="mt-2 flex items-center gap-2 text-sm bg-brand-accent/20 text-brand-accent font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-accent/40 transition-colors"
                                >
                                    <BrainCircuitIcon className="w-4 h-4" />
                                    View Full Analysis
                                </button>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="max-w-xs md:max-w-sm rounded-lg px-3 py-2 bg-gray-700 text-white">
                                <LoadingSpinner />
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-700">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask for advice..."
                            className="flex-grow bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="bg-brand-accent hover:bg-brand-accent-dark text-brand-primary font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
