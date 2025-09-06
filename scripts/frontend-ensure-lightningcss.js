// scripts/frontend-ensure-lightningcss.js
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function has(cmd) {
  try { execSync(`command -v ${cmd}`, { stdio: "ignore" }); return true; } catch { return false; }
}
function run(cmd, cwd) {
  console.log(">", cmd);
  execSync(cmd, { stdio: "inherit", cwd });
}

const plat = process.platform;
const arch = process.arch;
const frontendDir = path.resolve(__dirname, "..", "frontend");

console.log(`🔍 检测平台: ${plat} ${arch}`);

if (plat !== "darwin") {
  console.log("ℹ️ 非 macOS 平台; 跳过 arm64 确保.");
  process.exit(0);
}
if (arch !== "arm64") {
  console.error(`❌ Node 架构是 ${arch}; 请在原生 arm64 shell 下运行.`);
  console.error("💡 运行: arch -arm64 zsh");
  process.exit(1);
}

// 先切换到 frontend 目录
process.chdir(frontendDir);
console.log(`📁 切换到前端目录: ${frontendDir}`);

let ok = false;
try {
  // 在 frontend 目录中查找 lightningcss
  const core = require.resolve("lightningcss");
  console.log(`✅ Lightning CSS 核心包已安装: ${core}`);
  
  // 检查原生绑定文件是否存在
  const native = path.resolve(path.dirname(core), "node", "lightningcss.darwin-arm64.node");
  ok = fs.existsSync(native);
  
  if (ok) {
    console.log(`✅ arm64 原生绑定文件存在: ${native}`);
  } else {
    console.log(`❌ arm64 原生绑定文件缺失: ${native}`);
    // 尝试在 pnpm 的符号链接结构中查找
    const pnpmNative = path.resolve("node_modules", ".pnpm", "lightningcss-darwin-arm64@1.30.1", "node_modules", "lightningcss-darwin-arm64", "lightningcss.darwin-arm64.node");
    if (fs.existsSync(pnpmNative)) {
      console.log(`✅ 在 pnpm 结构中找到 arm64 原生绑定: ${pnpmNative}`);
      ok = true;
    }
  }
} catch (e) {
  console.log(`❌ Lightning CSS 核心包未安装: ${e.message}`);
  // 尝试直接检查文件系统而不是依赖 require.resolve
  const lightningcssPath = path.resolve("node_modules", "lightningcss");
  if (fs.existsSync(lightningcssPath)) {
    console.log(`✅ 在文件系统中找到 lightningcss 目录: ${lightningcssPath}`);
    // 检查原生绑定文件
    const native = path.resolve(lightningcssPath, "node", "lightningcss.darwin-arm64.node");
    if (fs.existsSync(native)) {
      console.log(`✅ arm64 原生绑定文件存在: ${native}`);
      ok = true;
    } else {
      // 检查 pnpm 符号链接结构
      const pnpmNative = path.resolve("node_modules", ".pnpm", "lightningcss-darwin-arm64@1.30.1", "node_modules", "lightningcss-darwin-arm64", "lightningcss.darwin-arm64.node");
      if (fs.existsSync(pnpmNative)) {
        console.log(`✅ 在 pnpm 结构中找到 arm64 原生绑定: ${pnpmNative}`);
        ok = true;
      }
    }
  } else {
    ok = false;
  }
}

if (!ok) {
  const pm = has("pnpm") ? "pnpm" : "npm";
  // 使用 --dir 参数指定安装目录，避免 --filter 需要 workspace
  const addCmd = pm === "pnpm" 
    ? `pnpm add -D lightningcss@latest lightningcss-darwin-arm64@latest --dir "${frontendDir}"`
    : `npm add -D lightningcss@latest lightningcss-darwin-arm64@latest`;
  console.log("🔧 安装 arm64 原生 Lightning CSS…");
  run(addCmd, pm === "pnpm" ? path.dirname(frontendDir) : frontendDir);
  
  // 再次检查（在 frontend 目录中）
  try {
    const core = require.resolve("lightningcss");
    const native = path.resolve(path.dirname(core), "node", "lightningcss.darwin-arm64.node");
    if (fs.existsSync(native)) {
      console.log("✅ arm64 Lightning CSS 安装成功");
    } else {
      // 检查 pnpm 符号链接结构
      const pnpmNative = path.resolve("node_modules", ".pnpm", "lightningcss-darwin-arm64@1.30.1", "node_modules", "lightningcss-darwin-arm64", "lightningcss.darwin-arm64.node");
      if (fs.existsSync(pnpmNative)) {
        console.log("✅ 在 pnpm 结构中找到 arm64 原生绑定");
      } else {
        console.log("⚠️  Lightning CSS 安装完成但原生绑定可能仍有问题");
      }
    }
  } catch (e) {
    console.log("❌ Lightning CSS 安装后仍无法解析");
    throw e;
  }
} else {
  console.log("✅ arm64 Lightning CSS 绑定已存在.");
}

console.log("✅ 确保完成.");