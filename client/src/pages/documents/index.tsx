import React, { useState, useEffect } from 'react';
import { Search, Upload, FileText, Filter, Plus, Trash2, ExternalLink, Folder, File, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useAuth } from '@/hooks';
import { useUserContext } from '@/shared/contexts/UserContext';
import { companyKnowledgeService } from '@/services/business/CompanyKnowledgeService';

interface Document {
  id: string;
  title: string;
  content_type: string;
  source: string;
  created_at: string;
  updated_at: string;
  file_size?: number;
  url?: string;
}

const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserContext();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const companyId = profile?.company_id || user?.id;

  useEffect(() => {
    if (companyId) {
      loadDocuments();
    }
  }, [companyId]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, activeTab]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await companyKnowledgeService.getDocuments(companyId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tab
    switch (activeTab) {
      case 'recent':
        filtered = filtered.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ).slice(0, 10);
        break;
      case 'large':
        filtered = filtered.filter(doc => (doc.file_size || 0) > 1024 * 1024); // > 1MB
        break;
      case 'external':
        filtered = filtered.filter(doc => doc.source !== 'upload');
        break;
      default:
        break;
    }

    setFilteredDocuments(filtered);
  };

  const handleSearch = () => {
    filterDocuments();
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleDeleteDocuments = async () => {
    if (!selectedDocuments.length || !companyId) return;

    try {
      setIsLoading(true);
      await Promise.all(
        selectedDocuments.map(id => companyKnowledgeService.deleteDocument(id, companyId))
      );
      await loadDocuments();
      setSelectedDocuments([]);
    } catch (error) {
      console.error('Error deleting documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'onedrive':
        return '📁';
      case 'gdrive':
        return '☁️';
      case 'upload':
        return '📤';
      default:
        return '📄';
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('word') || contentType.includes('docx')) return '📝';
    if (contentType.includes('excel') || contentType.includes('xlsx')) return '📊';
    if (contentType.includes('powerpoint') || contentType.includes('pptx')) return '📈';
    if (contentType.includes('image')) return '🖼️';
    return '📄';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-2">
            Manage and organize your business documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="large">Large Files</TabsTrigger>
          <TabsTrigger value="external">External</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Bulk Actions */}
          {selectedDocuments.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedDocuments.length} document(s) selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDeleteDocuments}
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Loading documents...</p>
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No documents found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Upload your first document to get started'}
                </p>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <Card 
                  key={doc.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDocuments.includes(doc.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleDocumentSelect(doc.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">
                            {getContentTypeIcon(doc.content_type)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {doc.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(doc.file_size)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {doc.source}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {formatDate(doc.updated_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentsPage;
