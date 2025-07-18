import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { encrypt, decrypt } from "./crypto.ts";

Deno.test("encrypt and decrypt should be symmetrical", async () => {
  const key = "ab5d9c79e60522c6248959589955e869"; // 32-char key for AES-256
  const originalText = "This is a secret message.";

  const encryptedData = await encrypt(originalText, key);
  const decryptedText = await decrypt(encryptedData, key);

  assertEquals(decryptedText, originalText);
});

Deno.test("decrypt should fail with wrong key", async () => {
  const correctKey = "ab5d9c79e60522c6248959589955e869";
  const wrongKey = "f3a7a9e3a6a2d1e9a8a1a7a2b1a8a3e9";
  const originalText = "This is another secret message.";

  const encryptedData = await encrypt(originalText, correctKey);

  let caughtError = false;
  try {
    await decrypt(encryptedData, wrongKey);
  } catch (error) {
    caughtError = true;
    // We can add more specific error checks here if needed
    console.log("Caught expected error:", error.message);
  }

  assertEquals(caughtError, true, "An error should have been thrown when using the wrong key.");
}); 