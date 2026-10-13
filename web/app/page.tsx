import Link from "next/link";

// Placeholder landing page. The project requirements ask for `/` to redirect to /verify
// once the consumer side exists; whoever owns that decides whether to keep this page.
export default function Home() {
  return (
    <main className="px-5 pt-16 md:pt-28">
      <div className="grid gap-10 md:grid-cols-2">
        <p className="tag self-start">Digital Product Passport</p>
        <div>
          <h1 className="display text-5xl md:text-6xl">
            Every garment gets a <em>digital birth certificate</em>
          </h1>
          <p className="mt-6 max-w-md text-lg">
            Register a garment once. Its fingerprint is written to the blockchain, and anyone can check it later by
            scanning the QR code on the label.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="pill pill-solid">
              Register a garment
            </Link>
            <Link href="/dashboard" className="pill">
              Registered garments
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
