import os
import sys

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from backend import create_app
from backend.config import Config

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", Config.PORT))
    host = os.getenv("HOST", Config.HOST)
    debug = Config.DEBUG
    print(f"[*] Starting Sign Recognition Backend on http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)

