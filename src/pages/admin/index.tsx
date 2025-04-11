import { MigrationRunner } from '@/components/admin/MigrationRunner';

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid gap-4">
        <MigrationRunner />
      </div>
    </div>
  );
} 