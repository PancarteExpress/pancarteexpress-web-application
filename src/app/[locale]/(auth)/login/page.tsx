import { LoginForm } from "@/features/auth/components/LoginForm";
import { GoogleLoginButton } from "@/features/auth/components/GoogleLoginButton";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">Se connecter</h1>
        
        <GoogleLoginButton />
        
        <div className="my-4 flex items-center">
          <div className="flex-1 border-t"></div>
          <span className="px-2 text-sm text-gray-500">ou</span>
          <div className="flex-1 border-t"></div>
        </div>
        
        <LoginForm />
        
        <p className="text-center text-sm mt-4">
          Pas encore inscrit?{" "}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}