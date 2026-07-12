import { redirect } from "next/navigation";

// Leaderboards moved into the combined Tabor Street Community page.
export default function LeaderboardPage() {
  redirect("/community");
}
