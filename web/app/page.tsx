import { redirect } from "next/navigation";

// Project requirements section 9.9: `/` redirects to `/verify`.
export default function Home() {
  redirect("/verify");
}