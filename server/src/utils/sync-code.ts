import { v4 as uuidv4 } from 'uuid';

/**
 * 生成6位同步码
 */
export function generateSyncCode(): string {
  return uuidv4().slice(0, 6).toUpperCase();
}

export default {
  generateSyncCode,
};
