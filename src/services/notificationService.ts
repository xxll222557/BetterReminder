import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

// 你有发送通知的权限吗？
let permissionGranted = await isPermissionGranted();

// 如果没有，我们需要请求它
if (!permissionGranted) {
  const permission = await requestPermission();
  permissionGranted = permission === 'granted';
}

// 一旦获得许可，我们就可以发送通知
if (permissionGranted) {
  sendNotification({ title: 'Tauri', body: 'Tauri is awesome!' });
}