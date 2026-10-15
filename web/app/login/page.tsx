import { redirect } from "next/navigation";

// Merchant login now lives on the landing page (bottom-right panel).
export default function LoginPage() {
  redirect("/");
}
