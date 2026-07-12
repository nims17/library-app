import { completeOnboarding } from "@/app/actions";

export default async function OnboardingPage() {
  async function submit(formData: FormData) {
    "use server";
    const firstName = String(formData.get("first_name") || "").trim();
    const lastName = String(formData.get("last_name") || "").trim();
    if (!firstName || !lastName) return;
    await completeOnboarding(firstName, lastName);
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border-2 border-amber-900/20 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center font-serif text-2xl text-amber-900">
          Welcome to the library
        </h1>
        <p className="mb-6 text-center text-sm text-amber-700">
          What&apos;s your name? This is what shows up on your library card,
          your reviews, and the leaderboard.
        </p>

        <form action={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-amber-900">
              First name
            </label>
            <input
              name="first_name"
              required
              autoFocus
              className="w-full rounded border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-amber-900">
              Last name
            </label>
            <input
              name="last_name"
              required
              className="w-full rounded border border-amber-900/30 px-3 py-2 text-sm focus:border-amber-700 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-amber-900 py-2 text-sm font-medium text-white hover:bg-amber-800"
          >
            Get my library card
          </button>
        </form>
      </div>
    </main>
  );
}
