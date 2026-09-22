import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { GoogleLoginButton } from "@/features/auth/components/GoogleLoginButton";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Créer un compte
        </h1>
        
        <GoogleLoginButton />
        
        <div className="my-4 flex items-center">
          <div className="flex-1 border-t"></div>
          <span className="px-2 text-sm text-gray-500">ou</span>
          <div className="flex-1 border-t"></div>
        </div>
        
        <RegisterForm />
        
        <p className="text-center text-sm mt-4">
          Déjà inscrit?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}