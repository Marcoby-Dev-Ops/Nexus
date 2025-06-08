/**
 * businessProcessMining.ts
 * Intelligent business process discovery and optimization system
 * Analyzes user interactions to discover inefficient processes and suggest improvements
 */

import { supabase } from './supabase';
import { n8nService } from './n8nService';

interface ProcessStep {
  id: string;
  action: string;
  component: string;
  timestamp: Date;
  duration: number;
  userId: string;
  sessionId: string;
  context: Record<string, any>;
  outcome: 'success' | 'failure' | 'abandoned';
}

interface BusinessProcess {
  id: string;
  name: string;
  department: string;
  steps: ProcessStep[];
  frequency: number;
  averageDuration: number;
  successRate: number;
  bottlenecks: ProcessBottleneck[];
  optimizationPotential: number;
  lastAnalyzed: Date;
}

interface ProcessBottleneck {
  stepId: string;
  type: 'time' | 'error' | 'abandonment' | 'complexity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number;
  suggestedSolution: string;
}

interface ProcessOptimization {
  processId: string;
  type: 'elimination' | 'automation' | 'simplification' | 'reordering';
  title: string;
  description: string;
  expectedTimeSaving: number;
  expectedErrorReduction: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  automationWorkflow?: string;
  alternativeFlowDesign?: ProcessStep[];
}

class BusinessProcessMining {
  private analysisQueue: string[] = [];
  private isAnalyzing = false;

  /**
   * Track a process step for later analysis
   */
  async trackProcessStep(step: Omit<ProcessStep, 'id'>): Promise<void> {
    const stepWithId: ProcessStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...step
    };

    // Store in database for analysis
    const { error } = await supabase
      .from('process_steps')
      .insert({
        id: stepWithId.id,
        action: stepWithId.action,
        component: stepWithId.component,
        timestamp: stepWithId.timestamp.toISOString(),
        duration: stepWithId.duration,
        user_id: stepWithId.userId,
        session_id: stepWithId.sessionId,
        context: stepWithId.context,
        outcome: stepWithId.outcome
      });

    if (error) {
      console.error('Failed to track process step:', error);
      return;
    }

