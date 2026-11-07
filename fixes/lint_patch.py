from pathlib import Path
import sys

root = Path(sys.argv[1]).resolve()

# Avoid an async BuildContext lookup after a Future has completed.
capture = root / "lib/screens/capture_screen.dart"
source = capture.read_text(encoding="utf-8")
old_start = """    setState(() {
      _saving = true;
      _error = null;
    });
    try {
"""
new_start = """    setState(() {
      _saving = true;
      _error = null;
    });
    final vault = context.read<VaultService>();
    try {
"""
old_read = """      final vault = context.read<VaultService>();
      final item = await vault.saveWebsite(
"""
if old_start in source and old_read in source:
    source = source.replace(old_start, new_start, 1)
    source = source.replace(old_read, """      final item = await vault.saveWebsite(
""", 1)
elif "final vault = context.read<VaultService>();" not in source:
    raise SystemExit("Could not fix the CaptureScreen async context lookup")

# Scroll the actual document height (bounded to 20 screens) to trigger lazy-load.
old_scroll = """          let previousHeight = 0;
          let stable = 0;
          for (let step = 0; step < 20; step++) {
            const height = Math.max(document.body?.scrollHeight || 0, document.documentElement?.scrollHeight || 0);
            if (height <= previousHeight) stable++; else stable = 0;
            if (stable >= 3) break;
            previousHeight = height;
            window.scrollTo(0, Math.min(height, window.scrollY + Math.max(window.innerHeight * 0.85, 500)));
            await pause(250);
          }
"""
new_scroll = """          let maxHeight = Math.max(document.body?.scrollHeight || 0, document.documentElement?.scrollHeight || 0);
          let stuck = 0;
          for (let step = 0; step < 20; step++) {
            const viewport = Math.max(window.innerHeight || 0, 500);
            maxHeight = Math.max(maxHeight, document.body?.scrollHeight || 0, document.documentElement?.scrollHeight || 0);
            const nextY = Math.min(Math.max(0, maxHeight - viewport), window.scrollY + Math.max(viewport * 0.85, 500));
            if (nextY <= window.scrollY + 1) {
              stuck++;
              if (stuck >= 3) break;
            } else {
              stuck = 0;
              window.scrollTo(0, nextY);
            }
            await pause(300);
            const newHeight = Math.max(document.body?.scrollHeight || 0, document.documentElement?.scrollHeight || 0);
            if (newHeight > maxHeight) {
              maxHeight = newHeight;
              stuck = 0;
            }
          }
"""
if old_scroll in source:
    source = source.replace(old_scroll, new_scroll, 1)
elif new_scroll not in source:
    raise SystemExit("Could not locate lazy-load scroll loop")

capture.write_text(source, encoding="utf-8")

# Promote common lazy image and background-image data attributes to fetchable URLs.
service_file = root / "lib/services/vault_service.dart"
service = service_file.read_text(encoding="utf-8")
old_selector = """          '[data-src], [data-lazy-src], [data-original], [data-original-src], [data-srcset]',
"""
new_selector = """          '[data-src], [data-lazy-src], [data-original], [data-original-src], [data-srcset], [data-bg], [data-background]',
"""
if old_selector in service:
    service = service.replace(old_selector, new_selector, 1)
old_bg = """          final lazySet = element.attributes['data-srcset'];
          if (lazySet != null && lazySet.trim().isNotEmpty &&
              (element.attributes['srcset'] ?? '').trim().isEmpty) {
            element.attributes['srcset'] = lazySet.trim();
          }
          element.attributes.remove('data-src');
"""
new_bg = """          final lazySet = element.attributes['data-srcset'];
          if (lazySet != null && lazySet.trim().isNotEmpty &&
              (element.attributes['srcset'] ?? '').trim().isEmpty) {
            element.attributes['srcset'] = lazySet.trim();
          }
          final lazyBackground = element.attributes['data-bg'] ??
              element.attributes['data-background'];
          if (lazyBackground != null && lazyBackground.trim().isNotEmpty) {
            final background = lazyBackground.trim();
            final cssValue = background.startsWith('url(')
                ? background
                : 'url("$background")';
            final oldStyle = element.attributes['style'] ?? '';
            element.attributes['style'] = oldStyle.isEmpty
                ? 'background-image: $cssValue'
                : '$oldStyle; background-image: $cssValue';
          }
          element.attributes.remove('data-bg');
          element.attributes.remove('data-background');
          element.attributes.remove('data-src');
"""
if old_bg in service:
    service = service.replace(old_bg, new_bg, 1)
service_file.write_text(service, encoding="utf-8")
print("Applied idempotent capture, full-page lazy-scroll and lazy-background fixes.")
