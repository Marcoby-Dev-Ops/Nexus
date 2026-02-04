import React from "react";
import { MARCOBY_TAGLINE } from "../../constants/marcobyTagline";

export const PublicFooter: React.FC = () => (
  <footer className="w-full py-6 border-t bg-background text-center text-sm text-muted-foreground">
    <div>
      <span>
        © {new Date().getFullYear()} Nexus. Your data, your AI, your control.
      </span>
    </div>
    <div className="mt-2 text-xs text-gray-400">
      {MARCOBY_TAGLINE}
    </div>
  </footer>
);
