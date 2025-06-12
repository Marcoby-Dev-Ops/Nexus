import React, { useState } from 'react';
import { 
  Folder, 
  File, 
  FilePlus, 
  FolderPlus, 
  Star, 
  Clock, 
  Search, 
  MoreHorizontal,
  Users,
  Settings,
  Share2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../components/ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';

/**
 * WorkspacePage - User's files and project management interface
 */
const WorkspacePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file');

  // Mock workspace data
  const workspaceItems = [
    { 
      id: 'doc1', 
      name: 'Q3 Sales Report.docx', 
      type: 'file', 
      icon: <File className="h-4 w-4" />, 
      modified: '2 hours ago',
      owner: { name: 'Alex Kim', avatar: '/avatars/alex.png' },
      starred: true,
      shared: true
    },
    { 
      id: 'folder1', 
      name: 'Marketing Assets', 
      type: 'folder', 
      icon: <Folder className="h-4 w-4" />, 
      modified: 'Yesterday',
      owner: { name: 'Jordan Lee', avatar: '/avatars/jordan.png' },
      starred: false,
      shared: true
    },
    { 
      id: 'doc2', 
      name: 'Project Roadmap.xlsx', 
      type: 'file', 
      icon: <File className="h-4 w-4" />, 
      modified: '3 days ago',
      owner: { name: 'Taylor Wong', avatar: '/avatars/taylor.png' },
      starred: true,
      shared: false
    },
    { 
      id: 'folder2', 
      name: 'Product Specifications', 
      type: 'folder', 
      icon: <Folder className="h-4 w-4" />, 
      modified: 'Last week',
      owner: { name: 'You', avatar: '/avatars/you.png' },
      starred: false,
      shared: true
    },
    { 
      id: 'doc3', 
      name: 'Customer Feedback Summary.pdf', 
      type: 'file', 
      icon: <File className="h-4 w-4" />, 
      modified: '2 weeks ago',
      owner: { name: 'You', avatar: '/avatars/you.png' },
      starred: false,
      shared: false
    },
    { 
      id: 'folder3', 
      name: 'Financial Reports', 
      type: 'folder', 
      icon: <Folder className="h-4 w-4" />, 
      modified: 'Last month',
      owner: { name: 'Morgan Chen', avatar: '/avatars/morgan.png' },
      starred: false,
      shared: true
    },
  ];

  // Filter items based on search and selected tab
  const filteredItems = workspaceItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = 
      selectedTab === 'all' || 
      (selectedTab === 'starred' && item.starred) || 
      (selectedTab === 'shared' && item.shared) ||
      (selectedTab === 'my-files' && item.owner.name === 'You');
    
    return matchesSearch && matchesTab;
  });

  // Workspace collaborators
  const collaborators = [
    { id: 'user1', name: 'Alex Kim', role: 'Editor', avatar: '/avatars/alex.png' },
    { id: 'user2', name: 'Jordan Lee', role: 'Viewer', avatar: '/avatars/jordan.png' },
    { id: 'user3', name: 'Taylor Wong', role: 'Admin', avatar: '/avatars/taylor.png' },
    { id: 'user4', name: 'Morgan Chen', role: 'Editor', avatar: '/avatars/morgan.png' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspace</h1>
          <p className="text-muted-foreground">Manage your files and collaborate with your team</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setNewItemType('folder');
              setIsCreateDialogOpen(true);
            }}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button
            onClick={() => {
              setNewItemType('file');
              setIsCreateDialogOpen(true);
            }}
          >
            <FilePlus className="h-4 w-4 mr-2" />
            New File
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main content area */}
        <div className="flex-1">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search files and folders..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setSelectedTab}>
              <TabsList className="!p-0 !h-auto grid grid-cols-4 w-full sm:w-[400px] border rounded-md">
                <TabsTrigger value="all" className="rounded-none">All</TabsTrigger>
                <TabsTrigger value="my-files" className="rounded-none">My Files</TabsTrigger>
                <TabsTrigger value="shared" className="rounded-none">Shared</TabsTrigger>
                <TabsTrigger value="starred" className="rounded-none">Starred</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Files and folders list */}
          <div className="border rounded-md overflow-hidden">
            {/* Table header */}
            <div className="bg-muted px-4 py-3 border-b grid grid-cols-12 text-sm font-medium">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-3">Last Modified</div>
              <div className="col-span-1"></div>
            </div>

            {/* Files and folders list */}
            <div className="divide-y">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-muted/50">
                    <div className="col-span-6 flex items-center space-x-3">
                      <div className="text-muted-foreground">
                        {item.icon}
                      </div>
                      <div className="font-medium truncate flex items-center">
                        {item.name}
                        {item.starred && (
                          <Star className="h-3.5 w-3.5 ml-2 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={item.owner.avatar} alt={item.owner.name} />
                          <AvatarFallback>{item.owner.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{item.owner.name}</span>
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 mr-2" />
                      {item.modified}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Star className="h-4 w-4 mr-2" />
                            {item.starred ? 'Unstar' : 'Star'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No items found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-full md:w-80 space-y-6">
          {/* Workspace info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Workspace Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Storage Used</div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '42%' }}></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  4.2 GB of 10 GB used
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Workspace Plan</div>
                <div className="text-sm flex justify-between">
                  <span>Business Pro</span>
                  <Button variant="link" className="h-auto p-0 text-xs">Upgrade</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collaborators */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Collaborators
              </CardTitle>
              <CardDescription>
                People with access to this workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {collaborators.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.role}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Invite People
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Create new item dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newItemType === 'file' ? 'Create New File' : 'Create New Folder'}
            </DialogTitle>
            <DialogDescription>
              {newItemType === 'file' 
                ? 'Enter a name for your new file'
                : 'Enter a name for your new folder'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={newItemType === 'file' ? 'Untitled file' : 'Untitled folder'}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(false)}>
              Create {newItemType === 'file' ? 'File' : 'Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkspacePage; 