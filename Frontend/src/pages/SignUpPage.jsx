import { SignupForm } from "@/components/Login&SignUp/signup-form.jsx";
// import  Header  from "@/components/Login&SignUp/Header";
// import  Footer  from "@/components/Login&SignUp/Footer";
const SignUpPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* <Header /> */}
      <main className="grow flex flex-col items-center px-6 md:px-10 pt-2 md:pt-4 pb-8 md:pb-12">
        <div className="w-full max-w-sm md:max-w-4xl">
          <SignupForm />
        </div>
      </main>
      {/* <Footer /> */}
    </div>
  );
};

export default SignUpPage;
