import os
import sys
import shutil
import subprocess
import zipfile
import hashlib
import json
import time

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TOOLS_DIR = os.path.join(ROOT_DIR, "tools", "android-toolchain")
JDK_BIN = os.path.join(TOOLS_DIR, "jdk-17", "bin")
BUILD_TOOLS = os.path.join(TOOLS_DIR, "build-tools", "android-14")
PLATFORM_JAR = os.path.join(TOOLS_DIR, "platforms", "android-13", "android.jar")

AAPT2 = os.path.join(BUILD_TOOLS, "aapt2.exe")
ZIPALIGN = os.path.join(BUILD_TOOLS, "zipalign.exe")
D8_JAR = os.path.join(BUILD_TOOLS, "lib", "d8.jar")
APKSIGNER_JAR = os.path.join(BUILD_TOOLS, "lib", "apksigner.jar")
JAVAC = os.path.join(JDK_BIN, "javac.exe")
KEYTOOL = os.path.join(JDK_BIN, "keytool.exe")
JAVA = os.path.join(JDK_BIN, "java.exe")

KEYSTORE = os.path.join(ROOT_DIR, "heatshield-release.keystore")
KEY_ALIAS = "heatshield"
KEY_PASS = "heatshield2026"

BUILD_DIR = os.path.join(ROOT_DIR, "build")
OUTPUT_APK = os.path.join(ROOT_DIR, "public", "downloads", "HeatShield-AI.apk")

def run_cmd(cmd, env=None, cwd=ROOT_DIR):
    print(f"[EXEC] {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    res = subprocess.run(cmd, env=env, cwd=cwd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[STDERR]\n{res.stderr}")
        print(f"[STDOUT]\n{res.stdout}")
        raise RuntimeError(f"Command failed with exit code {res.returncode}")
    if res.stdout:
        print(res.stdout.strip())
    return res

