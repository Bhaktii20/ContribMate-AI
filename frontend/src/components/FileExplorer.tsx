'use client';

import { useState, useEffect, useMemo } from 'react';
import { getRepoFileContent, RepoFileResponse } from '@/lib/api';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileImage,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  EyeOff,
  Code
} from 'lucide-react';

interface FileTreeItem {
  path: string;
  type: string;
}

interface FileExplorerProps {
  owner: string;
  repo: string;
  tree: FileTreeItem[];
  defaultBranch?: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'tree' | 'blob';
  children?: TreeNode[];
}

const BINARY_EXTENSIONS = new Set([
  'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'zip', 'tar', 'gz',
  '7z', 'rar', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'exe', 'dll', 'so',
  'dylib', 'pyc', 'wasm'
]);

function buildTreeStructure(items: FileTreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map: Record<string, TreeNode> = {};

  // Sort items so folders come first
  const sorted = [...items].sort((a, b) => {
    const aIsDir = a.type === 'tree';
    const bIsDir = b.type === 'tree';
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const item of sorted) {
    const parts = item.path.split('/');
    let currentPath = '';
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;
      const isDir = !isLast || item.type === 'tree';

      if (!map[currentPath]) {
        const newNode: TreeNode = {
          name: part,
          path: currentPath,
          type: isDir ? 'tree' : 'blob',
          children: isDir ? [] : undefined
        };
        map[currentPath] = newNode;
        currentLevel.push(newNode);
      }

      if (isDir && map[currentPath].children) {
        currentLevel = map[currentPath].children!;
      }
    }
  }

  return root;
}

export default function FileExplorer({ owner, repo, tree, defaultBranch = 'main' }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [fileData, setFileData] = useState<RepoFileResponse | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [copied, setCopied] = useState(false);

  const treeNodes = useMemo(() => buildTreeStructure(tree), [tree]);

  // Select first source/README file automatically
  useEffect(() => {
    if (tree.length > 0 && !selectedFilePath) {
      const firstFile = tree.find((t) => t.type === 'blob') || tree[0];
      if (firstFile) {
        handleFileSelect(firstFile.path);
      }
    }
  }, [tree]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleFileSelect = async (path: string) => {
    setSelectedFilePath(path);
    setLoadingFile(true);
    try {
      const data = await getRepoFileContent(owner, repo, path, defaultBranch);
      setFileData(data);
    } catch (err) {
      console.error(err);
      setFileData({
        path,
        is_binary: isBinaryFile(path),
        content: `Error loading content for ${path}`,
        github_url: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${path}`,
        default_branch: defaultBranch
      });
    } finally {
      setLoadingFile(false);
    }
  };

  const isBinaryFile = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    return BINARY_EXTENSIONS.has(ext);
  };

  const handleCopyCode = () => {
    if (fileData?.content) {
      navigator.clipboard.writeText(fileData.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderTreeItem = (node: TreeNode, depth: number = 0) => {
    const isDir = node.type === 'tree';
    const isExpanded = !!expandedFolders[node.path];
    const isSelected = selectedFilePath === node.path;
    const isBinary = !isDir && isBinaryFile(node.path);

    return (
      <div key={node.path} className="select-none">
        <div
          onClick={() => {
            if (isDir) {
              toggleFolder(node.path);
            } else {
              handleFileSelect(node.path);
            }
          }}
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
          className={`flex items-center justify-between gap-2 py-1.5 pr-3 text-xs font-mono cursor-pointer transition-colors ${
            isSelected
              ? 'bg-indigo-600/20 text-indigo-300 font-bold border-l-2 border-indigo-500'
              : 'text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {isDir ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Folder className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                )}
              </>
            ) : isBinary ? (
              <>
                <span className="w-3.5 shrink-0" />
                <FileImage className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              </>
            ) : (
              <>
                <span className="w-3.5 shrink-0" />
                <FileCode className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </div>

          {isBinary && (
            <span className="text-[9px] font-sans font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded shrink-0">
              Binary
            </span>
          )}
        </div>

        {isDir && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const githubUrl = fileData?.github_url || `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${selectedFilePath}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl">
      {/* File Tree Sidebar */}
      <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/60 flex flex-col max-h-[600px]">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Folder className="h-4 w-4 text-indigo-400" /> Repository Explorer
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{tree.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {treeNodes.map((node) => renderTreeItem(node, 0))}
        </div>
      </div>

      {/* Code / Content Viewer */}
      <div className="lg:col-span-8 flex flex-col max-h-[600px] bg-slate-900">
        {/* File Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-5 py-3">
          <div className="flex items-center gap-2 truncate">
            <Code className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-xs font-bold text-white truncate">
              {selectedFilePath || 'Select a file to view'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {fileData && !fileData.is_binary && fileData.content && (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white border border-slate-800 bg-slate-900 px-2.5 py-1 rounded-lg transition-colors"
                title="Copy Content"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
            >
              <span>Open on GitHub</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingFile ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <RefreshCw className="h-7 w-7 animate-spin text-indigo-400" />
              <p className="text-xs font-semibold">Fetching file content from GitHub API...</p>
            </div>
          ) : fileData?.is_binary ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <EyeOff className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Binary/visual file — preview not available</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Media and binary files (e.g. <code className="text-purple-300">.svg</code>, <code className="text-purple-300">.png</code>, <code className="text-purple-300">.pdf</code>) are excluded from code parsing. View directly on GitHub.
                </p>
              </div>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md transition-colors"
              >
                <span>View {selectedFilePath.split('.').pop()?.toUpperCase()} on GitHub</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <pre className="font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto p-3 rounded-xl border border-slate-800 bg-slate-950 whitespace-pre">
              <code>{fileData?.content || '// Select a file from the repository tree to view code'}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
