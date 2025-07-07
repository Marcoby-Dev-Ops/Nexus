import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { multiModalIntelligence } from '../lib/ai/multiModalIntelligence';
import { supabase } from '../lib/core/supabase';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Star,
  Share2,
  FolderPlus,
  Grid3X3,
  List,
  Calendar,
  User,
  Tag,
  Brain,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  FileImage,
  FileVideo,
  Archive,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Folder,
  File
} from 'lucide-react';

interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  folder_id?: string;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
  is_starred: boolean;
  is_shared: boolean;
  tags: string[];
  ai_analysis?: {
    type: string;
    confidence: number;
    insights: string[];
    actionItems: string[];
    extractedData: any;
  };
  thumbnail_url?: string;
  preview_available: boolean;
}

interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  file_count: number;
  total_size: number;
  color?: string;
}

interface DocumentStats {
  total_files: number;
  total_size: number;
  files_this_month: number;
  ai_processed: number;
  shared_files: number;
  starred_files: number;
}

/**
 * DocumentCenter - Comprehensive document management system
 * Pillar: 1,2 - Customer Success Automation + Business Workflow Intelligence
 */
const DocumentCenter: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
    loadFolders();
    loadStats();
  }, [selectedFolder]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_documents')
        .select('*')
        .eq('user_id', user?.id)
        .eq('folder_id', selectedFolder || null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load documents'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_document_folders')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_document_stats', { p_user_id: user?.id });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    setIsUploading(true);
    const uploadedFiles: DocumentFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress((i / files.length) * 50); // First 50% for upload

        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        // Process with AI if supported file type
        let aiAnalysis = null;
        if (file.type.includes('pdf') || file.type.includes('image') || file.type.includes('text')) {
          try {
            const intelligence = await multiModalIntelligence.processDocument(file);
            aiAnalysis = {
              type: intelligence.type,
              confidence: intelligence.confidence,
              insights: intelligence.businessInsights,
              actionItems: intelligence.actionableItems.map(item => item.description),
              extractedData: intelligence.extractedData
            };
          } catch (error) {
            console.warn('AI processing failed:', error);
          }
        }

        setUploadProgress(50 + ((i / files.length) * 50)); // Second 50% for processing

        // Save to database
        const { data: docData, error: docError } = await supabase
          .from('ai_documents')
          .insert({
            name: file.name,
            type: file.type,
            size: file.size,
            url: publicUrl,
            folder_id: selectedFolder,
            user_id: user?.id,
            uploaded_by: user?.id,
            ai_analysis: aiAnalysis,
            preview_available: file.type.includes('image') || file.type.includes('pdf')
          })
          .select()
          .single();

        if (docError) throw docError;
        uploadedFiles.push(docData);
      }

      setDocuments(prev => [...uploadedFiles, ...prev]);
      addNotification({
        type: 'success',
        message: `Successfully uploaded ${files.length} file(s)`
      });

      if (uploadedFiles.some(doc => doc.ai_analysis)) {
        addNotification({
          type: 'info',
          message: 'AI analysis completed for supported file types'
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      addNotification({
        type: 'error',
        message: 'Failed to upload files'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('ai_document_folders')
        .insert({
          name: newFolderName,
          user_id: user?.id,
          parent_id: selectedFolder
        })
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, data]);
      setNewFolderName('');
      setShowCreateFolder(false);
      addNotification({
        type: 'success',
        message: 'Folder created successfully'
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      addNotification({
        type: 'error',
        message: 'Failed to create folder'
      });
    }
  };

  const toggleStar = async (documentId: string) => {
    try {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) return;

      const { error } = await supabase
        .from('ai_documents')
        .update({ is_starred: !doc.is_starred })
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.map(d => 
        d.id === documentId ? { ...d, is_starred: !d.is_starred } : d
      ));
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('ai_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== documentId));
      addNotification({
        type: 'success',
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      addNotification({
        type: 'error',
        message: 'Failed to delete document'
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <FileImage className="h-5 w-5" />;
    if (type.includes('video')) return <FileVideo className="h-5 w-5" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-destructive" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || 
                       (filterType === 'images' && doc.type.includes('image')) ||
                       (filterType === 'documents' && (doc.type.includes('pdf') || doc.type.includes('text'))) ||
                       (filterType === 'starred' && doc.is_starred) ||
                       (filterType === 'ai-processed' && doc.ai_analysis);

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Document Center
          </h1>
          <p className="text-muted-foreground">
            Manage, organize, and analyze your documents with AI-powered insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCreateFolder(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            accept="*/*"
          />
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
              <FileText className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-2xl font-bold">{stats.total_files}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
              <Archive className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-2xl font-bold">{formatFileSize(stats.total_size)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
              <Calendar className="h-8 w-8 text-success" />
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{stats.files_this_month}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
              <Brain className="h-8 w-8 text-secondary" />
              <p className="text-sm text-muted-foreground">AI Processed</p>
              <p className="text-2xl font-bold">{stats.ai_processed}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
              <Share2 className="h-8 w-8 text-orange-500" />
              <p className="text-sm text-muted-foreground">Shared</p>
              <p className="text-2xl font-bold">{stats.shared_files}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
              <Star className="h-8 w-8 text-warning" />
              <p className="text-sm text-muted-foreground">Starred</p>
              <p className="text-2xl font-bold">{stats.starred_files}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Alert>
          <Upload className="h-4 w-4" />
          <AlertDescription>
            Uploading and processing files... {uploadProgress.toFixed(0)}%
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents, tags, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-border rounded-md bg-background"
              >
                <option value="all">All Files</option>
                <option value="documents">Documents</option>
                <option value="images">Images</option>
                <option value="starred">Starred</option>
                <option value="ai-processed">AI Processed</option>
              </select>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Folders */}
      {folders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Folders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <Card 
                  key={folder.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <CardContent className="flex flex-col items-center justify-center gap-2 pt-6">
                    <Folder className="h-8 w-8 text-primary" />
                    <p className="text-sm font-medium text-center">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {folder.file_count} files
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Grid/List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Documents {selectedFolder && `in ${folders.find(f => f.id === selectedFolder)?.name}`}</span>
            {selectedFolder && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedFolder(null)}
              >
                Back to All Files
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
                <p>Loading documents...</p>
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first document to get started'
                }
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getFileIcon(doc.type)}
                        {doc.ai_analysis && (
                          <Badge variant="secondary" className="text-xs">
                            <Brain className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleStar(doc.id)}
                        >
                          <Star className={`h-3 w-3 ${doc.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-2 line-clamp-2">{doc.name}</h4>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>{formatFileSize(doc.size)}</p>
                      <p>{new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    {doc.ai_analysis && doc.ai_analysis.insights.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">AI Insights:</p>
                        <p className="text-xs line-clamp-2">{doc.ai_analysis.insights[0]}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    {getFileIcon(doc.type)}
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        {doc.ai_analysis && (
                          <Badge variant="secondary" className="text-xs">
                            <Brain className="h-3 w-3 mr-1" />
                            AI Processed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStar(doc.id)}
                    >
                      <Star className={`h-4 w-4 ${doc.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDocument(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                Cancel
              </Button>
              <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                Create Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getFileIcon(selectedDocument.type)}
                {selectedDocument.name}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">File Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{formatFileSize(selectedDocument.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span>{selectedDocument.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(selectedDocument.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Modified:</span>
                        <span>{new Date(selectedDocument.updated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Actions</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => window.open(selectedDocument.url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => toggleStar(selectedDocument.id)}
                      >
                        <Star className={`h-4 w-4 mr-2 ${selectedDocument.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        {selectedDocument.is_starred ? 'Unstar' : 'Star'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-destructive"
                        onClick={() => {
                          deleteDocument(selectedDocument.id);
                          setSelectedDocument(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preview">
                <div className="text-center py-8">
                  {selectedDocument.preview_available ? (
                    selectedDocument.type.includes('image') ? (
                      <img 
                        src={selectedDocument.url} 
                        alt={selectedDocument.name}
                        className="max-w-full max-h-96 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="space-y-4">
                        <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">Preview not available for this file type</p>
                        <Button onClick={() => window.open(selectedDocument.url, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Preview not available</p>
                      <Button onClick={() => window.open(selectedDocument.url, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="ai-insights">
                {selectedDocument.ai_analysis ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="h-5 w-5 text-secondary" />
                      <span className="font-semibold">AI Analysis Results</span>
                      <Badge variant="secondary">
                        {(selectedDocument.ai_analysis.confidence * 100).toFixed(1)}% confidence
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Document Type</h4>
                      <Badge variant="outline">{selectedDocument.ai_analysis.type}</Badge>
                    </div>
                    
                    {selectedDocument.ai_analysis.insights.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Business Insights</h4>
                        <ul className="space-y-1">
                          {selectedDocument.ai_analysis.insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedDocument.ai_analysis.actionItems.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Action Items</h4>
                        <ul className="space-y-1">
                          {selectedDocument.ai_analysis.actionItems.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Zap className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No AI Analysis Available</h3>
                    <p className="text-muted-foreground">
                      This file type is not supported for AI analysis, or the analysis failed.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DocumentCenter; 