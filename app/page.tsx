import Link from "next/link";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <main
        className={`${poppins.variable} flex min-h-screen w-full max-w-6xl mx-auto flex-col items-center justify-center py-20 px-6 sm:px-16 relative z-10`}
      >
        <div className="w-full text-center space-y-10">
          <div className="space-y-6 animate-fade-in">
            <h1
              className={`text-6xl sm:text-7xl font-bold gradient-text tracking-tight`}
            >
              Stream402
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
              Monetize your images with Solana payments. Upload, tag, and sell
              your content using the x402 protocol on Solana DevNet.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <Link
              href="/upload"
              className="group relative px-10 py-4 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black rounded-xl font-semibold shadow-lg hover:shadow-[0_0_30px_rgba(29,215,155,0.5)] transform hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-[#1dd79b]/50"
            >
              <span className="relative z-10 flex items-center gap-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span>Upload Image</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#14966c] to-[#0d6b4f] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>

            <Link
              href="/images"
              className="group relative px-10 py-4 bg-gradient-to-r from-[#14966c] to-[#1dd79b] text-black rounded-xl font-semibold shadow-lg hover:shadow-[0_0_30px_rgba(29,215,155,0.5)] transform hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-[#1dd79b]/50"
            >
              <span className="relative z-10 flex items-center gap-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Browse Images</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d6b4f] to-[#14966c] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>

            <Link
              href="/provider"
              className="group relative px-10 py-4 bg-gradient-to-r from-[#1dd79b] to-[#4de6b4] text-black rounded-xl font-semibold shadow-lg hover:shadow-[0_0_30px_rgba(29,215,155,0.5)] transform hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-[#1dd79b]/50"
            >
              <span className="relative z-10 flex items-center gap-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Dashboard</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#14966c] to-[#1dd79b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-black/80 backdrop-blur-md rounded-2xl p-8 shadow-xl hover:shadow-[0_0_30px_rgba(29,215,155,0.3)] transition-all duration-300 border border-[#1dd79b]/30 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1dd79b] to-[#14966c] rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(29,215,155,0.5)]">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#1dd79b] mb-2">
                Secure Payments
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Blockchain-verified transactions on Solana
              </p>
            </div>
            <div className="bg-black/80 backdrop-blur-md rounded-2xl p-8 shadow-xl hover:shadow-[0_0_30px_rgba(29,215,155,0.3)] transition-all duration-300 border border-[#1dd79b]/30 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#14966c] to-[#1dd79b] rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(29,215,155,0.5)]">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#1dd79b] mb-2">
                IPFS Storage
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Decentralized storage with Pinata
              </p>
            </div>
            <div className="bg-black/80 backdrop-blur-md rounded-2xl p-8 shadow-xl hover:shadow-[0_0_30px_rgba(29,215,155,0.3)] transition-all duration-300 border border-[#1dd79b]/30 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#4de6b4] to-[#1dd79b] rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(29,215,155,0.5)]">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#1dd79b] mb-2">
                Fast & Reliable
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Instant access after payment
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
