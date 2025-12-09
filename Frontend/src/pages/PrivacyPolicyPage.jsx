const sections = [
  {
    title: "1. Information We Collect",
    body: "We collect the information you provide (such as name, email, profile details), booking details, payment confirmations, communications, and limited technical data like IP address and device information.",
  },
  {
    title: "2. How We Use Information",
    body: "We use your information to create and manage accounts, facilitate bookings, provide customer support, personalize experiences, improve our services, and meet legal or security requirements.",
  },
  {
    title: "3. Sharing and Disclosure",
    body: "We may share necessary details with guides or tourists to fulfill bookings, with service providers that help operate the platform, or when required by law or to protect rights, safety, and security.",
  },
  {
    title: "4. Cookies and Tracking",
    body: "We use cookies and similar technologies to keep you signed in, remember preferences, and analyze usage. You can adjust browser settings to limit cookies, but some features may not work correctly.",
  },
  {
    title: "5. Data Retention",
    body: "We retain information only as long as needed for the purposes described or as required by law. We may anonymize data for analytics after it is no longer needed.",
  },
  {
    title: "6. Your Rights",
    body: "Where applicable, you may request access, correction, deletion, or a copy of your personal data. You can also object to certain processing or withdraw consent when processing is based on consent.",
  },
  {
    title: "7. Security",
    body: "We implement reasonable technical and organizational measures to protect personal data, but no system is completely secure. Please keep your account credentials safe and notify us of suspected misuse.",
  },
  {
    title: "8. International Transfers",
    body: "If data is transferred across borders, we use appropriate safeguards as required by applicable law.",
  },
  {
    title: "9. Changes to This Policy",
    body: "We may update this Privacy Policy periodically. Material changes will be communicated through the platform or via email. Continued use after changes indicates acceptance.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-[80vh] justify-center bg-white px-6 py-10 md:px-10">
      <article className="prose prose-slate max-w-4xl">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Last updated: December 9, 2025
        </p>
        <h1 className="mb-4 text-3xl font-bold text-slate-900">
          Privacy Policy
        </h1>
        <p className="text-base text-slate-700">
          This policy explains how VNGO collects, uses, shares, and protects
          your information when you use our platform.
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
