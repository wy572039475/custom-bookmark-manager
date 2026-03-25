import { useState, useEffect } from 'react';
import { Category } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Category, 'id' | 'userId' | 'createdAt' | 'sortOrder'>) => void;
  category?: Category | null;
}

export function CategoryForm({ isOpen, onClose, onSubmit, category }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    icon: 'folder',
  });

  // 当模态框打开或 category 变化时，重置表单数据
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: category?.name || '',
        color: category?.color || '#3b82f6',
        icon: category?.icon || 'folder',
      });
    }
  }, [isOpen, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category ? '编辑分类' : '添加分类'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="分类名称"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="请输入分类名称"
          required
        />
        <div className="space-y-2">
          <label className="text-sm font-medium">颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-12 h-9 rounded cursor-pointer"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#3b82f6"
              className="flex-1"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button type="submit" className="flex-1">
            {category ? '保存' : '添加'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
