import React from 'react';
import { Box, Link } from '@mui/material';

const QUESTION_MAP: Record<string, string> = {
  why_problem: 'What problem is the company solving?',
  what_solution: 'What solution does the company offer?',
  how_execution: 'How does the company execute its strategy?',
  customer_segment: 'Who are the target customers?',
  founders_team_dna: 'Who are the founders and what is their background?',
  traction_snapshot: 'What traction has the company achieved?',
  valuation: 'What is the company valuation?',
  funding_round: 'What are the funding round details?',
  use_of_funds: 'How will the funding be used?',
  key_risks_open_questions: 'What are the key risks and open questions?',
  competitive_edge: 'What gives the company a competitive advantage?',
  pivots: 'Has the company made any strategic pivots?',
  sources: 'What are the information sources?',
};

export const formatFieldQuestion = (key: string): string =>
  QUESTION_MAP[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

/** Turns markdown-style links `[text](url)`, plain URLs, and `**bold**` into React nodes. */
export const processLinksInText = (text: string): React.ReactNode => {
  const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s)]+|\*\*([^*]+)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markdownRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      parts.push(
        <Link
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          {match[1]}
        </Link>
      );
    } else if (match[3]) {
      parts.push(
        <Box key={match.index} component="span" sx={{ fontWeight: 700 }}>
          {match[3]}
        </Box>
      );
    } else {
      parts.push(
        <Link
          key={match.index}
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          {match[0]}
        </Link>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 1 ? <>{parts}</> : parts[0] || text;
};

/** Renders LLM-generated section content as paragraphs/bullets, resolving links and bold text. */
export const formatContent = (content: string): React.ReactNode => {
  if (!content || content === 'N/A') return 'N/A';

  const formattedContent = content.replace(/\\n/g, '\n').replace(/\\t/g, '').trim();
  const lines = formattedContent.split('\n').filter((line) => line.trim());

  return (
    <Box>
      {lines.map((line, index) => {
        const isBulletPoint = line.trim().startsWith('-');
        const cleanLine = isBulletPoint ? line.trim().substring(1).trim() : line.trim();
        const processedLine = processLinksInText(cleanLine);

        return isBulletPoint ? (
          <Box key={index} component="li" sx={{ mb: 1, listStyleType: 'disc', ml: 2 }}>
            {processedLine}
          </Box>
        ) : (
          <Box key={index} component="p" sx={{ mb: 1 }}>
            {processedLine}
          </Box>
        );
      })}
    </Box>
  );
};
