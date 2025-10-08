import React, { useState, useEffect } from 'react';
import { logger } from '@/shared/utils/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  FolderOpen, 
  Search, 
  FileText, 
  Shield, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Upload,
  Download,
  Eye,
  Lock,
  RefreshCw
} from 'lucide-react';
import type { StorageProvider, KnowledgeDocumentMeta, DocumentDomain } from '@/services/integrations/ZeroRetentionStorageService';
import { ZeroRetentionStorageService } from '@/services/integrations/ZeroRetentionStorageService';

interface ZeroRetentionDocumentManagerProps {
  initiativeTitle: string;
  storageProvider: string;
  onDocumentTracked?: (documentMeta: KnowledgeDocumentMeta) => void;
}

export const ZeroRetentionDocumentManager: React.FC<ZeroRetentionDocumentManagerProps> = ({
  initiativeTitle,
  storageProvider,
  onDocumentTracked
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<DocumentDomain>('Compliance');
  const [documents, setDocuments] = useState<KnowledgeDocumentMeta[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  // Initialize zero-retention storage service
  const _storageService = new ZeroRetentionStorageService({
    retentionPolicy: 'zero_content',
    dataResidency: 'customer_controlled',
    auditLogging: 'metadata_only',
    ephemeralCache: '10_minutes_max',
    aclTrimming: true,
    contentRedaction: false
  });

  // Sample documents for demonstration
  useEffect(() => {
    const sampleDocuments: KnowledgeDocumentMeta[] = [
      {
        pointer: {
          provider: storageProvider as StorageProvider,
          driveId: 'primary',
          fileId: 'doc1',
          webUrl: 'https://drive.google.com/file/d/doc1',
          aclHash: 'hash1'
        },
        title: 'Business Entity Registration Certificate',
        mime: 'application/pdf',
        domain: ['Legal', 'Compliance'],
        docType: 'certificate',
        lastModified: '2024-01-15T10:30:00Z',
        taxonomy: ['BusinessRegistration', 'LegalCompliance'],
        businessEntity: 'Acme Corp LLC',
        renewalDate: '2025-01-15T10:30:00Z',
        complianceStatus: 'active'
      },
      {
        pointer: {
          provider: storageProvider as StorageProvider,
          driveId: 'primary',
          fileId: 'doc2',
          webUrl: 'https://drive.google.com/file/d/doc2',
          aclHash: 'hash2'
        },
        title: 'EIN Confirmation Letter',
        mime: 'application/pdf',
        domain: ['Finance', 'Compliance'],
        docType: 'certificate',
        lastModified: '2024-01-10T14:20:00Z',
        taxonomy: ['TaxID', 'IRS'],
        businessEntity: 'Acme Corp LLC',
        renewalDate: '2025-01-10T14:20:00Z',
        complianceStatus: 'active'
      },
      {
        pointer: {
          provider: storageProvider as StorageProvider,
          driveId: 'primary',
          fileId: 'doc3',
          webUrl: 'https://drive.google.com/file/d/doc3',
          aclHash: 'hash3'
        },
        title: 'Business License',
        mime: 'application/pdf',
        domain: ['Legal', 'Compliance'],
        docType: 'certificate',
        lastModified: '2023-12-01T09:15:00Z',
        taxonomy: ['BusinessLicense', 'LocalCompliance'],
        businessEntity: 'Acme Corp LLC',
        renewalDate: '2024-12-01T09:15:00Z',
        complianceStatus: 'pending_renewal'
      }
    ];

    setDocuments(sampleDocuments);
  }, [storageProvider]);

  const handleConnectStorage = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      // Simulate OAuth connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConnectionStatus('connected');
      
      // Track the initiative document
      const initiativeDoc = documents.find(doc => doc.title.includes(initiativeTitle));
      if (initiativeDoc && onDocumentTracked) {
        onDocumentTracked(initiativeDoc);
      }
    } catch (error) {
      logger.error('Connection failed:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSearchDocuments = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      // In a real implementation, this would call storageService.searchDocuments()
      logger.info('Searching documents with query:', searchQuery);
      // Results would be filtered based on search query
    } catch (error) {
      logger.error('Search failed:', error);
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success border-success/30';
      case 'pending_renewal': return 'bg-warning/20 text-warning border-warning/30';
      case 'expired': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'pending_renewal': return <Clock className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.taxonomy.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDomain = selectedDomain === 'Compliance' || doc.domain.includes(selectedDomain);
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Zero-Retention Document Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage "{initiativeTitle}" through your {storageProvider} storage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Zero Retention
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Metadata Only
          </Badge>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Storage Connection
          </CardTitle>
          <CardDescription>
            Connect your {storageProvider} account with least-privilege access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-success' :
                connectionStatus === 'connecting' ? 'bg-warning' : 'bg-muted'
              }`} />
              <span className="text-sm font-medium">
                {connectionStatus === 'connected' ? 'Connected to ' + storageProvider :
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Not connected'}
              </span>
            </div>
            <Button 
              onClick={handleConnectStorage}
              disabled={isConnecting || connectionStatus === 'connected'}
              className="flex items-center gap-2"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {connectionStatus === 'connected' ? 'Connected' : 'Connect Storage'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="search">Search & RAG</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-xs text-muted-foreground">Tracked in your storage</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {documents.filter(doc => doc.complianceStatus === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">Up to date</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {documents.filter(doc => doc.complianceStatus !== 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">Requires renewal</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Zero-Retention Architecture</CardTitle>
              <CardDescription>
                How Nexus manages your documents without storing content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">What Nexus Stores</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Document metadata (title, type, location)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Compliance dates and renewal reminders
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Access permissions and ACL hashes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Audit logs (operations only)
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">What Nexus Never Stores</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      Document content or file contents
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      Personal or sensitive data
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      File attachments or embedded content
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      Search indexes or vectors (unless customer-owned)
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedDomain} onValueChange={(value) => setSelectedDomain(value as DocumentDomain)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Compliance">All Compliance</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearchDocuments} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.pointer.fileId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-foreground">{doc.title}</h3>
                        <Badge className={getComplianceStatusColor(doc.complianceStatus)}>
                          {getComplianceStatusIcon(doc.complianceStatus)}
                          {doc.complianceStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>Domain: {doc.domain.join(', ')}</span>
                        <span>Type: {doc.docType}</span>
                        <span>Modified: {new Date(doc.lastModified).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.taxonomy.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Compliance Tracking
              </CardTitle>
              <CardDescription>
                Monitor renewal dates and compliance status for your documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.pointer.fileId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getComplianceStatusIcon(doc.complianceStatus)}
                      <div>
                        <h4 className="font-medium text-foreground">{doc.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Renewal: {doc.renewalDate ? new Date(doc.renewalDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getComplianceStatusColor(doc.complianceStatus)}>
                        {doc.complianceStatus}
                      </Badge>
                      {doc.complianceStatus === 'pending_renewal' && (
                        <Button size="sm" variant="outline">
                          Set Reminder
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search & RAG Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Zero-Retention Search & RAG
              </CardTitle>
              <CardDescription>
                Search across your documents and get AI-powered insights without storing content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Search Modes</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 border rounded-lg">
                        <input type="radio" name="searchMode" id="searchOnly" defaultChecked />
                        <label htmlFor="searchOnly" className="text-sm">
                          <div className="font-medium">Search-Only RAG</div>
                          <div className="text-muted-foreground">Live search with in-memory processing</div>
                        </label>
                      </div>
                      <div className="flex items-center gap-2 p-3 border rounded-lg">
                        <input type="radio" name="searchMode" id="customerIndex" />
                        <label htmlFor="customerIndex" className="text-sm">
                          <div className="font-medium">Customer-Owned Index</div>
                          <div className="text-muted-foreground">Vectors stored in your infrastructure</div>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Example Queries</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        "What is our business entity registration status?"
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        "When does our EIN certificate expire?"
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        "Show me all compliance documents that need renewal"
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">How Zero-Retention RAG Works</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Query your documents using native search APIs</li>
                    <li>2. Download relevant documents in memory (no disk storage)</li>
                    <li>3. Process and chunk content in RAM only</li>
                    <li>4. Generate embeddings and answer queries</li>
                    <li>5. Discard all content from memory immediately</li>
                    <li>6. Log only operation metadata for audit</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
