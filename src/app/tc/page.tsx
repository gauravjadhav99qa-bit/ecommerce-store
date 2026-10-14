export const metadata = {
  title: "Terms & Conditions | GT Shopping",
  description: "Terms and conditions for using GT Shopping and buying printable PDFs.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink font-display mb-2">
          Terms &amp; Conditions
        </h1>
        <p className="text-ink-soft text-sm mb-10">Last updated: October 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Acceptance of terms
            </h2>
            <p className="text-ink-soft leading-relaxed">
              By accessing or using GT Shopping you agree to these Terms &amp;
              Conditions and to our Licence &amp; Permitted Use terms. If you do
              not agree, please do not use the site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Products &amp; pricing
            </h2>
            <ul className="list-disc list-inside text-ink-soft space-y-2 leading-relaxed">
              <li>All products are digital PDF downloads — nothing is physically shipped.</li>
              <li>All prices are listed in Indian Rupees (₹) and include applicable taxes unless stated otherwise.</li>
              <li>We reserve the right to modify prices at any time without prior notice.</li>
              <li>Every product page states its format, paper size, page count and recommended age before purchase.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Orders
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Placing an order constitutes an offer to purchase. An order is
              confirmed only after payment is successfully processed by Razorpay
              and you receive a confirmation with download links. We reserve the
              right to cancel and refund any order that fails payment verification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Payment &amp; delivery
            </h2>
            <p className="text-ink-soft leading-relaxed">
              We accept UPI, credit/debit cards and netbanking via Razorpay. All
              payments are encrypted and verified server-side with cryptographic
              signatures. Download links are delivered instantly on the confirmation
              page and by email. Links are personal to your order and expire after
              30 days; signed-in customers can re-download from their account after
              that.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Licence
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Purchases grant a non-exclusive, non-transferable licence for
              personal, classroom or therapy use as described on the{" "}
              <a href="/license" className="underline text-ink">
                Licence page
              </a>
              . Redistribution, resale and commercial printing without a written
              commercial licence are prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              User accounts
            </h2>
            <p className="text-ink-soft leading-relaxed">
              You are responsible for maintaining the confidentiality of your
              account credentials. Guest checkout is available; orders placed as a
              guest are linked to the email address you provide at checkout.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Refunds
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Because files are delivered instantly, refunds are handled case by
              case under our{" "}
              <a href="/refund-policy" className="underline text-ink">
                Refund Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Limitation of liability
            </h2>
            <p className="text-ink-soft leading-relaxed">
              GT Shopping shall not be liable for any indirect, incidental or
              consequential damages arising from the use of our website or files.
              Our total liability shall not exceed the amount you paid for the
              product in question. We do not guarantee that printed results will
              match any particular printer, paper or software.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Governing law
            </h2>
            <p className="text-ink-soft leading-relaxed">
              These terms are governed by the laws of India. Any disputes shall be
              subject to the exclusive jurisdiction of the courts in Maharashtra,
              India.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Contact us
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Questions about these terms:{" "}
              <span className="font-medium text-ink">hello@gtshoppingonline.in</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
