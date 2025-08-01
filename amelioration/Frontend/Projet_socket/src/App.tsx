import React, { useState, useEffect, useRef } from 'react';
import { Send, Wifi, WifiOff, Globe, Trash2, MessageCircle, Clock } from 'lucide-react';

const DJANGO_SERVER_URL = 'http://localhost:8000';

export default function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState('http');
  const [isLoading, setIsLoading] = useState(false);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchMessageHistory();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const fetchMessageHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${DJANGO_SERVER_URL}/api/history/`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.slice(0, 10));
      }
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current) wsRef.current.close();

    const wsUrl = DJANGO_SERVER_URL.replace('http', 'ws') + '/ws/echo/';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionType('websocket');
      addMessage("Connexion WebSocket établie", 'system');
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'echo') {
        addMessage(`ECHO TCP/IP : ${data.message}`, 'received');
      } else if (data.type === 'error') {
        addMessage(`Erreur: ${data.message}`, 'error');
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      addMessage('Connexion WebSocket fermée', 'system');
    };

    ws.onerror = () => {
      setIsConnected(false);
      addMessage('Erreur WebSocket', 'error');
    };
  };

  const disconnectWebSocket = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setConnectionType('http');
    addMessage('Basculement vers le mode HTTP', 'system');
  };

  const addMessage = (text, type = 'sent') => {
    setMessages(prev => [
      {
        id: Date.now() + Math.random(),
        message: text,
        timestamp: new Date().toISOString(),
        type,
      },
      ...prev
    ]);
  };

  const sendViaHTTP = async () => {
    if (!message.trim()) return;
    
    const currentMessage = message;
    addMessage(currentMessage, 'sent');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(`${DJANGO_SERVER_URL}/api/echo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMessage }),
      });

      const data = await res.json();
      if (res.ok) {
        addMessage(`ECHO HTTP : data.echo`, 'received');
      } else {
        addMessage(`Erreur: ${data.error}`, 'error');
      }
    } catch {
      addMessage("Erreur de connexion au serveur", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sendViaWebSocket = () => {
    if (!message.trim()) return;
    if (!isConnected || !wsRef.current) return;

    try {
      const currentMessage = message;
      addMessage(currentMessage, 'sent');
      wsRef.current.send(JSON.stringify({ message: currentMessage }));
      setMessage('');
    } catch {
      addMessage("Erreur lors de l'envoi", 'error');
    }
  };

  const handleSendMessage = () => {
    if (connectionType === 'websocket' && isConnected) {
      sendViaWebSocket();
    } else {
      sendViaHTTP();
    }
  };

  const formatTimestamp = (ts) =>
    new Date(ts).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });

  const getMessageClass = (type) => {
    const animations = "transform transition-all duration-300 ease-out opacity-0 animate-[fadeInUp_0.3s_ease-out_forwards]";
    const base = `p-4 rounded-2xl mb-4 max-w-[70%] shadow-lg ${animations}`;
    
    return {
      sent: `${base} bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-auto`,
      received: `${base} bg-gradient-to-br from-green-500 to-green-600 text-white mr-auto`,
      system: `${base} bg-gradient-to-br from-gray-400 to-gray-500 text-white mx-auto text-sm max-w-md`,
      error: `${base} bg-gradient-to-br from-red-500 to-red-600 text-white mr-auto`,
    }[type] || `${base} bg-gradient-to-br from-gray-500 to-gray-600 text-white`;
  };

  const ConnectionIndicator = () => (
    <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
      {connectionType === 'websocket' ? (
        <>
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-400 animate-pulse" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span className="text-sm font-medium text-white">
            {isConnected ? 'WebSocket Actif' : 'WebSocket Déconnecté'}
          </span>
        </>
      ) : (
        <>
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Mode HTTP</span>
        </>
      )}
    </div>
  );

  const ActionButton = ({ variant, icon: Icon, children, onClick, disabled = false }) => {
    const variants = {
      primary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      secondary: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      warning: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          ${variants[variant]}
          text-white px-6 py-2.5 rounded-full font-semibold
          transition-all duration-300 transform hover:scale-105 hover:shadow-lg
          flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed
          disabled:hover:scale-100 shadow-md
        `}
      >
        <Icon className="w-4 h-4" />
        <span>{children}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header moderne */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Echo Client Pro
                </h1>
                <p className="text-gray-400 text-sm mt-1">Communication en temps réel</p>
              </div>
            </div>
            <ConnectionIndicator />
          </div>
        </div>
      </header>

      {/* Panneau de contrôle */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 px-8 py-4">
        <div className="flex justify-center space-x-4">
          <ActionButton 
            variant="primary" 
            icon={Globe} 
            onClick={disconnectWebSocket}
          >
            Mode HTTP
          </ActionButton>
          <ActionButton 
            variant="secondary" 
            icon={Wifi} 
            onClick={connectWebSocket}
          >
            WebSocket
          </ActionButton>
          <ActionButton 
            variant="warning" 
            icon={Trash2} 
            onClick={() => setMessages([])}
          >
            Effacer
          </ActionButton>
        </div>
      </div>

      {/* Zone de messages */}
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Chargement des messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-3xl inline-block backdrop-blur-sm border border-white/10">
                <MessageCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Aucun message</h3>
                <p className="text-gray-400">Commencez une conversation dès maintenant !</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.slice().reverse().map((msg, index) => (
                <div key={msg.id || index} className={getMessageClass(msg.type)}>
                  <div className="font-medium">{msg.message}</div>
                  <div className="flex items-center space-x-1 text-xs opacity-75 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(msg.timestamp)}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Zone de saisie moderne */}
      <footer className="bg-white/5 backdrop-blur-xl border-t border-white/10 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tapez votre message ici..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 
                         text-white placeholder-gray-400 resize-none max-h-32 min-h-[56px]
                         border border-white/20 focus:border-blue-500/50 focus:ring-2 
                         focus:ring-blue-500/20 transition-all duration-300 focus:outline-none
                         scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                rows={1}
                maxLength={500}
                disabled={isLoading}
              />
              <div className="absolute bottom-2 right-4 text-xs text-gray-500">
                {message.length}/500
              </div>
            </div>
            <ActionButton 
              variant="success"
              icon={Send}
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? 'Envoi...' : 'Envoyer'}
            </ActionButton>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}