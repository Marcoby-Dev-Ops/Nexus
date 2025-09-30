import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IdentityManager } from '@/lib/identity/identity-manager'
import type { BusinessIdentity } from '@/lib/identity/types'

export function IdentityDemo() {
  const [identityManager] = useState(() => new IdentityManager())
  const [identity, setIdentity] = useState<BusinessIdentity>(identityManager.getIdentity())
  const [companyName, setCompanyName] = useState('')

  const handleUpdateCompany = () => {
    identityManager.updateSection('foundation', {
      name: companyName,
      industry: 'Technology',
      businessModel: 'B2B',
      website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      email: `contact@${companyName.toLowerCase().replace(/\s+/g, '')}.com`
    })
    
    setIdentity(identityManager.getIdentity())
    setCompanyName('')
  }

  const handleSave = () => {
    identityManager.saveToStorage()
    alert('Identity saved to localStorage!')
  }

  const handleLoad = () => {
    identityManager.loadFromStorage()
    setIdentity(identityManager.getIdentity())
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identity System Demo</CardTitle>
          <CardDescription>
            Test the identity management system by adding basic company information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleUpdateCompany} disabled={!companyName.trim()}>
              Update Company Info
            </Button>
            <Button variant="outline" onClick={handleSave}>
              Save to Storage
            </Button>
            <Button variant="outline" onClick={handleLoad}>
              Load from Storage
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Identity Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Company Name:</strong> {identity.foundation.name || 'Not set'}
            </div>
            <div>
              <strong>Industry:</strong> {identity.foundation.industry || 'Not set'}
            </div>
            <div>
              <strong>Business Model:</strong> {identity.foundation.businessModel || 'Not set'}
            </div>
            <div>
              <strong>Website:</strong> {identity.foundation.website || 'Not set'}
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Overall Completeness:</span>
              <span className="text-lg font-bold">{identity.completeness.overall}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${identity.completeness.overall}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Recommended Action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Section:</span>
              <span>{identityManager.getNextAction().section}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Action:</span>
              <span>{identityManager.getNextAction().action}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Priority:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                identityManager.getNextAction().priority === 'High' ? 'bg-red-100 text-red-800' :
                identityManager.getNextAction().priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {identityManager.getNextAction().priority}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
