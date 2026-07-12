import { completeOnboarding } from "@/app/actions";
import LibraryCardFrame from "@/components/LibraryCardFrame";
import NameSignatureForm from "@/components/NameSignatureForm";

export default async function OnboardingPage() {
  async function submit(formData: FormData) {
    "use server";
    const firstName = String(formData.get("first_name") || "").trim();
    const lastName = String(formData.get("last_name") || "").trim();
    if (!firstName || !lastName) return;
    const avatar = formData.get("avatar");
    await completeOnboarding(
      firstName,
      lastName,
      avatar instanceof File ? avatar : null
    );
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <LibraryCardFrame eyebrow="WELCOME">
        <p className="mb-4 text-center text-sm text-brown/80">
          What&apos;s your name? This is what shows up on your library card,
          your reviews, and the leaderboard. Add a photo too, if you&apos;d
          like.
        </p>
        <NameSignatureForm action={submit} />
      </LibraryCardFrame>
    </main>
  );
}
