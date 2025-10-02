import React from 'react'
import { useHeaderContext } from '@/shared/hooks/useHeaderContext'

export function PageHeader() {
  const { pageTitle, pageSubtitle, pageActions } = useHeaderContext()

  if (!pageTitle) {
    return null
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
            {pageSubtitle && (
              <p className="text-sm text-muted-foreground">{pageSubtitle}</p>
            )}
          </div>
        </div>
        
        {pageActions && (
          <div className="ml-auto flex items-center gap-2">
            {pageActions}
          </div>
        )}
      </div>
    </header>
  )
}
