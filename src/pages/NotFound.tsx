import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn("404: route not found:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-6">
      <div className="text-center max-w-sm space-y-6">
        <div className="space-y-2">
          <p className="text-6xl font-bold text-primary/20">404</p>
          <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to groundpath
          </Link>
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60 pt-2">
          <Shield className="h-3 w-3" />
          <span>groundpath</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
