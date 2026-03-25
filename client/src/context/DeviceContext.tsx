import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import FingerprintService from '../services/fingerprint';

interface DeviceContextType {
  fingerprint: string | null;
  syncCode: string | null;
  isLoading: boolean;
  isFirstVisit: boolean;
  restoreWithSyncCode: (syncCode: string) => Promise<boolean>;
  regenerateSyncCode: () => Promise<string>;
  clearDevice: () => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    initDevice();
  }, []);

  const initDevice = async () => {
    try {
      // 检查是否已有身份
      const hasIdentity = FingerprintService.hasIdentity();

      // 获取或创建指纹和同步码
      const data = await FingerprintService.getOrCreateFingerprint();

      setFingerprint(data.fingerprint);
      setSyncCode(data.syncCode);

      // 如果之前没有身份，说明是首次访问
      if (!hasIdentity) {
        setIsFirstVisit(true);
      }
    } catch (error) {
      console.error('初始化设备失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreWithSyncCode = useCallback(async (newSyncCode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const data = await FingerprintService.restoreWithSyncCode(newSyncCode);
      setFingerprint(data.fingerprint);
      setSyncCode(data.syncCode);
      setIsFirstVisit(false);
      return true;
    } catch (error) {
      console.error('恢复身份失败:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const regenerateSyncCode = useCallback(async (): Promise<string> => {
    const newSyncCode = await FingerprintService.regenerateSyncCode();
    setSyncCode(newSyncCode);
    return newSyncCode;
  }, []);

  const clearDevice = useCallback(() => {
    FingerprintService.clearIdentity();
    setFingerprint(null);
    setSyncCode(null);
    setIsFirstVisit(true);
    // 重新初始化
    initDevice();
  }, []);

  return (
    <DeviceContext.Provider
      value={{
        fingerprint,
        syncCode,
        isLoading,
        isFirstVisit,
        restoreWithSyncCode,
        regenerateSyncCode,
        clearDevice,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
}

export default DeviceContext;
