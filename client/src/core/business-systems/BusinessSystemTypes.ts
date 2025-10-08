/**
 * Nexus Business Body - Universal Business Systems
 * 
 * Defines the 8 autonomous business systems that work with the 7 building blocks
 * to create a living, self-optimizing business organism.
 */

// ===== BUILDING BLOCKS (Fundamental Elements) =====
export type BuildingBlock = 
  | 'identity'    // Business DNA and core identity
  | 'revenue'     // Customer relationships and sales
  | 'cash'        // Financial resources and flow
  | 'delivery'    // Value creation and operations
  | 'people'      // Human capital and culture
  | 'knowledge'   // Information and intelligence
  | 'systems';    // Infrastructure and tools

// ===== AUTONOMOUS BUSINESS SYSTEMS (Body Systems) =====
export type BusinessSystem = 
  | 'cashFlow'        // Cardiovascular - Circulates financial resources
  | 'intelligence'    // Nervous - Processes information and coordinates
  | 'customerIntel'   // Respiratory - Absorbs market info and exchanges value
  | 'operations'      // Muscular - Executes work and delivers value
  | 'infrastructure'  // Skeletal - Provides structure and governance
  | 'knowledgeMgmt'   // Digestive - Processes and distributes information
  | 'growthDev'       // Endocrine - Manages growth and development
  | 'riskMgmt';       // Immune - Protects from threats and maintains resilience

// ===== SYSTEM HEALTH STATUS =====
export type SystemHealth = 
  | 'optimal'     // System performing at peak efficiency
  | 'healthy'     // System functioning normally
  | 'warning'     // System showing signs of stress
  | 'critical'    // System requires immediate attention
  | 'failed';     // System has stopped functioning

// ===== SYSTEM INTERACTION TYPES =====
export type InteractionType = 
  | 'data_flow'       // Data moving between systems
  | 'dependency'      // One system depends on another
  | 'optimization'    // Systems optimizing each other
  | 'alert'          // Systems alerting each other
  | 'coordination';   // Systems coordinating actions

// ===== CORE INTERFACES =====

export interface BuildingBlockData {
  id: BuildingBlock;
  name: string;
  description: string;
  health: SystemHealth;
  metrics: Record<string, number>;
  lastUpdated: string;
  dependencies: BuildingBlock[];
}

export interface BusinessSystemData {
  id: BusinessSystem;
  name: string;
  description: string;
  health: SystemHealth;
  status: 'active' | 'inactive' | 'maintenance';
  metrics: SystemMetrics;
  interactions: SystemInteraction[];
  lastUpdated: string;
  autoOptimization: boolean;
}

export interface SystemMetrics {
  efficiency: number;        // 0-100: How efficiently the system is operating
  throughput: number;        // 0-100: How much work the system is processing
  quality: number;          // 0-100: Quality of system outputs
  reliability: number;      // 0-100: System uptime and consistency
  adaptability: number;     // 0-100: How well system adapts to changes
  overall: number;          // 0-100: Composite health score
}

export interface SystemInteraction {
  id: string;
  fromSystem: BusinessSystem;
  toSystem: BusinessSystem;
  type: InteractionType;
  strength: number;         // 0-100: How strong the interaction is
  dataFlow: string[];       // What data is flowing
  lastActivity: string;
  health: SystemHealth;
}

export interface BusinessBodyState {
  overallHealth: SystemHealth;
  systems: Record<BusinessSystem, BusinessSystemData>;
  buildingBlocks: Record<BuildingBlock, BuildingBlockData>;
  interactions: SystemInteraction[];
  lastOptimization: string;
  autoOptimizationEnabled: boolean;
  alerts: BusinessAlert[];
  recommendations: BusinessRecommendation[];
}

export interface BusinessAlert {
  id: string;
  system: BusinessSystem;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  actionRequired: boolean;
  recommendedAction?: string;
}

export interface BusinessRecommendation {
  id: string;
  title: string;
  description: string;
  systems: BusinessSystem[];
  buildingBlocks: BuildingBlock[];
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  estimatedBenefit: number;
  implementationSteps: string[];
  timestamp: string;
}

// ===== SYSTEM-SPECIFIC INTERFACES =====

// Cardiovascular System - Cash Flow Management
export interface CashFlowSystemData extends BusinessSystemData {
  cashFlowVelocity: number;      // How fast money moves through the business
  workingCapitalEfficiency: number;
  paymentCycleTime: number;      // Days to collect payments
  financialRunway: number;       // Months of runway remaining
  cashFlowForecast: CashFlowForecast[];
  automatedPayments: AutomatedPayment[];
}

export interface CashFlowForecast {
  date: string;
  projectedInflow: number;
  projectedOutflow: number;
  netFlow: number;
  confidence: number;
}

export interface AutomatedPayment {
  id: string;
  type: 'invoice' | 'expense' | 'payroll' | 'tax';
  amount: number;
  dueDate: string;
  status: 'pending' | 'processed' | 'failed';
  automationLevel: 'manual' | 'semi-auto' | 'full-auto';
}

