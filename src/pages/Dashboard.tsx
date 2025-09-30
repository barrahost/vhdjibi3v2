import { useAuth } from '../contexts/AuthContext';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { ShepherdDashboard } from '../components/dashboard/ShepherdDashboard';
import { ADNDashboard } from '../components/dashboard/ADNDashboard';
import DepartmentLeaderDashboard from '../components/servants/DepartmentLeaderDashboard';
import { ROLES } from '../constants/roles';

export default function Dashboard() {
  const { userRole, activeRole } = useAuth();

  // Si pas de rôle défini, afficher un message d'erreur
  if (!userRole) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erreur de chargement du tableau de bord</p>
      </div>
    );
  }

  // Afficher le tableau de bord spécifique selon le rôle actif ou le rôle principal
  const currentRole = activeRole || userRole;
  switch (currentRole) {
    case ROLES.SHEPHERD:
      return <ShepherdDashboard />;
    case ROLES.ADN:
      return <ADNDashboard />;
    case ROLES.DEPARTMENT_LEADER:
      return <DepartmentLeaderDashboard />;
    case ROLES.ADMIN:
    case ROLES.SUPER_ADMIN:
      return <AdminDashboard />;
    default:
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Rôle non reconnu</p>
        </div>
      );
  }
}