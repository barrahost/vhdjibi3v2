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
    // Use active role if available, otherwise fall back to userRole
    const currentRole = activeRole || userRole;
    
    console.log('🔍 [Navigation] Current role for menu generation:', {
      currentRole,
      userRole,
      activeRole,
      additionalMenus
    });
    
    // Navigation pour les bergers (selon l'image fournie)
    if (currentRole === ROLES.SHEPHERD) {
      const items: MenuItem[] = [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          icon: <LayoutDashboard className="w-5 h-5" />,
          href: '/'
        },
        {
          id: 'monitoring',
          label: 'Suivi',
          icon: <FileText className="w-5 h-5" />,
          children: [
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
            },
            {
              id: 'attendance',
              label: 'Présences',
              href: '/presences',
              icon: <CalendarCheck className="w-5 h-5" />
            },
            {
              id: 'reminders',
              label: 'Rappels',
              href: '/rappels',
              icon: <Bell className="w-5 h-5" />
            },
            {
              id: 'sms',
              label: 'SMS',
              href: '/sms',
              icon: <MessageSquare className="w-5 h-5" />
            }
          ]
        },
        {
          id: 'replay-audio',
          label: 'Replay Audio',
          icon: <Headphones className="w-5 h-5" />,
          href: '/replay'
        }
      ];

      // Ajouter les menus additionnels basés sur les permissions
      if (hasPermission(PERMISSIONS.MANAGE_SOULS)) {
        items.push({
          id: 'souls-management',
          label: 'Gestion des Âmes',
          icon: <Heart className="w-5 h-5" />,
          href: '/ames'
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_USERS)) {
        items.push({
          id: 'users-management',
          label: 'Gestion des Utilisateurs',
          icon: <UserCog className="w-5 h-5" />,
          href: '/users'
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_AUDIO)) {
        items.push({
          id: 'audio-management',
          label: 'Gestion des Audios',
          icon: <Play className="w-5 h-5" />,
          href: '/audio'
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS)) {
        items.push({
          id: 'departments-management',
          label: 'Gestion des Départements',
          icon: <Briefcase className="w-5 h-5" />,
          href: '/departements'
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_FAMILIES)) {
        items.push({
          id: 'families-management',
          label: 'Gestion des Familles de Service',
          icon: <Users className="w-5 h-5" />,
          href: '/familles'
        });
      }

      if (hasPermission(PERMISSIONS.VIEW_STATS)) {
        items.push({
          id: 'stats',
          label: 'Statistiques',
          icon: <BarChart className="w-5 h-5" />,
          href: '/spiritual-progression'
        });
      }

      if (hasPermission(PERMISSIONS.EXPORT_DATA)) {
        items.push({
          id: 'export',
          label: 'Export de Données',
          icon: <FileText className="w-5 h-5" />,
          href: '/ames'
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SETTINGS)) {
        items.push({
          id: 'settings',
          label: 'Paramètres',
          icon: <Settings className="w-5 h-5" />,
          href: '/parametres'
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_BACKUP)) {
        items.push({
          id: 'backup',
          label: 'Sauvegarde et Restauration',
          icon: <Settings className="w-5 h-5" />,
          href: '/parametres'
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SMS_TEMPLATES)) {
        items.push({
          id: 'sms-templates',
          label: 'Modèles SMS',
          icon: <MessageSquare className="w-5 h-5" />,
          href: '/modeles-sms'
        });
      }

      // Add servants menu for department leaders
      if (hasPermission(PERMISSIONS.MANAGE_SERVANTS)) {
        items.push({
          id: 'servants',
          label: 'Serviteurs',
          icon: <UsersRound className="w-5 h-5" />,
          href: '/serviteurs'
        });
      }
      
      return items;
    }

    // Navigation pour les responsables de département
    if (currentRole === ROLES.DEPARTMENT_LEADER) {
      const items: MenuItem[] = [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          icon: <LayoutDashboard className="w-5 h-5" />,
          href: '/'
        },
        {
          id: 'department-management',
          label: 'Gestion Département',
          icon: <Briefcase className="w-5 h-5" />,
          children: [
            {
              id: 'servants',
              label: 'Serviteurs',
              href: '/serviteurs',
              icon: <UsersRound className="w-5 h-5" />
            },
            {
              id: 'interactions',
              label: 'Interactions',
              href: '/interactions',
              icon: <MessageCircle className="w-5 h-5" />
            },
            {
              id: 'attendance',
              label: 'Présences',
              href: '/presences',
              icon: <CalendarCheck className="w-5 h-5" />
            },
            {
              id: 'sms',
              label: 'SMS',
              href: '/sms',
              icon: <MessageSquare className="w-5 h-5" />
            }
          ]
        }
      ];

      return items;
    }

    // Navigation pour ADN (Assistant de Niveau)
    if (currentRole === ROLES.ADN) {
      const items: MenuItem[] = [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          icon: <LayoutDashboard className="w-5 h-5" />,
          href: '/'
        },
        {
          id: 'souls-management',
          label: 'Gestion des Âmes & Suivi',
          icon: <Users className="w-5 h-5" />,
          children: [
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
            },
            {
              id: 'interactions',
              label: 'Interactions',
              href: '/interactions',
              icon: <MessageCircle className="w-5 h-5" />
            },
            {
              id: 'sms',
              label: 'SMS',
              href: '/sms',
              icon: <MessageSquare className="w-5 h-5" />
            }
          ]
        },
        {
          id: 'resources-reports',
          label: 'Ressources & Rapports',
          icon: <BarChart className="w-5 h-5" />,
          children: [
            {
              id: 'replay-audio',
              label: 'Replay Audio',
              href: '/replay',
              icon: <Headphones className="w-5 h-5" />
            }
          ]
        }
      ];

      return items;
    }

    // Navigation pour les administrateurs et super administrateurs
    if ([ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(currentRole as any)) {
      const items: MenuItem[] = [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          icon: <LayoutDashboard className="w-5 h-5" />,
          href: '/'
        }
      ];

      // Gestion des Personnes
      items.push({
        id: 'people-management',
        label: 'Gestion des Personnes',
        icon: <Users className="w-5 h-5" />,
        children: [
          {
            id: 'users',
            label: 'Utilisateurs',
            href: '/users',
            icon: <UserCog className="w-5 h-5" />
          },
          {
            id: 'souls',
            label: 'Âmes',
            href: '/ames',
            icon: <Heart className="w-5 h-5" />
          },
          ...(hasPermission(PERMISSIONS.MANAGE_SERVANTS) ? [{
            id: 'servants',
            label: 'Serviteurs',
            href: '/serviteurs',
            icon: <UsersRound className="w-5 h-5" />
          }] : []),
          {
            id: 'service-families',
            label: 'Familles de service',
            href: '/familles',
            icon: <Users className="w-5 h-5" />
          },
          {
            id: 'undecided-souls',
            label: 'Âmes indécises',
            href: '/ames-indecises',
            icon: <AlertTriangle className="w-5 h-5" />
          }
        ]
      });

      // Suivi & Interactions
      items.push({
        id: 'tracking-interactions',
        label: 'Suivi & Interactions',
        icon: <MessageCircle className="w-5 h-5" />,
        children: [
          {
            id: 'interactions',
            label: 'Interactions',
            href: '/interactions',
            icon: <MessageCircle className="w-5 h-5" />
          },
          {
            id: 'reminders',
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

      // Contenu & Communication
      items.push({
        id: 'content-communication',
        label: 'Contenu & Communication',
        icon: <MessageSquare className="w-5 h-5" />,
        children: [
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
          },
          {
            id: 'sms',
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
        ]
      });

      // Outils & Configuration
      const toolsConfigurationChildren = [
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
        },
        {
          id: 'departments',
          label: 'Départements',
          href: '/departements',
          icon: <Briefcase className="w-5 h-5" />
        }
      ];
      
      // Ajouter le menu Paramètres seulement pour le super admin
      if (currentRole === ROLES.SUPER_ADMIN) {
        toolsConfigurationChildren.push({
          id: 'settings',
          label: 'Paramètres',
          href: '/parametres',
          icon: <Settings className="w-5 h-5" />
        });
        toolsConfigurationChildren.push({
          id: 'roles-permissions',
          label: 'Rôles et Permissions',
          href: '/parametres',
          icon: <Shield className="w-5 h-5" />
        });
      }
      
      items.push({
        id: 'tools-configuration',
        label: 'Outils & Configuration',
        icon: <Settings className="w-5 h-5" />,
        children: toolsConfigurationChildren
      });

      return items;
    }

    return [];
  };

  return (
    <AccordionMenu items={getNavigationItems()} onItemClick={onItemClick} />
  );
}