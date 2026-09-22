"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, isLoading, error } = useAuth();
  const [isGroup, setIsGroup] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { isGroup: false },
  });

  const onSubmit = async (data: RegisterInput) => {
    const result = await registerUser(data);
    if (result.success) {
      router.push("/services");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          {...register("email")}
          className="w-full px-3 py-2 border rounded"
          disabled={isLoading}
        />
        {errors.email && (
          <span className="text-red-600 text-sm">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nom</label>
        <input
          type="text"
          {...register("name")}
          className="w-full px-3 py-2 border rounded"
          disabled={isLoading}
        />
        {errors.name && (
          <span className="text-red-600 text-sm">{errors.name.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          {...register("password")}
          className="w-full px-3 py-2 border rounded"
          disabled={isLoading}
        />
        {errors.password && (
          <span className="text-red-600 text-sm">
            {errors.password.message}
          </span>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isGroup"
          checked={isGroup}
          onChange={(e) => setIsGroup(e.target.checked)}
          className="w-4 h-4"
          disabled={isLoading}
        />
        <label htmlFor="isGroup" className="ml-2 text-sm">
          Je minscris en tant quéquipe
        </label>
      </div>

      {isGroup && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Nom de léquipe
          </label>
          <input
            type="text"
            {...register("groupName")}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          />
          {errors.groupName && (
            <span className="text-red-600 text-sm">
              {errors.groupName.message}
            </span>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50"
      >
        {isLoading ? "Inscription..." : "S'inscrire"}
      </button>
    </form>
  );
}