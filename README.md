# Kopto YC Winter 2027 — Paper Download

Password-gated download for the YC Winter 2027 research paper.

The repository contains no plaintext PDF. The paper is encrypted with
AES-256-GCM using a key derived from the access password with PBKDF2-SHA-256
and 310,000 iterations. Decryption happens locally in the browser; the
password is never sent to a server.

## Rebuild encrypted assets

Run from this directory:

```bash
PORTAL_PASSWORD='<access password>' node scripts/encrypt-assets.mjs
```

The source PDFs are read from their canonical project locations and are not
copied into this repository.

## Preview

```bash
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080`.

## GitHub Pages

Publish the repository from the root branch. The generated site is static and
requires no build step.

This is a client-side gate: the HTML and encrypted files are public, but the
PDF contents remain encrypted without the password. Use a long, random
password and rotate the encrypted assets if it is disclosed.