def main():
    print("=== HeatShield AI Android Native APK Compilation Pipeline ===")
    
    # 0. Setup Directories
    os.makedirs(BUILD_DIR, exist_ok=True)
    gen_dir = os.path.join(BUILD_DIR, "gen")
    classes_dir = os.path.join(BUILD_DIR, "classes")
    dex_dir = os.path.join(BUILD_DIR, "dex")
    staging_dir = os.path.join(BUILD_DIR, "apk-staging")
    
    for d in [gen_dir, classes_dir, dex_dir, staging_dir]:
        if os.path.exists(d):
            shutil.rmtree(d)
        os.makedirs(d, exist_ok=True)

    # 1. Compile Resources with aapt2
    print("\n--- Step 1: Compiling Resources with AAPT2 ---")
    compiled_res = os.path.join(BUILD_DIR, "compiled_res.zip")
    res_dir = os.path.join(ROOT_DIR, "android-src", "res")
    run_cmd([AAPT2, "compile", "--dir", res_dir, "-o", compiled_res])

    # 2. Link Resources and Manifest with aapt2
    print("\n--- Step 2: Linking Resources with AAPT2 ---")
    manifest = os.path.join(ROOT_DIR, "android-src", "AndroidManifest.xml")
    base_apk = os.path.join(BUILD_DIR, "base.apk")
    run_cmd([
        AAPT2, "link",
        "-I", PLATFORM_JAR,
        "--manifest", manifest,
        "-o", base_apk,
        "--java", gen_dir,
        compiled_res,
        "--auto-add-overlay"
    ])

    # 3. Compile Java with javac
    print("\n--- Step 3: Compiling Java Sources ---")
    java_files = []
    for root, _, files in os.walk(os.path.join(ROOT_DIR, "android-src", "java")):
        for f in files:
            if f.endswith(".java"):
                java_files.append(os.path.join(root, f))
    for root, _, files in os.walk(gen_dir):
        for f in files:
            if f.endswith(".java"):
                java_files.append(os.path.join(root, f))
                
    run_cmd([
        JAVAC,
        "-source", "1.8",
        "-target", "1.8",
        "-cp", f"{PLATFORM_JAR};{gen_dir}",
        "-d", classes_dir,
        *java_files
    ])

    # 4. Compile .class files to Dalvik DEX with D8
    print("\n--- Step 4: Compiling DEX with D8 ---")
    class_files = []
    for root, _, files in os.walk(classes_dir):
        for f in files:
            if f.endswith(".class"):
                class_files.append(os.path.join(root, f))

    run_cmd([
        JAVA,
        "-cp", D8_JAR,
        "com.android.tools.r8.D8",
        "--output", dex_dir,
        "--lib", PLATFORM_JAR,
        *class_files
    ])

    # 5. Assemble APK Structure
    print("\n--- Step 5: Assembling APK staging directory ---")
    with zipfile.ZipFile(base_apk, "r") as z:
        z.extractall(staging_dir)

    # Copy classes.dex
    shutil.copyfile(os.path.join(dex_dir, "classes.dex"), os.path.join(staging_dir, "classes.dex"))

    # Copy web assets to assets/www
    www_dir = os.path.join(staging_dir, "assets", "www")
    os.makedirs(www_dir, exist_ok=True)
    dist_dir = os.path.join(ROOT_DIR, "dist")
    for item in os.listdir(dist_dir):
        if item == "downloads":
            continue
        s = os.path.join(dist_dir, item)
        d = os.path.join(www_dir, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            shutil.copy2(s, d)

    # Fix relative paths in assets/www/index.html if needed
    www_index = os.path.join(www_dir, "index.html")
    if os.path.exists(www_index):
        with open(www_index, "r", encoding="utf-8") as f:
            content = f.read()
        # Ensure href and src for /assets/ work seamlessly
        content = content.replace('src="/assets/', 'src="./assets/')
        content = content.replace('href="/assets/', 'href="./assets/')
        content = content.replace('href="/favicon.svg', 'href="./favicon.svg')
        content = content.replace('href="/manifest.json', 'href="./manifest.json')
        with open(www_index, "w", encoding="utf-8") as f:
            f.write(content)

    # 6. Package unaligned APK
    print("\n--- Step 6: Creating unaligned APK archive ---")
    unaligned_apk = os.path.join(BUILD_DIR, "unaligned.apk")
    if os.path.exists(unaligned_apk):
        os.remove(unaligned_apk)

    # Store uncompressed for .arsc and already compressed assets
    no_compress_exts = {".arsc", ".png", ".jpg", ".webp", ".ogg", ".mp3", ".wav"}
    with zipfile.ZipFile(unaligned_apk, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(staging_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, staging_dir).replace("\\", "/")
                ext = os.path.splitext(file)[1].lower()
                
                # Android requires resources.arsc to be stored uncompressed
                if file == "resources.arsc" or ext in no_compress_exts:
                    z.write(full_path, rel_path, compress_type=zipfile.ZIP_STORED)
                else:
                    z.write(full_path, rel_path, compress_type=zipfile.ZIP_DEFLATED)

    # 7. Zipalign (4-byte alignment)
    print("\n--- Step 7: 4-Byte ZipAligning ---")
    aligned_apk = os.path.join(BUILD_DIR, "aligned.apk")
    if os.path.exists(aligned_apk):
        os.remove(aligned_apk)
    run_cmd([ZIPALIGN, "-p", "-f", "4", unaligned_apk, aligned_apk])

    # Check alignment verification
    run_cmd([ZIPALIGN, "-c", "-p", "4", aligned_apk])
    print("[SUCCESS] Zip alignment verified on 4-byte boundaries.")

    # 8. Sign with apksigner (v1 + v2 + v3)
    print("\n--- Step 8: Signing APK with v1, v2, and v3 schemes ---")
    os.makedirs(os.path.dirname(OUTPUT_APK), exist_ok=True)
    run_cmd([
        JAVA,
        "-jar", APKSIGNER_JAR,
        "sign",
        "--ks", KEYSTORE,
        "--ks-key-alias", KEY_ALIAS,
        "--ks-pass", f"pass:{KEY_PASS}",
        "--key-pass", f"pass:{KEY_PASS}",
        "--v1-signing-enabled", "true",
        "--v2-signing-enabled", "true",
        "--v3-signing-enabled", "true",
        "--out", OUTPUT_APK,
        aligned_apk
    ])

    # 9. Verify Signature
    print("\n--- Step 9: Verifying APK Signatures ---")
    res = run_cmd([
        JAVA,
        "-jar", APKSIGNER_JAR,
        "verify",
        "--verbose",
        OUTPUT_APK
    ])
    print(res.stdout)

    # 10. Update version.json
    print("\n--- Step 10: Updating version.json Metadata ---")
    apk_stat = os.stat(OUTPUT_APK)
    with open(OUTPUT_APK, "rb") as f:
        apk_sha256 = hashlib.sha256(f.read()).hexdigest()

    version_info = {
        "version": "1.0.1",
        "versionCode": 2,
        "releaseDate": time.strftime("%Y-%m-%d"),
        "releaseNotes": "Production native Android release with hardware acceleration, high-precision hyperlocal heat risk navigation, offline shelters, and v1+v2+v3 APK signatures.",
        "minAndroidVersion": "7.0 (API level 24)",
        "targetAndroidVersion": "13.0 (API level 33)",
        "fileSize": f"{apk_stat.st_size / (1024 * 1024):.2f} MB",
        "sizeBytes": apk_stat.st_size,
        "sha256": apk_sha256,
        "downloadUrl": "/downloads/HeatShield-AI.apk",
        "verifiedSchemes": ["v1", "v2", "v3"]
    }

    version_path = os.path.join(ROOT_DIR, "public", "downloads", "version.json")
    with open(version_path, "w", encoding="utf-8") as f:
        json.dump(version_info, f, indent=2)

    # Also copy to dist if dist exists
    dist_version_path = os.path.join(ROOT_DIR, "dist", "downloads", "version.json")
    dist_apk_path = os.path.join(ROOT_DIR, "dist", "downloads", "HeatShield-AI.apk")
    if os.path.exists(os.path.join(ROOT_DIR, "dist")):
        os.makedirs(os.path.dirname(dist_version_path), exist_ok=True)
        with open(dist_version_path, "w", encoding="utf-8") as f:
            json.dump(version_info, f, indent=2)
        shutil.copy2(OUTPUT_APK, dist_apk_path)

    print("\n=== BUILD COMPLETE ===")
    print(f"Signed APK: {OUTPUT_APK}")
    print(f"Size: {version_info['fileSize']} ({version_info['sizeBytes']} bytes)")
    print(f"SHA-256: {apk_sha256}")
    print(f"Metadata written to {version_path}")

if __name__ == "__main__":
    main()
