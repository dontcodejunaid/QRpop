'use client';

import React from "react";
import { AuthSwitch } from "./auth-switch";

export default function Demo() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a110e] p-6">
      <AuthSwitch
        onLogin={async (email, password) => {
          console.log("Logging in:", { email, password });
          return { success: true, message: "Logged in successfully!" };
        }}
        onSignUp={async (name, email, password) => {
          console.log("Signing up:", { name, email, password });
          return { success: true, message: "Account created!" };
        }}
        onClose={() => console.log("Closed modal")}
      />
    </div>
  );
}
