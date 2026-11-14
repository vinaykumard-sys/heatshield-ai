// Test compareSemver logic in node

function compareSemver(v1, v2) {
  const sanitize = (v) => {
    if (!v) return [0];
    const cleaned = v.trim().replace(/^v/i, '').split('-')[0];
    return cleaned
      .split('.')
      .map((part) => {
        const num = parseInt(part, 10);
        return Number.isFinite(num) ? num : 0;
      });
  };

  const p1 = sanitize(v1);
  const p2 = sanitize(v2);
  const maxLength = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL: ' + msg);
    process.exit(1);
  } else {
    console.log('PASS: ' + msg);
  }
}

console.log('--- Testing compareSemver() ---');
assert(compareSemver('1.0.2', '1.1.0') === -1, '1.0.2 < 1.1.0 -> -1');
assert(compareSemver('1.0.0', '1.1.0') === -1, '1.0.0 < 1.1.0 -> -1');
assert(compareSemver('0.9.9', '1.0.0') === -1, '0.9.9 < 1.0.0 -> -1');
assert(compareSemver('v1.0.2', '1.1.0') === -1, 'v1.0.2 < 1.1.0 -> -1');
assert(compareSemver('1.1.0-beta', '1.1.0') === 0, '1.1.0-beta base semver equals 1.1.0');
assert(compareSemver('1.1.0', '1.1.0') === 0, '1.1.0 === 1.1.0 -> 0');
assert(compareSemver('v1.1.0', '1.1.0') === 0, 'v1.1.0 === 1.1.0 -> 0');
assert(compareSemver('1.1', '1.1.0') === 0, '1.1 === 1.1.0 -> 0');
assert(compareSemver('1.1.1', '1.1.0') === 1, '1.1.1 > 1.1.0 -> 1');
assert(compareSemver('1.9.9', '1.10.0') === -1, '1.9.9 < 1.10.0 -> -1 (Section 3 critical requirement)');
assert(compareSemver('1.10.0', '1.9.9') === 1, '1.10.0 > 1.9.9 -> 1');
assert(compareSemver('1.2.0', '1.1.0') === 1, '1.2.0 > 1.1.0 -> 1');
assert(compareSemver('1.2.0', '1.3.0') === -1, '1.2.0 < 1.3.0 -> -1');
assert(compareSemver('1.3.0', '1.3.0') === 0, '1.3.0 === 1.3.0 -> 0');
assert(compareSemver('1.3.0', '1.4.0') === -1, '1.3.0 < 1.4.0 -> -1');
assert(compareSemver('1.4.0', '1.4.0') === 0, '1.4.0 === 1.4.0 -> 0');
assert(compareSemver('2.0.0', '1.9.9') === 1, '2.0.0 > 1.9.9 -> 1');

// Test outdated detection rules:
const installedWebViewOlder = '1.0.2';
const minimumRequiredVersion = '1.1.0';
const isOutdatedOlder = compareSemver(installedWebViewOlder, minimumRequiredVersion) < 0;
assert(isOutdatedOlder === true, 'Installed 1.0.2 must be flagged outdated when min is 1.1.0');

const installedWebViewCurrent = '1.1.0';
const isOutdatedCurrent = compareSemver(installedWebViewCurrent, minimumRequiredVersion) < 0;
assert(isOutdatedCurrent === false, 'Installed 1.1.0 must NOT be flagged outdated when min is 1.1.0');

console.log('\nAll 13 semver and version update tests PASSED!');
