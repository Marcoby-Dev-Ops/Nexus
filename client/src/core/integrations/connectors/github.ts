/**
 * GitHub Connector
 * 
 * Implementation of the contract-first connector interface for GitHub API
 * Provides access to repositories, issues, pull requests, and development workflows
 */

import { BaseConnector } from '../connector-base';
import type { ConnectorContext, SyncResult, WebhookEvent } from '../types';
import { PROVIDER_CONFIGS } from '../http-client';
import { GitHubWebhookHandler } from '../webhooks';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// GitHub API types
interface GitHubUser {
  id: number;
  login: string;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name?: string;
  company?: string;
  blog?: string;
  location?: string;
  email?: string;
  hireable?: boolean;
  bio?: string;
  twitter_username?: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  description?: string;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage?: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language?: string;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  mirror_url?: string;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license?: {
    key: string;
    name: string;
    url?: string;
    spdx_id?: string;
    node_id: string;
  };
  allow_forking: boolean;
  is_template: boolean;
  web_commit_signoff_required: boolean;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

interface GitHubIssue {
  id: number;
  node_id: string;
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  number: number;
  state: string;
  title: string;
  body?: string;
  user: GitHubUser;
  labels: Array<{
    id: number;
    node_id: string;
    url: string;
    name: string;
    description?: string;
    color: string;
    default: boolean;
  }>;
  assignee?: GitHubUser;
  assignees: GitHubUser[];
  milestone?: {
    url: string;
    html_url: string;
    labels_url: string;
    id: number;
    node_id: string;
    number: number;
    title: string;
    description?: string;
    creator: GitHubUser;
    open_issues: number;
    closed_issues: number;
    state: string;
    created_at: string;
    updated_at: string;
    due_on?: string;
    closed_at?: string;
  };
  locked: boolean;
  active_lock_reason?: string;
  comments: number;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
    merged_at?: string;
  };
  closed_at?: string;
  created_at: string;
  updated_at: string;
  closed_by?: GitHubUser;
  author_association: string;
  state_reason?: string;
}

interface GitHubPullRequest {
  url: string;
  id: number;
  node_id: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
  number: number;
  state: string;
  locked: boolean;
  title: string;
  user: GitHubUser;
  body?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  merge_commit_sha?: string;
  assignee?: GitHubUser;
  assignees: GitHubUser[];
  requested_reviewers: GitHubUser[];
  requested_teams: Array<{
    id: number;
    node_id: string;
    url: string;
    html_url: string;
    name: string;
    slug: string;
    description?: string;
    privacy: string;
    permission: string;
    members_url: string;
    repositories_url: string;
    parent?: {
      id: number;
      node_id: string;
      url: string;
      html_url: string;
      name: string;
      slug: string;
      description?: string;
      privacy: string;
      permission: string;
      members_url: string;
      repositories_url: string;
    };
  }>;
  labels: Array<{
    id: number;
    node_id: string;
    url: string;
    name: string;
    description?: string;
    color: string;
    default: boolean;
  }>;
  milestone?: {
    url: string;
    html_url: string;
    labels_url: string;
    id: number;
    node_id: string;
    number: number;
    title: string;
    description?: string;
    creator: GitHubUser;
    open_issues: number;
    closed_issues: number;
    state: string;
    created_at: string;
    updated_at: string;
    due_on?: string;
    closed_at?: string;
  };
  draft: boolean;
  commits_url: string;
  review_comments_url: string;
  review_comment_url: string;
  comments_url: string;
  statuses_url: string;
  head: {
    label: string;
    ref: string;
    sha: string;
    user: GitHubUser;
    repo: GitHubRepository;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    user: GitHubUser;
    repo: GitHubRepository;
  };
  _links: {
    self: {
      href: string;
    };
    html: {
      href: string;
    };
    issue: {
      href: string;
    };
    comments: {
      href: string;
    };
    review_comments: {
      href: string;
    };
    review_comment: {
      href: string;
    };
    commits: {
      href: string;
    };
    statuses: {
      href: string;
    };
  };
  author_association: string;
  auto_merge?: {
    enabled_by: GitHubUser;
    merge_method: string;
    commit_title: string;
    commit_message: string;
  };
  active_lock_reason?: string;
  merged: boolean;
  mergeable?: boolean;
  mergeable_state: string;
  merged_by?: GitHubUser;
  comments: number;
  review_comments: number;
  maintainer_can_modify: boolean;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

interface GitHubOAuthResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

// Configuration schema
const GitHubConfigSchema = z.object({
  syncRepositories: z.boolean().default(true),
  syncIssues: z.boolean().default(true),
  syncPullRequests: z.boolean().default(true),
  syncUsers: z.boolean().default(true),
  syncCommits: z.boolean().default(false),
  repositoryLimit: z.number().min(1).max(100).default(50),
  issueLimit: z.number().min(1).max(100).default(50),
  pullRequestLimit: z.number().min(1).max(100).default(50),
  includePrivate: z.boolean().default(true),
  includeForks: z.boolean().default(false),
  syncFromDate: z.string().optional(),
  batchSize: z.number().min(1).max(100).default(50),
  webhookEvents: z.array(z.string()).default([
    'push',
    'pull_request',
    'issues',
    'create',
    'delete',
    'fork',
    'star',
    'gollum',
    'watch',
    'release'
  ]),
  scopes: z.array(z.string()).default([
    'repo',
    'user',
    'read:org',
    'write:org',
    'admin:org'
  ]),
});

export class GitHubConnector extends BaseConnector {
  private webhookHandler: GitHubWebhookHandler;
  private readonly githubApiBase = 'https://api.github.com';

