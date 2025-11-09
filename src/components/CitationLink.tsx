import { citations } from '../config/citations';

interface CitationLinkProps {
  citationKey: keyof typeof citations;
  showYear?: boolean;
  className?: string;
  showClaim?: boolean;
}

export function CitationLink({
  citationKey,
  showYear = false,
  className = "text-blue-600 underline hover:text-blue-800",
  showClaim = false
}: CitationLinkProps) {
  const citation = citations[citationKey];

  if (!citation) {
    console.error(`Citation key "${citationKey}" not found`);
    return null;
  }

  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={`Source: ${citation.source} - ${citation.claim}`}
    >
      {showClaim ? citation.claim : citation.source} {showYear && `(${citation.year})`}
    </a>
  );
}