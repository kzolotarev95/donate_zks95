import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { setAdminPassword } from "@/lib/admin-password";

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    password?: string;
    confirmPassword?: string;
  } | null;

  const password = body?.password?.trim() || "";
  const confirmPassword = body?.confirmPassword?.trim() || "";

  if (password.length < 8) {
    return NextResponse.json({ error: "Пароль должен быть не короче 8 символов" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Пароли не совпадают" }, { status: 400 });
  }

  await setAdminPassword(password);

  return NextResponse.json({ message: "Пароль обновлен" });
}
