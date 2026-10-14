export const metadata = {
  title: "FAQ | GT Shopping",
  description:
    "Answers about GT Shopping printable PDF colouring books — downloads, printing, payments and licences.",
};

const faqs = [
  {
    q: "What do I actually receive when I buy?",
    a: "Instant PDF download links. As soon as Razorpay confirms your payment you land on a confirmation page with your download links, and the same links are emailed to you. Nothing ships in the post — these are print-at-home files.",
  },
  {
    q: "How do I download my files?",
    a: "After checkout you will see a My Downloads page for your order. You can also open it any time from Account → My Downloads, or from the link in your confirmation email. Links are personal to your order and expire after 30 days — after that just sign in and reopen the order.",
  },
  {
    q: "What paper and printer do I need?",
    a: "Any home inkjet or laser printer works. Every product page lists the paper size (most are A4 & US Letter), page count and recommended paper weight. For colouring pages, 120–160 gsm paper prevents bleed-through from markers.",
  },
  {
    q: "Can I print the pages more than once?",
    a: "Yes. Your licence covers unlimited personal printing — print a page again whenever your child colours it, or print a fresh copy for a classroom or birthday party. See the Licence page for the full terms.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "UPI, credit and debit cards, and netbanking — all processed securely through Razorpay. We never see or store your card details.",
  },
  {
    q: "Can I buy as a guest without an account?",
    a: "Yes. Enter your email at checkout, pay, and your download links are emailed to that address. Creating an account simply keeps all your orders in one place.",
  },
  {
    q: "Do you offer refunds?",
    a: "Because files are delivered instantly, we handle refunds case by case — for example if a file is corrupted or the wrong product was delivered. Full details are on the Refund Policy page.",
  },
  {
    q: "Are these suitable for commercial use, like selling printed booklets?",
    a: "Not without a commercial licence. One purchase covers your own family, classroom or therapy practice. Email us if a school, clinic or business needs wider access — we offer simple site licences.",
  },
  {
    q: "What ages are the colouring books for?",
    a: "Each product page states the recommended age. Our range covers toddlers (thick outlines, simple shapes) through older kids and adults (detailed mandala and nature scenes).",
  },
  {
    q: "The PDF will not open on my device — what now?",
    a: "Install a current PDF reader (Adobe Acrobat Reader is free) and try again. If it still fails, email hello@gtshoppingonline.in with your order number and we will re-send working links, usually within a few hours.",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink font-display mb-2">
          Frequently asked questions
        </h1>
        <p className="text-ink-soft text-sm mb-10">
          Everything about downloads, printing and licences. Still stuck? Email{" "}
          <span className="font-medium text-ink">hello@gtshoppingonline.in</span>.
        </p>

        <div className="space-y-6">
          {faqs.map((faq) => (
            <section
              key={faq.q}
              className="bg-white rounded-xl border border-ink/10 p-5 sm:p-6"
            >
              <h2 className="font-semibold text-ink font-display mb-2">
                {faq.q}
              </h2>
              <p className="text-ink-soft text-sm leading-relaxed">{faq.a}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
