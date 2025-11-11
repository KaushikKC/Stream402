import { CatsComponent } from "@/components/cats-component";
import Link from "next/link";
import { notFound } from "next/navigation";

const CONTENT_CONFIG = {
  cheap: {
    price: "0.01",
    title: "Budget Content",
    message:
      "This is what you get when you pay for cheap content: angry, starving, and sad cats. 😿",
  },
  expensive: {
    price: "0.25",
    title: "Premium Content",
    message:
      "You deserve the best! Here are some happy, wealthy cats living their best lives. 🐱💰✨",
  },
} as const;

type ContentType = keyof typeof CONTENT_CONFIG;

export default async function ContentPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  if (!["cheap", "expensive"].includes(type)) {
    notFound();
  }

  const contentType = type as ContentType;
  const config = CONTENT_CONFIG[contentType];

  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-sans">
      <main className="flex w-full max-w-2xl flex-col items-center justify-center p-8">
        <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-2xl border border-[#1dd79b]/20 p-12 text-center">
          <div className="bg-[#1dd79b]/10 rounded-xl p-8 mb-8 border-2 border-[#1dd79b]/30">
            <h2 className="text-2xl font-bold text-[#1dd79b] mb-4">
              Exclusive Content Unlocked
            </h2>
            <p className="text-gray-300 leading-relaxed mb-6 font-medium">
              {config.message.replace(/😿|🐱|💰|✨/g, "")} You paid{" "}
              {config.price}!
            </p>
            <CatsComponent contentType={contentType} />
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black rounded-lg font-semibold hover:from-[#14966c] hover:to-[#0d6b4f] transition-all shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
