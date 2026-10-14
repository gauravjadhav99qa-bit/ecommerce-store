export const metadata = {
  title: "Privacy Policy | GT Shopping",
  description:
    "How GT Shopping collects, uses and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink font-display mb-2">
          Privacy Policy
        </h1>
        <p className="text-ink-soft text-sm mb-10">Last updated: October 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Information we collect
            </h2>
            <p className="text-ink-soft leading-relaxed">
              When you place an order or create an account we collect your name,
              email address and — optionally — your phone number. We never collect
              shipping addresses (we are a digital-only store) and we never see or
              store your card, UPI or netbanking credentials; those are handled
              entirely by our payment partner, Razorpay.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              How we use your information
            </h2>
            <ul className="list-disc list-inside text-ink-soft space-y-2 leading-relaxed">
              <li>To process your order and deliver your PDF download links</li>
              <li>To email you order receipts and download links</li>
              <li>To provide account features such as order history and re-downloads</li>
              <li>To send newsletter emails — only if you opt in (unsubscribe anytime)</li>
              <li>To detect and prevent payment fraud</li>
              <li>To respond to support and refund requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Data security
            </h2>
            <p className="text-ink-soft leading-relaxed">
              All traffic is encrypted with SSL/TLS. Payment verification uses
              cryptographic signatures (HMAC) so an order can only be marked paid
              when Razorpay confirms it. Product files are stored privately and
              served only through short-lived, signed download links tied to your
              order.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Third-party sharing
            </h2>
            <p className="text-ink-soft leading-relaxed">
              We do not sell or rent your personal information. We share data only
              with the service providers needed to run the store — Razorpay for
              payments, our email provider for receipts and download links, and our
              database/hosting providers — and only for those purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Cookies
            </h2>
            <p className="text-ink-soft leading-relaxed">
              We use essential cookies for sessions, shopping cart contents and
              security. You can control cookies through your browser settings, but
              disabling them may sign you out or empty your cart.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Your rights
            </h2>
            <p className="text-ink-soft leading-relaxed">
              You can access, correct or delete your personal data at any time.
              Email{" "}
              <span className="font-medium text-ink">hello@gtshoppingonline.in</span>{" "}
              and we will action your request — usually within a few business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Contact
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Privacy questions:{" "}
              <span className="font-medium text-ink">hello@gtshoppingonline.in</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
