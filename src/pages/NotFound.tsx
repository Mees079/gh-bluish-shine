import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <div className="text-center space-y-8 px-4 relative z-10 animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-primary drop-shadow-glow">404</h1>
          <div className="h-1 w-32 bg-primary/50 rounded mx-auto" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Pagina Niet Gevonden
          </h2>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            De pagina die je zoekt bestaat niet of is verplaatst.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild size="lg" variant="glow" className="gap-2">
            <Link to="/">
              <Home className="h-5 w-5" />
              Terug naar Home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link to="/shop">
              Shop Bekijken
            </Link>
          </Button>
        </div>

        <div className="pt-8 text-sm text-muted-foreground">
          <p>Denk je dat dit een fout is? Neem contact op via Discord!</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
