import React from 'react';
import { Shield, BookOpen, Globe, User, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import type { SourceMeta } from '@/domains/ai/components/chat/SourceDrawer';

// Map source types to icons and colors
const sourceTypeMap: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  user: { icon: <User className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700', label: 'User' },
  business: { icon: <Shield className="w-4 h-4" />, color: 'bg-green-100 text-green-700', label: 'Business' },
  document: { icon: <BookOpen className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-700', label: 'Document' },
  web: { icon: <Globe className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700', label: 'Web' },
  database: { icon: <Database className="w-4 h-4" />, color: 'bg-pink-100 text-pink-700', label: 'Database' },
  verified: { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-700', label: 'Verified' },
  unverified: { icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700', label: 'Unverified' },
};

export interface SourceChipProps {
  source: SourceMeta;
  onClick?: (source: SourceMeta) => void;
}

export const SourceChip: React.FC<SourceChipProps> = ({ source, onClick }) => {
  const typeInfo = sourceTypeMap[source.type] || sourceTypeMap['document'];
  return (
    <button
      type="button"
      aria-label={`View source: ${typeInfo.label}`}
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition ${typeInfo.color} hover:opacity-90`}
      onClick={() => onClick?.(source)}
    >
      {typeInfo.icon}
      <span className="ml-1">{typeInfo.label}</span>
      {typeof source.confidence === 'number' && (
        <span className="ml-2 text-gray-500 dark:text-gray-300">{(source.confidence * 100).toFixed(0)}%</span>
      )}
    </button>
  );
};

export default SourceChip; 