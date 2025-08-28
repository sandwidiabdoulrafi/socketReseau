import React, { useState, useEffect, useRef } from 'react';

const DJANGO_SERVER_URL = 'http://localhost:8000';

export default function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState('http'); // 'http' | 'websocket'

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Chargement de l'historique au montage
  useEffect(() => {
    fetchMessageHistory();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  // Scroll vers le bas lorsqu’un message est ajouté
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 📜 Chargement des messages existants
  const fetchMessageHistory = async () => {
    try {
      const res = await fetch(`${DJANGO_SERVER_URL}/api/history/`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.slice(0, 10));
      }
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique:", err);
    }
  };

  // 🌐 Connexion WebSocket
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
        addMessage(`Echo reçu: ${data.message}`, 'received');
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
      alert("Erreur: Connexion WebSocket échouée.");
    };
  };

  // ❌ Déconnexion WebSocket
  const disconnectWebSocket = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setConnectionType('http');
  };

  // ➕ Ajout d’un message local
  const addMessage = (text, type = 'sent') => {
    setMessages(prev => [
      {
        id: Date.now(),
        message: text,
        timestamp: new Date().toISOString(),
        type,
      },
      ...prev
    ]);
  };

  // ✉️ Envoi via HTTP
  const sendViaHTTP = async () => {
    if (!message.trim()) return alert("Le message ne peut pas être vide.");
    addMessage(message, 'sent');

    try {
      const res = await fetch(`${DJANGO_SERVER_URL}/api/echo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      if (res.ok) {
        addMessage(`Echo reçu: ${data.echo}`, 'received');
        setMessage('');
      } else {
        addMessage(`Erreur: ${data.error}`, 'error');
      }
    } catch {
      addMessage("Erreur de connexion au serveur", 'error');
    }
  };

  // ✉️ Envoi via WebSocket
  const sendViaWebSocket = () => {
    if (!message.trim()) return alert("Le message ne peut pas être vide.");
    if (!isConnected || !wsRef.current) return alert("WebSocket non connecté.");

    try {
      addMessage(message, 'sent');
      wsRef.current.send(JSON.stringify({ message }));
      setMessage('');
    } catch {
      addMessage("Erreur lors de l'envoi", 'error');
    }
  };

  // 🔁 Envoi selon le mode
  const handleSendMessage = () => {
    if (connectionType === 'websocket' && isConnected) {
      sendViaWebSocket();
    } else {
      sendViaHTTP();
    }
  };

  const formatTimestamp = (ts) =>
    new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const getMessageClass = (type) => {
    const base = "p-3 rounded-2xl mb-3 max-w-xs lg:max-w-md xl:max-w-lg break-words animate-fade-in";
    return {
      sent: `${base} bg-blue-500 text-white ml-auto`,
      received: `${base} bg-green-500 text-white`,
      system: `${base} bg-gray-500 text-white mx-auto text-sm`,
      error: `${base} bg-red-500 text-white`,
    }[type] || `${base} bg-gray-600 text-white`;
  };

  return (
    <div className="flex flex-col p-10 h-screen bg-slate-700">
      {/* 🧩 Header */}
      <header className="bg-slate-800 px-6 py-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Echo Client</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-200">
              {connectionType === 'websocket' ? (isConnected ? 'WebSocket Connecté' : 'WebSocket Déconnecté') : 'Mode HTTP'}
            </span>
          </div>
        </div>
      </header>

      {/* 🎛️ Boutons */}
      <div className="bg-slate-800 px-6 py-3 border-b border-slate-600 flex justify-center gap-12">
        <button className="btn bg-blue-500 p-4  rounded-lg" onClick={disconnectWebSocket}>Mode HTTP</button>
        <button className="btn bg-purple-500 p-4  rounded-lg" onClick={connectWebSocket}>WebSocket</button>
        <button className="btn bg-orange-500 p-4  rounded-lg" onClick={() => setMessages([])}>Effacer</button>

      </div>

      {/* 💬 Zone messages */}
      <main className="flex-1 p-4 overflow-y-auto bg-slate-700 custom-scrollbar">
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 italic py-8">Aucun message. Commencez une conversation !</div>
          ) : (
            messages.slice().reverse().map((msg, index) => (
              <div key={msg.id || index} className={getMessageClass(msg.type)}>
                <div>{msg.message}</div>
                <div className="text-xs text-gray-200 opacity-70 mt-1 text-right">{formatTimestamp(msg.timestamp)}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 📝 Input */}
      <footer className="bg-slate-800 p-4 border-t border-slate-600">
        <div className="flex space-x-3 items-center">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tapez votre message ici..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 bg-white rounded-2xl px-4 py-3 resize-none max-h-32 min-h-[44px] text-gray-800 focus:ring-2 focus:ring-blue-500"
            rows={1}
            maxLength={500}
          />
          <button
            className="btn bg-green-500 p-2 rounded-lg"
            onClick={handleSendMessage}
            disabled={!message.trim()}
            aria-label=" Envoyer le message"
          >
            Envoyer
          </button>
        </div>
      </footer>
    </div>
  );
}

// ✅ Réutilisable
const btnBase = "hover:scale-105 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 shadow-lg";
const btnClass = {
    'bg-blue-500': `${btnBase} bg-blue-500 hover:bg-blue-600`,
    'bg-purple-500': `${btnBase} bg-purple-500 hover:bg-purple-600`,
    'bg-orange-500': `${btnBase} bg-orange-500 hover:bg-orange-600`,
    'bg-red-500': `${btnBase} bg-red-500 hover:bg-red-600`,
};
