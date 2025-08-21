/**
 * Nexus Mobile App
 * 
 * Mobile-first business gaming experience that puts your business's
 * stats, missions, and upgrades in your pocket.
 */

import React, { useState, useEffect } from 'react';
import { 
  nexusUniverse, 
  NexusUniverseService,
  type QuantumBuildingBlock,
  type FIREPhase 
} from '../../core/config/nexusUniverse';

interface NexusMobileAppProps {
  businessId: string;
  userId: string;
}

type TabType = 'home' | 'missions' | 'skillTree' | 'integrations' | 'advisor';

export const NexusMobileApp: React.FC<NexusMobileAppProps> = ({ 
  businessId, 
  userId 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [businessData, setBusinessData] = useState<any>(null);
  const [completedPlaybooks, setCompletedPlaybooks] = useState<string[]>([]);
  const [progressionSummary, setProgressionSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdvisor, setShowAdvisor] = useState(false);

  useEffect(() => {
    loadBusinessData();
  }, [businessId, userId]);

  const loadBusinessData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      const data = await fetchBusinessData(businessId);
      const playbooks = await fetchCompletedPlaybooks(userId, businessId);
      
      setBusinessData(data);
      setCompletedPlaybooks(playbooks);
      
      const summary = NexusUniverseService.generateProgressionSummary(data, playbooks);
      setProgressionSummary(summary);
    } catch (error) {
      console.error('Error loading business data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your business...</p>
        </div>
      </div>
    );
  }

  if (!businessData || !progressionSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300">Unable to load business data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Main Content */}
      <div className="pb-20">
        {activeTab === 'home' && (
          <HomeScreen 
            businessData={businessData}
            progressionSummary={progressionSummary}
            onStartMission={() => setActiveTab('missions')}
          />
        )}
        
        {activeTab === 'missions' && (
          <MissionsScreen 
            businessData={businessData}
            completedPlaybooks={completedPlaybooks}
            onMissionComplete={loadBusinessData}
          />
        )}
        
        {activeTab === 'skillTree' && (
          <SkillTreeScreen 
            businessData={businessData}
            completedPlaybooks={completedPlaybooks}
          />
        )}
        
        {activeTab === 'integrations' && (
          <IntegrationsScreen 
            businessData={businessData}
            onIntegrationConnect={loadBusinessData}
          />
        )}
        
        {activeTab === 'advisor' && (
          <AdvisorScreen 
            businessData={businessData}
            progressionSummary={progressionSummary}
          />
        )}
      </div>

      {/* AI Advisor Chat Bubble */}
      <AIChatBubble 
        isVisible={!showAdvisor}
        onClick={() => setShowAdvisor(true)}
        message={getAdvisorMessage(progressionSummary)}
      />

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

// Home Screen - Player Card & Quick Stats
const HomeScreen: React.FC<{
  businessData: any;
  progressionSummary: any;
  onStartMission: () => void;
}> = ({ businessData, progressionSummary, onStartMission }) => {
  const { overallRating, tier, buildingBlockScores } = progressionSummary;
  const nextLevel = Math.ceil(overallRating / 10) * 10;
  const progressToNext = ((overallRating % 10) / 10) * 100;

  return (
    <div className="p-4 space-y-6">
      {/* Hero Player Card */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{businessData.name}</h1>
            <p className="text-blue-100 text-sm">{tier.name}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{overallRating}</div>
            <div className="text-blue-100 text-sm">OVR</div>
          </div>
        </div>
        
        {/* Progress Ring */}
        <div className="flex justify-center mb-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeDasharray={`${progressToNext}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold">{nextLevel}</span>
            </div>
          </div>
        </div>
        
        <p className="text-center text-blue-100 text-sm">
          {progressToNext.toFixed(0)}% to next level
        </p>
      </div>

      {/* Quick Stats - Swipeable Tiles */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Quick Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          {nexusUniverse.buildingBlocks.slice(0, 4).map((block) => (
            <div key={block.id} className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{block.icon}</span>
                <span className="text-white font-medium text-sm">{block.name}</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {buildingBlockScores[block.id] || 0}
              </div>
              <div className="w-full bg-slate-600 rounded-full h-1">
                <div 
                  className="h-1 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${buildingBlockScores[block.id] || 0}%`,
                    backgroundColor: block.color 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Mission Preview */}
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-2">Next Mission</h3>
        <p className="text-slate-300 text-sm mb-3">
          Automate your invoicing process to boost efficiency
        </p>
        <div className="flex items-center justify-between">
          <span className="text-orange-400 text-sm">+10 Efficiency</span>
          <button 
            onClick={onStartMission}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors"
          >
            Start Mission
          </button>
        </div>
      </div>
    </div>
  );
};

// Missions Screen - Quest Feed
const MissionsScreen: React.FC<{
  businessData: any;
  completedPlaybooks: string[];
  onMissionComplete: () => void;
}> = ({ businessData, completedPlaybooks, onMissionComplete }) => {
  const [missions, setMissions] = useState<any[]>([]);

  useEffect(() => {
    // Generate missions based on business state
    const availableMissions = NexusUniverseService.getAvailablePlaybooks(businessData, completedPlaybooks);
    setMissions(availableMissions.slice(0, 5).map(playbook => ({
      id: playbook.id,
      title: playbook.title,
      description: playbook.description,
      reward: '+10 ' + (playbook.buildingBlock || 'Overall'),
      difficulty: 'medium',
      estimatedTime: '2 hours',
      isCompleted: false
    })));
  }, [businessData, completedPlaybooks]);

  const handleMissionStart = (missionId: string) => {
    // TODO: Implement mission start logic
    console.log('Starting mission:', missionId);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-4">Missions</h1>
      
      {/* Primary Mission */}
      {missions.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">{missions[0].title}</h3>
            <span className="text-orange-400 text-sm font-medium">{missions[0].difficulty}</span>
          </div>
          <p className="text-slate-300 text-sm mb-3">{missions[0].description}</p>
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <span className="text-orange-400 text-sm">{missions[0].reward}</span>
              <span className="text-slate-400 text-sm">• {missions[0].estimatedTime}</span>
            </div>
            <button 
              onClick={() => handleMissionStart(missions[0].id)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors"
            >
              Start Mission
            </button>
          </div>
        </div>
      )}

      {/* Side Missions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Side Missions</h3>
        {missions.slice(1).map((mission) => (
          <div key={mission.id} className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">{mission.title}</h4>
              <span className="text-slate-400 text-xs">{mission.difficulty}</span>
            </div>
            <p className="text-slate-300 text-sm mb-3">{mission.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-blue-400 text-sm">{mission.reward}</span>
              <button 
                onClick={() => handleMissionStart(mission.id)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Skill Tree Screen - Pathways
const SkillTreeScreen: React.FC<{
  businessData: any;
  completedPlaybooks: string[];
}> = ({ businessData, completedPlaybooks }) => {
  const [selectedPath, setSelectedPath] = useState<string>('growth');

  const skillPaths = [
    { id: 'growth', name: 'Growth', icon: '📈', color: '#10B981' },
    { id: 'efficiency', name: 'Efficiency', icon: '⚡', color: '#3B82F6' },
    { id: 'finance', name: 'Finance', icon: '💰', color: '#F59E0B' },
    { id: 'team', name: 'Team', icon: '👥', color: '#EF4444' }
  ];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-4">Skill Tree</h1>
      
      {/* Path Selector */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {skillPaths.map((path) => (
          <button
            key={path.id}
            onClick={() => setSelectedPath(path.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedPath === path.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span>{path.icon}</span>
            <span className="text-sm font-medium">{path.name}</span>
          </button>
        ))}
      </div>

      {/* Skill Tree Visualization */}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <div className="space-y-4">
          {/* Root Node */}
          <div className="flex justify-center">
            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-lg font-bold">
              {skillPaths.find(p => p.id === selectedPath)?.icon}
            </div>
          </div>

          {/* Level 1 Nodes */}
          <div className="flex justify-around">
            <SkillNode 
              name="Leads"
              isUnlocked={true}
              isCompleted={false}
              onClick={() => {}}
            />
            <SkillNode 
              name="CRM"
              isUnlocked={true}
              isCompleted={true}
              onClick={() => {}}
            />
          </div>

          {/* Level 2 Nodes */}
          <div className="flex justify-around">
            <SkillNode 
              name="Automation"
              isUnlocked={true}
              isCompleted={false}
              onClick={() => {}}
            />
            <SkillNode 
              name="Analytics"
              isUnlocked={false}
              isCompleted={false}
              onClick={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Skill Node Component
const SkillNode: React.FC<{
  name: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  onClick: () => void;
}> = ({ name, isUnlocked, isCompleted, onClick }) => {
  const getNodeStyle = () => {
    if (isCompleted) return 'bg-green-600 text-white';
    if (isUnlocked) return 'bg-blue-600 text-white';
    return 'bg-slate-600 text-slate-400';
  };

  return (
    <button
      onClick={onClick}
      disabled={!isUnlocked}
      className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${getNodeStyle()}`}
    >
      {isCompleted ? '✓' : name.charAt(0)}
    </button>
  );
};

// Integrations Screen - Power-Ups
const IntegrationsScreen: React.FC<{
  businessData: any;
  onIntegrationConnect: () => void;
}> = ({ businessData, onIntegrationConnect }) => {
  const integrations = [
    { id: 'hubspot', name: 'HubSpot', icon: '🎯', status: 'connected', boost: '+10 Sales' },
    { id: 'quickbooks', name: 'QuickBooks', icon: '💰', status: 'connected', boost: '+5 Finance' },
    { id: 'slack', name: 'Slack', icon: '💬', status: 'available', boost: '+3 Team' },
    { id: 'zapier', name: 'Zapier', icon: '⚡', status: 'available', boost: '+8 Efficiency' },
    { id: 'stripe', name: 'Stripe', icon: '💳', status: 'locked', boost: '+12 Revenue' },
    { id: 'mailchimp', name: 'Mailchimp', icon: '📧', status: 'locked', boost: '+6 Growth' }
  ];

  const handleConnect = (integrationId: string) => {
    // TODO: Implement integration connection
    console.log('Connecting:', integrationId);
    onIntegrationConnect();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-4">Integrations</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <div 
            key={integration.id}
            className={`rounded-xl p-4 text-center transition-all ${
              integration.status === 'connected'
                ? 'bg-green-500/20 border-2 border-green-500/30'
                : integration.status === 'available'
                ? 'bg-slate-700/50 border-2 border-slate-600'
                : 'bg-slate-700/30 border-2 border-slate-700 opacity-50'
            }`}
          >
            <div className="text-3xl mb-2">{integration.icon}</div>
            <h3 className="text-white font-medium text-sm mb-1">{integration.name}</h3>
            <p className="text-slate-400 text-xs mb-3">{integration.boost}</p>
            
            {integration.status === 'connected' ? (
              <div className="text-green-400 text-xs">Connected</div>
            ) : integration.status === 'available' ? (
              <button 
                onClick={() => handleConnect(integration.id)}
                className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              >
                Connect
              </button>
            ) : (
              <div className="text-slate-500 text-xs">Locked</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Advisor Screen - AI Coach
const AdvisorScreen: React.FC<{
  businessData: any;
  progressionSummary: any;
}> = ({ businessData, progressionSummary }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: `Hey! I see you're at ${progressionSummary.overallRating} OVR. Want to hit the next level? I've got some great suggestions for you.`,
      timestamp: new Date()
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'ai' as const,
        message: "Great question! Based on your current progress, I'd recommend focusing on your Revenue Generation building block. You could complete the 'Sales Process Optimization' playbook to boost your score by 10 points.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-slate-800/50 p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">AI Business Coach</h1>
        <p className="text-slate-400 text-sm">Your 24/7 business advisor</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-xl ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-white'
              }`}
            >
              <p className="text-sm">{message.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask your AI coach anything..."
            className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// AI Chat Bubble Component
const AIChatBubble: React.FC<{
  isVisible: boolean;
  onClick: () => void;
  message: string;
}> = ({ isVisible, onClick, message }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <button
        onClick={onClick}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
      >
        <div className="text-2xl">🤖</div>
      </button>
      
      {/* Message Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 text-white rounded-lg p-3 shadow-lg">
        <p className="text-sm">{message}</p>
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

// Bottom Navigation
const BottomNavigation: React.FC<{
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', name: 'Home', icon: '🏠' },
    { id: 'missions', name: 'Missions', icon: '🎯' },
    { id: 'skillTree', name: 'Skills', icon: '🌳' },
    { id: 'integrations', name: 'Tools', icon: '⚡' },
    { id: 'advisor', name: 'Coach', icon: '🤖' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm border-t border-slate-700">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            className={`flex flex-col items-center py-2 px-3 transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Helper Functions
const getAdvisorMessage = (progressionSummary: any): string => {
  const { overallRating, nextActions } = progressionSummary;
  
  if (overallRating < 50) {
    return "Let's get your business foundation solid! I can help you identify your weakest areas.";
  } else if (overallRating < 80) {
    return "Great progress! Want to hit the next tier? I've got some high-impact missions for you.";
  } else {
    return "You're crushing it! Ready to become a 99 OVR business? Let's optimize those final areas.";
  }
};

// Mock API functions
const fetchBusinessData = async (businessId: string) => {
  return {
    id: businessId,
    name: 'Marcoby',
    metrics: {
      'brand-clarity': 65,
      'market-positioning': 70,
      'monthly-recurring-revenue': 25000,
      'customer-acquisition-cost': 150
    }
  };
};

const fetchCompletedPlaybooks = async (userId: string, businessId: string) => {
  return ['register-business-entity', 'define-business-identity'];
};

export default NexusMobileApp;
