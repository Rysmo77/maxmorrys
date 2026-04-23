import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { localizeAuthError } from '../../lib/auth-errors';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      addToast('success', 'Email de réinitialisation envoyé.');
    } catch (error: unknown) {
      addToast('error', localizeAuthError(error));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-8">
            <span className="font-black text-2xl tracking-tight text-neutral-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              MAX-MORRYS
            </span>
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">Mot de passe oublié</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {sent ? 'Consulte ta boîte email' : 'Entre ton email pour réinitialiser ton mot de passe'}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mx-auto mb-5">
                <Mail className="w-8 h-8 text-success-600 dark:text-success-400" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                Un email avec un lien de réinitialisation a été envoyé à{' '}
                <strong className="text-neutral-900 dark:text-white">{email}</strong>.
              </p>
              <Link to="/connexion">
                <Button variant="outline" className="w-full">Retour à la connexion</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                icon={<Mail className="w-4 h-4" />}
              />
              <Button type="submit" className="w-full" loading={loading}>Envoyer le lien</Button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/connexion" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
