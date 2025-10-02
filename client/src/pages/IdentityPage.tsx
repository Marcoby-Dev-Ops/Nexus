import { IdentityDashboard } from "@/components/identity/identity-dashboard"
import { useHeaderContext } from "@/shared/hooks/useHeaderContext"
import { Building2, Download, Upload, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function IdentityPage() {
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const { setHeaderContent, clearHeaderContent } = useHeaderContext()

  const handleExport = () => {
    setShowExportDialog(true)
  }

  const handleImport = () => {
    setShowImportDialog(true)
  }

  const handleSave = () => {
    // This will be handled by the dashboard component
    const saveEvent = new CustomEvent('identity-save')
    window.dispatchEvent(saveEvent)
  }

  useEffect(() => {
    const headerActions = (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={handleImport}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    )

    setHeaderContent(
      "Business Identity",
      "Define your business foundation, mission, and strategic context",
      headerActions
    )

    // Cleanup when component unmounts
    return () => clearHeaderContent()
  }, []) // Empty dependency array to prevent infinite re-renders

  return (
    <div className="space-y-4 p-4">
      <IdentityDashboard 
        showExportDialog={showExportDialog}
        setShowExportDialog={setShowExportDialog}
        showImportDialog={showImportDialog}
        setShowImportDialog={setShowImportDialog}
      />
    </div>
  )
}
