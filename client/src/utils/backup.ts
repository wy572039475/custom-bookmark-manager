/**
 * 数据备份和恢复工具
 */

export interface BackupData {
  version: string;
  timestamp: string;
  user: any;
  bookmarks: any[];
  categories: any[];
  settings?: any;
}

const BACKUP_VERSION = '2.0';
const BACKUP_KEY_PREFIX = 'backup_';
const MAX_BACKUPS = 5;
const AUTO_BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24小时

/**
 * 创建备份
 */
export function createBackup(
  user: any,
  bookmarks: any[],
  categories: any[],
  settings?: any
): BackupData {
  return {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    bookmarks,
    categories,
    settings,
  };
}

/**
 * 保存备份到 localStorage
 */
export function saveBackupToLocalStorage(backup: BackupData): string {
  const backupId = `backup_${Date.now()}`;
  const backups = getBackupList();

  // 限制备份数量
  if (backups.length >= MAX_BACKUPS) {
    const oldestBackup = backups[backups.length - 1];
    localStorage.removeItem(oldestBackup.id);
  }

  localStorage.setItem(backupId, JSON.stringify(backup));

  // 保存备份列表
  const backupMeta = {
    id: backupId,
    timestamp: backup.timestamp,
    bookmarkCount: backup.bookmarks.length,
    categoryCount: backup.categories.length,
  };
  const updatedBackups = [backupMeta, ...backups.slice(0, MAX_BACKUPS - 1)];
  localStorage.setItem('backup_list', JSON.stringify(updatedBackups));

  return backupId;
}

/**
 * 从 localStorage 加载备份
 */
export function loadBackupFromLocalStorage(backupId: string): BackupData | null {
  try {
    const backupData = localStorage.getItem(backupId);
    if (!backupData) return null;
    return JSON.parse(backupData);
  } catch (error) {
    console.error('加载备份失败:', error);
    return null;
  }
}

/**
 * 获取备份列表
 */
export function getBackupList(): Array<{
  id: string;
  timestamp: string;
  bookmarkCount: number;
  categoryCount: number;
}> {
  try {
    const backupList = localStorage.getItem('backup_list');
    return backupList ? JSON.parse(backupList) : [];
  } catch (error) {
    console.error('获取备份列表失败:', error);
    return [];
  }
}

/**
 * 删除备份
 */
export function deleteBackup(backupId: string): boolean {
  try {
    localStorage.removeItem(backupId);
    const backups = getBackupList();
    const updatedBackups = backups.filter(b => b.id !== backupId);
    localStorage.setItem('backup_list', JSON.stringify(updatedBackups));
    return true;
  } catch (error) {
    console.error('删除备份失败:', error);
    return false;
  }
}

/**
 * 清除所有备份
 */
export function clearAllBackups(): boolean {
  try {
    const backups = getBackupList();
    backups.forEach(backup => {
      localStorage.removeItem(backup.id);
    });
    localStorage.removeItem('backup_list');
    return true;
  } catch (error) {
    console.error('清除所有备份失败:', error);
    return false;
  }
}

/**
 * 下载备份文件
 */
export function downloadBackup(backup: BackupData, filename?: string): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `bookmark-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 从文件加载备份
 */
export async function loadBackupFromFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content) as BackupData;
        validateBackup(backup);
        resolve(backup);
      } catch (error) {
        reject(new Error('备份文件格式无效'));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}

/**
 * 验证备份数据
 */
export function validateBackup(backup: any): void {
  if (!backup || typeof backup !== 'object') {
    throw new Error('无效的备份数据');
  }

  if (!backup.version || !backup.timestamp) {
    throw new Error('备份文件缺少必要字段');
  }

  if (!Array.isArray(backup.bookmarks)) {
    throw new Error('备份数据格式错误：缺少书签列表');
  }

  if (!Array.isArray(backup.categories)) {
    throw new Error('备份数据格式错误：缺少分类列表');
  }
}

/**
 * 自动备份检查
 */
export function checkAutoBackup(): boolean {
  const lastBackup = localStorage.getItem('last_auto_backup');
  const now = Date.now();

  if (!lastBackup) {
    return true; // 从未备份过
  }

  const lastBackupTime = parseInt(lastBackup, 10);
  return now - lastBackupTime > AUTO_BACKUP_INTERVAL;
}

/**
 * 更新最后备份时间
 */
export function updateLastBackupTime(): void {
  localStorage.setItem('last_auto_backup', Date.now().toString());
}

/**
 * 获取备份统计信息
 */
export function getBackupStats(): {
  totalBackups: number;
  totalSize: number;
  oldestBackup: string | null;
  newestBackup: string | null;
} {
  const backups = getBackupList();
  let totalSize = 0;

  backups.forEach(backup => {
    const backupData = localStorage.getItem(backup.id);
    if (backupData) {
      totalSize += backupData.length * 2; // UTF-16 字符
    }
  });

  return {
    totalBackups: backups.length,
    totalSize,
    oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
    newestBackup: backups.length > 0 ? backups[0].timestamp : null,
  };
}

export default {
  createBackup,
  saveBackupToLocalStorage,
  loadBackupFromLocalStorage,
  getBackupList,
  deleteBackup,
  clearAllBackups,
  downloadBackup,
  loadBackupFromFile,
  validateBackup,
  checkAutoBackup,
  updateLastBackupTime,
  getBackupStats,
};
