"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();

    // Remove the # from the href
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);

    if (element) {
      const navbarHeight = 64; // Account for navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer className="w-full bg-[#161616] text-neutral-400 px-4 sm:px-10">
      <div className="py-8 sm:py-16 max-w-7xl mx-auto">
        {/* Logo Section */}
        <div className="mb-8 sm:mb-12">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-white">RemberTheKingdom</span>
          </Link>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-0">
          {/* Resources Column */}
          <div className="space-y-6 sm:space-y-0">
            <h3 className="text-white font-semibold mb-4 sm:mb-6">Resources</h3>
            <ul className="space-y-4">
              <li>
                {/* <a
                  href="/examples"
                  className="hover:text-white transition-colors"
                >
                  Examples
                </a> */}
              </li>
              <li>
                {/* <a
                  href="#pricing"
                  onClick={(e) => handleScroll(e, "#pricing")}
                  className="hover:text-white transition-colors"
                >
                  Pricing
                </a> */}
              </li>
              <li>
                <a
                  href="#reason"
                  onClick={(e) => handleScroll(e, "#reason")}
                  className="hover:text-white transition-colors"
                >
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-6 sm:space-y-0">
            <h3 className="text-white font-semibold mb-4 sm:mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-6 sm:space-y-0">
            <h3 className="text-white font-semibold mb-4 sm:mb-6">Company</h3>
            <ul className="space-y-4">
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Directory
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>

              <li>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>All systems operational</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Subscribe Column */}
          <div className="space-y-6 sm:space-y-0">
            <h3 className="text-white font-semibold mb-4 sm:mb-6">
              Subscribe to stay up to date
            </h3>
            <p className="text-sm mb-4">
              Want to stay up to date with news and updates about our team?
            </p>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email here.."
                className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 focus:outline-none focus:border-neutral-600"
              />
              <p className="text-xs text-neutral-500">
                By subscribing to our newsletter you agree to our privacy policy
                and will get commercial communication.
              </p>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex justify-center sm:justify-start gap-4 mt-8 sm:mt-12 pt-8 border-t border-neutral-800">
          <a
            href="https://github.com"
            className="hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
          <a
            href="https://discord.com"
            className="hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>
          <a
            href="https://twitter.com"
            className="hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
