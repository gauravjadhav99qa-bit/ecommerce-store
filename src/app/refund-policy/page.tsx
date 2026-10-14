export const metadata = {
  title: "Refund Policy | GT Shopping",
  description:
    "GT Shopping refund policy for instant-download PDF colouring books, activity books and planners.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink font-display mb-2">
          Refund Policy
        </h1>
        <p className="text-ink-soft text-sm mb-10">Last updated: October 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Instant digital delivery
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Every product at GT Shopping is a PDF download. Because files are
              delivered instantly and cannot be &ldquo;returned&rdquo;, we handle
              refunds case by case rather than through a fixed return window.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              When we refund
            </h2>
            <ul className="list-disc list-inside text-ink-soft space-y-2 leading-relaxed">
              <li>A file is corrupted, incomplete, or will not open</li>
              <li>The wrong product was delivered by our mistake</li>
              <li>You were charged twice for the same order</li>
              <li>
                Payment succeeded but download links were never delivered and we
                cannot restore access
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              When we do not refund
            </h2>
            <ul className="list-disc list-inside text-ink-soft space-y-2 leading-relaxed">
              <li>Change of mind after a successful download</li>
              <li>Printer, paper, or software compatibility issues (every product page lists format, paper size and print guidance before you buy)</li>
              <li>Failure to read the product description or licence terms</li>
              <li>Partial use of a bundle (bundles are priced as a single unit)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              How to request a refund
            </h2>
            <div className="space-y-4">
              {[
                {
                  step: "1",
                  title: "Email us within 14 days",
                  desc: "Write to hello@gtshoppingonline.in with your order number (IB-XXXXXX) and a short description of the problem.",
                },
                {
                  step: "2",
                  title: "Include details",
                  desc: "Attach a screenshot of any error message and the device/printer you used.",
                },
                {
                  step: "3",
                  title: "We review within 3 business days",
                  desc: "If approved, the refund is credited to your original payment method (Razorpay).",
                },
                {
                  step: "4",
                  title: "Refund lands in 5–7 business days",
                  desc: "Bank or wallet timelines apply after we process the refund.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 bg-ink text-cream rounded-full flex items-center justify-center text-xs font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink text-sm">
                      {item.title}
                    </h3>
                    <p className="text-ink-soft text-sm mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              File problems instead of refunds?
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Most file issues are solved in minutes — just email us and we will
              re-send working links or an alternate format. A refund is only
              needed when we genuinely cannot fix the download.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Contact
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Refund questions:{" "}
              <span className="font-medium text-ink">hello@gtshoppingonline.in</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
