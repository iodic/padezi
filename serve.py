#!/usr/bin/env python3
"""LAN-only fallback for old browsers. Run from any directory."""
import functools
import http.server
from pathlib import Path
import socket
import subprocess

PORT = 8080
ROOT = str(Path(__file__).resolve().parent)
addresses = set()
for interface in ('en0', 'en1'):
    try:
        value = subprocess.check_output(['ipconfig', 'getifaddr', interface], stderr=subprocess.DEVNULL, text=True).strip()
        if value:
            addresses.add(value)
    except (OSError, subprocess.CalledProcessError):
        pass
if not addresses:
    try:
        addresses.update(socket.gethostbyname_ex(socket.gethostname())[2])
    except OSError:
        pass
print('Kviz za padeže — prekid: Ctrl+C', flush=True)
print('Na ovom računaru: http://localhost:%s' % PORT, flush=True)
for address in sorted(addresses):
    if not address.startswith('127.'):
        print('Na iPad-u (isti Wi-Fi): http://%s:%s' % (address, PORT), flush=True)
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
try:
    with http.server.HTTPServer(('0.0.0.0', PORT), handler) as server:
        server.serve_forever()
except KeyboardInterrupt:
    print('\nServer je zaustavljen.')
except OSError as error:
    raise SystemExit('Server nije pokrenut: %s. Proveri dozvole ili da li je port 8080 zauzet.' % error)
