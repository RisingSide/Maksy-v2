'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Upload,
  FolderPlus,
  Grid3x3,
  List,
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  Folder,
  MoreHorizontal,
  Download,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import {
  useDocuments,
  useDocumentMutations,
  Document,
} from '@/hooks/use-documents'
import { useDebouncedValue } from '@/hooks/use-debounce'

// Predefined folder structure
const FOLDER_STRUCTURE = [
  { path: '/', label: 'All Documents', icon: '📁' },
  { path: '/customers', label: 'Customers', icon: '📁' },
  { path: '/jobs', label: 'Jobs', icon: '📁' },
  { path: '/invoices', label: 'Invoices', icon: '📁' },
  { path: '/company', label: 'Company Files', icon: '📁' },
  {
    path: '/company/licenses',
    label: 'Licenses & Permits',
    icon: '📁',
    indent: true,
  },
  { path: '/company/insurance', label: 'Insurance', icon: '📁', indent: true },
  {
    path: '/company/training',
    label: 'Training Manuals',
    icon: '📁',
    indent: true,
  },
  { path: '/team', label: 'Team Files', icon: '📁' },
  { path: '/uncategorized', label: 'Uncategorized', icon: '📁' },
]

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File className="h-5 w-5" />

  if (fileType.includes('image'))
    return <FileImage className="h-5 w-5 text-purple-500" />
  if (fileType.includes('pdf'))
    return <FileText className="h-5 w-5 text-red-500" />
  if (
    fileType.includes('spreadsheet') ||
    fileType.includes('excel') ||
    fileType.includes('csv')
  ) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />
  }
  if (fileType.includes('document') || fileType.includes('word')) {
    return <FileText className="h-5 w-5 text-blue-500" />
  }

  return <File className="h-5 w-5 text-muted-foreground" />
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DocumentsClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('/')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const { documents, isLoading, total, refetch } = useDocuments({
    folderPath: selectedFolder === '/' ? undefined : selectedFolder,
    search: debouncedSearch || undefined,
  })
  const {
    uploadDocument,
    deleteDocument,
    isLoading: isMutating,
  } = useDocumentMutations()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        await uploadDocument(file, {
          folderPath: selectedFolder === '/' ? undefined : selectedFolder,
        })
      }
      refetch()
    } catch {
      // Error handled by hook
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.fileName}"?`)) return

    try {
      await deleteDocument(doc.id)
      refetch()
    } catch {
      // Error handled by hook
    }
  }

  const handleDownload = (doc: Document) => {
    window.open(doc.fileUrl, '_blank')
  }

  // Count documents per folder
  const folderCounts = documents.reduce(
    (acc, doc) => {
      const folder = doc.folderPath || '/uncategorized'
      acc[folder] = (acc[folder] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="flex gap-6 min-h-[calc(100vh-200px)] animate-fade-in">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={handleFileSelect}
      />

      {/* Left Sidebar: Folder Tree */}
      <Card className="w-64 p-4 space-y-2 glass-card shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Folders</h3>
          <Button size="sm" variant="ghost" title="Create folder (coming soon)">
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1 text-sm">
          {FOLDER_STRUCTURE.map((folder) => (
            <Button
              key={folder.path}
              variant={selectedFolder === folder.path ? 'secondary' : 'ghost'}
              className={`w-full justify-start gap-2 ${folder.indent ? 'pl-8' : ''}`}
              size="sm"
              onClick={() => setSelectedFolder(folder.path)}
            >
              <Folder className="h-4 w-4 text-primary" />
              <span className="flex-1 text-left">{folder.label}</span>
              {folderCounts[folder.path] && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {folderCounts[folder.path]}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </Card>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground">
              {total} document{total !== 1 ? 's' : ''} in{' '}
              {FOLDER_STRUCTURE.find((f) => f.path === selectedFolder)?.label ||
                'All Documents'}
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload
          </Button>
        </div>

        {/* Toolbar */}
        <Card className="p-4 glass-card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Documents */}
        {isLoading ? (
          <Card className="p-6 glass-card">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </Card>
        ) : documents.length === 0 ? (
          <Card className="p-12 glass-card">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {searchQuery ? 'No documents found' : 'No documents yet'}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {searchQuery
                    ? 'Try adjusting your search or selecting a different folder'
                    : 'Upload your first document to get started. You can organize files in folders, tag them, and link them to customers, jobs, or invoices.'}
                </p>
              </div>
              {!searchQuery && (
                <Button
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload First Document
                </Button>
              )}
            </div>
          </Card>
        ) : viewMode === 'list' ? (
          <Card className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left p-4 font-semibold text-sm">Name</th>
                  <th className="text-left p-4 font-semibold text-sm">Size</th>
                  <th className="text-left p-4 font-semibold text-sm">
                    Uploaded
                  </th>
                  <th className="text-left p-4 font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          {getFileIcon(doc.fileType)}
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[300px]">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.folderPath || 'Root'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="glass-card p-4 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-16 w-16 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="space-y-1 w-full">
                    <p className="font-medium truncate">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.fileSize)} •{' '}
                      {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
