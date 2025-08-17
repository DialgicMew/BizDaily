import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Link,
  Divider,
  styled
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Styled components for notebook theme
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  borderBottom: '1px solid #e0e0e0',
}));

const BackButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#1976d2',
  color: 'white',
  borderRadius: '8px',
  padding: '8px 24px',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': {
    backgroundColor: '#1565c0',
  },
}));

const NotebookPage = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fefefe',
      backgroundImage: `
      linear-gradient(90deg, #1565c0 40px, #1565c0 42px, transparent 42px),
      repeating-linear-gradient(0deg, transparent, transparent 29px, #e8f4fd 29px, #e8f4fd 31px)
    `,
  backgroundSize: '100% 30px',
  borderRadius: '0',
  boxShadow: '4px 4px 12px rgba(0,0,0,0.15)',
  border: '1px solid #ccc',
  borderLeft: '4px solid #1565c0',
  minHeight: 'calc(100vh - 100px)',
  padding: '40px 60px 40px 80px', // Left margin for red line
  marginBottom: '20px',
  position: 'relative',
  // Add holes at the top like a real notebook
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '20px',
    left: '15px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    boxShadow: '0 20px 0 #f5f5f5, 0 20px 0 1px #ddd, 0 40px 0 #f5f5f5, 0 40px 0 1px #ddd',
  },
  // Add subtle paper texture
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 20% 30%, rgba(0,0,0,0.01) 1px, transparent 1px),
      radial-gradient(circle at 80% 70%, rgba(0,0,0,0.01) 1px, transparent 1px),
      radial-gradient(circle at 40% 90%, rgba(0,0,0,0.01) 1px, transparent 1px)
    `,
    backgroundSize: '100px 100px, 150px 150px, 200px 200px',
    pointerEvents: 'none',
  }
}));

const NotebookTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '2.5rem',
  color: '#000000',
  marginBottom: '20px',
  textAlign: 'center',
  textDecorationColor: '#000000',
}));

const CompanySection = styled(Box)(({ theme }) => ({
  marginBottom: '50px',
  borderBottom: '1px solid #ddd',
  paddingBottom: '30px',
  position: 'relative',
  '&:last-child': {
    borderBottom: 'none',
  },
  // Add margin notes area
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '-60px',
    top: '0',
    bottom: '0',
    width: '40px',
    borderRight: '1px solid #e0e0e0',
    backgroundColor: 'rgba(255, 0, 0, 0.02)',
  }
}));

const CompanyTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.8rem',
  color: '#000000',
  marginBottom: '15px',
  position: 'relative',
  // Add a subtle highlight/marker effect
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '2px',
    left: '0',
    right: '0',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 0, 0.2)',
    zIndex: -1,
  }
}));

const QuestionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.3rem',
  color: '#000000',
  marginBottom: '12px',
  marginTop: '24px',
  position: 'relative',
  // Add bullet point style
  '&::before': {
    content: '"•"',
    position: 'absolute',
    left: '-20px',
    color: '#666',
    fontWeight: 'bold',
  }
}));

const AnswerText = styled(Box)(({ theme }) => ({
  fontSize: '1rem',
  color: '#000000',
  lineHeight: '1.6',
  marginBottom: '32px',
  '& a': {
    color: '#000000',
    textDecoration: 'underline',
    fontWeight: 500,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& p': {
    margin: '0 0 12px 0',
  },
  '& ul': {
    margin: '8px 0',
    paddingLeft: '20px',
  },
  '& li': {
    marginBottom: '4px',
  },
}));

const DateHeader = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  color: '#000000',
  textAlign: 'right',
  marginBottom: '10px',
  fontStyle: 'italic',
}));

// Aurora Loader Styles
const AuroraLoader = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(45deg, #000428, #004e92)',
  overflow: 'hidden',
  zIndex: 9999,
  animation: 'pulseBackground 4s ease-in-out infinite',
  
  '@keyframes pulseBackground': {
    '0%, 100%': {
      background: 'linear-gradient(45deg, #000428, #004e92)',
    },
    '25%': {
      background: 'linear-gradient(45deg, #1a1a2e, #16213e)',
    },
    '50%': {
      background: 'linear-gradient(45deg, #0f3460, #005aa7)',
    },
    '75%': {
      background: 'linear-gradient(45deg, #2c1810, #8b4513)',
    },
  },
}));

const AuroraWave = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '200%',
  height: '200%',
  top: '-50%',
  left: '-50%',
  background: `
    radial-gradient(circle at 20% 30%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 70%, rgba(255, 200, 124, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(120, 255, 124, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 10% 90%, rgba(124, 200, 255, 0.3) 0%, transparent 50%)
  `,
  animation: 'wave 8s ease-in-out infinite',
  
  '@keyframes wave': {
    '0%, 100%': {
      transform: 'rotate(0deg) scale(1)',
      filter: 'hue-rotate(0deg)',
    },
    '25%': {
      transform: 'rotate(90deg) scale(1.1)',
      filter: 'hue-rotate(90deg)',
    },
    '50%': {
      transform: 'rotate(180deg) scale(0.9)',
      filter: 'hue-rotate(180deg)',
    },
    '75%': {
      transform: 'rotate(270deg) scale(1.05)',
      filter: 'hue-rotate(270deg)',
    },
  },
}));

const AuroraParticle = styled(Box)<{ delay: number; duration: number }>(({ delay, duration }) => ({
  position: 'absolute',
  width: '4px',
  height: '4px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.8)',
  animation: `particle ${duration}s linear infinite`,
  animationDelay: `${delay}s`,
  
  '@keyframes particle': {
    '0%': {
      transform: 'translateY(100vh) translateX(0px)',
      opacity: 0,
    },
    '10%': {
      opacity: 1,
    },
    '90%': {
      opacity: 1,
    },
    '100%': {
      transform: 'translateY(-100px) translateX(100px)',
      opacity: 0,
    },
  },
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'white',
  fontSize: '1.5rem',
  fontWeight: 600,
  textAlign: 'center',
  zIndex: 10,
  animation: 'textGlow 2s ease-in-out infinite alternate',
  fontFamily: '"Inter", "Roboto", sans-serif',
  
  '@keyframes textGlow': {
    '0%': {
      textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
      opacity: 0.8,
    },
    '100%': {
      textShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 40px rgba(120, 119, 198, 0.6)',
      opacity: 1,
    },
  },
}));

const FlashOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(255, 255, 255, 0.1)',
  animation: 'flash 3s ease-in-out infinite',
  
  '@keyframes flash': {
    '0%, 90%, 100%': {
      opacity: 0,
    },
    '5%': {
      opacity: 0.3,
    },
    '10%': {
      opacity: 0,
    },
  },
}));

// API types for daily brief
interface DailyBriefCompany {
  id: number;
  funding_uuid: number;
  company_name: string;
  generated_on: string;
  valuation: string;
  funding_round: string;
  use_of_funds: string;
  why_problem: string;
  what_solution: string;
  how_execution: string;
  customer_segment: string;
  founders_team_dna: string;
  traction_snapshot: string;
  competitive_edge: string;
  pivots: string;
  key_risks_open_questions: string;
  sources: string;
  created_at: string;
}

// API service for daily brief
const fetchDailyBrief = async (): Promise<DailyBriefCompany[]> => {
  const response = await fetch('http://localhost:8000/api/brief/daily-brief?generate_if_missing=true', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Format content with proper handling of links, newlines, and tabs
const formatContent = (content: string): React.ReactNode => {
  if (!content || content === 'N/A') return 'N/A';
  
  // Handle newlines and tabs
  let formattedContent = content
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '')
    .replace(/\n/g, '\n')
    .trim();
  
  // Split by lines and process each
  const lines = formattedContent.split('\n').filter(line => line.trim());
  
  return (
    <Box>
      {lines.map((line, index) => {
        // Check if line starts with bullet point
        const isBulletPoint = line.trim().startsWith('-');
        const cleanLine = isBulletPoint ? line.trim().substring(1).trim() : line.trim();
        
        // Process links in the line
        const processedLine = processLinksInText(cleanLine);
        
        if (isBulletPoint) {
          return (
            <Box key={index} component="li" sx={{ mb: 1, listStyleType: 'disc', ml: 2 }}>
              {processedLine}
            </Box>
          );
        } else {
          return (
            <Box key={index} component="p" sx={{ mb: 1 }}>
              {processedLine}
            </Box>
          );
        }
      })}
    </Box>
  );
};

// Process links and bold text
const processLinksInText = (text: string): React.ReactNode => {
  // Regex to match markdown-style links [text](url), plain URLs, and bold text **text**
  const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s)]+|\*\*([^*]+)\*\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = markdownRegex.exec(text)) !== null) {
    // Add text before the current match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Handle different types of matches
    if (match[1] && match[2]) {
      // Markdown-style link [text](url)
      parts.push(
        <Link
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: '#000000',
            textDecoration: 'underline',
          }}
        >
          {match[1]}
        </Link>
      );
    } else if (match[3]) {
      // Bold text **text**
      parts.push(
        <Box
          key={match.index}
          component="span"
          sx={{ fontWeight: 'bold' }}
        >
          {match[3]}
        </Box>
      );
    } else {
      // Plain URL
      parts.push(
        <Link
          key={match.index}
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: '#000000',
            textDecoration: 'underline',
          }}
        >
          {match[0]}
        </Link>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 1 ? <>{parts}</> : parts[0] || text;
};

// Format field names as questions (using exact same questions as FundingDetail page)
const formatFieldQuestion = (key: string): string => {
  const questionMap: Record<string, string> = {
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
    sources: 'What are the information sources?'
  };
  
  return questionMap[key] || key;
};

const DailyBrief: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<DailyBriefCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDailyBrief = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch daily brief data
        const dailyBriefData = await fetchDailyBrief();
        setCompanies(dailyBriefData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch daily brief');
      } finally {
        setLoading(false);
      }
    };

    loadDailyBrief();
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <AuroraLoader>
        <AuroraWave />
        <AuroraWave sx={{ animationDelay: '-2s', animationDirection: 'reverse' }} />
        <AuroraWave sx={{ animationDelay: '-4s', transform: 'scale(0.8)' }} />
        
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <AuroraParticle
            key={i}
            delay={i * 0.5}
            duration={3 + Math.random() * 2}
            sx={{
              left: `${Math.random() * 100}%`,
              background: `hsl(${Math.random() * 360}, 70%, 60%)`,
            }}
          />
        ))}
        
        <FlashOverlay />
        
        <LoadingText>
          Compiling today's funding stories...
          <br />
          <Box component="span" sx={{ fontSize: '1rem', opacity: 0.7, mt: 1, display: 'block' }}>
            ✨ Analyzing market trends and company insights
          </Box>
        </LoadingText>
      </AuroraLoader>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <StyledAppBar position="static">
          <Toolbar>
            <BackButton startIcon={<ArrowBackIcon />} onClick={handleBack}>
              Back to Home Page
            </BackButton>
          </Toolbar>
        </StyledAppBar>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography color="error">Error: {error}</Typography>
        </Box>
      </Box>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#ecf0f1'
    }}>
      {/* Top Navbar */}
      <StyledAppBar position="static">
        <Toolbar>
          <BackButton startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back to Home Page
          </BackButton>
        </Toolbar>
      </StyledAppBar>
      
      {/* Notebook Content */}
      <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
        {/* Spiral binding effect */}
        <Box sx={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '10px',
          background: 'repeating-linear-gradient(90deg, #ccc 0px, #ccc 20px, transparent 20px, transparent 40px)',
          borderRadius: '5px',
          zIndex: 1,
        }} />
        
        <NotebookPage>
          <DateHeader>{today}</DateHeader>
          <NotebookTitle>Daily Funding Brief</NotebookTitle>
          
          {companies.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{ fontSize: '1.2rem', color: '#000000' }}>
                No funding announcements today... yet! 📰
              </Typography>
            </Box>
          ) : (
            <>
              <Typography sx={{ 
                fontSize: '1.1rem', 
                color: '#000000', 
                mb: 4, 
                textAlign: 'center' 
              }}>
                {companies.length} companies received funding today 🚀
              </Typography>
              
              {companies.map((company, index) => (
                <CompanySection key={`${company.company_name}-${index}`}>
                  <CompanyTitle>
                    {index + 1}. {company.company_name}
                  </CompanyTitle>
                  
                  {/* Company Details in Q&A Format */}
                  {(() => {
                    // Define custom order for questions (only these will be displayed)
                    const customOrder = [
                      'why_problem',
                      'what_solution',
                      'how_execution',
                      'customer_segment',
                      'founders_team_dna',
                      'traction_snapshot',
                      'competitive_edge',
                      'sources'
                    ];
                    
                    // Filter and sort entries based on custom order
                    return Object.entries(company)
                      .filter(([key]) => customOrder.includes(key.toLowerCase()))
                      .filter(([, value]) => {
                        if (!value) return false;
                        if (value === 'N/A' || value === 'n/a') return false;
                        if (typeof value !== 'string') return false;
                        return value.trim().length > 0;
                      })
                      .sort(([keyA], [keyB]) => {
                        const indexA = customOrder.indexOf(keyA.toLowerCase());
                        const indexB = customOrder.indexOf(keyB.toLowerCase());
                        return indexA - indexB;
                      })
                      .map(([key, value]) => (
                        <React.Fragment key={key}>
                          <QuestionTitle>{formatFieldQuestion(key)}</QuestionTitle>
                          <AnswerText>{formatContent(value as string)}</AnswerText>
                        </React.Fragment>
                      ));
                  })()}
                </CompanySection>
              ))}
            </>
          )}
        </NotebookPage>
      </Box>
    </Box>
  );
};

export default DailyBrief; 