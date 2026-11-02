import { createCipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const password = process.env.PORTAL_PASSWORD;
if (!password || password.length < 24) {
  throw new Error("Set PORTAL_PASSWORD to at least 24 characters.");
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const outDir = path.join(root, "assets");
const magic = Buffer.from("KOPTO01\n", "utf8");
const iterations = 310000;

const documents = [
  {
    input: path.resolve(
      process.env.DECK_PDF ??
        "../quant_minds/paper/presentation/yc-winter-2027/output/KOPTO_YC_Winter_2027.pdf",
    ),
    output: path.join(outDir, "kopto-yc-winter-2027-deck.kopto"),
  },
  {
    input: path.resolve(
      process.env.PAPER_PDF ??
        "../yc-winter-2027/paper/Kopto_YC_Winter_2027_Research_Technology.pdf",
    ),
    output: path.join(outDir, "kopto-yc-winter-2027-paper.kopto"),
  },
];

await mkdir(outDir, { recursive: true });

for (const document of documents) {
  const plaintext = await readFile(document.input);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([magic, salt, iv, ciphertext, tag]);
  await writeFile(document.output, payload, { mode: 0o644 });
  console.log(`${path.basename(document.output)}: ${payload.length} bytes`);
}
