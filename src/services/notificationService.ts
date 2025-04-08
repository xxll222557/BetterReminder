import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

/**
 * 检查并请求通知权限
 * @returns 返回是否获得了权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    // 检查是否已有权限
    let permissionGranted = await isPermissionGranted();
    
    // 如果没有，则请求权限
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    
    return permissionGranted;
  } catch (error) {
    console.error('获取通知权限失败:', error);
    return false;
  }
}

/**
 * 发送一条通知
 * @param title 通知标题
 * @param body 通知内容
 * @param icon 通知图标（可选）
 * @returns 是否成功发送
 */
export async function sendAppNotification(
  title: string, 
  body: string,
  icon: string = '/favicon.ico'
): Promise<boolean> {
  try {
    // 先检查权限
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      console.warn('没有通知权限，无法发送通知');
      return false;
    }
    
    // 发送通知
    await sendNotification({ 
      title, 
      body,
      icon 
    });
    
    return true;
  } catch (error) {
    console.error('发送通知失败:', error);
    return false;
  }
}

/**
 * 发送测试通知
 */
export async function sendTestNotification(): Promise<boolean> {
  return sendAppNotification(
    '测试通知', 
    '当你看到这条通知的时候，说明通知功能正常~',
  );
}