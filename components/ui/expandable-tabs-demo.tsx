import React from "react";
import { Bell, Home, HelpCircle, Settings, Shield, Mail, User, FileText, Lock, QrCode, Scan, History, Info } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";

export function DefaultDemo() {
  const tabs = [
    { title: "Dashboard", icon: Home },
    { title: "Notifications", icon: Bell },
    { type: "separator" as const },
    { title: "Settings", icon: Settings },
    { title: "Support", icon: HelpCircle },
    { title: "Security", icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-900 min-h-screen items-center justify-center">
      <ExpandableTabs tabs={tabs} />
    </div>
  );
}

export function QRpopNavDemo() {
  const tabs = [
    { title: "Home", icon: Home },
    { title: "Generate", icon: QrCode },
    { title: "Scan", icon: Scan },
    { title: "History", icon: History },
    { type: "separator" as const },
    { title: "About", icon: Info },
  ];

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-900 min-h-screen items-center justify-center">
      <ExpandableTabs tabs={tabs} activeColor="text-white" />
    </div>
  );
}

export function CustomColorDemo() {
  const tabs = [
    { title: "Profile", icon: User },
    { title: "Messages", icon: Mail },
    { type: "separator" as const },
    { title: "Documents", icon: FileText },
    { title: "Privacy", icon: Lock },
  ];

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-900 min-h-screen items-center justify-center">
      <ExpandableTabs 
        tabs={tabs} 
        activeColor="text-blue-500"
        className="border-blue-200 dark:border-blue-800" 
      />
    </div>
  );
}

export default QRpopNavDemo;
