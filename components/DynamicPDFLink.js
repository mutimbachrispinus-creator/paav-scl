import dynamic from 'next/dynamic';

/**
 * A client-side only PDF Download Link.
 * This component dynamically imports @react-pdf/renderer to avoid
 * including it in the server-side bundle.
 */
const DynamicPDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(m => m.PDFDownloadLink),
  { ssr: false }
);

export default function DynamicPDFLink({ document, fileName, children, className }) {
  return (
    <DynamicPDFDownloadLink 
      document={document} 
      fileName={fileName}
      className={className}
    >
      {children}
    </DynamicPDFDownloadLink>
  );
}
