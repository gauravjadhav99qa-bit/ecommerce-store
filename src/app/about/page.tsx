export const metadata = {
  title: "About | GT Shopping",
  description:
    "GT Shopping makes printable colouring books, activity books and planners — instant PDF downloads, print at home.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink font-display mb-2">
          About GT Shopping
        </h1>
        <p className="text-ink-soft text-sm mb-10">Print. Colour. Create.</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Who we are
            </h2>
            <p className="text-ink-soft leading-relaxed">
              GT Shopping is a small independent studio making printable
              colouring books, preschool activity packs and planners. We design
              every page ourselves — thick outlines for little hands, gentle
              nature scenes for older kids, and calm, detailed pages for adults
              who colour to unwind.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Why digital only
            </h2>
            <p className="text-ink-soft leading-relaxed">
              We sell PDFs, not parcels. Instant downloads mean no shipping fees,
              no waiting for the post, and no stock running out the night before
              a birthday. You print the pages you need, when you need them — on
              the paper you like, at the size that fits your printer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              How it works
            </h2>
            <div className="space-y-4">
              {[
                {
                  step: "1",
                  title: "Pick a book or bundle",
                  desc: "Every product page shows the page count, paper size, age range and a preview of the artwork.",
                },
                {
                  step: "2",
                  title: "Pay securely",
                  desc: "UPI, cards or netbanking through Razorpay. Guest checkout is fine — just an email is enough.",
                },
                {
                  step: "3",
                  title: "Download instantly",
                  desc: "Your links appear on the confirmation page and in your email within seconds.",
                },
                {
                  step: "4",
                  title: "Print at home",
                  desc: "Follow the print guidance on each product page. Re-print any page as often as you like.",
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
              Our promise
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Clear product descriptions, files that open on any device, and a
              human reply when something goes wrong. If a download ever fails you,
              email us and we will fix it — usually the same day.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Get in touch
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Questions, custom requests or school licences:{" "}
              <span className="font-medium text-ink">hello@gtshoppingonline.in</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
