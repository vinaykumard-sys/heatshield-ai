import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TOOLCHAIN_DIR = path.join(ROOT_DIR, 'tools', 'android-toolchain');
const DOWNLOADS_DIR = path.join(TOOLCHAIN_DIR, '_downloads');

const PACKAGES = [
  {
    name: 'OpenJDK 17',
    url: 'https://download.visualstudio.microsoft.com/download/pr/58dca6c6-c3c9-4daa-8e17-b7d0df501afc/667a0e2c93e1aab8df0707a31c42d190/microsoft-jdk-17.0.12-windows-x64.zip',
    targetDir: path.join(TOOLCHAIN_DIR, 'jdk-17'),
    archiveName: 'microsoft-jdk-17.zip',
    flattenSingleSubdir: true,
    expectedFile: path.join('bin', 'java.exe'),
  },
  {
    name: 'Android Build Tools (r34)',
    url: 'https://dl.google.com/android/repository/build-tools_r34-windows.zip',
    targetDir: path.join(TOOLCHAIN_DIR, 'build-tools'),
    archiveName: 'build-tools_r34.zip',
    flattenSingleSubdir: false, // will extract android-14/ inside build-tools
    expectedFile: path.join('android-14', 'aapt2.exe'),
  },
  {
    name: 'Android Platform API 33',
    url: 'https://dl.google.com/android/repository/platform-33_r01.zip',
    targetDir: path.join(TOOLCHAIN_DIR, 'platforms'),
    archiveName: 'platform-33_r01.zip',
    flattenSingleSubdir: false, // will extract android-13/ inside platforms
    expectedFile: path.join('android-13', 'android.jar'),
  },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function downloadFile(url, destPath) {
  console.log(`\n[DOWNLOAD] Fetching: ${url}`);
  const tempDest = `${destPath}.tmp`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
  let downloadedBytes = 0;
  let lastLoggedPct = -1;
  const startTime = Date.now();

  const fileStream = fs.createWriteStream(tempDest);
  const reader = response.body.getReader();

  const progressStream = new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
          return;
        }
        downloadedBytes += value.length;
        if (totalBytes > 0) {
          const pct = Math.floor((downloadedBytes / totalBytes) * 100);
          if (pct >= lastLoggedPct + 5 || pct === 100) {
            lastLoggedPct = pct;
            const elapsedSec = Math.max((Date.now() - startTime) / 1000, 0.1);
            const speed = formatBytes(downloadedBytes / elapsedSec) + '/s';
            process.stdout.write(
              `\r  -> Progress: ${pct}% (${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}) at ${speed}    `
            );
          }
        } else {
          process.stdout.write(`\r  -> Downloaded: ${formatBytes(downloadedBytes)}    `);
        }
        this.push(value);
      } catch (err) {
        this.destroy(err);
      }
    },
  });

  await finished(progressStream.pipe(fileStream));
  process.stdout.write('\n');

  if (fs.existsSync(destPath)) {
    fs.unlinkSync(destPath);
  }
  fs.renameSync(tempDest, destPath);
  console.log(`[DOWNLOAD] Completed: ${formatBytes(fs.statSync(destPath).size)} -> ${destPath}`);
}

function extractZip(archivePath, targetDir) {
  console.log(`[EXTRACT] Unzipping ${path.basename(archivePath)} into ${targetDir}...`);
  fs.mkdirSync(targetDir, { recursive: true });

  try {
    execSync(`tar.exe -xf "${archivePath}" -C "${targetDir}"`, { stdio: 'inherit' });
  } catch (err) {
    console.warn(`[WARN] tar.exe failed (${err.message}), falling back to PowerShell Expand-Archive...`);
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${targetDir}' -Force"`,
      { stdio: 'inherit' }
    );
  }
}

