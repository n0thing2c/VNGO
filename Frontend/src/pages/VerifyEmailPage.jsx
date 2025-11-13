import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { VerifyEmailForm } from "@/components/verify-email-form";

const VerifyEmailPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="grow flex flex-col items-center px-6 md:px-10 pt-2 md:pt-4 pb-8 md:pb-12">
        <div className="w-full max-w-sm md:max-w-2xl">
          <VerifyEmailForm />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyEmailPage;


