/**
 * 浏览器指纹识别服务
 * 用于生成唯一的设备标识符，无需用户登录即可识别用户
 */

interface FingerprintData {
  fingerprint: string;
  syncCode: string;
}

// 存储键名
const STORAGE_KEYS = {
  FINGERPRINT: 'device_fingerprint',
  SYNC_CODE: 'device_sync_code',
};

/**
 * 生成浏览器指纹
 * 收集浏览器特征信息生成唯一标识
 */
async function generateFingerprint(): Promise<string> {
  const components: string[] = [];

  // 1. 用户代理
  components.push(navigator.userAgent);

  // 2. 屏幕信息
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // 3. 时区
  components.push(String(Intl.DateTimeFormat().resolvedOptions().timeZone));

  // 4. 语言
  components.push(navigator.language);

  // 5. 平台
  components.push(navigator.platform);

  // 6. 硬件并发数（CPU核心数）
  components.push(String(navigator.hardwareConcurrency || 0));

  // 7. 设备内存（如果可用）
  const nav = navigator as any;
  if (nav.deviceMemory) {
    components.push(String(nav.deviceMemory));
  }

  // 8. 触摸支持
  components.push(String(navigator.maxTouchPoints || 0));

  // 9. Canvas 指纹
  try {
    const canvasFingerprint = getCanvasFingerprint();
    components.push(canvasFingerprint);
  } catch (e) {
    components.push('canvas-error');
  }

  // 10. WebGL 指纹
  try {
    const webglFingerprint = getWebGLFingerprint();
    components.push(webglFingerprint);
  } catch (e) {
    components.push('webgl-error');
  }

  // 组合所有特征并生成哈希
  const rawFingerprint = components.join('|||');
  const hash = await simpleHash(rawFingerprint);

  return `fp_${hash}`;
}

/**
 * Canvas 指纹
 */
function getCanvasFingerprint(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');

  if (!ctx) return 'no-canvas';

  // 绘制文本
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('Fingerprint', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('Canvas', 4, 17);

  return canvas.toDataURL();
}

/**
 * WebGL 指纹
 */
function getWebGLFingerprint(): string {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;

  if (!gl) return 'no-webgl';

  const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    return `${vendor}|${renderer}`;
  }

  return 'webgl-basic';
}

/**
 * 简单哈希函数
 */
async function simpleHash(str: string): Promise<string> {
  // 使用 SubtleCrypto API 进行哈希
  const encoder = new TextEncoder();
  const data = encoder.encode(str);

  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 16);
    return hashHex;
  } catch (e) {
    // 降级方案：简单字符串哈希
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
  }
}

/**
 * 生成同步码（6位字母数字）
 */
function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除容易混淆的字符 I, O, 0, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 指纹服务类
 */
export const FingerprintService = {
  /**
   * 获取或创建设备指纹
   */
  async getOrCreateFingerprint(): Promise<FingerprintData> {
    // 先尝试从本地存储获取
    let fingerprint = localStorage.getItem(STORAGE_KEYS.FINGERPRINT);
    let syncCode = localStorage.getItem(STORAGE_KEYS.SYNC_CODE);

    // 如果没有，则生成新的
    if (!fingerprint) {
      fingerprint = await generateFingerprint();
      localStorage.setItem(STORAGE_KEYS.FINGERPRINT, fingerprint);
    }

    if (!syncCode) {
      syncCode = generateSyncCode();
      localStorage.setItem(STORAGE_KEYS.SYNC_CODE, syncCode);
    }

    return { fingerprint, syncCode };
  },

  /**
   * 获取当前指纹
   */
  getFingerprint(): string | null {
    return localStorage.getItem(STORAGE_KEYS.FINGERPRINT);
  },

  /**
   * 获取当前同步码
   */
  getSyncCode(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SYNC_CODE);
  },

  /**
   * 使用同步码恢复身份
   * 这会将当前指纹绑定到已有的同步码账户
   */
  async restoreWithSyncCode(newSyncCode: string): Promise<FingerprintData> {
    // 生成新的指纹（因为可能是新设备）
    const fingerprint = await generateFingerprint();

    // 保存新的同步码
    localStorage.setItem(STORAGE_KEYS.SYNC_CODE, newSyncCode);
    localStorage.setItem(STORAGE_KEYS.FINGERPRINT, fingerprint);

    return { fingerprint, syncCode: newSyncCode };
  },

  /**
   * 重新生成同步码
   */
  async regenerateSyncCode(): Promise<string> {
    const syncCode = generateSyncCode();
    localStorage.setItem(STORAGE_KEYS.SYNC_CODE, syncCode);
    return syncCode;
  },

  /**
   * 清除所有本地身份信息
   */
  clearIdentity(): void {
    localStorage.removeItem(STORAGE_KEYS.FINGERPRINT);
    localStorage.removeItem(STORAGE_KEYS.SYNC_CODE);
  },

  /**
   * 检查是否有本地身份
   */
  hasIdentity(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.FINGERPRINT);
  },
};

export default FingerprintService;
