import React, { useEffect, useState, useRef } from 'react';
import { FileText, Download, RefreshCw, Loader2, FolderOpen, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import { useAuth } from '@/hooks/index';
import { useToast } from '@/shared/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface WorkspaceFile {
    name: string;
    size: number;
    lastModified?: string;
    path: string;
    isDirectory?: boolean;
}

export default function WorkspacePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [files, setFiles] = useState<WorkspaceFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFiles = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/openclaw/workspace/files', {
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch files: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                setFiles(data.data || []);
            } else {
                throw new Error(data.error || 'Failed to load workspace files');
            }
        } catch (err) {
            console.error('Error fetching workspace files:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load workspace files. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleDownload = async (filename: string) => {
        setDownloading(filename);
        try {
            const response = await fetch(`/api/openclaw/workspace/files/${encodeURIComponent(filename)}?download=true`, {
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: 'Download Started',
                description: `Downloading ${filename}...`,
            });
        } catch (err) {
            console.error('Download error:', err);
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: `Could not download ${filename}.`,
            });
        } finally {
            setDownloading(null);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/openclaw/workspace/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            if (data.success) {
                toast({
                    title: 'Upload Successful',
                    description: `${file.name} has been uploaded.`,
                    variant: 'success'
                });
                fetchFiles(); // Refresh list
            } else {
                throw new Error(data.error || 'Failed to upload file');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: err instanceof Error ? err.message : 'Could not upload file.',
            });
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <FolderOpen className="h-8 w-8 text-primary" />
                        Workspace Files
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage files from your OpenClaw agent workspace.
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <Button onClick={handleUploadClick} disabled={uploading} className="gap-2">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Upload File
                    </Button>
                    <Button onClick={fetchFiles} variant="outline" disabled={loading} className="gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Files</CardTitle>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                            <p className="text-lg font-medium text-destructive mb-2">Failed to load files</p>
                            <p className="text-sm">{error}</p>
                            <Button variant="outline" className="mt-4" onClick={fetchFiles}>Try Again</Button>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Loading workspace files...</p>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <FolderOpen className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No files found</p>
                            <p className="text-sm mt-1">Your workspace is empty.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Last Modified</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {files.map((file) => (
                                        <TableRow key={file.path}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                {file.name}
                                            </TableCell>
                                            <TableCell>{formatSize(file.size)}</TableCell>
                                            <TableCell>{formatDate(file.lastModified)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownload(file.name)}
                                                    disabled={downloading === file.name}
                                                >
                                                    {downloading === file.name ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Download className="h-4 w-4" />
                                                    )}
                                                    <span className="sr-only">Download</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
