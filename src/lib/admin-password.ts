import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const passwordPath = path.join(process.cwd(), ".data", "admin-password.txt");

export async function getAdminPassword() {
  try {
    const raw = await readFile(passwordPath, "utf8");
    const value = raw.trim();
    if (value) {
      return value;
    }
  } catch {
    // fall back to env/default below
  }

  return process.env.ADMIN_PASSWORD || "admin123";
}

export async function setAdminPassword(password: string) {
  await mkdir(path.dirname(passwordPath), { recursive: true });
  await writeFile(passwordPath, `${password.trim()}\n`, "utf8");
}
