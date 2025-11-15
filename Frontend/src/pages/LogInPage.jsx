import { LoginForm } from "@/components/Login&SignUp/login-form.jsx";

const LogInPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="grow flex flex-col items-center px-6 md:px-10 pt-2 md:pt-4 pb-8 md:pb-12">
        <div className="w-full max-w-sm md:max-w-4xl">
          <LoginForm />
        </div>
      </main>
    </div>
  );
};

export default LogInPage;
