import { getAllOrgs } from "@/lib/getOrgs";
import { QuizClient, type QuizOrg } from "@/components/QuizClient";

export default function QuizPage() {
  // Only the fields QuizClient needs to work out which answers lead
  // somewhere - no reason to ship descriptions, links, cycles, etc.
  const orgs: QuizOrg[] = getAllOrgs().map((org) => ({
    category: org.category,
    disciplines: org.disciplines,
  }));

  return <QuizClient orgs={orgs} />;
}
