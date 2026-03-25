import { Edit, Trash2 } from 'lucide-react';
import { Bookmark as BookmarkType, Category } from '../types';
import { Button } from './ui/Button';

interface BookmarkCardProps {
  bookmark: BookmarkType;
  categories: Category[];
  onEdit: (bookmark: BookmarkType) => void;
  onDelete: (id: string) => void;
  onVisit: (id: string, url: string) => void;
}

const getIconForUrl = (url: string): string => {
  if (url.includes('github.com')) return 'fab fa-github';
  if (url.includes('stackoverflow.com')) return 'fab fa-stack-overflow';
  if (url.includes('youtube.com')) return 'fab fa-youtube';
  if (url.includes('google.com')) return 'fab fa-google';
  if (url.includes('react.dev') || url.includes('reactjs')) return 'fab fa-react';
  if (url.includes('vuejs')) return 'fab fa-vuejs';
  if (url.includes('twitter.com')) return 'fab fa-twitter';
  if (url.includes('linkedin.com')) return 'fab fa-linkedin';
  if (url.includes('facebook.com')) return 'fab fa-facebook';
  return 'fas fa-globe';
};

const getCategoryColor = (color?: string): string => {
  if (color) {
    return `bg-opacity-20`;
  }
  return 'bg-gray-100 text-gray-700';
};

export function BookmarkCard({ bookmark, categories, onEdit, onDelete, onVisit }: BookmarkCardProps) {
  const icon = getIconForUrl(bookmark.url);
  const category = categories.find(c => c.id === bookmark.categoryId);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onVisit(bookmark.id, bookmark.url);
  };

  return (
    <div 
      className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg card-hover group cursor-pointer border border-white/50 relative overflow-hidden"
      onClick={handleCardClick}
    >
      {/* 装饰背景 */}
      <div className="absolute top-0 right-0 w-32 h-32 card-decoration-bg rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start flex-1 min-w-0">
            <div className="w-12 h-12 icon-container rounded-xl text-white mr-4 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <i className={`${icon} text-lg`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-800 truncate group-hover:text-primary transition-colors">{bookmark.title}</h3>
              <p className="text-sm text-gray-400 truncate block mt-1">
                {bookmark.url}
              </p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(bookmark); }}
              className="text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }}
              className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {bookmark.description && (
          <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
            {bookmark.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          {category && (
            <span
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
              style={{ 
                backgroundColor: category.color ? `${category.color}15` : '#f3f4f6',
                color: category.color || '#374151',
                border: `1px solid ${category.color ? `${category.color}30` : '#e5e7eb'}`
              }}
            >
              <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: category.color || '#9ca3af' }}></span>
              {category.name}
            </span>
          )}
          <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            <i className="fas fa-external-link-alt mr-1"></i>
            点击访问
          </div>
        </div>
      </div>
    </div>
  );
}
