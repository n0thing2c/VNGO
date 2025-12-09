const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating an account or using VNGO, you agree to these Terms of Service. If you do not agree, please do not use the platform.",
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 18 years old and able to form a binding contract. Guides are responsible for complying with all local laws and permits required to offer tours.",
  },
  {
    title: "3. Accounts and Security",
    body: "You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. Notify us immediately of any unauthorized use or security incident.",
  },
  {
    title: "4. Bookings, Payments, and Cancellations",
    body: "Pricing, availability, and cancellation terms are shown before you confirm a booking. By confirming, you authorize any associated charges. Refunds follow the specific tour’s cancellation policy unless required otherwise by law.",
  },
  {
    title: "5. User Conduct",
    body: "Do not use the platform for any unlawful, harmful, or abusive purpose. Respect other users, provide accurate information, and follow community guidelines when communicating or posting content.",
  },
  {
    title: "6. Content Ownership and License",
    body: "You retain ownership of the content you upload but grant VNGO a worldwide, non-exclusive license to host and display it for platform operation. Do not upload content you do not have rights to share.",
  },
  {
    id: "guide-responsibilities",
    title: "7. Guide Responsibilities",
    body: "Guides must provide accurate tour descriptions, honor confirmed bookings, and ensure participant safety within reasonable control. Guides are solely responsible for permits, insurance, and compliance with local regulations.",
  },
  {
    title: "8. Disclaimers",
    body: "VNGO provides the service on an “as is” basis without warranties of any kind. We do not guarantee uninterrupted service or endorse any user-generated content.",
  },
  {
    title: "9. Limitation of Liability",
    body: "To the maximum extent permitted by law, VNGO is not liable for indirect, incidental, or consequential damages arising from your use of the service.",
  },
  {
    title: "10. Changes to These Terms",
    body: "We may update these Terms from time to time. Material changes will be communicated through the platform or via email. Continued use after changes constitutes acceptance.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-[80vh] justify-center bg-white px-6 py-10 md:px-10">
      <article className="prose prose-slate max-w-4xl">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Last updated: December 9, 2025
        </p>
        <h1 className="mb-4 text-3xl font-bold text-slate-900">
          Terms of Service
        </h1>
        <p className="text-base text-slate-700">
          These Terms govern your use of VNGO’s platform and services. Please
          read them carefully before creating an account or booking a tour.
        </p>

        <div className="mt-6 space-y-6">
          {sections.map(({ id, title, body }) => (
            <section key={title} id={id ?? undefined} className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="text-sm leading-relaxed text-slate-700">{body}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
