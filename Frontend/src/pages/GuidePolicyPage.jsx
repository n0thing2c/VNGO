const sections = [
  {
    title: "1. Professional Conduct",
    body:
      "Provide accurate tour descriptions, show up on time, and communicate promptly about changes or delays. Be respectful, inclusive, and responsive to tourists’ questions and accessibility needs.",
  },
  {
    title: "2. Safety and Compliance",
    body:
      "Follow all local laws, permits, and safety regulations. Maintain necessary insurance where required and ensure activities are safe and appropriate for participants’ disclosed conditions.",
  },
  {
    title: "3. Accuracy of Information",
    body:
      "Keep your profile, pricing, availability, and tour details up to date. Only publish media and information you have rights to share.",
  },
  {
    title: "4. Bookings and Cancellations",
    body:
      "Honor confirmed bookings. If you must cancel, do so as early as possible and communicate clearly with impacted tourists. Repeated cancellations may affect your standing on the platform.",
  },
  {
    title: "5. Payments and Fees",
    body:
      "Ensure prices and included services are clearly disclosed. Comply with payment terms, platform fees, and any applicable taxes in your region.",
  },
  {
    title: "6. Reviews and Communication",
    body:
      "Encourage honest feedback without incentives or coercion. Keep all communication respectful and free of harassment, discrimination, or spam.",
  },
  {
    title: "7. Data Protection",
    body:
      "Handle tourist information responsibly. Use personal data only for fulfilling tours or lawful purposes, and respect applicable privacy laws.",
  },
  {
    title: "8. Reporting and Issues",
    body:
      "Report safety incidents, misconduct, or policy violations to VNGO promptly. Cooperate in resolving disputes in good faith.",
  },
  {
    title: "9. Consequences of Violations",
    body:
      "Policy breaches may result in warnings, suspension, removal from the platform, or other actions as permitted by law and platform terms.",
  },
];

export default function GuidePolicyPage() {
  return (
    <div className="flex min-h-[80vh] justify-center bg-white px-6 py-10 md:px-10">
      <article className="prose prose-slate max-w-4xl">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Last updated: December 9, 2025
        </p>
        <h1 className="mb-4 text-3xl font-bold text-slate-900">Guide Policy</h1>
        <p className="text-base text-slate-700">
          This policy supplements the Terms of Service for guides on VNGO. It
          outlines expectations for safety, professionalism, and compliance when
          hosting tourists.
        </p>

        <div className="mt-6 space-y-6">
          {sections.map(({ title, body }) => (
            <section key={title} className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="text-sm leading-relaxed text-slate-700">{body}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

