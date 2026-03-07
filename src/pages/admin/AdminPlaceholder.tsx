import { Construction } from 'lucide-react';

interface AdminPlaceholderProps {
  title: string;
}

export default function AdminPlaceholder({ title }: AdminPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
        <Construction className="w-7 h-7 text-neutral-400" />
      </div>
      <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">{title}</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
        Cette section est en cours de développement et sera disponible prochainement.
      </p>
    </div>
  );
}
