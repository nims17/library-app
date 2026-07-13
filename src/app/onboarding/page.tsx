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
    <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/library-nook-lights.jpg"
          alt=""
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-parchment/75" />
      </div>
      <LibraryCardFrame eyebrow="WELCOME">
        <p className="mb-4 text-center text-sm text-brown/80">
          What&apos;s your name, and what do you look like? Both show up on
          your library card, your reviews, and the leaderboard — a photo is
          required to finish signing up.
        </p>
        <NameSignatureForm action={submit} />
      </LibraryCardFrame>
    </main>
  );
}
