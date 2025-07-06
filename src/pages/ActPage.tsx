import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

const sampleWorkflows = [
  { id: 1, name: 'Onboard New Client', description: 'A series of steps to onboard a new client.', trigger: 'manual', status: 'Active' },
  { id: 2, name: 'Process Refund', description: 'Automated workflow to process a customer refund.', trigger: 'webhook', status: 'Active' },
  { id: 3, name: 'Generate Monthly Report', description: 'Scheduled workflow to generate a monthly performance report.', trigger: 'schedule', status: 'Inactive' },
];

export function ActPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Act: Automation Engine</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Manage and execute your automated workflows.
      </p>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Workflows</CardTitle>
            <CardDescription>
              Here is a list of your available workflows. You can run, edit, or view the history of each workflow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleWorkflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">{workflow.name}</TableCell>
                    <TableCell>{workflow.description}</TableCell>
                    <TableCell>{workflow.trigger}</TableCell>
                    <TableCell>{workflow.status}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">Run</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 