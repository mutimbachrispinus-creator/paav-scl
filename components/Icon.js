import { lazy, Suspense } from 'react';

/**
 * A lightweight Icon loader that dynamically imports Lucide icons.
 * This helps reduce the initial bundle size by not loading all icons at once.
 */
export default function Icon({ name, size = 20, className = "" }) {
  const DynamicIcon = lazy(() => 
    import('lucide-react').then(m => {
      const IconComponent = m[name];
      if (!IconComponent) {
        console.warn(`Icon "${name}" not found in lucide-react`);
        return { default: () => null };
      }
      return { default: IconComponent };
    })
  );

  return (
    <Suspense fallback={<div style={{ width: size, height: size }} className="animate-pulse bg-slate-200 rounded-sm" />}>
      <DynamicIcon size={size} className={className} />
    </Suspense>
  );
}
