import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Models } from "@/models";
import { signSession, SESSION_COOKIE } from "@/lib/session";
import { json } from "@/lib/api";

export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return json({ error: "Email and password are required" }, 400);
  await connectDB();
  const user = await Models.users.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
  if (!user || !user.password || !(await bcrypt.compare(String(password), user.password))) {
    return json({ error: "Invalid email or password" }, 401);
  }
  if (user.status === "Inactive") return json({ error: "This account is inactive" }, 403);

  const token = await signSession({ sub: String(user._id), name: user.name, role: user.role, email: user.email });
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
