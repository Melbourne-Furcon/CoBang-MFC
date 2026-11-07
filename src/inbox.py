"""inbox.py

Encrypts a scanned QR string to an Ed25519 SSH public key and sends it to the
Node receiver (cobang-inbox.mjs) over a Unix socket.

Config (env vars, so the feature is a no-op unless set):
  COBANG_INBOX_PUBKEY  path to the .pub file, e.g. ~/.ssh/cobang_inbox.pub
  COBANG_INBOX_SOCKET  optional, defaults to $XDG_RUNTIME_DIR/cobang-inbox.sock

Needs python3-cryptography (a Debian/Ubuntu package, so it fits CoBang's
OS-package dependency model).
"""

import os
import socket

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey, X25519PublicKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat, load_ssh_public_key

from logbook import Logger

log = Logger(__name__)
_P = 2**255 - 19
_RAW = dict(encoding=Encoding.Raw, format=PublicFormat.Raw)


def _ed25519_pub_to_x25519(raw: bytes) -> bytes:
    y = int.from_bytes(raw, 'little') & ((1 << 255) - 1)
    u = (1 + y) * pow((1 - y) % _P, -1, _P) % _P
    return u.to_bytes(32, 'little')


def _load_recipient(pubkey_path: str) -> bytes:
    with open(os.path.expanduser(pubkey_path), 'rb') as f:
        key = load_ssh_public_key(f.read())
    return _ed25519_pub_to_x25519(key.public_bytes(**_RAW))  # raises if not ed25519


def encrypt(recipient_x25519: bytes, plaintext: bytes) -> bytes:
    eph = X25519PrivateKey.generate()
    eph_pub = eph.public_key().public_bytes(**_RAW)
    shared = eph.exchange(X25519PublicKey.from_public_bytes(recipient_x25519))
    key = HKDF(hashes.SHA256(), 32, salt=eph_pub + recipient_x25519, info=b'cobang-inbox-v1').derive(shared)
    header = b'\x01' + eph_pub
    nonce = os.urandom(12)
    return header + nonce + AESGCM(key).encrypt(nonce, plaintext, header)  # ct || 16-byte tag


def send_scan(text: str) -> bool:
    """Call this with each decoded QR string. Never raises into the UI."""
    pubkey = os.environ.get('COBANG_INBOX_PUBKEY')
    if not pubkey:
        return False
    sock_path = os.environ.get(
        'COBANG_INBOX_SOCKET',
        os.path.join(os.environ.get('XDG_RUNTIME_DIR', '/tmp'), 'cobang-inbox.sock'),
    )
    try:
        blob = encrypt(_load_recipient(pubkey), text.encode('utf-8'))
        with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
            s.settimeout(2)
            s.connect(sock_path)
            s.sendall(blob)
            s.shutdown(socket.SHUT_WR)
            return s.recv(8) == b'ok'
    except Exception as exc:  # keep the scanner working even if the inbox is down
        log.warning('Could not deliver scan to inbox: {}', exc)
        return False
