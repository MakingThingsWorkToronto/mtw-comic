"""Import an exact public image packet through the maintained catalog producer.

The payload is authored input, not a generated catalog. No source files are changed.
"""
import argparse
import importlib.util
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("payload", type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
helper = root / ".codex/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py"
spec = importlib.util.spec_from_file_location("image_producer", helper)
producer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(producer)
library = root / "wiki/image-library"
library.mkdir(parents=True, exist_ok=True)
payload = json.loads(args.payload.read_text(encoding="utf-8"))
catalog = {"schemaVersion": 1, "name": "Experiment image library", "records": [], "files": []}
catalog, _ = producer.register_records(catalog, {"records": payload["records"]})
catalog = producer.derive(library, catalog, None)
outputs = producer.generated_files(catalog)
producer.validate_links(library, outputs)
for name, content in outputs.items():
    producer.atomic_write(library / name, content)
print(json.dumps({"records": len(catalog["records"]), "files": len(catalog["files"])}))