    // Queue for real-time analysis if it's a critical process
    if (this.isCriticalProcess(stepWithId)) {
      this.queueForAnalysis(stepWithId.sessionId);
    }
  }

  /**
   * Discover business processes from tracked data
   */
  async discoverProcesses(timeWindow: number = 7): Promise<BusinessProcess[]> {
    const startDate = new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000);
    
    // Get process steps from the time window
    const { data: steps, error } = await supabase
      .from('process_steps')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error || !steps) {
      console.error('Failed to fetch process steps:', error);
      return [];
    }

    // Group steps into sessions/processes
    const sessionGroups = this.groupStepsBySession(steps);
    
    // Identify distinct process patterns
    const processPatterns = this.identifyProcessPatterns(sessionGroups);
    
    // Convert patterns to business processes
    const businessProcesses = await Promise.all(
      processPatterns.map(pattern => this.analyzeProcess(pattern))
    );

    return businessProcesses;
  }

  /**
   * Analyze a specific process for bottlenecks and optimization opportunities
   */
  private async analyzeProcess(processSteps: ProcessStep[]): Promise<BusinessProcess> {
    const processName = this.inferProcessName(processSteps);
    const department = this.inferDepartment(processSteps);
    
    // Calculate metrics
    const frequency = await this.calculateProcessFrequency(processSteps);
    const averageDuration = this.calculateAverageDuration(processSteps);
    const successRate = this.calculateSuccessRate(processSteps);
    
    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(processSteps);
    
    // Calculate optimization potential
    const optimizationPotential = this.calculateOptimizationPotential(processSteps, bottlenecks);

    return {
      id: `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: processName,
      department,
      steps: processSteps,
      frequency,
      averageDuration,
      successRate,
      bottlenecks,
      optimizationPotential,
      lastAnalyzed: new Date()
    };
  }

  /**
   * Generate optimization recommendations for a process
   */
  async generateOptimizations(process: BusinessProcess): Promise<ProcessOptimization[]> {
    const optimizations: ProcessOptimization[] = [];

    // 1. Automation opportunities
    const automationOpps = await this.identifyAutomationOpportunities(process);
    optimizations.push(...automationOpps);

    // 2. Step elimination opportunities
    const eliminationOpps = this.identifyEliminationOpportunities(process);
    optimizations.push(...eliminationOpps);

    // 3. Process reordering opportunities
    const reorderingOpps = this.identifyReorderingOpportunities(process);
    optimizations.push(...reorderingOpps);

    // 4. Simplification opportunities
    const simplificationOpps = this.identifySimplificationOpportunities(process);
    optimizations.push(...simplificationOpps);

    return optimizations.sort((a, b) => b.expectedTimeSaving - a.expectedTimeSaving);
  }

  /**
   * Auto-implement safe optimizations
   */
  async autoOptimizeProcess(processId: string): Promise<boolean> {
    const { data: processData, error } = await supabase
      .from('business_processes')
      .select('*')
      .eq('id', processId)
      .single();

    if (error || !processData) {
      console.error('Failed to fetch process for optimization:', error);
      return false;
    }

    const process: BusinessProcess = this.deserializeProcess(processData);
    const optimizations = await this.generateOptimizations(process);
    
    // Only auto-implement low complexity, high impact optimizations
    const safeOptimizations = optimizations.filter(opt => 
      opt.implementationComplexity === 'low' && 
      opt.expectedTimeSaving > 10
    );

    let implementedCount = 0;
    for (const optimization of safeOptimizations.slice(0, 2)) { // Limit to 2 per run
      try {
        await this.implementOptimization(optimization);
        implementedCount++;
      } catch (error) {
        console.error('Failed to implement optimization:', error);
      }
    }

    return implementedCount > 0;
  }

  /**
   * Identify automation opportunities in a process
   */
  private async identifyAutomationOpportunities(process: BusinessProcess): Promise<ProcessOptimization[]> {
    const automationOpps: ProcessOptimization[] = [];

    // Look for repetitive manual data entry
    const dataEntrySteps = process.steps.filter(step => 
      step.action.includes('input') || 
      step.action.includes('enter') ||
      step.action.includes('fill')
    );

    if (dataEntrySteps.length >= 3) {
      const workflow = await this.generateAutomationWorkflow(dataEntrySteps);
      
      automationOpps.push({
        processId: process.id,
        type: 'automation',
        title: 'Automate Data Entry Sequence',
        description: `Automate the repetitive data entry steps in ${process.name}`,
        expectedTimeSaving: dataEntrySteps.length * 15, // 15 seconds per automated step
        expectedErrorReduction: 25, // 25% error reduction
        implementationComplexity: 'medium',
        automationWorkflow: workflow
      });
    }

    // Look for API call opportunities
    const manualLookupSteps = process.steps.filter(step =>
      step.action.includes('search') ||
      step.action.includes('lookup') ||
      step.action.includes('check')
    );

    if (manualLookupSteps.length >= 2) {
      automationOpps.push({
        processId: process.id,
        type: 'automation',
        title: 'Automate Information Lookup',
        description: `Replace manual lookups with automated API calls`,
        expectedTimeSaving: manualLookupSteps.length * 30,
        expectedErrorReduction: 40,
        implementationComplexity: 'low',
        automationWorkflow: await this.generateLookupAutomation(manualLookupSteps)
      });
    }

    return automationOpps;
  }

  /**
   * Identify steps that can be eliminated
   */
  private identifyEliminationOpportunities(process: BusinessProcess): ProcessOptimization[] {
    const eliminations: ProcessOptimization[] = [];

    // Find redundant verification steps
    const verificationSteps = process.steps.filter(step =>
      step.action.includes('verify') ||
      step.action.includes('confirm') ||
      step.action.includes('check')
    );

    if (verificationSteps.length > 1) {
      eliminations.push({
        processId: process.id,
        type: 'elimination',
        title: 'Eliminate Redundant Verification',
        description: `Remove ${verificationSteps.length - 1} redundant verification steps`,
        expectedTimeSaving: (verificationSteps.length - 1) * 20,
        expectedErrorReduction: 0,
        implementationComplexity: 'low'
      });
    }

    // Find unnecessary approval steps for low-value transactions
    const approvalSteps = process.steps.filter(step =>
      step.action.includes('approve') ||
      step.action.includes('review')
    );

    if (approvalSteps.length > 0 && process.averageDuration > 300) { // 5+ minutes
      eliminations.push({
        processId: process.id,
        type: 'elimination',
        title: 'Streamline Approval Process',
        description: `Implement conditional approvals to bypass unnecessary review steps`,
        expectedTimeSaving: 120, // 2 minutes
        expectedErrorReduction: 5,
        implementationComplexity: 'medium'
      });
    }

    return eliminations;
  }

  /**
   * Generate n8n workflow for automation
   */
  private async generateAutomationWorkflow(steps: ProcessStep[]): Promise<string> {
    const workflowPrompt = `
Create an n8n workflow that automates these manual steps:
${steps.map(step => `- ${step.action} in ${step.component}`).join('\n')}

The workflow should:
1. Capture the same data inputs
2. Perform the same actions automatically
3. Handle errors gracefully
4. Provide status updates
5. Log all activities for audit

Return the n8n workflow JSON configuration.
`;

    // In a real implementation, this would call an AI service to generate the workflow
    const workflow = {
      name: `Auto-${steps[0]?.component || 'Process'}`,
      nodes: steps.map((step, index) => ({
        id: `node_${index}`,
        type: 'n8n-nodes-base.httpRequest',
        name: `Automate ${step.action}`,
        parameters: {
          url: `{{$json["apiEndpoint"]}}`,
          method: 'POST',
          body: `{{$json["${step.action.toLowerCase()}Data"]}}`
        }
      }))
    };

    return JSON.stringify(workflow, null, 2);
  }

  // Helper methods
  private groupStepsBySession(steps: any[]): Map<string, ProcessStep[]> {
    const sessionMap = new Map<string, ProcessStep[]>();
    
    steps.forEach(step => {
      const sessionId = step.session_id;
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, []);
      }
      sessionMap.get(sessionId)!.push({
        id: step.id,
        action: step.action,
        component: step.component,
        timestamp: new Date(step.timestamp),
        duration: step.duration,
        userId: step.user_id,
        sessionId: step.session_id,
        context: step.context || {},
        outcome: step.outcome
      });
    });

    return sessionMap;
  }

  private identifyProcessPatterns(sessionGroups: Map<string, ProcessStep[]>): ProcessStep[][] {
    // Simplified pattern identification
    // In a real implementation, this would use ML to identify similar process flows
    const patterns: ProcessStep[][] = [];
    
    sessionGroups.forEach(steps => {
      if (steps.length >= 3) { // Minimum process length
        patterns.push(steps);
      }
    });

    return patterns;
  }

  private inferProcessName(steps: ProcessStep[]): string {
    const components = [...new Set(steps.map(s => s.component))];
    const actions = [...new Set(steps.map(s => s.action))];
    
    if (components.includes('Invoice') && actions.includes('create')) {
      return 'Invoice Creation Process';
    }
    if (components.includes('Customer') && actions.includes('onboard')) {
      return 'Customer Onboarding Process';
    }
    if (components.includes('Quote') || components.includes('Proposal')) {
      return 'Sales Quote Process';
    }
    
    return `${components[0] || 'Business'} Process`;
  }

  private inferDepartment(steps: ProcessStep[]): string {
    const components = steps.map(s => s.component.toLowerCase());
    
    if (components.some(c => c.includes('invoice') || c.includes('payment') || c.includes('accounting'))) {
      return 'finance';
    }
    if (components.some(c => c.includes('customer') || c.includes('lead') || c.includes('deal'))) {
      return 'sales';
    }
    if (components.some(c => c.includes('project') || c.includes('task') || c.includes('workflow'))) {
      return 'operations';
    }
    
    return 'general';
  }

  private isCriticalProcess(step: ProcessStep): boolean {
    const criticalComponents = ['payment', 'invoice', 'contract', 'deal'];
    return criticalComponents.some(comp => 
      step.component.toLowerCase().includes(comp) ||
      step.action.toLowerCase().includes(comp)
    );
  }

  private queueForAnalysis(sessionId: string): void {
    if (!this.analysisQueue.includes(sessionId)) {
      this.analysisQueue.push(sessionId);
      this.processAnalysisQueue();
    }
  }

  private async processAnalysisQueue(): Promise<void> {
    if (this.isAnalyzing || this.analysisQueue.length === 0) return;
    
    this.isAnalyzing = true;
    
    while (this.analysisQueue.length > 0) {
      const sessionId = this.analysisQueue.shift()!;
      await this.analyzeSessionRealTime(sessionId);
    }
    
    this.isAnalyzing = false;
  }

  private async analyzeSessionRealTime(sessionId: string): Promise<void> {
    // Real-time analysis logic would go here
    console.log(`Analyzing session ${sessionId} in real-time`);
  }

  private calculateProcessFrequency(steps: ProcessStep[]): Promise<number> {
    // Would calculate based on historical data
    return Promise.resolve(steps.length);
  }

  private calculateAverageDuration(steps: ProcessStep[]): number {
    if (steps.length === 0) return 0;
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    return totalDuration / steps.length;
  }

  private calculateSuccessRate(steps: ProcessStep[]): number {
    if (steps.length === 0) return 0;
    const successfulSteps = steps.filter(step => step.outcome === 'success').length;
    return (successfulSteps / steps.length) * 100;
  }

  private identifyBottlenecks(steps: ProcessStep[]): ProcessBottleneck[] {
    const bottlenecks: ProcessBottleneck[] = [];
    
    // Find time bottlenecks
    const avgDuration = this.calculateAverageDuration(steps);
    steps.forEach(step => {
      if (step.duration > avgDuration * 2) {
        bottlenecks.push({
          stepId: step.id,
          type: 'time',
          severity: step.duration > avgDuration * 4 ? 'critical' : 'high',
          description: `Step takes ${step.duration}s, much longer than average ${avgDuration.toFixed(1)}s`,
          impact: step.duration - avgDuration,
          suggestedSolution: 'Consider automation or UI optimization'
        });
      }
    });

    return bottlenecks;
  }

  private calculateOptimizationPotential(steps: ProcessStep[], bottlenecks: ProcessBottleneck[]): number {
    let potential = 0;
    
    // Base potential from bottlenecks
    potential += bottlenecks.reduce((sum, b) => sum + b.impact, 0);
    
    // Additional potential from automation opportunities
    const automationSteps = steps.filter(s => 
      s.action.includes('manual') || 
      s.action.includes('input') ||
      s.action.includes('copy')
    );
    potential += automationSteps.length * 15; // 15 seconds per automated step
    
    return Math.min(potential, 300); // Cap at 5 minutes improvement
  }

  private identifyReorderingOpportunities(process: BusinessProcess): ProcessOptimization[] {
    return []; // Simplified for this example
  }

  private identifySimplificationOpportunities(process: BusinessProcess): ProcessOptimization[] {
    return []; // Simplified for this example
  }

  private generateLookupAutomation(steps: ProcessStep[]): Promise<string> {
    return Promise.resolve('// Lookup automation workflow JSON');
  }

  private async implementOptimization(optimization: ProcessOptimization): Promise<void> {
    // Implementation logic would go here
    console.log(`Implementing optimization: ${optimization.title}`);
  }

  private deserializeProcess(data: any): BusinessProcess {
    return data as BusinessProcess; // Simplified for this example
  }
}

export const businessProcessMining = new BusinessProcessMining(); 