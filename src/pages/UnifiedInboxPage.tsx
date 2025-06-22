/**
 * Unified Inbox Page with Email Integration
 * Pillar: 2 - Minimum Lovable Feature Set
 * Priority: #3 - Ship unified inbox with streamed tokens and quick filters
 * Features: Email integration, AI prioritization, real-time updates, <2s latency
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Inbox,
  Star,
  Archive,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Clock,
  User,
  Tag,
  Zap,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Bell,
  Settings,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Reply,
  Forward,
  ExternalLink,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications } from '@/contexts/NotificationContext';
import { 
  unifiedInboxService, 
  type InboxItem, 
  type InboxSummary, 
  type InboxFilters,
  type EmailAccount 
} from '@/lib/services/unifiedInboxService';
import EmailSetupModal from '@/components/integrations/EmailSetupModal';
import Microsoft365EmailSetup from '@/components/ai/Microsoft365EmailSetup';
import MicrosoftGraphTokenSetup from '@/components/integrations/MicrosoftGraphTokenSetup';

interface UnifiedInboxPageProps {}

const UnifiedInboxPage: React.FC<UnifiedInboxPageProps> = () => {
  // State Management
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [summary, setSummary] = useState<InboxSummary | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<InboxFilters>({});
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'important' | 'emails'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  
  const { addNotification } = useNotifications();
  const ITEMS_PER_PAGE = 25;

  // Load inbox data
  const loadInboxData = useCallback(async (append = false) => {
    try {
      if (!append) setIsLoading(true);
      
      const tabFilters: InboxFilters = {
        ...filters,
        search: searchQuery || undefined,
        ...(selectedTab === 'unread' && { is_read: false }),
        ...(selectedTab === 'important' && { is_important: true }),
        ...(selectedTab === 'emails' && { item_type: ['email'] })
      };

      const offset = append ? inboxItems.length : 0;
      
      const [itemsResult, summaryResult] = await Promise.all([
        unifiedInboxService.getInboxItems(tabFilters, ITEMS_PER_PAGE, offset),
        append ? Promise.resolve(summary) : unifiedInboxService.getInboxSummary()
      ]);

      if (append) {
        setInboxItems(prev => [...prev, ...itemsResult.items]);
      } else {
        setInboxItems(itemsResult.items);
      }
      
      if (!append && summaryResult) {
        setSummary(summaryResult);
      }
      
      setHasMore(itemsResult.items.length === ITEMS_PER_PAGE);
      
    } catch (error) {
      console.error('Failed to load inbox data:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load inbox. Please try again.'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, searchQuery, selectedTab, inboxItems.length, summary, addNotification]);

  // Initial load
  useEffect(() => {
    loadInboxData();
  }, []);

  // Refresh on filter/search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(0);
      loadInboxData();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, selectedTab]);

  // Real-time updates
  useEffect(() => {
    const subscription = unifiedInboxService.subscribeToInboxUpdates((payload) => {
      if (payload.eventType === 'INSERT') {
        setInboxItems(prev => [payload.new, ...prev]);
        setSummary(prev => prev ? {
          ...prev,
          total_items: prev.total_items + 1,
          unread_count: prev.unread_count + (payload.new.is_read ? 0 : 1)
        } : null);
      } else if (payload.eventType === 'UPDATE') {
        setInboxItems(prev => prev.map(item => 
          item.id === payload.new.id ? payload.new : item
        ));
      } else if (payload.eventType === 'DELETE') {
        setInboxItems(prev => prev.filter(item => item.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Kick off background sync for connected email accounts if needed
  useEffect(() => {
    const ensureEmailSync = async () => {
      try {
        const accounts = await unifiedInboxService.getEmailAccounts();
        const needsSync = accounts.filter(
          (acc) =>
            acc.sync_enabled &&
            (acc.sync_status === 'pending' || acc.sync_status === 'error' || !acc.last_sync_at),
        );
        await Promise.all(
          needsSync.map((acc) => unifiedInboxService.startEmailSync(acc.id, 'full_sync')),
        );
      } catch (err) {
        console.warn('Failed to trigger email sync:', err);
      }
    };

    ensureEmailSync();
  }, []);

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      const accounts = await unifiedInboxService.getEmailAccounts();
      setEmailAccounts(accounts);
    };
    fetchAccounts();
  }, []);

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInboxData();
  };

  const handleMarkAsRead = async (itemId: string, isRead = true) => {
    try {
      await unifiedInboxService.markAsRead(itemId, isRead);
      setInboxItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, is_read: isRead } : item
      ));
      
      setSummary(prev => prev ? {
        ...prev,
        unread_count: prev.unread_count + (isRead ? -1 : 1)
      } : null);
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to update read status'
      });
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === inboxItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(inboxItems.map(item => item.id));
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await Promise.all(selectedItems.map(id => unifiedInboxService.markAsRead(id, true)));
      setInboxItems(prev => prev.map(item => 
        selectedItems.includes(item.id) ? { ...item, is_read: true } : item
      ));
      setSelectedItems([]);
      
      addNotification({
        type: 'success',
        message: `Marked ${selectedItems.length} items as read`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to mark items as read'
      });
    }
  };

  const getItemIcon = (item: InboxItem) => {
    switch (item.item_type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'notification': return <Bell className="w-4 h-4" />;
      case 'task': return <CheckCircle2 className="w-4 h-4" />;
      case 'calendar': return <Calendar className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      default: return <Inbox className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-danger';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-info';
      case 'low': return 'bg-success';
      default: return 'bg-muted-foreground';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      loadInboxData(true);
    }
  };

  const handleEmailSetupComplete = (account: EmailAccount) => {
    addNotification({
      type: 'success',
      message: `Successfully connected ${account.display_name || account.email_address}!`
    });
    // Add to state so UI reflects connection immediately
    setEmailAccounts(prev => [...prev, account]);
    // Trigger sync & refresh inbox
    loadInboxData();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 bg-gradient-to-r from-primary-subtle to-secondary-subtle border-b border-border gap-4">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div className="flex items-center space-x-2 min-w-0">
            <Inbox className="w-6 h-6 text-primary flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold truncate">Unified Inbox</h1>
          </div>
          
          {summary && (
            <div className="hidden sm:flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{summary.total_items} total</span>
              <span>•</span>
              <span className="text-primary font-medium">{summary.unread_count} unread</span>
              {summary.urgent_count > 0 && (
                <>
                  <span>•</span>
                  <span className="text-destructive font-medium">{summary.urgent_count} urgent</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile summary */}
        {summary && (
          <div className="flex sm:hidden items-center space-x-3 text-sm text-muted-foreground w-full">
            <span>{summary.total_items} total</span>
            <span>•</span>
            <span className="text-primary font-medium">{summary.unread_count} unread</span>
            {summary.urgent_count > 0 && (
              <>
                <span>•</span>
                <span className="text-destructive font-medium">{summary.urgent_count} urgent</span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hidden sm:flex"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* Mobile refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="sm:hidden"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowEmailSetup(true)}
            className="hidden sm:flex"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Email
          </Button>
          
          {/* Mobile connect button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowEmailSetup(true)}
            className="sm:hidden"
          >
            <Plus className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Connected accounts banner */}
      {emailAccounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-6 py-2 bg-success/5 text-success border-b border-border text-sm">
          <span className="font-medium">Connected mailboxes:</span>
          {emailAccounts.map(acc => (
            <span key={acc.id} className="px-2 py-1 rounded bg-success/10">{acc.email_address}</span>
          ))}
          <span className="ml-auto text-muted-foreground">{`Syncing every ${emailAccounts[0].sync_frequency || '5 minutes'}`}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 p-6 bg-card/50 border-b border-border backdrop-blur-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search emails, notifications, and tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-muted' : ''}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>

        {selectedItems.length > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {selectedItems.length} selected
            </Badge>
            <Button size="sm" onClick={handleBulkMarkAsRead}>
              <Eye className="w-4 h-4 mr-1" />
              Mark Read
            </Button>
            <Button size="sm" variant="outline">
              <Archive className="w-4 h-4 mr-1" />
              Archive
            </Button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border bg-gradient-to-r from-muted-subtle to-primary-subtle/30"
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select
                  value={filters.item_type?.[0] || 'all'}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    item_type: value === 'all' ? undefined : [value]
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Item Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="email">Emails</SelectItem>
                    <SelectItem value="notification">Notifications</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.ai_urgency?.[0] || 'all'}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    ai_urgency: value === 'all' ? undefined : [value]
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgency</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filter by sender..."
                  value={filters.sender || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sender: e.target.value || undefined
                  }))}
                />

                <Button
                  variant="outline"
                  onClick={() => setFilters({})}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-6 mt-6 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <Inbox className="w-4 h-4" />
            <span>All</span>
            {summary && <Badge variant="secondary" className="ml-1">{summary.total_items}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Unread</span>
            {summary && summary.unread_count > 0 && (
              <Badge variant="default" className="ml-1">{summary.unread_count}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="important" className="flex items-center space-x-2">
            <Star className="w-4 h-4" />
            <span>Important</span>
            {summary && summary.important_count > 0 && (
              <Badge variant="secondary" className="ml-1">{summary.important_count}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Emails</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="flex-1 overflow-hidden mt-0">
          <div className="h-full flex flex-col">
                          {/* Bulk Actions */}
              {inboxItems.length > 0 && (
                <Card className="mx-6 mt-4 border-0 bg-gradient-to-r from-card/80 to-muted-subtle/50 backdrop-blur-sm shadow-sm">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedItems.length === inboxItems.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedItems.length > 0 
                          ? `${selectedItems.length} of ${inboxItems.length} selected`
                          : `${inboxItems.length} items`
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        AI Insights
                      </Button>
                      <Button variant="ghost" size="sm">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Inbox Items */}
            <div className="flex-1 overflow-auto p-6">
              {isLoading && inboxItems.length === 0 ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="border-0 bg-gradient-to-r from-card/50 to-muted-subtle/30 animate-pulse">
                      <CardContent className="flex items-center space-x-4 p-6">
                        <Skeleton className="w-4 h-4 rounded" />
                        <div className="p-3 rounded-xl bg-primary/5">
                          <Skeleton className="w-5 h-5 rounded" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-3/4 rounded-full" />
                          <Skeleton className="h-3 w-1/2 rounded-full" />
                          <Skeleton className="h-3 w-2/3 rounded-full" />
                        </div>
                        <div className="flex space-x-2">
                          <Skeleton className="w-16 h-6 rounded-full" />
                          <Skeleton className="w-8 h-8 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : inboxItems.length === 0 ? (
                emailAccounts.length > 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <h3 className="text-xl font-semibold">Syncing your inbox…</h3>
                    <p className="text-muted-foreground max-w-sm">
                      We&apos;re pulling your latest messages. This may take a minute on the first run.
                    </p>
                    <Button onClick={() => loadInboxData()} variant="outline">
                      Refresh now
                    </Button>
                  </div>
                ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-primary-subtle to-secondary-subtle">
                    <Inbox className="w-16 h-16 text-muted-foreground mb-4" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No items found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {searchQuery || Object.keys(filters).length > 0
                      ? 'Try adjusting your search or filters to find what you\'re looking for'
                      : 'Your inbox is empty. Connect an email account to get started and see your messages here.'
                    }
                  </p>
                  
                  {/* Microsoft 365 Email Setup */}
                  <Card className="w-full max-w-md border-0 bg-gradient-to-r from-card/80 to-primary-subtle/30 shadow-lg">
                    <CardContent className="p-6">
                      <Microsoft365EmailSetup onEmailAccountCreated={() => loadInboxData()} />
                    </CardContent>
                  </Card>
                  
                  {/* Microsoft Graph Token Setup */}
                  <div className="w-full max-w-md">
                    <MicrosoftGraphTokenSetup onTokenObtained={() => loadInboxData()} />
                  </div>
                  
                  <div className="text-muted-foreground text-sm">or</div>
                  
                  <Button 
                    onClick={() => setShowEmailSetup(true)}
                    className="bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Other Email Account
                  </Button>
                </div>
                )
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {inboxItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 ${
                            !item.is_read 
                              ? 'bg-gradient-to-r from-unread-bg to-primary-subtle/20 border-l-4 border-l-unread-border shadow-md' 
                              : 'bg-card/80 hover:bg-card backdrop-blur-sm'
                          } ${selectedItems.includes(item.id) ? 'bg-selected-bg shadow-xl ring-2 ring-primary/30' : ''}`}
                          onClick={() => handleMarkAsRead(item.id, true)}
                        >
                          <CardContent className="flex items-center space-x-4 p-6">
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={() => handleSelectItem(item.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            
                            <div className="flex items-center space-x-3">
                              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                                {getItemIcon(item)}
                              </div>
                              {item.ai_urgency && (
                                <div className={`w-3 h-3 rounded-full ${getUrgencyColor(item.ai_urgency)} shadow-sm`} />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className={`font-medium truncate ${!item.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                  {item.title}
                                </h3>
                                {item.is_important && (
                                  <div className="p-1 rounded-full bg-warning/10">
                                    <Star className="w-4 h-4 text-warning fill-warning" />
                                  </div>
                                )}
                                {item.ai_category && (
                                  <Badge variant="outline" className="text-xs bg-card/60 backdrop-blur-sm">
                                    {item.ai_category}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                                {item.sender && (
                                  <>
                                    <div className="p-1 rounded-full bg-muted/50">
                                      <User className="w-3 h-3" />
                                    </div>
                                    <span className="truncate max-w-32 font-medium">{item.sender}</span>
                                    <span>•</span>
                                  </>
                                )}
                                <span className="text-xs">{formatTimeAgo(item.item_timestamp || item.received_at)}</span>
                              </div>
                              
                              {item.preview && (
                                <p className="text-sm text-muted-foreground mt-1 truncate leading-relaxed">
                                  {item.preview}
                                </p>
                              )}
                              
                              {item.ai_action_suggestion && (
                                <div className="flex items-center space-x-2 mt-3 p-2 rounded-lg bg-primary/5">
                                  <div className="p-1 rounded-full bg-primary/10">
                                    <Zap className="w-3 h-3 text-primary" />
                                  </div>
                                  <span className="text-xs text-primary font-medium">
                                    {item.ai_action_suggestion}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={item.is_read ? 'secondary' : 'default'} 
                                className="text-xs bg-card/60 backdrop-blur-sm"
                              >
                                {item.item_type}
                              </Badge>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(item.id, !item.is_read);
                                }}
                              >
                                {item.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Load More */}
              {hasMore && inboxItems.length > 0 && (
                <div className="text-center mt-8">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={isLoading}
                    className="bg-card/80 backdrop-blur-sm hover:bg-card border-border/50 hover:shadow-md transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Email Setup Modal */}
      {showEmailSetup && (
        <div className="z-modal">
          <EmailSetupModal
            isOpen={showEmailSetup}
            onClose={() => setShowEmailSetup(false)}
            onComplete={handleEmailSetupComplete}
          />
        </div>
      )}
    </div>
  );
};

export default UnifiedInboxPage; 