// Nervous System - Business Intelligence
export interface IntelligenceSystemData extends BusinessSystemData {
  decisionAccuracy: number;      // How accurate AI decisions are
  responseTime: number;          // Time to respond to issues (minutes)
  learningVelocity: number;      // How fast system learns and improves
  strategicAlignment: number;    // Alignment with business goals
  activeAlerts: number;
  predictiveInsights: PredictiveInsight[];
  automatedDecisions: AutomatedDecision[];
}

export interface PredictiveInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'optimization' | 'trend';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  impact: number;
  recommendedAction: string;
}

export interface AutomatedDecision {
  id: string;
  type: 'resource_allocation' | 'pricing' | 'inventory' | 'hiring';
  decision: string;
  reasoning: string;
  confidence: number;
  timestamp: string;
  outcome?: string;
}

// Respiratory System - Customer Intelligence
export interface CustomerIntelSystemData extends BusinessSystemData {
  customerSatisfaction: number;  // Overall satisfaction score
  marketShareGrowth: number;     // Market share growth rate
  leadConversionRate: number;    // Lead to customer conversion
  customerLifetimeValue: number; // Average customer value
  marketTrends: MarketTrend[];
  customerSegments: CustomerSegment[];
  automatedEngagement: AutomatedEngagement[];
}

export interface MarketTrend {
  id: string;
  trend: string;
  direction: 'up' | 'down' | 'stable';
  strength: number;
  impact: 'positive' | 'negative' | 'neutral';
  timeframe: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  size: number;
  value: number;
  satisfaction: number;
  growthRate: number;
  engagement: number;
}

export interface AutomatedEngagement {
  id: string;
  type: 'email' | 'social' | 'support' | 'sales';
  target: string;
  message: string;
  status: 'scheduled' | 'sent' | 'responded' | 'converted';
  timestamp: string;
}

// Muscular System - Operations & Delivery
export interface OperationsSystemData extends BusinessSystemData {
  operationalEfficiency: number; // Overall operational efficiency
  qualityMetrics: number;        // Quality score across operations
  deliverySpeed: number;         // Speed of value delivery
  resourceUtilization: number;   // How well resources are used
  automatedProcesses: AutomatedProcess[];
  qualityControls: QualityControl[];
  performanceMetrics: PerformanceMetric[];
}

export interface AutomatedProcess {
  id: string;
  name: string;
  automationLevel: number;       // 0-100: How automated the process is
  efficiency: number;            // 0-100: Process efficiency
  throughput: number;            // Units processed per time period
  quality: number;               // 0-100: Process quality
  lastOptimized: string;
}

export interface QualityControl {
  id: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  status: 'pass' | 'warning' | 'fail';
  trend: 'improving' | 'stable' | 'declining';
  lastCheck: string;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  status: 'on_target' | 'below_target' | 'above_target';
  trend: 'up' | 'down' | 'stable';
}

// Skeletal System - Infrastructure & Governance
export interface InfrastructureSystemData extends BusinessSystemData {
  complianceStatus: number;      // Overall compliance score
  riskExposure: number;          // Current risk exposure level
  systemUptime: number;          // System availability percentage
  securityPosture: number;       // Security health score
  complianceChecks: ComplianceCheck[];
  riskAssessments: RiskAssessment[];
  securityIncidents: SecurityIncident[];
}

export interface ComplianceCheck {
  id: string;
  regulation: string;
  status: 'compliant' | 'non_compliant' | 'pending';
  lastCheck: string;
  nextCheck: string;
  risk: 'low' | 'medium' | 'high';
}

export interface RiskAssessment {
  id: string;
  riskType: 'operational' | 'financial' | 'strategic' | 'compliance';
  description: string;
  probability: number;           // 0-100: Likelihood of occurrence
  impact: number;                // 0-100: Potential impact
  mitigation: string;
  status: 'active' | 'mitigated' | 'monitoring';
}

export interface SecurityIncident {
  id: string;
  type: 'breach' | 'threat' | 'vulnerability' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected: string;
  resolved?: string;
  status: 'active' | 'resolved' | 'investigating';
}

// Digestive System - Knowledge Management
export interface KnowledgeMgmtSystemData extends BusinessSystemData {
  dataQuality: number;           // Overall data quality score
  knowledgeAccessibility: number; // How easily knowledge is accessed
  learningVelocity: number;      // Speed of knowledge acquisition
  informationAccuracy: number;   // Accuracy of stored information
  knowledgeBases: KnowledgeBase[];
  learningPrograms: LearningProgram[];
  dataSources: DataSource[];
}

export interface KnowledgeBase {
  id: string;
  name: string;
  type: 'documentation' | 'procedures' | 'best_practices' | 'lessons_learned';
  size: number;                  // Number of items
  quality: number;               // 0-100: Quality score
  accessibility: number;         // 0-100: How easily accessed
  lastUpdated: string;
}