  constructor() {
    super(
      'github',
      'GitHub',
      '1.0.0',
      PROVIDER_CONFIGS.github
    );
    
    this.webhookHandler = new GitHubWebhookHandler();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  getConfigSchema(): z.ZodSchema {
    return GitHubConfigSchema;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authorize(ctx: ConnectorContext, code?: string): Promise<ConnectorContext> {
    if (!code) {
      throw new Error('Authorization code is required for GitHub OAuth');
    }

    try {
      const tokenResponse = await this.httpClient.post<GitHubOAuthResponse>(
        'https://github.com/login/oauth/access_token',
        new URLSearchParams({
          client_id: process.env.GITHUB_CLIENT_ID!,
          client_secret: process.env.GITHUB_CLIENT_SECRET!,
          code,
          redirect_uri: process.env.GITHUB_REDIRECT_URI!,
        }).toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        }
      );

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          accessToken: tokenResponse.data.access_token,
          refreshToken: '', // GitHub doesn't use refresh tokens
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        },
        metadata: {
          ...ctx.metadata,
          lastAuth: new Date().toISOString(),
        },
      };

      logger.info('GitHub authorization successful', {
        tenantId: ctx.tenantId,
        scope: tokenResponse.data.scope,
      });

      return updatedCtx;
    } catch (error) {
      logger.error('GitHub authorization failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`GitHub authorization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refresh(ctx: ConnectorContext): Promise<ConnectorContext> {
    // GitHub tokens don't expire, so we just return the same context
    logger.info('GitHub token refresh (no-op)', {
      tenantId: ctx.tenantId,
    });
    return ctx;
  }

  // ============================================================================
  // DATA SYNCHRONIZATION
  // ============================================================================

  async backfill(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    const startTime = Date.now();
    const results: SyncResult = {
      success: true,
      recordsProcessed: 0,
      cursor: cursor,
      data: [],
      errors: [],
      duration: 0,
      hasMore: false,
    };

    try {
      // Sync user info
      if (ctx.config.syncUsers !== false) {
        const userResult = await this.syncUser(ctx);
        results.recordsProcessed += userResult.recordsProcessed;
        results.data.push(...userResult.data);
        results.errors.push(...userResult.errors);
      }

      // Sync repositories
      if (ctx.config.syncRepositories !== false) {
        const reposResult = await this.syncRepositories(ctx, cursor);
        results.recordsProcessed += reposResult.recordsProcessed;
        results.data.push(...reposResult.data);
        results.errors.push(...reposResult.errors);
      }

      // Sync issues
      if (ctx.config.syncIssues !== false) {
        const issuesResult = await this.syncIssues(ctx, cursor);
        results.recordsProcessed += issuesResult.recordsProcessed;
        results.data.push(...issuesResult.data);
        results.errors.push(...issuesResult.errors);
      }

      // Sync pull requests
      if (ctx.config.syncPullRequests !== false) {
        const prsResult = await this.syncPullRequests(ctx, cursor);
        results.recordsProcessed += prsResult.recordsProcessed;
        results.data.push(...prsResult.data);
        results.errors.push(...prsResult.errors);
      }

      results.duration = Date.now() - startTime;
      results.hasMore = !!results.cursor;

      logger.info('GitHub backfill completed', {
        tenantId: ctx.tenantId,
        recordsProcessed: results.recordsProcessed,
        errors: results.errors.length,
        duration: results.duration,
      });

      return results;
    } catch (error) {
      logger.error('GitHub backfill failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        recordsProcessed: results.recordsProcessed,
        cursor: cursor,
        data: results.data,
        errors: [...results.errors, error instanceof Error ? error.message : String(error)],
        duration: Date.now() - startTime,
        hasMore: false,
      };
    }
  }

  async delta(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    // For GitHub, we can use cursor-based pagination for delta syncs
    const deltaCtx = {
      ...ctx,
      config: {
        ...ctx.config,
        batchSize: Math.min(ctx.config.batchSize || 50, 25), // Smaller batches for delta
      },
    };

    return await this.backfill(deltaCtx, cursor);
  }

  // ============================================================================
  // SPECIFIC SYNC METHODS
  // ============================================================================

  private async syncUser(ctx: ConnectorContext): Promise<SyncResult> {
    try {
      const response = await this.httpClient.get<GitHubUser>(
        `${this.githubApiBase}/user`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      );

      return {
        success: true,
        recordsProcessed: 1,
        cursor: undefined,
        data: [response.data],
        errors: [],
        duration: 0,
        hasMore: false,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        cursor: undefined,
        data: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
        hasMore: false,
      };
    }
  }

  private async syncRepositories(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        per_page: (ctx.config.repositoryLimit || 50).toString(),
        sort: 'updated',
        direction: 'desc',
      });
      
