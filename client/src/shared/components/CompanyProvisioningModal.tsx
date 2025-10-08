/**
 * Company Provisioning Modal
 * 
 * Provides a user-friendly interface for company provisioning
 */

import React, { useState } from 'react';
import { useCompanyProvisioning } from '@/shared/hooks/useCompanyProvisioning';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Modal } from '@/shared/components/ui/Modal';
import { Spinner } from '@/shared/components/ui/Spinner';

interface CompanyProvisioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (companyId: string) => void;
  title?: string;
  description?: string;
}

export const CompanyProvisioningModal: React.FC<CompanyProvisioningModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Set Up Your Workspace',
  description = 'To get started, we need to set up your workspace. Choose an option below:'
}) => {
  const {
    isProvisioning,
    provisioningResult,
    error,
    createPersonalWorkspace,
    createDefaultCompany,
    redirectToOnboarding
  } = useCompanyProvisioning();

  const [selectedOption, setSelectedOption] = useState<'personal' | 'company' | 'onboarding' | null>(null);

  const handleOptionSelect = async (option: 'personal' | 'company' | 'onboarding') => {
    setSelectedOption(option);
    
    try {
      let result;
      
      switch (option) {
        case 'personal':
          result = await createPersonalWorkspace();
          break;
        case 'company':
          result = await createDefaultCompany();
          break;
        case 'onboarding':
          result = await redirectToOnboarding();
          break;
      }
      
      if (result?.success && result.companyId) {
        onSuccess?.(result.companyId);
        onClose();
      }
    } catch (err) {
      // console.error('Error provisioning company:', err);
    }
  };

  const getOptionDescription = (option: 'personal' | 'company' | 'onboarding') => {
    switch (option) {
      case 'personal':
        return 'Create a personal workspace for individual use';
      case 'company':
        return 'Create a company workspace with team features';
      case 'onboarding':
        return 'Complete full onboarding with guided setup';
    }
  };

  const getOptionIcon = (option: 'personal' | 'company' | 'onboarding') => {
    switch (option) {
      case 'personal':
        return '👤';
      case 'company':
        return '🏢';
      case 'onboarding':
        return '🚀';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {provisioningResult && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">{provisioningResult.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card
            className={`p-4 cursor-pointer transition-all ${
              selectedOption === 'personal' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleOptionSelect('personal')}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{getOptionIcon('personal')}</div>
              <h3 className="font-semibold text-gray-900 mb-1">Personal Workspace</h3>
              <p className="text-sm text-gray-600">{getOptionDescription('personal')}</p>
            </div>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all ${
              selectedOption === 'company' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleOptionSelect('company')}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{getOptionIcon('company')}</div>
              <h3 className="font-semibold text-gray-900 mb-1">Company Workspace</h3>
              <p className="text-sm text-gray-600">{getOptionDescription('company')}</p>
            </div>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all ${
              selectedOption === 'onboarding' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleOptionSelect('onboarding')}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{getOptionIcon('onboarding')}</div>
              <h3 className="font-semibold text-gray-900 mb-1">Guided Setup</h3>
              <p className="text-sm text-gray-600">{getOptionDescription('onboarding')}</p>
            </div>
          </Card>
        </div>

        {isProvisioning && (
          <div className="text-center py-4">
            <Spinner size="md" />
            <p className="text-gray-600 mt-2">Setting up your workspace...</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProvisioning}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 
