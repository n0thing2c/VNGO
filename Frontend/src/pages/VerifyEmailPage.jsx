import { VerifyEmailForm } from "@/components/Login&SignUp/verify-email-form.jsx";

const VerifyEmailPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="grow flex flex-col items-center px-6 md:px-10 pt-2 md:pt-4 pb-8 md:pb-12">
        <div className="w-full max-w-sm md:max-w-2xl">
          <VerifyEmailForm />
        </div>
      </main>
    </div>
  );
};

export default VerifyEmailPage;


