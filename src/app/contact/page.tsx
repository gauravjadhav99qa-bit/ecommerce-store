export const metadata = {
  title: "Contact | GT Shopping",
  description:
    "Contact GT Shopping for download help, refunds, school licences or custom printable requests.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink font-display mb-2">
          Contact us
        </h1>
        <p className="text-ink-soft text-sm mb-10">
          We usually reply within one business day.
        </p>

        <div className="space-y-10">
          <section className="bg-white rounded-xl border border-ink/10 p-5 sm:p-6">
            <h2 className="font-semibold text-ink font-display mb-2">
              Email
            </h2>
            <p className="text-ink-soft text-sm leading-relaxed">
              <span className="font-medium text-ink">hello@gtshoppingonline.in</span>{" "}
              — for download help, refunds, school or clinic licences, and custom
              printable requests. Include your order number (IB-XXXXXX) if you
              have one.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Before you write
            </h2>
            <ul className="list-disc list-inside text-ink-soft space-y-2 leading-relaxed">
              <li>
                Download links not arriving? Check your spam folder, then email
                us the address you used at checkout.
              </li>
              <li>
                File will not open? Install a current PDF reader and try again —
                most issues disappear.
              </li>
              <li>
                Printing tips and paper guidance live on each product page and
                in the FAQ.
              </li>
              <li>
                Refund requests: see the Refund Policy, then email us with your
                order number.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              What we cannot help with
            </h2>
            <p className="text-ink-soft leading-relaxed">
              We are a fully digital studio — we do not ship physical products,
              run a phone line, or offer printing services. Everything you buy is
              a PDF you print yourself.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
