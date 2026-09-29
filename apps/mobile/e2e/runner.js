const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { testCases } = require("./test-cases");

const PACKAGE = "com.anonymous.thullaabulilmimobile";
const DEVICE = process.env.ANDROID_SERIAL || "z5yxpjrgvw8pdqzt";
const ROOT_DIR = path.resolve(__dirname, "../../..");
const APK_DEBUG = path.join(
    ROOT_DIR,
    "apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk",
);
const APK_RELEASE = path.join(
    ROOT_DIR,
    "apps/mobile/android/app/build/outputs/apk/release/app-release.apk",
);

const args = process.argv.slice(2);
const shouldBuild = args.includes("--build");
const shouldInstall = args.includes("--install");
const isRelease = args.includes("--release");
const filterArgIndex = args.indexOf("--filter");
const filter = filterArgIndex !== -1 ? args[filterArgIndex + 1] : null;

function run(cmd, opts = {}) {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], ...opts });
}

function adb(cmd) {
    return run(`adb -s ${DEVICE} ${cmd}`);
}

function wait(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function getAppPid() {
    try {
        const out = adb(`shell pidof ${PACKAGE}`).trim();
        return out.split(/\s+/)[0] || null;
    } catch {
        return null;
    }
}

function getFocusedPackage() {
    const output = adb("shell dumpsys window");
    const match = output.match(/mCurrentFocus=Window\{[^}]+\s+([^/]+)\//);
    return match?.[1] ?? null;
}

function assertAppForeground() {
    for (let i = 0; i < 5; i++) {
        const focusedPackage = getFocusedPackage();
        if (focusedPackage === PACKAGE) return;
        wait(400);
    }
    const finalPackage = getFocusedPackage();
    if (finalPackage !== PACKAGE) {
        throw new Error(`Unexpected foreground package: ${finalPackage ?? "unknown"}`);
    }
}

function dumpHierarchy() {
    for (let i = 0; i < 5; i++) {
        try {
            adb("shell uiautomator dump /sdcard/window.xml");
            const xml = adb("shell cat /sdcard/window.xml");
            if (xml.includes("<hierarchy")) return xml;
        } catch {
            wait(500);
        }
    }
    throw new Error("Could not read Android UI hierarchy");
}

function captureScreenshot(filePath) {
    execSync(`adb -s ${DEVICE} exec-out screencap -p > "${filePath}"`);
}

function parseBounds(boundsStr) {
    const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) return null;
    const [, x1, y1, x2, y2] = match.map(Number);
    return { x1, y1, x2, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}

function findNodeByText(xml, text, attr = null) {
    const attrsToCheck = attr ? [attr] : ["text", "hint", "content-desc"];
    for (const a of attrsToCheck) {
        const regex = new RegExp(`<node[^>]*${a}="[^"]*${text}[^"]*"[^>]*>`, "i");
        const match = xml.match(regex);
        if (match) {
            const nodeXml = match[0];
            const boundsMatch = nodeXml.match(/bounds="[^"]+"/);
            const clickableMatch = nodeXml.match(/clickable="true"/);
            return {
                bounds: boundsMatch
                    ? parseBounds(boundsMatch[0].replace('bounds="', "").replace('"', ""))
                    : null,
                clickable: !!clickableMatch,
            };
        }
    }
    return null;
}

function findNodeByResourceId(xml, resourceId) {
    const regex = new RegExp(`<node[^>]*resource-id="[^"]*${resourceId}[^"]*"[^>]*>`, "i");
    const match = xml.match(regex);
    if (!match) return null;
    const nodeXml = match[0];
    const boundsMatch = nodeXml.match(/bounds="[^"]+"/);
    return { bounds: boundsMatch ? parseBounds(boundsMatch[0].replace('bounds="', '').replace('"', '')) : null };
}

function tapElement(xml, text, attr = null) {
    const node = findNodeByText(xml, text, attr);
    if (!node?.bounds) throw new Error(`Element not found: "${text}"`);
    adb(`shell input tap ${Math.round(node.bounds.cx)} ${Math.round(node.bounds.cy)}`);
    wait(800);
    return dumpHierarchy();
}

function tapByResourceId(xml, resourceId) {
    const node = findNodeByResourceId(xml, resourceId);
    if (!node?.bounds) throw new Error(`Element not found: resource-id="${resourceId}"`);
    adb(`shell input tap ${Math.round(node.bounds.cx)} ${Math.round(node.bounds.cy)}`);
    wait(800);
    return dumpHierarchy();
}

function inputText(xml, text, resourceId = null, placeholder = null) {
    let node = null;
    if (resourceId) {
        node = findNodeByResourceId(xml, resourceId);
    } else if (placeholder) {
        node = findNodeByText(xml, placeholder);
    } else {
        const match = xml.match(/<node[^>]*class="android\.widget\.EditText"[^>]*>/i);
        if (match) {
            const boundsMatch = match[0].match(/bounds="[^"]+"/);
            node = { bounds: boundsMatch ? parseBounds(boundsMatch[0].replace('bounds="', "").replace('"', "")) : null };
        }
    }
    if (!node?.bounds) throw new Error(`Input field not found`);
    adb(`shell input tap ${Math.round(node.bounds.cx)} ${Math.round(node.bounds.cy)}`);
    wait(500);
    const escaped = text.replace(/ /g, "%s").replace(/&/g, "\\&");
    adb(`shell input text "${escaped}"`);
    wait(500);
    return dumpHierarchy();
}

function pressKey(keyCode) {
    adb(`shell input keyevent ${keyCode}`);
    wait(500);
    return dumpHierarchy();
}

function swipe(x1, y1, x2, y2, duration = 300) {
    adb(`shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
    wait(500);
    return dumpHierarchy();
}

function assertRoute(tc, xml) {
    const normalizedXml = xml.toLowerCase();
    const missingTexts = (tc.assertTexts ?? []).filter(
        (text) => !normalizedXml.includes(text.toLowerCase()),
    );

    if (missingTexts.length > 0) {
        throw new Error(`Missing UI text: ${missingTexts.join(", ")}`);
    }
}

function main() {
    console.log(`[E2E] Target Device : ${DEVICE}`);
    console.log(`[E2E] Target Package: ${PACKAGE}`);

    if (shouldBuild) {
        const variant = isRelease ? "assembleRelease" : "assembleDebug";
        console.log(`[E2E] Building APK (${variant})...`);
        execSync(`./gradlew ${variant}`, {
            cwd: path.join(ROOT_DIR, "apps/mobile/android"),
            stdio: "inherit",
        });
    }

    if (shouldInstall) {
        const apkPath = isRelease ? APK_RELEASE : (fs.existsSync(APK_RELEASE) ? APK_RELEASE : APK_DEBUG);
        console.log(`[E2E] Reinstalling APK (${apkPath})...`);
        run(`adb -s ${DEVICE} install -r "${apkPath}"`, { stdio: "inherit" });
    }

    console.log("[E2E] Verifying package install...");
    const packages = adb("shell pm list packages");
    if (!packages.includes(PACKAGE)) {
        throw new Error(`Package ${PACKAGE} is not installed on device ${DEVICE}`);
    }

    const filteredCases = filter
        ? testCases.filter((tc) => tc.id.includes(filter) || tc.featureKey === filter || tc.tab === filter)
        : testCases;

    console.log(`[E2E] Executing ${filteredCases.length} test cases...`);

    const outDir = path.join(ROOT_DIR, "apps/mobile/e2e/output", Date.now().toString());
    fs.mkdirSync(outDir, { recursive: true });

    let passed = 0;
    let failed = 0;
    const failures = [];

    adb(`shell am start -n ${PACKAGE}/.MainActivity`);
    wait(2000);

    for (let i = 0; i < filteredCases.length; i++) {
        const tc = filteredCases[i];
        process.stdout.write(`[${i + 1}/${filteredCases.length}] ${tc.id} (${tc.name})... `);

        try {
            if (tc.deepLink) {
                adb(`shell am force-stop ${PACKAGE}`);
                wait(500);
                adb(`shell am start -a android.intent.action.VIEW -d "${tc.deepLink}" ${PACKAGE}`);
            }
            wait(2000);

            const pid = getAppPid();
            if (!pid) {
                throw new Error("App crashed or is not running!");
            }
            assertAppForeground();

            let currentXml = dumpHierarchy();

            if (Array.isArray(tc.actions) && tc.actions.length > 0) {
                for (const act of tc.actions) {
                    if (act.type === "tap") {
                        currentXml = tapElement(currentXml, act.text, act.attr || "text");
                    } else if (act.type === "type") {
                        currentXml = inputText(currentXml, act.text, act.resourceId, act.placeholder);
                    } else if (act.type === "key") {
                        currentXml = pressKey(act.keyCode);
                    } else if (act.type === "swipe") {
                        currentXml = swipe(act.x1, act.y1, act.x2, act.y2, act.duration);
                    } else if (act.type === "wait") {
                        wait(act.ms || 1000);
                        currentXml = dumpHierarchy();
                    }
                }
            } else {
                adb(`shell input swipe 540 1500 540 600 250`);
                wait(500);
                adb(`shell input swipe 540 600 540 1500 250`);
                wait(500);
                currentXml = dumpHierarchy();
            }

            const currentPid = getAppPid();
            if (!currentPid) {
                throw new Error("App crashed after interaction!");
            }
            assertAppForeground();

            assertRoute(tc, currentXml);

            const screenshotPath = path.join(outDir, `${tc.id}.png`);
            captureScreenshot(screenshotPath);

            console.log("PASS");
            passed++;
        } catch (err) {
            console.log(`FAIL: ${err.message}`);
            failed++;
            failures.push({ id: tc.id, name: tc.name, error: err.message });
            try {
                captureScreenshot(path.join(outDir, `${tc.id}.failed.png`));
                fs.writeFileSync(path.join(outDir, `${tc.id}.failed.xml`), dumpHierarchy());
            } catch {}
        }
    }

    fs.writeFileSync(
        path.join(outDir, "results.json"),
        JSON.stringify(
            {
                device: DEVICE,
                package: PACKAGE,
                total: filteredCases.length,
                passed,
                failed,
                failures,
            },
            null,
            2,
        ),
    );

    console.log(`\n[E2E] Artifacts: ${outDir}`);
    console.log("\n==========================================");
    console.log(`[E2E RESULTS] Total: ${filteredCases.length} | Passed: ${passed} | Failed: ${failed}`);
    if (failures.length > 0) {
        console.log("[FAILURES]:");
        failures.forEach((f) => console.log(` - ${f.id}: ${f.error}`));
        process.exit(1);
    }
    console.log("==========================================");
}

main();
