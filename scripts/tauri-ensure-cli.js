#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 检测包管理器
function detectPackageManager() {
  try {
    execSync('command -v pnpm', { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    return 'npm';
  }
}

// 检测平台和架构
function detectPlatform() {
  const platform = process.platform;
  const arch = process.arch;
  
  console.log(`🔍 检测到平台: ${platform} ${arch}`);
  
  return { platform, arch };
}

// 检查 Tauri CLI 是否可解析
function checkTauriCliResolvable() {
  try {
    require.resolve('@tauri-apps/cli');
    console.log('✅ @tauri-apps/cli 已安装且可解析');
    return true;
  } catch (error) {
    console.log('❌ @tauri-apps/cli 无法解析:', error.message);
    return false;
  }
}

// 安装平台特定的 Tauri CLI 包
function installPlatformPackage(platform, arch, packageManager) {
  let packages = ['@tauri-apps/cli@latest'];
  
  if (platform === 'darwin') {
    if (arch === 'arm64') {
      packages.push('@tauri-apps/cli-darwin-arm64@latest');
      console.log('🍎 为 macOS ARM64 安装 Tauri CLI 包...');
    } else if (arch === 'x64') {
      packages.push('@tauri-apps/cli-darwin-x64@latest');
      console.log('🍎 为 macOS x64 安装 Tauri CLI 包...');
    }
  }
  
  const installCmd = packageManager === 'pnpm' 
    ? `pnpm add -D ${packages.join(' ')}`
    : `npm i -D ${packages.join(' ')}`;
  
  console.log(`📦 运行安装命令: ${installCmd}`);
  
  try {
    execSync(installCmd, { stdio: 'inherit' });
    console.log('✅ 平台特定包安装成功');
    return true;
  } catch (error) {
    console.error('❌ 安装失败:', error.message);
    return false;
  }
}

// 检查 cargo 是否可用
function checkCargoAvailable() {
  try {
    execSync('command -v cargo', { stdio: 'ignore' });
    console.log('🦀 检测到 Rust/Cargo 工具链');
    return true;
  } catch {
    console.log('⚠️  未检测到 Rust/Cargo 工具链');
    return false;
  }
}

// 主函数
async function main() {
  console.log('🚀 开始确保 Tauri CLI 环境...');
  
  try {
    const { platform, arch } = detectPlatform();
    const packageManager = detectPackageManager();
    console.log(`📦 使用包管理器: ${packageManager}`);
    
    // 检查 Tauri CLI 是否已可解析
    if (checkTauriCliResolvable()) {
      console.log('✅ Tauri CLI 环境已就绪');
      process.exit(0);
    }
    
    // 尝试安装平台特定包
    console.log('🔧 尝试安装平台特定的 Tauri CLI 包...');
    if (installPlatformPackage(platform, arch, packageManager)) {
      // 再次检查是否可解析
      if (checkTauriCliResolvable()) {
        console.log('✅ Tauri CLI 环境修复成功');
        process.exit(0);
      }
    }
    
    // 如果所有方法都失败，检查 cargo 作为后备
    if (checkCargoAvailable()) {
      console.log('💡 建议使用 cargo tauri dev 作为后备方案');
      console.log('   运行: cargo tauri dev');
    }
    
    console.error('❌ 无法修复 Tauri CLI 环境');
    process.exit(1);
    
  } catch (error) {
    console.error('💥 确保脚本执行失败:', error.message);
    process.exit(1);
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

main();