export interface LearningProgram {
  id: string;
  name: string;
  type: 'training' | 'certification' | 'skill_development' | 'onboarding';
  participants: number;
  completionRate: number;
  effectiveness: number;         // 0-100: How effective the program is
  status: 'active' | 'completed' | 'planned';
}

export interface DataSource {
  id: string;
  name: string;
  type: 'internal' | 'external' | 'third_party';
  reliability: number;           // 0-100: Data source reliability
  updateFrequency: string;
  lastSync: string;
  status: 'active' | 'inactive' | 'error';
}

// Endocrine System - Growth & Development
export interface GrowthDevSystemData extends BusinessSystemData {
  growthRate: number;            // Overall business growth rate
  marketExpansion: number;       // Market expansion success
  innovationVelocity: number;    // Speed of innovation
  talentDevelopment: number;     // Employee development success
  growthInitiatives: GrowthInitiative[];
  marketOpportunities: MarketOpportunity[];
  talentPrograms: TalentProgram[];
}

export interface GrowthInitiative {
  id: string;
  name: string;
  type: 'product' | 'market' | 'acquisition' | 'partnership';
  status: 'planning' | 'active' | 'completed' | 'paused';
  progress: number;              // 0-100: Completion percentage
  impact: number;                // 0-100: Expected impact
  timeline: string;
  resources: string[];
}

export interface MarketOpportunity {
  id: string;
  market: string;
  size: number;                  // Market size in dollars
  growthRate: number;            // Market growth rate
  competition: number;           // 0-100: Competition level
  fit: number;                   // 0-100: How well business fits
  priority: 'low' | 'medium' | 'high';
  status: 'identified' | 'evaluating' | 'pursuing' | 'captured';
}

export interface TalentProgram {
  id: string;
  name: string;
  type: 'recruitment' | 'training' | 'retention' | 'succession';
  participants: number;
  successRate: number;           // 0-100: Program success rate
  impact: number;                // 0-100: Impact on business
  status: 'active' | 'completed' | 'planned';
}

// Immune System - Risk Management
export interface RiskMgmtSystemData extends BusinessSystemData {
  threatDetectionRate: number;   // Percentage of threats detected
  responseTime: number;          // Time to respond to threats (minutes)
  recoveryCapability: number;    // 0-100: Ability to recover from issues
  vulnerabilityStatus: number;   // Overall vulnerability score
  activeThreats: ActiveThreat[];
  riskMitigations: RiskMitigation[];
  recoveryPlans: RecoveryPlan[];
}

export interface ActiveThreat {
  id: string;
  type: 'security' | 'operational' | 'financial' | 'reputational';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected: string;
  status: 'active' | 'mitigating' | 'resolved';
  responseTime: number;          // Minutes to respond
  impact: number;                // 0-100: Potential impact
}

export interface RiskMitigation {
  id: string;
  riskType: string;
  strategy: string;
  effectiveness: number;         // 0-100: How effective the mitigation is
  cost: number;                  // Cost of mitigation
  status: 'planned' | 'implementing' | 'active' | 'review';
  lastUpdated: string;
}

export interface RecoveryPlan {
  id: string;
  scenario: string;
  recoveryTime: number;          // Hours to recover
  successRate: number;           // 0-100: Likelihood of successful recovery
  resources: string[];
  status: 'draft' | 'approved' | 'tested' | 'active';
  lastTested: string;
}

// ===== SYSTEM CONFIGURATION =====
export interface SystemConfiguration {
  system: BusinessSystem;
  enabled: boolean;
  autoOptimization: boolean;
  alertThresholds: Record<string, number>;
  optimizationRules: OptimizationRule[];
  integrationSettings: IntegrationSetting[];
}

export interface OptimizationRule {
  id: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export interface IntegrationSetting {
  system: BusinessSystem;
  dataFlow: string[];
  frequency: string;
  enabled: boolean;
}

// ===== BUSINESS BODY CONFIGURATION =====
export interface BusinessBodyConfiguration {
  businessSize: 'micro' | 'small' | 'medium' | 'large';
  industry: string;
  systems: Record<BusinessSystem, SystemConfiguration>;
  autoOptimizationEnabled: boolean;
  alertSettings: AlertSettings;
  optimizationSettings: OptimizationSettings;
}

export interface AlertSettings {
  emailAlerts: boolean;
  pushNotifications: boolean;
  dashboardAlerts: boolean;
  escalationRules: EscalationRule[];
}

export interface EscalationRule {
  severity: 'low' | 'medium' | 'high' | 'critical';
  responseTime: number;          // Minutes
  escalationPath: string[];
  autoActions: string[];
}

export interface OptimizationSettings {
  frequency: 'hourly' | 'daily' | 'weekly';
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  learningEnabled: boolean;
  adaptationRate: number;        // 0-100: How quickly system adapts
}
