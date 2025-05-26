import React from 'react';
import Card from "@/components/Card";
import Button from "@/components/Button";

/**
 * SalesDashboard displays the sales pipeline, deals, contacts, forecast, and invoice creation.
 * @component
 */
const pipelineStages = ['Prospect', 'Negotiation', 'Closed'];

interface Deal {
  id: string;
  name: string;
  stage: string;
  value: number;
  contact: string;
}

const mockDeals: Deal[] = [
  { id: '1', name: 'Acme Corp', stage: 'Prospect', value: 12000, contact: 'Jane Doe' },
  { id: '2', name: 'Beta LLC', stage: 'Negotiation', value: 8000, contact: 'John Smith' },
  { id: '3', name: 'Gamma Inc', stage: 'Closed', value: 15000, contact: 'Alice Lee' },
];

const SalesDashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Forecast Widget */}
      <Card className="mb-4 p-4">
        <h2 className="text-lg font-semibold mb-2">Forecast</h2>
        <div className="flex gap-8">
          <div>
            <span className="block text-gray-500">Expected Revenue</span>
            <span className="text-xl font-bold">$34,000</span>
          </div>
          <div>
            <span className="block text-gray-500">Deals Closing</span>
            <span className="text-xl font-bold">2</span>
          </div>
        </div>
      </Card>

      {/* Pipeline Board */}
      <div className="grid grid-cols-3 gap-4">
        {pipelineStages.map((stage) => (
          <Card key={stage} className="p-4">
            <h3 className="font-semibold mb-2">{stage}</h3>
            <ul className="space-y-2">
              {mockDeals.filter((deal) => deal.stage === stage).map((deal) => (
                <li key={deal.id} className="flex flex-col border rounded p-2 bg-gray-50 dark:bg-gray-800">
                  <span className="font-medium">{deal.name}</span>
                  <span className="text-xs text-gray-500">Contact: {deal.contact}</span>
                  <span className="text-xs text-gray-500">Value: ${deal.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* Deal & Contact List */}
      <Card className="mt-4 p-4">
        <h2 className="text-lg font-semibold mb-2">Deals & Contacts</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Deal</th>
              <th className="text-left">Contact</th>
              <th className="text-left">Stage</th>
              <th className="text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            {mockDeals.map((deal) => (
              <tr key={deal.id} className="border-t">
                <td>{deal.name}</td>
                <td>{deal.contact}</td>
                <td>{deal.stage}</td>
                <td>${deal.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Create Invoice Button */}
      <div className="flex justify-end mt-4">
        <Button variant="primary" className="px-6 py-2">Create Invoice</Button>
      </div>
    </div>
  );
};

SalesDashboard.propTypes = {};

export default SalesDashboard; 