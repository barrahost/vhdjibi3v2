import { useState } from 'react';
import { Servant } from '../../types/servant.types';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface BulkDeleteServantModalProps {
  isOpen: boolean;
  onClose: () => void;
  servants: Servant[];
  onConfirm: (servantIds: string[], deactivateHeads: boolean) => Promise<void>;
}

export default function BulkDeleteServantModal({
  isOpen,
  onClose,
  servants,
  onConfirm
}: BulkDeleteServantModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deactivateHeads, setDeactivateHeads] = useState(true);

  const departmentHeads = servants.filter(s => s.isHead);
  const regularServants = servants.filter(s => !s.isHead);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(servants.map(s => s.id), deactivateHeads);
      onClose();
    } catch (error) {
      console.error('Error in bulk delete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl bg-white dark:bg-gray-900 shadow-xl border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmer la suppression
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de supprimer {servants.length} serviteur(s).
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {departmentHeads.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Responsables de département ({departmentHeads.length})
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Les responsables de département ne peuvent pas être supprimés directement.
                Ils seront désactivés au lieu d'être supprimés.
              </p>
              <ul className="space-y-1 text-sm">
                {departmentHeads.map(servant => (
                  <li key={servant.id} className="text-foreground">
                    • {servant.fullName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {regularServants.length > 0 && (
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-2">
                Serviteurs à supprimer ({regularServants.length})
              </h4>
              <div className="max-h-48 overflow-y-auto">
                <ul className="space-y-1 text-sm">
                  {regularServants.map(servant => (
                    <li key={servant.id} className="text-muted-foreground">
                      • {servant.fullName} {servant.isShepherd && '(Berger)'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Cette action est irréversible pour les serviteurs supprimés.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Confirmer la suppression'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
