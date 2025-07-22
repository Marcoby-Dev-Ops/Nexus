import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Loader2, Mail, AlertCircle, Search, Star, EyeOff, Unlink, Plus, Settings, Inbox, Send, Archive, Trash2, Filter, MoreHorizontal, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/shared/components/ui/Avatar';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { useUnifiedInbox } from '@/shared/hooks/useUnifiedInbox';
import type { OWAInboxFilters } from '@/domains/services/owaInboxService';
import { owaInboxService } from '@/domains/services/owaInboxService';

const UnifiedInbox: React.FC = () => {
  const [filters, setFilters] = useState<OWAInboxFilters>({});
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get connected providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      const providers = await owaInboxService.getConnectedProviders();
      setConnectedProviders(providers);
    };
    fetchProviders();
  }, []);

  const { items: emails, total, isLoading, isError, error, refetch } = useUnifiedInbox({ 
    filters, 
    limit: 50, 
    offset: 0 
  });

  const handleMarkAsRead = async (emailId: string, isRead: boolean, provider: string = 'microsoft') => {
    try {
      await owaInboxService.markAsRead(emailId, isRead, provider as any);
      refetch();
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const handleFilterChange = (newFilters: Partial<OWAInboxFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDisconnectMicrosoft = async () => {
    try {
      setIsDisconnecting(true);
      await owaInboxService.removeOAuthTokens('microsoft');
      const providers = await owaInboxService.getConnectedProviders();
      setConnectedProviders(providers);
    } catch (error) {
      console.error('Error disconnecting Microsoft 365:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleAddMailbox = () => {
    // TODO: Implement add mailbox flow
    console.log('Add mailbox clicked');
  };

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading inbox: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* Left Sidebar - Navigation */}
      <div className="w-64 border-r border-gray-200 bg-gray-50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Mail</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Mailbox Button */}
          <Button
            onClick={handleAddMailbox}
            className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Mailbox
          </Button>

          {/* Navigation */}
          <nav className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
            >
              <Inbox className="h-4 w-4 mr-3" />
              Inbox
              <span className="ml-auto text-xs text-gray-500">{total}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100"
            >
              <Star className="h-4 w-4 mr-3" />
              Starred
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100"
            >
              <Send className="h-4 w-4 mr-3" />
              Sent
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100"
            >
              <Archive className="h-4 w-4 mr-3" />
              Archive
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Trash
            </Button>
          </nav>

          {/* Connected Accounts */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Connected Accounts</h3>
            {connectedProviders.length > 0 ? (
              <div className="space-y-2">
                {connectedProviders.map(provider => (
                  <div key={provider} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium capitalize">{provider}</span>
                    </div>
                    {provider === 'microsoft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDisconnectMicrosoft}
                        disabled={isDisconnecting}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        {isDisconnecting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Unlink className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No accounts connected</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddMailbox}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Connect Account
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search in mail"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={filters.is_read === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange({ is_read: filters.is_read === false ? undefined : false })}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Unread
                </Button>
                <Button
                  variant={filters.is_important ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange({ is_important: !filters.is_important })}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Important
                </Button>
              </div>
            </div>

            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !email.is_read ? 'bg-blue-50' : ''
                  } ${selectedEmail === email.id ? 'bg-blue-100' : ''}`}
                  onClick={() => setSelectedEmail(email.id)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {email.sender_name?.charAt(0) || email.sender_email?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Email Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium text-sm truncate ${
                          !email.is_read ? 'font-semibold' : ''
                        }`}>
                          {email.sender_name || email.sender_email}
                        </p>
                        {email.is_important && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm truncate ${
                        !email.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'
                      }`}>
                        {email.subject || '(No subject)'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {email.body_preview}
                      </p>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center space-x-2 text-xs text-gray-500 flex-shrink-0">
                      {email.has_attachments && (
                        <span className="text-blue-500">📎</span>
                      )}
                      {email.provider && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                          {email.provider}
                        </span>
                      )}
                      <span>
                        {email.item_timestamp ? new Date(email.item_timestamp).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(email.id, !email.is_read, email.provider);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {email.is_read ? <EyeOff className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {emails.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No emails found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedInbox; 