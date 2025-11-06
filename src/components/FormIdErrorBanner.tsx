import { AlertCircle } from 'lucide-react';

interface FormIdErrorBannerProps {
  show: boolean;
}

export default function FormIdErrorBanner({ show }: FormIdErrorBannerProps) {
  if (!show) return null;

  return (
    <div className="bg-red-50 border-b-2 border-red-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Error: No Form ID provided
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Cannot save quote. This page must be accessed with a valid Form ID in the URL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
