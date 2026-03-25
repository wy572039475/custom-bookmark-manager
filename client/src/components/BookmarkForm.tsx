import { useState, useEffect } from 'react';
import { Bookmark as BookmarkType, Category } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Link, Globe, FileText, FolderOpen, AlertCircle, Sparkles } from 'lucide-react';

interface BookmarkFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<BookmarkType, 'id' | 'userId' | 'visitCount' | 'createdAt' | 'updatedAt'>) => void;
  bookmark?: BookmarkType | null;
  categories: Category[];
}

interface FormErrors {
  title?: string;
  url?: string;
  description?: string;
  categoryId?: string;
}

export function BookmarkForm({ isOpen, onClose, onSubmit, bookmark, categories }: BookmarkFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    categoryId: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 当模态框打开或 bookmark 变化时，重置表单数据
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: bookmark?.title || '',
        url: bookmark?.url || '',
        description: bookmark?.description || '',
        categoryId: bookmark?.categoryId || '',
      });
      setErrors({});
      setTouched({});
    }
  }, [isOpen, bookmark]);

  // URL 格式校验
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // 单字段校验
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'title':
        if (!value.trim()) return '请输入标题';
        if (value.trim().length < 2) return '标题至少需要2个字符';
        if (value.trim().length > 100) return '标题不能超过100个字符';
        break;
      case 'url':
        if (!value.trim()) return '请输入网址';
        if (!isValidUrl(value.trim())) return '请输入有效的网址（如 https://example.com）';
        break;
      case 'description':
        if (!value.trim()) return '请输入描述';
        if (value.trim().length < 2) return '描述至少需要2个字符';
        if (value.trim().length > 500) return '描述不能超过500个字符';
        break;
      case 'categoryId':
        if (!value) return '请选择分类';
        break;
    }
    return undefined;
  };

  // 全表单校验
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    const titleError = validateField('title', formData.title);
    if (titleError) newErrors.title = titleError;

    const urlError = validateField('url', formData.url);
    if (urlError) newErrors.url = urlError;

    const descError = validateField('description', formData.description);
    if (descError) newErrors.description = descError;

    const categoryError = validateField('categoryId', formData.categoryId);
    if (categoryError) newErrors.categoryId = categoryError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理字段变化
  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 如果字段已被触摸，实时校验
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // 处理字段失焦
  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 标记所有字段为已触摸
    setTouched({
      title: true,
      url: true,
      description: true,
      categoryId: true,
    });

    if (!validateForm()) {
      return;
    }

    onSubmit({
      ...formData,
      sortOrder: 0,
      categoryId: formData.categoryId,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={bookmark ? '编辑收藏' : '添加收藏'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 标题 */}
        <div className="relative">
          <div className="absolute left-4 top-[38px] text-gray-400">
            <Link className="h-4 w-4" />
          </div>
          <Input
            label="标题"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            placeholder="请输入书签标题"
            error={errors.title}
            className="pl-11"
          />
        </div>

        {/* URL */}
        <div className="relative">
          <div className="absolute left-4 top-[38px] text-gray-400">
            <Globe className="h-4 w-4" />
          </div>
          <Input
            label="网址"
            value={formData.url}
            onChange={(e) => handleChange('url', e.target.value)}
            onBlur={() => handleBlur('url')}
            placeholder="https://example.com"
            error={errors.url}
            className="pl-11"
          />
        </div>

        {/* 描述 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            className={`flex min-h-[100px] w-full rounded-xl border bg-white/80 backdrop-blur-sm px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400/20 hover:border-gray-300 resize-none ${
              errors.description 
                ? 'border-red-400 focus-visible:ring-red-400/20' 
                : 'border-gray-200 focus-visible:border-purple-400'
            }`}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder="请输入书签描述信息"
          />
          {errors.description && (
            <p className="text-sm text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.description}
            </p>
          )}
        </div>

        {/* 分类 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-gray-400" />
            分类 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              className={`flex h-11 w-full rounded-xl border bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400/20 hover:border-gray-300 appearance-none cursor-pointer ${
                errors.categoryId 
                  ? 'border-red-400 focus-visible:ring-red-400/20' 
                  : 'border-gray-200 focus-visible:border-purple-400'
              } ${!formData.categoryId ? 'text-gray-400' : 'text-gray-700'}`}
              value={formData.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              onBlur={() => handleBlur('categoryId')}
            >
              <option value="">请选择分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.categoryId && (
            <p className="text-sm text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.categoryId}
            </p>
          )}
        </div>

        {/* 提示信息 */}
        {categories.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-amber-700">暂无分类，请先添加分类后再创建书签</span>
          </div>
        )}

        {/* 按钮组 */}
        <div className="flex gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 h-11 rounded-xl font-medium transition-all hover:bg-gray-100"
          >
            取消
          </Button>
          <Button 
            type="submit" 
            className="flex-1 h-11 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25"
            disabled={categories.length === 0}
          >
            {bookmark ? '保存修改' : '添加书签'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
