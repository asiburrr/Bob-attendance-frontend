import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="glass-dropdown p-8 rounded-3xl max-w-sm space-y-4 border border-white/60 dark:border-white/10 shadow-2xl animate-ios-enter">
        <h1 className="text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
          404
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          The requested console page or terminal resource could not be found.
        </p>
        <div>
          <Link href="/admin">
            <Button variant="primary" size="sm">
              Return to Console
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
