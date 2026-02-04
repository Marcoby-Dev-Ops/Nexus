import { useEffect } from "react"
import { IdentityDashboard } from "@/components/identity/identity-dashboard"
import { useHeaderContext } from "@/shared/hooks/useHeaderContext"
import { Building2 } from "lucide-react"

export default function IdentityPage() {
  const { setPageTitle, setPageIcon } = useHeaderContext();

  useEffect(() => {
    setPageTitle("Business Identity");
    setPageIcon(<Building2 className="h-5 w-5" />);
    return () => {
      setPageTitle("");
      setPageIcon(undefined);
    };
  }, [setPageTitle, setPageIcon]);

  return (
    <div className="flex flex-1 flex-col fade-in">
        <div className="flex flex-1 flex-col gap-2">
            <IdentityDashboard />
        </div>
    </div>
  )
}
