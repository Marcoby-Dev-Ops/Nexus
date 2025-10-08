import React, { useState, useEffect } from 'react';
import { Search, Upload, MessageSquare, FileText, Filter, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { companyKnowledgeService, type CKBDocument, type CKBSearchResult, type CKBQAResponse } from '@/services/business/CompanyKnowledgeService';
import { useAuth } from '@/hooks';
import { useUserContext } from '@/shared/contexts/UserContext';

const CKBPage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserContext();
  const [documents, setDocuments] = useState<CKBDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CKBSearchResult[]>([]);
  const [question, setQuestion] = useState('');
  const [qaResponse, setQaResponse] = useState<CKBQAResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('documents');

  const companyId = profile?.company_id || user?.id;

  useEffect(() => {
    if (companyId) {
      loadDocuments();
    }
  }, [companyId]);

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

  const handleSearch = async () => {
    if (!searchQuery.trim() || !companyId) return;

    try {
      setIsLoading(true);
      const results = await companyKnowledgeService.searchDocuments(companyId, {
        query: searchQuery,
        limit: 10
      });
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('Error searching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !companyId) return;

    try {
      setIsLoading(true);
      const response = await companyKnowledgeService.askQuestion(companyId, question);
      setQaResponse(response);
      setActiveTab('qa');
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!companyId) return;

    try {
      await companyKnowledgeService.deleteDocument(documentId, companyId);
      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
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
    switch (contentType) {
      case 'pdf':
        return '📕';
      case 'docx':
        return '📘';
      case 'xlsx':
        return '📊';
      case 'pptx':
        return '📽️';
      case 'txt':
        return '📝';
      default:
        return '📄';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Corporate Knowledge Base</h1>
          <p className="text-muted-foreground mt-2">
            Search, analyze, and get insights from your company documents
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Connect Storage
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search your documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="search">Search Results</TabsTrigger>
          <TabsTrigger value="qa">Q&A</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Documents</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">
                {documents.length} documents
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your OneDrive or Google Drive to start building your knowledge base
                </p>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Connect Storage
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl">
                          {getContentTypeIcon(doc.content_type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{doc.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getSourceIcon(doc.source)} {doc.source}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {doc.content_type.toUpperCase()}
                            </Badge>
                            {doc.metadata.department && (
                              <Badge variant="outline" className="text-xs">
                                {doc.metadata.department}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {doc.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Added {new Date(doc.created_at).toLocaleDateString()}</span>
                            {doc.metadata.author && (
                              <span>by {doc.metadata.author}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.source_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Search Results Tab */}
        <TabsContent value="search" className="space-y-4">
          <h2 className="text-xl font-semibold">Search Results</h2>
          {searchResults.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No search results</h3>
                <p className="text-muted-foreground">
                  Try searching for something in your documents
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{result.document.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(result.score * 100)}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.context}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getSourceIcon(result.document.source)} {result.document.source}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {result.document.content_type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(result.document.source_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Q&A Tab */}
        <TabsContent value="qa" className="space-y-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question about your documents..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                className="flex-1"
              />
              <Button onClick={handleAskQuestion} disabled={isLoading}>
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>

            {qaResponse && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Answer</h3>
                      <p className="text-muted-foreground">{qaResponse.answer}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {Math.round(qaResponse.confidence * 100)}% confidence
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Based on {qaResponse.sources.length} documents
                      </span>
                    </div>

                    {qaResponse.sources.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Sources</h4>
                        <div className="space-y-2">
                          {qaResponse.sources.map((source, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span>{source.title}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(source.source_url, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <h2 className="text-xl font-semibold">Document Insights</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {new Set(documents.map(d => d.content_type)).size}
                </div>
                <p className="text-sm text-muted-foreground">File Types</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {new Set(documents.map(d => d.source)).size}
                </div>
                <p className="text-sm text-muted-foreground">Connected Sources</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CKBPage;