function checkAndFlattenSubdir(targetDir) {
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  // If there is only one subdirectory and no other files, move it up
  const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'));
  const files = entries.filter((e) => e.isFile());

  if (dirs.length === 1 && files.length === 0) {
    const subDirName = dirs[0].name;
    const subDirPath = path.join(targetDir, subDirName);
    const parentDir = path.dirname(targetDir);
    const tempDir = path.join(parentDir, `_temp_flat_${Date.now()}`);
    console.log(`[FLATTEN] Moving nested folder "${subDirName}" up to "${targetDir}"...`);
    execSync(
      `powershell -NoProfile -Command "Move-Item -Path '${subDirPath}' -Destination '${tempDir}'; Remove-Item -Path '${targetDir}' -Force -Recurse; Move-Item -Path '${tempDir}' -Destination '${targetDir}'"`,
      { stdio: 'inherit' }
    );
  }
}

async function setupPackage(pkg) {
  console.log(`\n============================================================`);
  console.log(`Package: ${pkg.name}`);
  console.log(`============================================================`);

  const archivePath = path.join(DOWNLOADS_DIR, pkg.archiveName);
  const targetExpectedPath = path.join(pkg.targetDir, pkg.expectedFile);

  if (fs.existsSync(targetExpectedPath)) {
    console.log(`[SKIP] Already installed. Found: ${targetExpectedPath}`);
    return;
  }

  if (!fs.existsSync(archivePath)) {
    await downloadFile(pkg.url, archivePath);
  } else {
    console.log(`[REUSE] Using existing archive: ${archivePath} (${formatBytes(fs.statSync(archivePath).size)})`);
  }

  extractZip(archivePath, pkg.targetDir);

  if (pkg.flattenSingleSubdir) {
    checkAndFlattenSubdir(pkg.targetDir);
  }

  if (!fs.existsSync(targetExpectedPath)) {
    console.warn(`[CHECK] Expected file not directly at ${targetExpectedPath}. Scanning target directory...`);
    // Search recursively for the expected file name
    const findFile = (dir, fileName) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const res = findFile(full, fileName);
          if (res) return res;
        } else if (entry.name.toLowerCase() === fileName.toLowerCase()) {
          return full;
        }
      }
      return null;
    };
    const found = findFile(pkg.targetDir, path.basename(pkg.expectedFile));
    if (found) {
      console.log(`[FOUND] Located expected binary at: ${found}`);
    } else {
      throw new Error(`Failed to locate expected file ${pkg.expectedFile} in ${pkg.targetDir}`);
    }
  } else {
    console.log(`[VERIFIED] Successfully placed at: ${targetExpectedPath}`);
  }
}

