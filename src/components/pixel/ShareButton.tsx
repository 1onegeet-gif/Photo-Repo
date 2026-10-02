"use client";

import { useState } from "react";
import { Share2, Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Shareable URL copied", {
        description: "All current settings are encoded in the link.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the URL
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand("copy");
        toast.success("URL copied to clipboard");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Could not copy — copy the URL from the address bar");
      }
      input.remove();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onShare}
      className="h-8 gap-1.5 border-border/60 bg-paper/60 px-2.5 text-xs hover:bg-paper"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-matcha" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5 text-seal" />
          <span>Share</span>
          <LinkIcon className="h-3 w-3 text-muted-foreground/50" />
        </>
      )}
    </Button>
  );
}
