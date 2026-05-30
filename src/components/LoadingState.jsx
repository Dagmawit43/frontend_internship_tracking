import React from "react";
import { Loader2 } from "lucide-react";

const LoadingState = ({ title = "Loading dashboard", subtitle = "Please wait while we fetch your data." }) => {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center shadow-xl shadow-slate-200/50 backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-slate-900 text-white shadow-lg shadow-indigo-200/40">
          <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
        </div>
        <h2 className="mt-5 text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>
        <div className="mt-6 space-y-3 text-left">
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
};

export default LoadingState;