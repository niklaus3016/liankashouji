# 恋咖手记

纯本地的咖啡手账 Android 应用。界面使用 React + Vite，安卓端使用 Kotlin WebView 壳，记录与配图保存在设备本地。

## 开发

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:3000`。

## 构建 Web 并同步到安卓

```bash
npm run build:android
```

该命令会构建前端，并将 `dist/` 同步到 `android/app/src/main/assets/`。安卓 APK 构建前必须先执行此步骤。

## 构建 APK

使用 Android Studio 打开 `android/` 目录，或在配置好 JDK 17 与 Android SDK 的环境中执行：

```bash
cd android
gradle assembleDebug
```

生成的调试包位于 `android/app/build/outputs/apk/debug/app-debug.apk`。

## GitHub Actions

推送到 `main` 分支后，`.github/workflows/android.yml` 会自动：

1. 安装前端依赖并构建 Web 资源；
2. 同步资源到安卓工程；
3. 使用 Gradle 构建 debug APK；
4. 上传 `lianka-shouji-debug-apk` 构建产物。

也可以在 Actions 页面手动触发 `Build Android APK`。
