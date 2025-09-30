import { 
  LayoutDashboard, 
  MessageCircle, 
  TrendingUp, 
  AlertTriangle, 
  Heart, 
  Bell, 
  CalendarCheck, 
  Briefcase, 
  UsersRound,
  MessageSquare,
  MessagesSquare,
  UserCog,
  Map,
  Settings,
  Users,
  FileText,
  BarChart,
  Cake,
  Play,
  Headphones,
  User,
  Shield
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, PERMISSIONS } from '../../constants/roles';
import { usePermissions } from '../../hooks/usePermissions';
import { AccordionMenu, MenuItem } from './AccordionMenu';

interface NavigationProps {
  onItemClick?: () => void;
}

export default function Navigation({ onItemClick }: NavigationProps) {
  const { userRole, activeRole, additionalMenus } = useAuth();
  const { hasPermission } = usePermissions();

  const getNavigationItems = (): MenuItem[] => {
    console.log('🔍 [Navigation] Building menu with permissions:', {
      userRole,
      activeRole,
      additionalMenus
    });
    
    // Start with common items
    const items: MenuItem[] = [
      {
        id: 'dashboard',
        label: 'Tableau de bord',
        icon: <LayoutDashboard className="w-5 h-5" />,
        href: '/'
      }
    ];

    // Build shepherd-specific menu - only for shepherds
    if ((activeRole === ROLES.SHEPHERD || userRole === ROLES.SHEPHERD) && (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS) || hasPermission(PERMISSIONS.MANAGE_ATTENDANCES))) {
      const shepherdChildren = [];
      
      if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
        shepherdChildren.push(
          {
            id: 'assigned-souls',
            label: 'Mes Âmes',
            href: '/assigned-souls',
            icon: <Heart className="w-5 h-5" />
          },
          {
            id: 'interactions',
            label: 'Interactions',
            href: '/interactions',
            icon: <MessageCircle className="w-5 h-5" />
          }
        );
      }

      if (hasPermission(PERMISSIONS.MANAGE_ATTENDANCES)) {
        shepherdChildren.push({
          id: 'attendance',
          label: 'Présences',
          href: '/presences',
          icon: <CalendarCheck className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SMS)) {
        shepherdChildren.push({
          id: 'sms',
          label: 'SMS',
          href: '/sms',
          icon: <MessageSquare className="w-5 h-5" />
        });
      }

      shepherdChildren.push({
        id: 'reminders',
        label: 'Rappels',
        href: '/rappels',
        icon: <Bell className="w-5 h-5" />
      });

      if (shepherdChildren.length > 0) {
        items.push({
          id: 'monitoring',
          label: 'Suivi',
          icon: <FileText className="w-5 h-5" />,
          children: shepherdChildren
        });
      }
    }

    // Build department management menu - only for department leaders
    if ((activeRole === ROLES.DEPARTMENT_LEADER || userRole === ROLES.DEPARTMENT_LEADER) && (hasPermission(PERMISSIONS.MANAGE_SERVANTS) || hasPermission(PERMISSIONS.MANAGE_DEPARTMENT_SERVANTS))) {
      const departmentChildren = [];
      
      if (hasPermission(PERMISSIONS.MANAGE_SERVANTS) || hasPermission(PERMISSIONS.MANAGE_DEPARTMENT_SERVANTS)) {
        departmentChildren.push({
          id: 'servants',
          label: 'Serviteurs',
          href: '/serviteurs',
          icon: <UsersRound className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
        departmentChildren.push({
          id: 'interactions',
          label: 'Interactions',
          href: '/interactions',
          icon: <MessageCircle className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_ATTENDANCES)) {
        departmentChildren.push({
          id: 'attendance',
          label: 'Présences',
          href: '/presences',
          icon: <CalendarCheck className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SMS)) {
        departmentChildren.push({
          id: 'sms',
          label: 'SMS',
          href: '/sms',
          icon: <MessageSquare className="w-5 h-5" />
        });
      }

      if (departmentChildren.length > 0) {
        items.push({
          id: 'department-management',
          label: 'Gestion Département',
          icon: <Briefcase className="w-5 h-5" />,
          children: departmentChildren
        });
      }
    }

    // Build souls management menu (for ADN and admins)
    if (hasPermission(PERMISSIONS.MANAGE_SOULS) || hasPermission(PERMISSIONS.MANAGE_USERS)) {
      const soulsChildren = [];
      
      if (hasPermission(PERMISSIONS.MANAGE_SOULS)) {
        soulsChildren.push(
          {
            id: 'souls',
            label: 'Âmes',
            href: '/ames',
            icon: <Heart className="w-5 h-5" />
          },
          {
            id: 'undecided-souls',
            label: 'Âmes indécises',
            href: '/ames-indecises',
            icon: <AlertTriangle className="w-5 h-5" />
          }
        );
      }

      if (hasPermission(PERMISSIONS.MANAGE_USERS)) {
        soulsChildren.push({
          id: 'users',
          label: 'Utilisateurs',
          href: '/users',
          icon: <UserCog className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SERVANTS)) {
        soulsChildren.push({
          id: 'servants-admin',
          label: 'Serviteurs',
          href: '/serviteurs',
          icon: <UsersRound className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_FAMILIES)) {
        soulsChildren.push({
          id: 'service-families',
          label: 'Familles de service',
          href: '/familles',
          icon: <Users className="w-5 h-5" />
        });
      }

      if (soulsChildren.length > 0) {
        items.push({
          id: 'people-management',
          label: hasPermission(PERMISSIONS.MANAGE_USERS) ? 'Gestion des Personnes' : 'Gestion des Âmes & Suivi',
          icon: <Users className="w-5 h-5" />,
          children: soulsChildren
        });
      }
    }

    // Build tracking & interactions menu (for admins)
    if (hasPermission(PERMISSIONS.MANAGE_USERS) && hasPermission(PERMISSIONS.VIEW_STATS)) {
      items.push({
        id: 'tracking-interactions',
        label: 'Suivi & Interactions',
        icon: <MessageCircle className="w-5 h-5" />,
        children: [
          {
            id: 'interactions-admin',
            label: 'Interactions',
            href: '/interactions',
            icon: <MessageCircle className="w-5 h-5" />
          },
          {
            id: 'reminders-admin',
            label: 'Rappels',
            href: '/rappels-bergers',
            icon: <Bell className="w-5 h-5" />
          },
          {
            id: 'attendance-management',
            label: 'Gestion des présences',
            href: '/presences',
            icon: <CalendarCheck className="w-5 h-5" />
          },
          {
            id: 'attendance-view',
            label: 'Historique des présences',
            href: '/historique-presences',
            icon: <BarChart className="w-5 h-5" />
          },
          {
            id: 'progression',
            label: 'Progression spirituelle',
            href: '/spiritual-progression',
            icon: <TrendingUp className="w-5 h-5" />
          }
        ]
      });
    }

    // Build content & communication menu
    if (hasPermission(PERMISSIONS.MANAGE_AUDIO) || hasPermission(PERMISSIONS.MANAGE_SMS_TEMPLATES)) {
      const contentChildren = [];
      
      if (hasPermission(PERMISSIONS.MANAGE_AUDIO)) {
        contentChildren.push(
          {
            id: 'audio',
            label: 'Gestion audio',
            href: '/audio',
            icon: <Headphones className="w-5 h-5" />
          },
          {
            id: 'replay-teachings',
            label: 'Replay des enseignements',
            href: '/replay',
            icon: <Play className="w-5 h-5" />
          }
        );
      } else {
        // For non-admins, just show replay
        contentChildren.push({
          id: 'replay-audio',
          label: 'Replay Audio',
          href: '/replay',
          icon: <Headphones className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SMS_TEMPLATES)) {
        contentChildren.push(
          {
            id: 'sms-admin',
            label: 'Gestion SMS',
            href: '/sms',
            icon: <MessagesSquare className="w-5 h-5" />
          },
          {
            id: 'sms-templates',
            label: 'Modèles SMS',
            href: '/modeles-sms',
            icon: <MessageSquare className="w-5 h-5" />
          }
        );
      }

      if (contentChildren.length > 0) {
        items.push({
          id: 'content-communication',
          label: hasPermission(PERMISSIONS.MANAGE_AUDIO) ? 'Contenu & Communication' : 'Ressources & Rapports',
          icon: hasPermission(PERMISSIONS.MANAGE_AUDIO) ? <MessageSquare className="w-5 h-5" /> : <BarChart className="w-5 h-5" />,
          children: contentChildren
        });
      }
    }

    // Build tools & configuration menu
    if (hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS) || hasPermission(PERMISSIONS.MANAGE_SETTINGS) || hasPermission(PERMISSIONS.VIEW_STATS)) {
      const toolsChildren = [];
      
      if (hasPermission(PERMISSIONS.VIEW_STATS)) {
        toolsChildren.push(
          {
            id: 'soul-map',
            label: 'Carte des âmes',
            href: '/carte',
            icon: <Map className="w-5 h-5" />
          },
          {
            id: 'birthdays',
            label: 'Anniversaires',
            href: '/anniversaires',
            icon: <Cake className="w-5 h-5" />
          }
        );
      }

      if (hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS)) {
        toolsChildren.push({
          id: 'departments',
          label: 'Départements',
          href: '/departements',
          icon: <Briefcase className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SETTINGS)) {
        toolsChildren.push({
          id: 'settings',
          label: 'Paramètres',
          href: '/parametres',
          icon: <Settings className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_ROLES_PERMISSIONS)) {
        toolsChildren.push({
          id: 'roles-permissions',
          label: 'Rôles et Permissions',
          href: '/parametres',
          icon: <Shield className="w-5 h-5" />
        });
      }

      if (toolsChildren.length > 0) {
        items.push({
          id: 'tools-configuration',
          label: 'Outils & Configuration',
          icon: <Settings className="w-5 h-5" />,
          children: toolsChildren
        });
      }
    }

    return items;
  };

  return (
    <AccordionMenu items={getNavigationItems()} onItemClick={onItemClick} />
  );
}