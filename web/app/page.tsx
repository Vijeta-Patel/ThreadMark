import { MerchantLogin } from "@/components/merchant-login";
import { QrScanner } from "@/components/qr-scanner";
import { Wordmark } from "@/components/wordmark";

// Landing page: giant wordmark on top, shoppers bottom-left (scan, no login), merchants bottom-right (login).
export default function Home() {
  return (
    <main className="flex min-h-svh flex-col px-4 pt-4 pb-8 md:px-5 md:pt-5">
      <h1>
        <Wordmark className="block w-full" />
      </h1>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm md:text-base">Digital Product Passport for garments</p>
        <p className="text-sm md:text-base">
          <em>Tamper-evident on Ethereum</em>
        </p>
      </div>

      <div className="mt-10 grid gap-12 md:mt-16 md:flex-1 md:grid-cols-2 md:items-end">
        <QrScanner />
        <div className="flex md:justify-end">
          <MerchantLogin />
        </div>
      </div>
    </main>
  );
}
