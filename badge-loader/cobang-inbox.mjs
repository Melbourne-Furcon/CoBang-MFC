// cobang-inbox.mjs
// Receives encrypted QR scan results from CoBang over a Unix socket and decrypts
// them with an Ed25519 OpenSSH private key. Node built-ins only, no npm deps.
//
// Scheme: sender does ephemeral X25519 ECDH against the recipient's key (the
// Ed25519 SSH key converted to X25519), HKDF-SHA256, then AES-256-GCM.
//
// Use as a module:  import { startInbox } from './cobang-inbox.mjs'
// Or standalone:    node cobang-inbox.mjs ~/.ssh/cobang_inbox

import net from 'node:net';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const P = (1n << 255n) - 19n;
const b64u = (buf) => Buffer.from(buf).toString('base64url');

function modPow(b, e, m) {
  let r = 1n;
  b %= m;
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return r;
}

function reader(buf, off = 0) {
  return {
    u32() { const v = buf.readUInt32BE(off); off += 4; return v; },
    str() { const n = this.u32(); const s = buf.subarray(off, off + n); off += n; return s; },
  };
}

// Parse an unencrypted OpenSSH ed25519 private key -> { seed, pub }
function readSshEd25519(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/-----BEGIN OPENSSH PRIVATE KEY-----([\s\S]+?)-----END OPENSSH PRIVATE KEY-----/);
  if (!m) throw new Error('Not an OpenSSH private key file');
  const buf = Buffer.from(m[1].replace(/\s+/g, ''), 'base64');
  const magic = 'openssh-key-v1\0';
  if (buf.subarray(0, magic.length).toString('latin1') !== magic) throw new Error('Bad key magic');
  const r = reader(buf, magic.length);
  const cipher = r.str().toString();
  r.str(); r.str(); // kdfname, kdfoptions
  if (cipher !== 'none') throw new Error('Key is passphrase-protected; use a dedicated unencrypted key');
  if (r.u32() !== 1) throw new Error('Expected exactly one key in file');
  r.str(); // public blob
  const inner = reader(r.str());
  inner.u32(); inner.u32(); // check ints
  if (inner.str().toString() !== 'ssh-ed25519') throw new Error('Only ssh-ed25519 keys are supported');
  const pub = inner.str();
  const priv = inner.str(); // seed(32) || pub(32)
  return { seed: priv.subarray(0, 32), pub };
}

// Ed25519 public key (32 bytes) -> X25519 public key (32 bytes)
export function edPubToX25519(pub) {
  const yBytes = Buffer.from(pub); yBytes[31] &= 0x7f;
  const y = BigInt('0x' + Buffer.from(yBytes).reverse().toString('hex'));
  const u = ((1n + y) * modPow((1n - y + P) % P, P - 2n, P)) % P;
  return Buffer.from(u.toString(16).padStart(64, '0'), 'hex').reverse();
}

// Ed25519 -> X25519 (same conversion age uses for ssh-ed25519 recipients)
function loadRecipientKey(file) {
  const { seed, pub } = readSshEd25519(file);
  const d = Buffer.from(crypto.createHash('sha512').update(seed).digest().subarray(0, 32));
  d[0] &= 248; d[31] &= 127; d[31] |= 64;

  const x = edPubToX25519(pub);

  const key = crypto.createPrivateKey({
    key: { kty: 'OKP', crv: 'X25519', d: b64u(d), x: b64u(x) },
    format: 'jwk',
  });
  return { key, pub: x };
}

function decrypt(rk, blob) {
  if (blob.length < 1 + 32 + 12 + 16 || blob[0] !== 1) throw new Error('Malformed message');
  const header = blob.subarray(0, 33);
  const ephPub = blob.subarray(1, 33);
  const nonce = blob.subarray(33, 45);
  const ct = blob.subarray(45, blob.length - 16);
  const tag = blob.subarray(blob.length - 16);

  const shared = crypto.diffieHellman({
    privateKey: rk.key,
    publicKey: crypto.createPublicKey({ key: { kty: 'OKP', crv: 'X25519', x: b64u(ephPub) }, format: 'jwk' }),
  });
  const aesKey = Buffer.from(
    crypto.hkdfSync('sha256', shared, Buffer.concat([ephPub, rk.pub]), 'cobang-inbox-v1', 32),
  );
  const dec = crypto.createDecipheriv('aes-256-gcm', aesKey, nonce);
  dec.setAAD(header);
  dec.setAuthTag(tag);
  return Buffer.concat([dec.update(ct), dec.final()]).toString('utf8');
}

export function defaultSocketPath() {
  return path.join(process.env.XDG_RUNTIME_DIR ?? '/tmp', 'cobang-inbox.sock');
}

export function startInbox({ keyPath, socketPath = defaultSocketPath(), onMessage, maxBytes = 64 * 1024 }) {
  const rk = loadRecipientKey(keyPath);
  try { fs.unlinkSync(socketPath); } catch {}

  const server = net.createServer({ allowHalfOpen: true }, (sock) => {
    const chunks = [];
    let size = 0;
    sock.on('data', (c) => {
      size += c.length;
      if (size > maxBytes) return sock.destroy();
      chunks.push(c);
    });
    sock.on('end', () => {
      try {
        onMessage(decrypt(rk, Buffer.concat(chunks)));
        sock.end('ok');
      } catch {
        sock.end('err'); // don't leak why decryption failed
      }
    });
    sock.on('error', () => {});
  });

  const oldUmask = process.umask(0o177); // socket created as 0600
  server.listen(socketPath, () => {
    process.umask(oldUmask);
    fs.chmodSync(socketPath, 0o600);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const keyPath = process.argv[2];
  if (!keyPath) {
    console.error('usage: node cobang-inbox.mjs <path-to-ed25519-ssh-private-key>');
    process.exit(1);
  }
  startInbox({ keyPath, onMessage: (text) => console.log('scanned:', text) });
  console.log('listening on', defaultSocketPath());
}
