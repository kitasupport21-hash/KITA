from pathlib import Path
import sys

root = Path(sys.argv[1]).resolve()
target = root / "lib/screens/capture_screen.dart"
source = target.read_text(encoding="utf-8")
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
if old_start not in source:
    raise SystemExit("Could not find the capture-save method start")
source = source.replace(old_start, new_start, 1)
old_read = """      final vault = context.read<VaultService>();
      final item = await vault.saveWebsite(
"""
if old_read not in source:
    raise SystemExit("Could not find the late VaultService lookup")
source = source.replace(old_read, """      final item = await vault.saveWebsite(
""", 1)
target.write_text(source, encoding="utf-8")
print("Fixed async BuildContext lint in CaptureScreen.")
