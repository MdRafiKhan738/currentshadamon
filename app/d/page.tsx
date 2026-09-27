import { redirect } from "next/navigation";

export default async function InvestmentEntry({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const role = params?.role === "investor" ? "investor" : "business_owner";
  redirect(`/dashboard/post-ad?role=${role}`);
}
