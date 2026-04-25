import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3141';
const WS_URL = 'ws://localhost:3142';

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  applications: any[];
  scores: any[];
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedTab, setSelectedTab] = useState<'chat' | 'candidates' | 'config'>('chat');
  const [jobConfig, setJobConfig] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchChatHistory();
    fetchCandidates();
    fetchJobConfig();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectWebSocket = () => {
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket event:', data);
      
      if (data.event === 'new_application' || data.event === 'candidate_rejected' || data.event === 'interview_scheduled') {
        fetchCandidates();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(connectWebSocket, 3000);
    };

    wsRef.current = ws;
  };

  const fetchChatHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/history`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/candidates`);
      setCandidates(res.data.candidates);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    }
  };

  const fetchJobConfig = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/config/job`);
      setJobConfig(res.data.job);
    } catch (err) {
      console.error('Failed to fetch job config:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'EMPLOYER',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const res = await axios.post(`${API_URL}/api/chat/message`, {
        message: input,
      });

      const botMessage: Message = {
        role: 'ORCHESTRATOR',
        content: res.data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const updateJobConfig = async () => {
    if (!jobConfig) return;

    try {
      await axios.put(`${API_URL}/api/config/job`, jobConfig);
      alert('Job configuration updated');
    } catch (err) {
      console.error('Failed to update job config:', err);
      alert('Update failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold">AI Recruitment Orchestrator</h1>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        <nav className="w-64 bg-gray-800 border-r border-gray-700 p-4">
          <button
            onClick={() => setSelectedTab('chat')}
            className={`w-full text-left p-3 rounded mb-2 ${
              selectedTab === 'chat' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            Chat with Orchestrator
          </button>
          <button
            onClick={() => setSelectedTab('candidates')}
            className={`w-full text-left p-3 rounded mb-2 ${
              selectedTab === 'candidates' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            Candidates
          </button>
          <button
            onClick={() => setSelectedTab('config')}
            className={`w-full text-left p-3 rounded ${
              selectedTab === 'config' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            Configuration
          </button>
        </nav>

        <main className="flex-1 p-6 overflow-auto">
          {selectedTab === 'chat' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-auto mb-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      msg.role === 'EMPLOYER'
                        ? 'bg-blue-600 ml-auto max-w-xl'
                        : 'bg-gray-700 max-w-xl'
                    }`}
                  >
                    <div className="text-xs text-gray-300 mb-1">
                      {msg.role} - {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask orchestrator anything..."
                  className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded"
                />
                <button
                  onClick={sendMessage}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {selectedTab === 'candidates' && (
            <div>
              <h2 className="text-xl font-bold mb-4">All Candidates</h2>
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-gray-800 p-4 rounded-lg border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">{candidate.name}</h3>
                        <p className="text-sm text-gray-400">{candidate.email}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-sm ${
                          candidate.applications[0]?.status === 'ACCEPTED'
                            ? 'bg-green-600'
                            : candidate.applications[0]?.status === 'REJECTED'
                            ? 'bg-red-600'
                            : candidate.applications[0]?.status === 'HUMAN_REVIEW'
                            ? 'bg-yellow-600'
                            : 'bg-gray-600'
                        }`}
                      >
                        {candidate.applications[0]?.status || 'N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-gray-400">Total Score:</span>{' '}
                        {candidate.applications[0]?.totalScore || 0}/100
                      </div>
                      <div>
                        <span className="text-gray-400">Applied:</span>{' '}
                        {new Date(candidate.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-gray-400">Scores:</span> Intake:{' '}
                        {candidate.scores.find((s) => s.stage === 'INTAKE')?.score || 0},
                        Research:{' '}
                        {candidate.scores.find((s) => s.stage === 'RESEARCH')?.score || 0},
                        Screener:{' '}
                        {candidate.scores.find((s) => s.stage === 'SCREENER')?.score || 0}
                      </div>
                    </div>
                    {candidate.applications[0]?.scheduledAt && (
                      <div className="mt-2 text-sm text-green-400">
                        Interview: {new Date(candidate.applications[0].scheduledAt).toLocaleString()}
                        <br />
                        <a
                          href={candidate.applications[0].meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 underline"
                        >
                          Google Meet Link
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'config' && jobConfig && (
            <div>
              <h2 className="text-xl font-bold mb-4">Job Configuration</h2>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={jobConfig.title}
                    onChange={(e) =>
                      setJobConfig({ ...jobConfig, title: e.target.value })
                    }
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Required Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={jobConfig.requiredSkills.join(', ')}
                    onChange={(e) =>
                      setJobConfig({
                        ...jobConfig,
                        requiredSkills: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Nice-to-Have Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={jobConfig.niceToHave.join(', ')}
                    onChange={(e) =>
                      setJobConfig({
                        ...jobConfig,
                        niceToHave: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Minimum Experience (years)
                  </label>
                  <input
                    type="number"
                    value={jobConfig.minimumExperienceYears}
                    onChange={(e) =>
                      setJobConfig({
                        ...jobConfig,
                        minimumExperienceYears: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded"
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={jobConfig.portfolioRequired}
                      onChange={(e) =>
                        setJobConfig({
                          ...jobConfig,
                          portfolioRequired: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Portfolio Required
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={jobConfig.githubRequired}
                      onChange={(e) =>
                        setJobConfig({
                          ...jobConfig,
                          githubRequired: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    GitHub Required
                  </label>
                </div>

                <button
                  onClick={updateJobConfig}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;