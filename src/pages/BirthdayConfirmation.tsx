import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Cake, Home, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BirthdayData {
  fullName: string;
  birthMonth: string;
  birthDay: string;
}

const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function BirthdayConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [birthdayData, setBirthdayData] = useState<BirthdayData | null>(null);

  useEffect(() => {
    // Récupérer les données depuis la navigation state
    const data = location.state as BirthdayData | undefined;
    
    if (data) {
      setBirthdayData(data);
      // Nettoyer le state après récupération pour éviter qu'il persiste
      window.history.replaceState({}, document.title);
    } else {
      // Si pas de données, rediriger vers le formulaire
      navigate('/anniversaires/ajouter');
    }
  }, [location, navigate]);

  if (!birthdayData) {
    return null;
  }

  const monthName = monthNames[parseInt(birthdayData.birthMonth) - 1];
  const firstName = birthdayData.fullName.split(' ')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative p-4 bg-primary/10 rounded-full">
              <CheckCircle className="w-16 h-16 text-primary" />
            </div>
          </div>
        </div>

        {/* Main Confirmation Card */}
        <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Merci {firstName} !
            </h1>
            <p className="text-lg text-muted-foreground">
              Votre anniversaire a été enregistré avec succès
            </p>
          </div>

          {/* Birthday Info Display */}
          <div className="bg-primary/5 rounded-lg p-6 mb-8 border border-primary/20">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Cake className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Date enregistrée
              </h2>
            </div>
            <p className="text-center text-2xl font-bold text-primary">
              {parseInt(birthdayData.birthDay)} {monthName}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-accent/10 rounded-lg p-4 mb-8 border border-accent/20">
            <p className="text-sm text-muted-foreground text-center">
              🎉 Nous vous enverrons un message de félicitations le jour de votre anniversaire !
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/anniversaires/ajouter')}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium shadow-sm"
            >
              <UserPlus className="w-5 h-5" />
              Ajouter un autre
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md"
            >
              <Home className="w-5 h-5" />
              Retour à l'accueil
            </button>
          </div>

          {/* Share Section */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Partagez ce lien avec vos amis !
            </p>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
              <input
                type="text"
                readOnly
                value={window.location.origin + '/anniversaires/ajouter'}
                className="flex-1 bg-transparent text-sm text-foreground outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/anniversaires/ajouter');
                }}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Copier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