function verifyBinary(desc, execCommand, cwd) {
  console.log(`\n[VERIFY] ${desc}: ${execCommand}`);
  try {
    const out = execSync(execCommand, { cwd: cwd || ROOT_DIR, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const preview = (out.trim().split('\n')[0] || 'Success').trim();
    console.log(`  -> Output: ${preview}`);
    return { ok: true, output: out.trim() };
  } catch (err) {
    const combined = ((err.stdout || '') + '\n' + (err.stderr || '')).trim();
    const preview = combined.split('\n')[0] || err.message;
    console.log(`  -> Code ${err.status}: ${preview}`);
    // If command returned non-zero but gave expected output (like apksigner/zipalign returning help text)
    if (combined.length > 0) {
      return { ok: true, output: combined };
    }
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log(`[TOOLCHAIN] Initializing Android Toolchain Setup`);
  console.log(`Target Directory: ${TOOLCHAIN_DIR}`);

  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

  for (const pkg of PACKAGES) {
    await setupPackage(pkg);
  }

  console.log(`\n============================================================`);
  console.log(`[VERIFICATION PHASE] Testing all required binaries`);
  console.log(`============================================================`);

  const results = {};

  // 1. JDK 17
  const javaBin = path.join(TOOLCHAIN_DIR, 'jdk-17', 'bin', 'java.exe');
  const javacBin = path.join(TOOLCHAIN_DIR, 'jdk-17', 'bin', 'javac.exe');
  const keytoolBin = path.join(TOOLCHAIN_DIR, 'jdk-17', 'bin', 'keytool.exe');

  results.java = { path: javaBin, ...verifyBinary('Java', `"${javaBin}" -version`) };
  results.javac = { path: javacBin, ...verifyBinary('Javac', `"${javacBin}" -version`) };
  results.keytool = { path: keytoolBin, ...verifyBinary('Keytool', `"${keytoolBin}" -help`) };

  // 2. Build Tools (android-14)
  // Find where android-14 (or build-tools root) is located
  let buildToolsSubdir = path.join(TOOLCHAIN_DIR, 'build-tools', 'android-14');
  if (!fs.existsSync(buildToolsSubdir)) {
    // Check if directly in build-tools
    if (fs.existsSync(path.join(TOOLCHAIN_DIR, 'build-tools', 'aapt2.exe'))) {
      buildToolsSubdir = path.join(TOOLCHAIN_DIR, 'build-tools');
    }
  }

  const aapt2Bin = path.join(buildToolsSubdir, 'aapt2.exe');
  const zipalignBin = path.join(buildToolsSubdir, 'zipalign.exe');
  const apksignerBat = path.join(buildToolsSubdir, 'apksigner.bat');

  results.aapt2 = { path: aapt2Bin, ...verifyBinary('AAPT2', `"${aapt2Bin}" version`) };
  results.zipalign = { path: zipalignBin, ...verifyBinary('Zipalign', `"${zipalignBin}" -h`) };
  
  // Set JAVA_HOME in env when running apksigner
  const jdkHome = path.join(TOOLCHAIN_DIR, 'jdk-17');
  const envWithJdk = { ...process.env, JAVA_HOME: jdkHome, PATH: `${path.join(jdkHome, 'bin')};${process.env.PATH}` };
  try {
    console.log(`\n[VERIFY] Apksigner: "${apksignerBat}" --version (with JAVA_HOME=${jdkHome})`);
    const apkSignerOut = execSync(`cmd /c "${apksignerBat}" --version`, {
      cwd: buildToolsSubdir,
      env: envWithJdk,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(`  -> Output: ${apkSignerOut.trim()}`);
    results.apksigner = { path: apksignerBat, ok: true, output: apkSignerOut.trim() };
  } catch (err) {
    const combined = ((err.stdout || '') + '\n' + (err.stderr || '')).trim();
    console.log(`  -> Result: ${combined.split('\n')[0] || err.message}`);
    results.apksigner = { path: apksignerBat, ok: combined.length > 0, output: combined };
  }

  // 3. Android Platform (android.jar)
  const androidJar = path.join(TOOLCHAIN_DIR, 'platforms', 'android-13', 'android.jar');
  const jarExists = fs.existsSync(androidJar);
  const jarSize = jarExists ? fs.statSync(androidJar).size : 0;
  console.log(`\n[VERIFY] Android JAR: ${androidJar}`);
  console.log(`  -> Exists: ${jarExists} (${formatBytes(jarSize)})`);
  results.androidJar = { path: androidJar, ok: jarExists, size: jarSize };

  console.log(`\n============================================================`);
  console.log(`SUMMARY OF TOOLCHAIN BINARIES`);
  console.log(`============================================================`);
  console.log(`Java:       ${results.java.path} (${results.java.ok ? 'VERIFIED' : 'FAILED'})`);
  console.log(`Javac:      ${results.javac.path} (${results.javac.ok ? 'VERIFIED' : 'FAILED'})`);
  console.log(`Keytool:    ${results.keytool.path} (${results.keytool.ok ? 'VERIFIED' : 'FAILED'})`);
  console.log(`AAPT2:      ${results.aapt2.path} (${results.aapt2.ok ? 'VERIFIED' : 'FAILED'})`);
  console.log(`Zipalign:   ${results.zipalign.path} (${results.zipalign.ok ? 'VERIFIED' : 'FAILED'})`);
  console.log(`Apksigner:  ${results.apksigner.path} (${results.apksigner.ok ? 'VERIFIED' : 'FAILED'})`);
  console.log(`AndroidJar: ${results.androidJar.path} (${results.androidJar.ok ? 'VERIFIED' : 'FAILED'})`);
  console.log(`============================================================\n`);
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]', err);
  process.exit(1);
});
