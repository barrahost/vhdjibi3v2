import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserSelect from '../components/auth/UserSelect';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/ui/Logo';
import { DEFAULT_PASSWORDS } from '../constants/auth';
import { Eye, EyeOff, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { ChangelogModal } from '../components/ui/ChangelogModal';
import { UserType } from '../types/user.types';


export default function Login() {
  const [password, setPassword] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [userType, setUserType] = useState<UserType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(selectedPhone, password);
      toast.success('Connexion réussie');
      navigate('/');
    } catch (error: any) {
      toast.error('Numéro de téléphone ou mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00665C]/10 to-[#F2B636]/10">
      <div className="flex min-h-screen flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="flex flex-col items-center">
            <Logo className="h-20 w-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 text-center">
              Vases d'Honneur Assemblée Grâce Confondante
            </h1>
          </div>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white py-10 px-6 sm:px-12 shadow-2xl rounded-xl border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Sélectionner un utilisateur
                </label>
                <UserSelect
                  value={selectedPhone}
                  onChange={(phone, type) => {
                    setSelectedPhone(phone);
                    setUserType(type);
                  }}
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    placeholder="Saisissez votre mot de passe"
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#00665C] focus:border-[#00665C] text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!selectedPhone || !password}
                  className={`w-full flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-lg text-base font-medium text-white transition-all duration-200 ${
                    !selectedPhone || !password
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C] hover:shadow-xl'
                  }`}
                >
                  Se connecter
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Vases d'Honneur Assemblée Grâce Confondante. Tous droits réservés.</p>
          <button
            onClick={() => setIsChangelogOpen(true)}
            className="mt-1 text-xs text-gray-400 hover:text-[#00665C] transition-colors flex items-center justify-center mx-auto"
          >
            <FileText className="w-3 h-3 mr-1" />
           Version 1.7.40
          </button>
          <div className="mt-2 space-x-4">
            <a href="/legal-notice" className="text-[#00665C] hover:text-[#00665C]/80">
              Mentions légales
            </a>
            <a href="/privacy-policy" className="text-[#00665C] hover:text-[#00665C]/80">
              Politique de confidentialité
            </a>
          </div>
        </div>
      </div>
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
    </div>
  );
}
