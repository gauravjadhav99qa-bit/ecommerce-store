export const metadata = {
  title: "Licence & Permitted Use | GT Shopping",
  description:
    "What you can and cannot do with GT Shopping printable PDF colouring books, activity books and planners.",
};

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink font-display mb-2">
          Licence &amp; Permitted Use
        </h1>
        <p className="text-ink-soft text-sm mb-10">Last updated: October 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              What you are buying
            </h2>
            <p className="text-ink-soft leading-relaxed">
              When you purchase a product from GT Shopping you are buying a
              licence to use the PDF files for the permitted purposes below. You
              are not buying ownership of the copyright, and the files themselves
              are not &ldquo;sold&rdquo; in the traditional sense.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              You may
            </h2>
            <ul className="list-disc list-inside text-ink-soft space-y-2 leading-relaxed">
              <li>Print unlimited copies for your own family, classroom or therapy setting</li>
              <li>Use printed pages in one-to-one or small-group teaching sessions you personally run</li>
              <li>Store the PDFs on your personal devices for convenient re-printing</li>
              <li>Print party favours, gifts or classroom handouts made from the printed pages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              You may not
            </h2>
            <ul className="list-disc list-inside text-ink-soft space-y-2 leading-relaxed">
              <li>Resell, share, email or redistribute the PDF files in any form</li>
              <li>Upload the files to cloud drives, forums, group chats or file-sharing sites</li>
              <li>Print and sell the pages as your own product (e.g. binders, worksheets on Etsy or at fairs)</li>
              <li>Claim the artwork or text as your own, or remove credits/metadata</li>
              <li>Use the files for commercial printing runs without a written commercial licence from us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Teachers &amp; therapists
            </h2>
            <p className="text-ink-soft leading-relaxed">
              One licence covers the students or clients you personally work
              with. If a whole school or clinic needs access, email us about a
              site licence — it is affordable and we keep it simple.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Bundles
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Bundle purchases follow exactly the same licence as the single
              products they contain — one buyer, unlimited personal printing of
              everything inside the bundle.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink font-display mb-3">
              Questions
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Need a commercial licence or school-wide access? Email{" "}
              <span className="font-medium text-ink">hello@gtshoppingonline.in</span>{" "}
              and tell us how you plan to use the printables.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
