import Link from "next/link";

// Placeholder home page. The consumer side (Bharti) replaces this with a redirect to /verify.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">ThreadMark</h1>
      <p>Garment authentication with a blockchain-backed Digital Product Passport.</p>
      <ul className="list-disc pl-6">
        <li>
          <Link className="underline" href="/register">
            Register a garment
          </Link>
        </li>
        <li>
          <Link className="underline" href="/dashboard">
            Registered garments
          </Link>
        </li>
      </ul>
    </main>
  );
}
