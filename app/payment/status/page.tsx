import { Suspense } from "react";
import PaymentStatusClient from "./PaymentStatusClient";
export default function PaymentStatusPage(){return <Suspense fallback={<main className="min-h-screen bg-slate-50" />}><PaymentStatusClient /></Suspense>}
