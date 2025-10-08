/**
 * Business Locker Room Dashboard
 * 
 * The main dashboard that transforms business management into a "locker room" experience
 * with game mechanics that deliver serious business outcomes.
 */

import React, { useState, useEffect } from 'react';
import type { 
  BusinessPlayerCard, 
  Mission, 
  SkillTree, 
  IntegrationPowerUp, 
  AdvisorAI} from '../../core/config/nexusFeaturePresentation';
import {
  DashboardExperienceService 
} from '../../core/config/nexusFeaturePresentation';

interface BusinessLockerRoomProps {
  businessId: string;
  userId: string;
}

export const BusinessLockerRoom: React.FC<BusinessLockerRoomProps> = ({ 
  businessId, 
  userId 
}) => {
  const [playerCard, setPlayerCard] = useState<BusinessPlayerCard | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [skillTrees, setSkillTrees] = useState<SkillTree[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationPowerUp[]>([]);
  const [advisorAI, setAdvisorAI] = useState<AdvisorAI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [businessId, userId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      const businessData = await fetchBusinessData(businessId);
      const completedPlaybooks = await fetchCompletedPlaybooks(userId, businessId);
      const availablePlaybooks = await fetchAvailablePlaybooks();
      const connectedIntegrations = await fetchConnectedIntegrations(businessId);
      const availableIntegrations = await fetchAvailableIntegrations();

      // Generate dashboard components
      const playerCardData = DashboardExperienceService.generatePlayerCard(
        businessData,
        completedPlaybooks,
        connectedIntegrations
      );
      
      const missionsData = DashboardExperienceService.generateMissions(
        businessData,
        completedPlaybooks,
        availablePlaybooks
      );
      
      const skillTreesData = DashboardExperienceService.generateSkillTrees(
        businessData,
        completedPlaybooks
      );
      
      const integrationsData = DashboardExperienceService.generateIntegrationPowerUps(
        connectedIntegrations,
        availableIntegrations
      );
      
      const advisorAIData = DashboardExperienceService.generateAdvisorAI(
        businessData,
        completedPlaybooks,
        missionsData
      );

      setPlayerCard(playerCardData);
      setMissions(missionsData);
      setSkillTrees(skillTreesData);
      setIntegrations(integrationsData);
      setAdvisorAI(advisorAIData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your business locker room...</p>
        </div>
      </div>
    );
  }

  if (!playerCard) {
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
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-white">Nexus</div>
              <div className="text-slate-400">|</div>
              <div className="text-slate-300">Business Locker Room</div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Player Card */}
            <PlayerCardSection playerCard={playerCard} />
            
            {/* Next Moves - Missions */}
            <MissionsSection missions={missions} />
            
            {/* Skill Trees */}
            <SkillTreesSection skillTrees={skillTrees} />
            
            {/* Integrations Hub */}
            <IntegrationsSection integrations={integrations} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Advisor AI */}
            <AdvisorAISection advisorAI={advisorAI} />
            
            {/* Progress Summary */}
            <ProgressSummarySection playerCard={playerCard} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Player Card Component
const PlayerCardSection: React.FC<{ playerCard: BusinessPlayerCard }> = ({ playerCard }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
          {playerCard.businessName.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{playerCard.businessName}</h1>
          <p className="text-slate-400">{playerCard.tagline}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-3xl font-bold text-white">{playerCard.overallRating}</span>
          <span className="text-2xl">{playerCard.tierIcon}</span>
        </div>
        <div className="text-sm text-slate-400">{playerCard.tier}</div>
      </div>
    </div>

    {/* Attributes */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {playerCard.attributes.map((attr) => (
        <div key={attr.name} className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{attr.icon}</span>
              <span className="font-medium text-white">{attr.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-bold">{attr.value}</span>
              <span className={`text-sm ${attr.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {attr.trend === 'up' ? '↗' : '↘'} {attr.trendValue}%
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(attr.value / attr.maxValue) * 100}%`,
                backgroundColor: attr.color 
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>

    {/* Recent Level Ups */}
    <div>
      <h3 className="text-lg font-semibold text-white mb-3">Recent Level Ups</h3>
      <div className="space-y-2">
        {playerCard.recentLevelUps.map((levelUp) => (
          <div key={levelUp.id} className="flex items-center space-x-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <span className="text-green-400">🎉</span>
            <div>
              <div className="text-white font-medium">{levelUp.title}</div>
              <div className="text-sm text-slate-400">{levelUp.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Missions Section
const MissionsSection: React.FC<{ missions: Mission[] }> = ({ missions }) => {
  const primaryMission = missions.find(m => m.type === 'primary');
  const sideQuests = missions.filter(m => m.type === 'side').slice(0, 3);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-6">Next Moves</h2>
      
      {/* Primary Mission */}
      {primaryMission && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Your Next Mission</h3>
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">{primaryMission.title}</h4>
              <span className="text-orange-400 font-medium">{primaryMission.difficulty}</span>
            </div>
            <p className="text-slate-300 mb-3">{primaryMission.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {primaryMission.rewards.map((reward, index) => (
                  <span key={index} className="text-sm bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
                    {reward.value}
                  </span>
                ))}
              </div>
              <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                Start Mission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Quests */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Side Quests</h3>
        <div className="space-y-3">
          {sideQuests.map((quest) => (
            <div key={quest.id} className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">{quest.title}</h4>
                  <p className="text-sm text-slate-400">{quest.description}</p>
                </div>
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Skill Trees Section
const SkillTreesSection: React.FC<{ skillTrees: SkillTree[] }> = ({ skillTrees }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
    <h2 className="text-xl font-bold text-white mb-6">Skill Trees & Growth Paths</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {skillTrees.map((tree) => (
        <div key={tree.id} className={`rounded-lg p-4 border-2 transition-all ${
          tree.isActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-slate-600 bg-slate-700/50'
        }`}>
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-2xl">{tree.icon}</span>
            <div>
              <h3 className="text-white font-semibold">{tree.name}</h3>
              <p className="text-sm text-slate-400">{tree.description}</p>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-sm text-slate-300 mb-1">
              <span>Progress</span>
              <span>{tree.progress}%</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${tree.progress}%`,
                  backgroundColor: tree.color 
                }}
              ></div>
            </div>
          </div>
          <button className={`w-full py-2 rounded-lg transition-colors ${
            tree.isActive
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
          }`}>
            {tree.isActive ? 'Active Focus' : 'Set as Focus'}
          </button>
        </div>
      ))}
    </div>
  </div>
);

// Integrations Section
const IntegrationsSection: React.FC<{ integrations: IntegrationPowerUp[] }> = ({ integrations }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
    <h2 className="text-xl font-bold text-white mb-6">Integrations Hub (Power-Ups)</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {integrations.map((integration) => (
        <div key={integration.id} className={`rounded-lg p-4 text-center transition-all ${
          integration.status === 'connected'
            ? 'bg-green-500/20 border-2 border-green-500/30'
            : 'bg-slate-700/50 border-2 border-slate-600'
        }`}>
          <div className="text-3xl mb-2">{integration.icon}</div>
          <h3 className="text-white font-medium text-sm mb-1">{integration.name}</h3>
          <p className="text-xs text-slate-400 mb-3">{integration.description}</p>
          {integration.status === 'connected' ? (
            <div className="text-green-400 text-xs">Connected</div>
          ) : (
            <button className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
              Connect
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Advisor AI Section
const AdvisorAISection: React.FC<{ advisorAI: AdvisorAI[] }> = ({ advisorAI }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
    <h2 className="text-xl font-bold text-white mb-4">Advisor AI</h2>
    <div className="space-y-3">
      {advisorAI.slice(0, 3).map((suggestion) => (
        <div key={suggestion.id} className={`rounded-lg p-3 border-l-4 ${
          suggestion.type === 'opportunity' ? 'border-green-500 bg-green-500/10' :
          suggestion.type === 'warning' ? 'border-red-500 bg-red-500/10' :
          suggestion.type === 'achievement' ? 'border-yellow-500 bg-yellow-500/10' :
          'border-blue-500 bg-blue-500/10'
        }`}>
          <p className="text-sm text-white">{suggestion.message}</p>
          {suggestion.actionRequired && suggestion.actionText && (
            <button className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
              {suggestion.actionText}
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Progress Summary Section
const ProgressSummarySection: React.FC<{ playerCard: BusinessPlayerCard }> = ({ playerCard }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
    <h2 className="text-xl font-bold text-white mb-4">Progress Summary</h2>
    
    {/* Weekly Progress */}
    <div className="mb-4">
      <h3 className="text-sm font-medium text-slate-300 mb-2">{playerCard.weeklyProgress.period}</h3>
      <div className="text-2xl font-bold text-white mb-2">+{playerCard.weeklyProgress.overallChange}</div>
      <div className="text-sm text-slate-400">
        {playerCard.weeklyProgress.missionsCompleted} missions completed
      </div>
    </div>

    {/* Monthly Progress */}
    <div>
      <h3 className="text-sm font-medium text-slate-300 mb-2">{playerCard.monthlyProgress.period}</h3>
      <div className="text-2xl font-bold text-white mb-2">+{playerCard.monthlyProgress.overallChange}</div>
      <div className="text-sm text-slate-400">
        {playerCard.monthlyProgress.missionsCompleted} missions completed
      </div>
    </div>
  </div>
);

// Mock API functions (replace with actual implementations)
const fetchBusinessData = async (businessId: string) => {
  // TODO: Implement actual API call
  return {
    id: businessId,
    name: 'Marcoby',
    logo: null,
    focusAreas: ['growth', 'efficiency']
  };
};

const fetchCompletedPlaybooks = async (userId: string, businessId: string) => {
  // TODO: Implement actual API call
  return ['register-business-entity'];
};

const fetchAvailablePlaybooks = async () => {
  // TODO: Implement actual API call
  return [];
};

const fetchConnectedIntegrations = async (businessId: string) => {
  // TODO: Implement actual API call
  return ['hubspot', 'quickbooks'];
};

const fetchAvailableIntegrations = async () => {
  // TODO: Implement actual API call
  return [
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'CRM and marketing automation',
      icon: '🎯',
      category: 'sales',
      attributeBoosts: [{ attribute: 'revenue', boost: 10, description: 'Sales efficiency' }],
      setupTime: '30 minutes',
      features: ['CRM', 'Marketing Automation'],
      requirements: []
    }
  ];
};

export default BusinessLockerRoom;
