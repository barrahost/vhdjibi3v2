import { useState } from 'react';
import ServantForm from '../components/servants/ServantForm';
import ServantList from '../components/servants/ServantList';
import DepartmentLeaderDashboard from '../components/servants/DepartmentLeaderDashboard';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Plus, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function ServantManagement() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const canManageServants = hasPermission('MANAGE_SERVANTS');
  const canManageDepartmentServants = hasPermission('MANAGE_DEPARTMENT_SERVANTS');
  const isAdmin = hasPermission('*') || canManageServants;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Gestion des Serviteurs</h1>
        {canManageServants && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Masquer le formulaire' : 'Ajouter un serviteur'}
          </Button>
        )}
      </div>

      {/* Tabs pour séparer la vue admin de la vue responsable de département */}
      <Tabs defaultValue={isAdmin ? "all" : "department"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {isAdmin && (
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Tous les serviteurs
            </TabsTrigger>
          )}
          {canManageDepartmentServants && (
            <TabsTrigger value="department" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Mon département
            </TabsTrigger>
          )}
        </TabsList>

        {/* Vue complète pour les admins */}
        {isAdmin && (
          <TabsContent value="all" className="space-y-6">
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="text-lg font-medium text-foreground mb-4">Filtres</h3>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background"
                >
                  <option value="active">Actifs uniquement</option>
                  <option value="inactive">Inactifs uniquement</option>
                  <option value="all">Tous les serviteurs</option>
                </select>
              </div>
            </div>
            
            {showForm && (
              <div className="bg-card p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold text-primary mb-4">Ajouter un serviteur</h2>
                <ServantForm onSuccess={() => setShowForm(false)} />
              </div>
            )}

            <ServantList statusFilter={statusFilter} />
          </TabsContent>
        )}

        {/* Vue département pour les responsables */}
        {canManageDepartmentServants && (
          <TabsContent value="department">
            <DepartmentLeaderDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}