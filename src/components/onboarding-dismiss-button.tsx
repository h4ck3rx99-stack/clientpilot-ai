"use client";

export default function OnboardingDismissButton() {
  async function handleDismiss() {
    await fetch("/api/onboarding/dismiss", { method: "POST" });
    location.reload();
  }

  return (
    <button
      onClick={handleDismiss}
      className="text-xs text-zinc-500 hover:text-white transition-colors"
    >
      Hide
    </button>
  );
}
