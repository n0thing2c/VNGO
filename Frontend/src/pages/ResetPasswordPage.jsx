import { ResetPasswordForm } from "@/components/Login&SignUp/reset-password-form.jsx";

const ResetPasswordPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="grow flex flex-col items-center px-6 md:px-10 pt-2 md:pt-4 pb-8 md:pb-12">
        <div className="w-full max-w-sm md:max-w-4xl">
          <ResetPasswordForm />
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;