      if (cursor) {
        params.append('page', cursor);
      }

      const response = await this.httpClient.get<GitHubRepository[]>(
        `${this.githubApiBase}/user/repos?${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      );

      // Filter repositories based on configuration
      let repositories = response.data;
      
      if (!ctx.config.includePrivate) {
        repositories = repositories.filter(repo => !repo.private);
      }
      
      if (!ctx.config.includeForks) {
        repositories = repositories.filter(repo => !repo.fork);
      }

      return {
        success: true,
        recordsProcessed: repositories.length,
        cursor: repositories.length === (ctx.config.repositoryLimit || 50) ? 
          (parseInt(cursor || '1') + 1).toString() : undefined,
        data: repositories,
        errors: [],
        duration: 0,
        hasMore: repositories.length === (ctx.config.repositoryLimit || 50),
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        cursor: cursor,
        data: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
        hasMore: false,
      };
    }
  }

  private async syncIssues(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        per_page: (ctx.config.issueLimit || 50).toString(),
        sort: 'updated',
        direction: 'desc',
        state: 'all',
      });
      
      if (cursor) {
        params.append('page', cursor);
      }

      const response = await this.httpClient.get<GitHubIssue[]>(
        `${this.githubApiBase}/issues?${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.length,
        cursor: response.data.length === (ctx.config.issueLimit || 50) ? 
          (parseInt(cursor || '1') + 1).toString() : undefined,
        data: response.data,
        errors: [],
        duration: 0,
        hasMore: response.data.length === (ctx.config.issueLimit || 50),
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        cursor: cursor,
        data: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
        hasMore: false,
      };
    }
  }

  private async syncPullRequests(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        per_page: (ctx.config.pullRequestLimit || 50).toString(),
        sort: 'updated',
        direction: 'desc',
        state: 'all',
      });
      
      if (cursor) {
        params.append('page', cursor);
      }

      const response = await this.httpClient.get<GitHubPullRequest[]>(
        `${this.githubApiBase}/search/issues?q=is:pr+author:@me&${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.items?.length || 0,
        cursor: (response.data.items?.length || 0) === (ctx.config.pullRequestLimit || 50) ? 
          (parseInt(cursor || '1') + 1).toString() : undefined,
        data: response.data.items || [],
        errors: [],
        duration: 0,
        hasMore: (response.data.items?.length || 0) === (ctx.config.pullRequestLimit || 50),
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        cursor: cursor,
        data: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
        hasMore: false,
      };
    }
  }

  // ============================================================================
  // WEBHOOK HANDLING
  // ============================================================================

  async handleWebhook(
    ctx: ConnectorContext,
    headers: Record<string, string>,
    body: any
  ): Promise<WebhookEvent[]> {
    return await this.webhookHandler.handle(headers, body, 'github');
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  async healthCheck(ctx: ConnectorContext): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Test basic API access
      const response = await this.httpClient.get<GitHubUser>(
        `${this.githubApiBase}/user`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      );

      // Test specific scopes if configured
      const scopeTests = [];
      
      if (ctx.config.syncRepositories !== false) {
        try {
          await this.httpClient.get(
            `${this.githubApiBase}/user/repos?per_page=1`,
            {
              'Authorization': `Bearer ${ctx.auth.accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
            }
          );
          scopeTests.push({ scope: 'repositories', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'repositories', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      if (ctx.config.syncIssues !== false) {
        try {
          await this.httpClient.get(
            `${this.githubApiBase}/issues?per_page=1`,
            {
              'Authorization': `Bearer ${ctx.auth.accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
            }
          );
          scopeTests.push({ scope: 'issues', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'issues', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      return {
        healthy: true,
        details: {
          user: response.data.login,
          scopeTests,
          lastCheck: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
          lastCheck: new Date().toISOString(),
        },
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  protected isTokenExpiredError(error: any): boolean {
    return error?.response?.status === 401 || 
           error?.message?.includes('unauthorized') ||
           error?.message?.includes('invalid_token') ||
           error?.message?.includes('bad_credentials');
  }

  protected isRateLimitError(error: any): boolean {
    return error?.response?.status === 403 && 
           error?.response?.headers?.['x-ratelimit-remaining'] === '0' ||
           error?.message?.includes('rate_limited') ||
           error?.message?.includes('API rate limit exceeded');
  }

  protected extractRetryAfter(error: any): number {
    const retryAfter = error?.response?.headers?.['retry-after'];
    return retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000; // Default 1 minute
  }
}
