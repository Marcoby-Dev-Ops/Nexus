/**
 * AI Domain - Main Index
 * Consolidates all AI functionality including chat, agents, and core AI components
 */

// AI Subdomains
export * from './chat';
export * from './agents';

// Core AI Components
export * from './components';

// AI Pages
export { default as AIHubPage } from './pages/AIHubPage';
export { default as AICapabilitiesPage } from './pages/AICapabilities';
export { default as AIPerformancePage } from './pages/AIPerformancePage';

// AI Services
export { getSlashCommands, filterSlashCommands, type SlashCommand } from './services/slashCommandService';

// AI Lib
export * from './lib'; 