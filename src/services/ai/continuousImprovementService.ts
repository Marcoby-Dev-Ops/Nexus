import { logger } from '@/shared/utils/logger.ts';

export interface ImprovementMetrics {
  accuracy: number;
  responseTime: number;
  userSatisfaction: number;
  taskCompletionRate: number;
  errorRate: number;
}

export interface UserFeedback {
  id: string;
  userId: string;
  sessionId: string;
  interactionType: 'chat' | 'task' | 'analysis' | 'recommendation';
  rating: number; // 1-5 scale
  feedback: string;
  context: Record<string, any>;
  createdAt: Date;
}

export interface ImprovementRecommendation {
  id: string;
  category: 'accuracy' | 'speed' | 'user_experience' | 'functionality';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // 0-100
  effort: number; // 0-100
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface ImprovementDashboard {
  timeframe: string;
  metrics: ImprovementMetrics;
  feedback: UserFeedback[];
  recommendations: ImprovementRecommendation[];
  trends: {
    accuracy: number[];
    responseTime: number[];
    satisfaction: number[];
  };
}

class ContinuousImprovementService {
  private feedback: UserFeedback[] = [];
  private recommendations: ImprovementRecommendation[] = [];
  private metrics: ImprovementMetrics = {
    accuracy: 0.85,
    responseTime: 1200,
    userSatisfaction: 4.2,
    taskCompletionRate: 0.92,
    errorRate: 0.08
  };

  async getImprovementDashboard(timeframe: string = 'week'): Promise<ImprovementDashboard> {
    try {
      const startDate = this.getStartDate(timeframe);
      const filteredFeedback = this.feedback.filter(f => f.createdAt >= startDate);
      
      return {
        timeframe,
        metrics: this.metrics,
        feedback: filteredFeedback,
        recommendations: this.recommendations.filter(r => r.status !== 'completed'),
        trends: this.generateTrends(timeframe)
      };
    } catch (error) {
      logger.error('Error getting improvement dashboard:', error);
      return {
        timeframe,
        metrics: this.metrics,
        feedback: [],
        recommendations: [],
        trends: {
          accuracy: [],
          responseTime: [],
          satisfaction: []
        }
      };
    }
  }

  async trackUserFeedback(feedback: Omit<UserFeedback, 'id' | 'createdAt'>): Promise<UserFeedback> {
    try {
      const newFeedback: UserFeedback = {
        ...feedback,
        id: `feedback-${Date.now()}`,
        createdAt: new Date()
      };
      
      this.feedback.push(newFeedback);
      
      // Update metrics based on feedback
      this.updateMetrics(newFeedback);
      
      logger.info(`Tracked user feedback: ${newFeedback.interactionType} - Rating: ${newFeedback.rating}`);
      return newFeedback;
    } catch (error) {
      logger.error('Error tracking user feedback:', error);
      throw error;
    }
  }

  async generateImprovementRecommendations(): Promise<ImprovementRecommendation[]> {
    try {
      const recommendations: ImprovementRecommendation[] = [];
      
      // Analyze feedback patterns
      const avgRating = this.feedback.length > 0 
        ? this.feedback.reduce((sum, f) => sum + f.rating, 0) / this.feedback.length 
        : 0;
      
      const avgResponseTime = this.metrics.responseTime;
      const errorRate = this.metrics.errorRate;
      
      // Generate recommendations based on metrics
      if (avgRating < 4.0) {
        recommendations.push({
          id: `rec-${Date.now()}-1`,
          category: 'user_experience',
          title: 'Improve User Satisfaction',
          description: 'User feedback indicates room for improvement in user experience',
          priority: 'high',
          impact: 80,
          effort: 60,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      if (avgResponseTime > 2000) {
        recommendations.push({
          id: `rec-${Date.now()}-2`,
          category: 'speed',
          title: 'Optimize Response Time',
          description: 'Response times are above acceptable thresholds',
          priority: 'medium',
          impact: 70,
          effort: 50,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      if (errorRate > 0.1) {
        recommendations.push({
          id: `rec-${Date.now()}-3`,
          category: 'accuracy',
          title: 'Reduce Error Rate',
          description: 'Error rate is above acceptable thresholds',
          priority: 'critical',
          impact: 90,
          effort: 80,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      this.recommendations.push(...recommendations);
      logger.info(`Generated ${recommendations.length} improvement recommendations`);
      return recommendations;
    } catch (error) {
      logger.error('Error generating improvement recommendations:', error);
      return [];
    }
  }

  async updateRecommendationStatus(id: string, status: ImprovementRecommendation['status']): Promise<boolean> {
    try {
      const recommendation = this.recommendations.find(r => r.id === id);
      if (!recommendation) {
        return false;
      }
      
      recommendation.status = status;
      recommendation.updatedAt = new Date();
      
      logger.info(`Updated recommendation status: ${id} -> ${status}`);
      return true;
    } catch (error) {
      logger.error(`Error updating recommendation status ${id}:`, error);
      return false;
    }
  }

  async getFeedbackAnalytics(timeframe: string = 'week'): Promise<{
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    topIssues: string[];
  }> {
    try {
      const startDate = this.getStartDate(timeframe);
      const filteredFeedback = this.feedback.filter(f => f.createdAt >= startDate);
      
      const totalFeedback = filteredFeedback.length;
      const averageRating = totalFeedback > 0 
        ? filteredFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback 
        : 0;
      
      const ratingDistribution: Record<number, number> = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = filteredFeedback.filter(f => f.rating === i).length;
      }
      
      // Extract common issues from feedback
      const feedbackTexts = filteredFeedback.map(f => f.feedback.toLowerCase());
      const topIssues = this.extractCommonIssues(feedbackTexts);
      
      return {
        totalFeedback,
        averageRating,
        ratingDistribution,
        topIssues
      };
    } catch (error) {
      logger.error('Error getting feedback analytics:', error);
      return {
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: {},
        topIssues: []
      };
    }
  }

  private updateMetrics(feedback: UserFeedback): void {
    // Update satisfaction metric
    const recentFeedback = this.feedback.slice(-10);
    if (recentFeedback.length > 0) {
      this.metrics.userSatisfaction = recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length;
    }
    
    // Update other metrics based on feedback patterns
    if (feedback.rating < 3) {
      this.metrics.errorRate = Math.min(1, this.metrics.errorRate + 0.01);
    } else if (feedback.rating > 4) {
      this.metrics.errorRate = Math.max(0, this.metrics.errorRate - 0.005);
    }
  }

  private getStartDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private generateTrends(timeframe: string): {
    accuracy: number[];
    responseTime: number[];
    satisfaction: number[];
  } {
    // Generate mock trend data
    const days = timeframe === 'day' ? 24 : timeframe === 'week' ? 7 : 30;
    
    return {
      accuracy: Array.from({ length: days }, () => 0.8 + Math.random() * 0.2),
      responseTime: Array.from({ length: days }, () => 800 + Math.random() * 800),
      satisfaction: Array.from({ length: days }, () => 3.5 + Math.random() * 1.5)
    };
  }

  private extractCommonIssues(feedbackTexts: string[]): string[] {
    const commonWords = feedbackTexts
      .flatMap(text => text.split(' '))
      .filter(word => word.length > 3)
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    return Object.entries(commonWords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }
}

// Export singleton instance
export const continuousImprovementService = new ContinuousImprovementService(); 