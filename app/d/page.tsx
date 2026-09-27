import { redirect } from "next/navigation";

export default function InvestmentEntry({ searchParams }: { searchParams: { role?: string } }) {
  const role = searchParams?.role === "investor" ? "investor" : "business_owner";
  redirect(`/dashboard/post-ad?role=${role}`);
}
