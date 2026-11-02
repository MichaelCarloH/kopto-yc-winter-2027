const ITERATIONS = 310000;
const MAGIC = new TextEncoder().encode("KOPTO01\n");
const FILES = {
  deck: {
    encrypted: "./assets/kopto-yc-winter-2027-deck.kopto",
    filename: "KOPTO_YC_Winter_2027.pdf",
  },
  paper: {
    encrypted: "./assets/kopto-yc-winter-2027-paper.kopto",
    filename: "Kopto_YC_Winter_2027_Research_Technology.pdf",
  },
};

const form = document.querySelector("#unlock-form");
const passwordInput = document.querySelector("#password");
const button = form.querySelector("button");
const status = document.querySelector("#status");
const materials = document.querySelector("#materials");
const objectUrls = [];

function bytesEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function setStatus(message, kind = "") {
  status.textContent = message;
  status.className = `status ${kind}`.trim();
}

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: ITERATIONS,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

async function decryptFile(file, password) {
  const response = await fetch(file.encrypted, { cache: "no-store" });
  if (!response.ok) throw new Error("Encrypted asset is unavailable.");

  const payload = new Uint8Array(await response.arrayBuffer());
  if (payload.length < 36 || !bytesEqual(payload.slice(0, 8), MAGIC)) {
    throw new Error("Encrypted asset has an invalid format.");
  }

  const salt = payload.slice(8, 24);
  const iv = payload.slice(24, 36);
  const ciphertext = payload.slice(36);
  const key = await deriveKey(password, salt);

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, tagLength: 128 },
      key,
      ciphertext,
    );
    return new Blob([plaintext], { type: "application/pdf" });
  } catch {
    throw new Error("That password did not unlock the materials.");
  }
}

function connect(blob, filename, prefix) {
  const url = URL.createObjectURL(blob);
  objectUrls.push(url);
  const openLink = document.querySelector(`#${prefix}-open`);
  const downloadLink = document.querySelector(`#${prefix}-download`);
  openLink.href = url;
  downloadLink.href = url;
  downloadLink.download = filename;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  button.disabled = true;
  materials.hidden = true;
  setStatus("Decrypting materials locally…");

  try {
    const password = passwordInput.value;
    const [deck, paper] = await Promise.all([
      decryptFile(FILES.deck, password),
      decryptFile(FILES.paper, password),
    ]);

    objectUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
    connect(deck, FILES.deck.filename, "deck");
    connect(paper, FILES.paper.filename, "paper");
    materials.hidden = false;
    passwordInput.value = "";
    setStatus("Materials unlocked in this browser only.", "success");
    materials.focus();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Unable to unlock materials.", "error");
    passwordInput.select();
  } finally {
    button.disabled = false;
  }
});

window.addEventListener("pagehide", () => {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
});
