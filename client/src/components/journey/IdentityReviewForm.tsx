import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { CheckCircle, Edit, ArrowLeft, Download, Share } from 'lucide-react';
import { getIndustryLabel } from '@/lib/identity/industry-options';

interface IdentityData {
  companyFoundation: any;
  industryBusinessModel: any;
  missionVision: any;
  coreValues: any;
  strategicContext: any;
}

interface IdentityReviewFormProps {
  identityData: IdentityData;
  onEdit: (step: string) => void;
  onComplete: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
}

export function IdentityReviewForm({ 
  identityData, 
  onEdit, 
  onComplete, 
  onPrevious,
  isLoading = false 
}: IdentityReviewFormProps) {
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    // Calculate completion percentage
    const steps = [
      identityData.companyFoundation,
      identityData.industryBusinessModel,
      identityData.missionVision,
      identityData.coreValues,
      identityData.strategicContext
    ];
    
    const completedSteps = steps.filter(step => step && Object.keys(step).length > 0);
    const percentage = Math.round((completedSteps.length / steps.length) * 100);
    setCompletionPercentage(percentage);
  }, [identityData]);

  const handleComplete = () => {
    onComplete();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(identityData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'business-identity.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Business Identity',
        text: 'Check out my business identity profile',
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
            6
          </div>
          Identity Review
        </CardTitle>
        <CardDescription>
          Review and finalize your complete business identity profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Completion Status */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Completion Status</h3>
            <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
              {completionPercentage}% Complete
            </Badge>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          {completionPercentage === 100 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">All sections completed! Your business identity is ready.</span>
            </div>
          ) : (
            <p className="text-gray-600">
              Complete all sections to finalize your business identity profile.
            </p>
          )}
        </div>

        {/* Company Foundation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Company Foundation</h3>
            <div className="flex items-center gap-2">
              {identityData.companyFoundation ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit('companyFoundation')}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
          
          {identityData.companyFoundation ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Company Name:</span>
                  <p>{identityData.companyFoundation.name}</p>
                </div>
                <div>
                  <span className="font-medium">Legal Structure:</span>
                  <p>{identityData.companyFoundation.legalStructure}</p>
                </div>
                <div>
                  <span className="font-medium">Founded:</span>
                  <p>{identityData.companyFoundation.foundedDate}</p>
                </div>
                <div>
                  <span className="font-medium">Website:</span>
                  <p>{identityData.companyFoundation.website}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Location:</span>
                  <p>{identityData.companyFoundation.headquarters?.city}, {identityData.companyFoundation.headquarters?.state}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
              Company foundation information not completed
            </div>
          )}
        </div>

        {/* Industry & Business Model */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Industry & Business Model</h3>
            <div className="flex items-center gap-2">
              {identityData.industryBusinessModel ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit('industryBusinessModel')}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
          
          {identityData.industryBusinessModel ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Industry:</span>
                  <p>{getIndustryLabel(identityData.industryBusinessModel.industry)}</p>
                </div>
                <div>
                  <span className="font-medium">Business Model:</span>
                  <p>{identityData.industryBusinessModel.businessModel}</p>
                </div>
                <div>
                  <span className="font-medium">Company Stage:</span>
                  <p>{identityData.industryBusinessModel.companyStage}</p>
                </div>
                <div>
                  <span className="font-medium">Company Size:</span>
                  <p>{identityData.industryBusinessModel.companySize}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
              Industry and business model information not completed
            </div>
          )}
        </div>

        {/* Mission & Vision */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Mission & Vision</h3>
            <div className="flex items-center gap-2">
              {identityData.missionVision ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit('missionVision')}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
          
          {identityData.missionVision ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Mission Statement:</span>
                  <p className="mt-1 italic">"{identityData.missionVision.missionStatement}"</p>
                </div>
                <div>
                  <span className="font-medium">Vision Statement:</span>
                  <p className="mt-1 italic">"{identityData.missionVision.visionStatement}"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
              Mission and vision statements not completed
            </div>
          )}
        </div>

        {/* Core Values */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Core Values</h3>
            <div className="flex items-center gap-2">
              {identityData.coreValues ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit('coreValues')}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
          
          {identityData.coreValues ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Core Values:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {identityData.coreValues.values?.map((value: string, index: number) => (
                      <Badge key={index} variant="secondary">{value}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Culture Principles:</span>
                  <ul className="mt-2 space-y-1">
                    {identityData.coreValues.culturePrinciples?.map((principle: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>{principle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
              Core values and culture principles not completed
            </div>
          )}
        </div>

        {/* Strategic Context */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Strategic Context</h3>
            <div className="flex items-center gap-2">
              {identityData.strategicContext ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit('strategicContext')}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
          
          {identityData.strategicContext ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Business Goals:</span>
                  <ul className="mt-1 space-y-1">
                    {identityData.strategicContext.businessGoals?.map((goal: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium">Key Challenges:</span>
                  <ul className="mt-1 space-y-1">
                    {identityData.strategicContext.challenges?.map((challenge: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium">Success Metrics:</span>
                  <ul className="mt-1 space-y-1">
                    {identityData.strategicContext.successMetrics?.map((metric: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium">Strategic Priorities:</span>
                  <ul className="mt-1 space-y-1">
                    {identityData.strategicContext.strategicPriorities?.map((priority: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{priority}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
              Strategic context information not completed
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={onPrevious}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Button
              variant="outline"
              onClick={handleShare}
              disabled={isLoading}
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            
            <Button 
              onClick={handleComplete}
              disabled={isLoading || completionPercentage < 100}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Journey
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
