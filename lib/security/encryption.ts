import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

type KeyEntry = {
  version: number;
  key: Buffer;
};

type EncryptedPayload = {
  value: string;
  iv: string;
  tag: string;
  keyVersion: number;
};

const ALGO = "aes-256-gcm";

function decodeKey(raw: string) {
  const key = Buffer.from(raw, "base64");

  if (key.byteLength !== 32) {
    throw new Error("Encryption key must be a base64-encoded 32-byte value");
  }

  return key;
}

function parseKeyRing() {
  const keyRing = process.env.DEPLOY_ENCRYPTION_KEYS?.trim();
  const fallbackKey = process.env.DEPLOY_ENCRYPTION_KEY?.trim();

  if (!keyRing && !fallbackKey) {
    throw new Error("Missing DEPLOY_ENCRYPTION_KEYS or DEPLOY_ENCRYPTION_KEY");
  }

  const entries: KeyEntry[] = [];

  if (keyRing) {
    for (const entry of keyRing.split(",")) {
      const [versionRaw, keyRaw] = entry.split(":").map((part) => part.trim());
      const version = Number(versionRaw);

      if (!Number.isInteger(version) || version <= 0 || !keyRaw) {
        continue;
      }

      entries.push({
        version,
        key: decodeKey(keyRaw),
      });
    }
  }

  if (entries.length === 0 && fallbackKey) {
    entries.push({
      version: 1,
      key: decodeKey(fallbackKey),
    });
  }

  if (entries.length === 0) {
    throw new Error("No valid encryption keys configured");
  }

  entries.sort((a, b) => b.version - a.version);

  return entries;
}

function getAad(aadContext?: string) {
  if (!aadContext) {
    return undefined;
  }

  return Buffer.from(aadContext, "utf8");
}

export function encryptSecret(value: string, aadContext?: string): EncryptedPayload {
  const keyRing = parseKeyRing();
  const active = keyRing[0];
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, active.key, iv);
  const aad = getAad(aadContext);

  if (aad) {
    cipher.setAAD(aad);
  }

  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    value: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    keyVersion: active.version,
  };
}

export function decryptSecret(payload: EncryptedPayload, aadContext?: string) {
  const keyRing = parseKeyRing();
  const key = keyRing.find((entry) => entry.version === payload.keyVersion);

  if (!key) {
    throw new Error(`Unknown encryption key version: ${payload.keyVersion}`);
  }

  const decipher = createDecipheriv(ALGO, key.key, Buffer.from(payload.iv, "base64"));
  const aad = getAad(aadContext);

  if (aad) {
    decipher.setAAD(aad);
  }

  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.value, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
