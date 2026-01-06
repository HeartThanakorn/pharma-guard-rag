/**
 * SourceCitation Component
 * Displays source document name and page number as a styled badge
 */

import type { Source } from '../types';

interface SourceCitationProps {
  source: Source;
}

const SourceCitation = ({ source }: SourceCitationProps) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-1">
      <span className="mr-1">📄</span>
      Source: {source.document}, Page {source.page}
    </span>
  );
};

export default SourceCitation;
