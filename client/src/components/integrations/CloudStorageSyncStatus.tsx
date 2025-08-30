/**
 * Cloud Storage Sync Status Component
 * Shows document sync status and provides manual sync controls
 */

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  FileText, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/ui/components/Toast';
import { cloudStorageRAGService } from '@/services/cloudStorageRAG';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

interface CloudStorageSyncStatusProps {
  className?: string;
}

interface SyncStats {
  totalDocuments: number;
  lastSync: string | null;
  isLoading: boolean;
  error: string | null;
}

export function CloudStorageSyncStatus({ className }: CloudStorageSyncStatusProps) {
  const [syncStats, setSyncStats] = useState<SyncStats>({
    totalDocuments: 0,
    lastSync: null,
    isLoading: false,
    error: null
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadSyncStats();
  }, []);

  const loadSyncStats = async () => {
    setSyncStats(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Get document count from Supabase
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        setSyncStats(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { count } = await import('@/shared/lib/core/supabase').then(m => m.supabase
        .from('ai_vector_documents')
        .select('*', { count: 'exact', head: true })
        .or('document_id.like.google-drive-%,document_id.like.onedrive-%')
      );

      // Get last sync time from most recent document
      const { data: lastDoc } = await import('@/shared/lib/core/supabase').then(m => m.supabase
        .from('ai_vector_documents')
        .select('created_at')
        .or('document_id.like.google-drive-%,document_id.like.onedrive-%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      );

      setSyncStats({
        totalDocuments: count || 0,
        lastSync: lastDoc?.created_at || null,
        isLoading: false,
        error: null
      });
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Failed to load sync stats: ', error);
      setSyncStats(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load sync stats'
      }));
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    
    try {
      showToast({
        title: "Syncing Documents",
        description: "Processing your cloud storage documents...",
        type: "info"
      });

      const results = await cloudStorageRAGService.syncAllProviders();
      
      showToast({
        title: "Sync Complete",
        description: `Processed ${results.totalProcessed} documents successfully.`,
        type: results.totalErrors.length > 0 ? "error" : "success"
      });

      // Reload stats after sync
      await loadSyncStats();
      
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Sync failed: ', error);
      showToast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        type: "error"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-2">
            <Cloud className="w-4 h-4" />
            <span>Document Sync Status</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerSync}
            disabled={isSyncing || syncStats.isLoading}
            className="h-8"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {syncStats.error ? (
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{syncStats.error}</span>
          </div>
        ) : (
          <>
            {/* Document Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Documents Synced</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {syncStats.totalDocuments}
              </Badge>
            </div>

            {/* Last Sync */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Last Sync</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatLastSync(syncStats.lastSync)}
              </span>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">RAG Status</span>
              </div>
              <div className="flex items-center space-x-1">
                {syncStats.totalDocuments > 0 ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-success" />
                    <span className="text-xs text-success">Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-orange-500" />
                    <span className="text-xs text-warning">No Documents</span>
                  </>
                )}
              </div>
            </div>

            {/* Info */}
            {syncStats.totalDocuments > 0 && (
              <div className="p-2 bg-primary/5 rounded text-xs text-primary">
                <strong>AI Ready: </strong> Your documents are available for intelligent search and contextual insights.
              </div>
            )}

            {syncStats.totalDocuments === 0 && (
              <div className="p-2 bg-orange-50 rounded text-xs text-warning">
                <strong>Setup Needed: </strong> Connect Google Drive or OneDrive to enable document-based AI insights.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 
