import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  styled,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { API_ENDPOINTS } from '../config/constants';
import { AppHeader } from '../components/AppHeader';
import { formatContent, formatFieldQuestion } from '../utils/textFormat';

// Styled components for notebook theme
const DateToggleRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '8px',
  backgroundColor: '#eef1f5',
  padding: '4px',
  [theme.breakpoints.down('md')]: {
    flexShrink: 0,
    fontSize: '0.8rem',
  },
}));

const DateLabel = styled(Typography)(({ theme }) => ({
  flex: '0 0 0',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  color: theme.palette.text.primary,
  [theme.breakpoints.down('md')]: {
    fontSize: '0.8rem',
    padding: '0 8px',
  },
}));

const BackButton = styled(Button)(({ theme }) => ({
  padding: '8px 24px',
  fontWeight: 600,
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const NotebookPage = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fefefe',
  backgroundImage: `
    linear-gradient(90deg, ${theme.palette.primary.dark} 40px, ${theme.palette.primary.dark} 42px, transparent 42px),
    repeating-linear-gradient(0deg, transparent, transparent 29px, #e8f0fe 29px, #e8f0fe 31px)
  `,
  backgroundSize: '100% 30px',
  borderRadius: '4px',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.1)',
  border: '1px solid #e0e0e0',
  borderLeft: `4px solid ${theme.palette.primary.dark}`,
  minHeight: 'calc(100vh - 100px)',
  padding: '40px 60px 40px 80px',
  marginBottom: '20px',
  position: 'relative',
  [theme.breakpoints.down('md')]: {
    padding: '20px 20px 20px 40px',
    marginBottom: '10px',
    margin: '0 -8px',
    backgroundImage: `
      linear-gradient(90deg, ${theme.palette.primary.dark} 20px, ${theme.palette.primary.dark} 22px, transparent 22px),
      repeating-linear-gradient(0deg, transparent, transparent 24px, #e8f0fe 24px, #e8f0fe 26px)
    `,
    backgroundSize: '100% 25px',
  },
}));

const NotebookTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '2.5rem',
  color: theme.palette.text.primary,
  marginBottom: '20px',
  textAlign: 'center',
  [theme.breakpoints.down('md')]: {
    fontSize: '1.8rem',
    marginBottom: '15px',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.5rem',
    marginBottom: '12px',
  },
}));

const CompanySection = styled(Box)(({ theme }) => ({
  marginBottom: '50px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: '30px',
  '&:last-child': {
    borderBottom: 'none',
  },
  [theme.breakpoints.down('md')]: {
    marginBottom: '30px',
    paddingBottom: '20px',
  },
}));

const CompanyTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.8rem',
  color: theme.palette.text.primary,
  marginBottom: '15px',
  [theme.breakpoints.down('md')]: {
    fontSize: '1.4rem',
    marginBottom: '12px',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.2rem',
    marginBottom: '10px',
  },
}));

const QuestionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.3rem',
  color: theme.palette.text.primary,
  marginBottom: '12px',
  marginTop: '24px',
  position: 'relative',
  '&::before': {
    content: '"•"',
    position: 'absolute',
    left: '-20px',
    color: theme.palette.text.secondary,
    fontWeight: 'bold',
  },
  [theme.breakpoints.down('md')]: {
    fontSize: '1.1rem',
    marginBottom: '8px',
    marginTop: '16px',
    '&::before': { left: '-15px' },
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
    marginBottom: '6px',
    marginTop: '12px',
  },
}));

const AnswerText = styled(Box)(({ theme }) => ({
  fontSize: '1rem',
  color: theme.palette.text.primary,
  lineHeight: '1.6',
  marginBottom: '32px',
  '& p': { margin: '0 0 12px 0' },
  '& ul': { margin: '8px 0', paddingLeft: '20px' },
  '& li': { marginBottom: '4px' },
  [theme.breakpoints.down('md')]: {
    fontSize: '0.9rem',
    lineHeight: '1.5',
    marginBottom: '20px',
    '& p': { margin: '0 0 8px 0' },
    '& ul': { paddingLeft: '16px' },
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.85rem',
    marginBottom: '16px',
  },
}));

// Aurora Loader Styles
const AuroraInlineLoader = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(45deg, #000428, #004e92)',
  overflow: 'hidden',
  zIndex: 2,
  animation: 'pulseBackground 4s ease-in-out infinite',
  borderRadius: 0,

  '@keyframes pulseBackground': {
    '0%, 100%': { background: 'linear-gradient(45deg, #000428, #004e92)' },
    '25%': { background: 'linear-gradient(45deg, #1a1a2e, #16213e)' },
    '50%': { background: 'linear-gradient(45deg, #0f3460, #005aa7)' },
    '75%': { background: 'linear-gradient(45deg, #2c1810, #8b4513)' },
  },
}));

const AuroraWave = styled(Box)(() => ({
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
    '0%, 100%': { transform: 'rotate(0deg) scale(1)', filter: 'hue-rotate(0deg)' },
    '25%': { transform: 'rotate(90deg) scale(1.1)', filter: 'hue-rotate(90deg)' },
    '50%': { transform: 'rotate(180deg) scale(0.9)', filter: 'hue-rotate(180deg)' },
    '75%': { transform: 'rotate(270deg) scale(1.05)', filter: 'hue-rotate(270deg)' },
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
    '0%': { transform: 'translateY(100vh) translateX(0px)', opacity: 0 },
    '10%': { opacity: 1 },
    '90%': { opacity: 1 },
    '100%': { transform: 'translateY(-100px) translateX(100px)', opacity: 0 },
  },
}));

const LoadingText = styled(Typography)(() => ({
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

  '@keyframes textGlow': {
    '0%': { textShadow: '0 0 20px rgba(255, 255, 255, 0.5)', opacity: 0.8 },
    '100%': { textShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 40px rgba(120, 119, 198, 0.6)', opacity: 1 },
  },
}));

const FlashOverlay = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(255, 255, 255, 0.1)',
  animation: 'flash 3s ease-in-out infinite',

  '@keyframes flash': {
    '0%, 90%, 100%': { opacity: 0 },
    '5%': { opacity: 0.3 },
    '10%': { opacity: 0 },
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

const formatYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fetchDailyBrief = async (
  date: Date,
  generateIfMissing: boolean = true,
  signal?: AbortSignal
): Promise<DailyBriefCompany[]> => {
  const url = new URL(API_ENDPOINTS.DAILY_BRIEF);
  url.search = new URLSearchParams({
    date: formatYMD(date),
    generate_if_missing: String(generateIfMissing),
  }).toString();

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      if (err?.detail) msg += ` – ${err.detail}`;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return response.json();
};

const DailyBrief: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companies, setCompanies] = useState<DailyBriefCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Switching dates while a generation is still in flight (LLM calls can take
  // a while) must cancel the stale request — otherwise it can resolve after a
  // newer one and either get silently swallowed (leaving the UI stuck on the
  // loading animation forever) or overwrite the newer date's data.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let timedOut = false;

    // LLM generation for several companies can legitimately take a while, but
    // it shouldn't spin forever if the backend is actually stuck or down.
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 120000);

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchDailyBrief(selectedDate, true, controller.signal);
        if (!cancelled) {
          setCompanies(data);
        }
      } catch (err) {
        if (cancelled) return;

        if (err instanceof DOMException && err.name === 'AbortError') {
          if (timedOut) {
            setError('This is taking longer than expected. The brief may still be generating in the background — try again in a bit.');
          }
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch daily brief';
        if (errorMessage.includes('No brief found for the given date')) {
          setError(null);
          setCompanies([]);
        } else {
          setError(errorMessage);
        }
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedDate]);

  const handleBack = () => {
    navigate('/');
  };

  const shiftDays = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta);
      return next;
    });
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const headerActions = (
    <>
      <BackButton startIcon={<ArrowBackIcon />} onClick={handleBack}>
        Back to Home Page
      </BackButton>
      {isMobile && (
        <IconButton onClick={handleBack} sx={{ color: 'primary.main', mr: 1 }} size="small" aria-label="Back to home">
          <ArrowBackIcon />
        </IconButton>
      )}
    </>
  );

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <AppHeader
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          onMobileMenuClose={() => setMobileMenuOpen(false)}
        >
          {headerActions}
        </AppHeader>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography color="error">Error: {error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#ecf0f1', display: 'flex', flexDirection: 'column' }}>
      <AppHeader
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      >
        {headerActions}
        <Box sx={{ flexGrow: 1 }} />
        <DateToggleRoot>
          <IconButton aria-label="Previous day" size="small" onClick={() => shiftDays(-1)} sx={{ borderRadius: '10px' }}>
            <ChevronLeftIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>

          <DateLabel>{formatDate(selectedDate)}</DateLabel>

          <IconButton aria-label="Next day" size="small" onClick={() => shiftDays(1)} sx={{ borderRadius: '10px' }}>
            <ChevronRightIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </DateToggleRoot>
      </AppHeader>

      {/* Body container below AppBar */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {loading && (
          <AuroraInlineLoader>
            <AuroraWave />
            <AuroraWave sx={{ animationDelay: '-2s', animationDirection: 'reverse' }} />
            <AuroraWave sx={{ animationDelay: '-4s', transform: 'scale(0.8)' }} />
            {Array.from({ length: 20 }).map((_, i) => (
              <AuroraParticle
                key={i}
                delay={i * 0.5}
                duration={3 + Math.random() * 2}
                sx={{ left: `${Math.random() * 100}%`, background: `hsl(${Math.random() * 360}, 70%, 60%)` }}
              />
            ))}
            <FlashOverlay />
            <LoadingText>
              Compiling today&apos;s funding stories...
              <br />
              <Box component="span" sx={{ fontSize: '1rem', opacity: 0.7, mt: 1, display: 'block' }}>
                ✨ Analyzing market trends and company insights
              </Box>
            </LoadingText>
          </AuroraInlineLoader>
        )}
        {/* Notebook Content */}
        <Box
          sx={{
            p: 3,
            maxWidth: '1000px',
            margin: '0 auto',
            position: 'relative',
            [theme.breakpoints.down('md')]: { p: 1, maxWidth: '100%' },
          }}
        >
          {/* Spiral binding effect */}
          <Box
            sx={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '800px',
              height: '10px',
              background: 'repeating-linear-gradient(90deg, #ccc 0px, #ccc 20px, transparent 20px, transparent 40px)',
              borderRadius: '5px',
              zIndex: 1,
              [theme.breakpoints.down('md')]: {
                width: 'calc(100% - 20px)',
                top: '15px',
                height: '8px',
                background: 'repeating-linear-gradient(90deg, #ccc 0px, #ccc 15px, transparent 15px, transparent 30px)',
              },
            }}
          />
          <NotebookPage sx={{ visibility: loading ? 'hidden' : 'visible' }}>
            <NotebookTitle>Daily Funding Brief</NotebookTitle>

            {companies.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '2rem', [theme.breakpoints.down('md')]: { fontSize: '1.6rem' } }}>📖</Typography>
                <Typography
                  sx={{
                    fontSize: '1.3rem',
                    fontWeight: 600,
                    marginBottom: '8px',
                    [theme.breakpoints.down('md')]: { fontSize: '1.1rem' },
                  }}
                >
                  No reading material for this date
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1rem',
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    maxWidth: '400px',
                    lineHeight: '1.5',
                    [theme.breakpoints.down('md')]: { fontSize: '0.9rem', maxWidth: '300px', padding: '0 16px' },
                  }}
                >
                  This page appears to be empty. Try selecting a different date or check back later for new funding stories.
                </Typography>
              </Box>
            ) : (
              <>
                <Typography sx={{ fontSize: '1.1rem', mb: 4, textAlign: 'center' }}>
                  {companies.length} companies received funding today 🚀
                </Typography>

                {companies.map((company, index) => (
                  <CompanySection key={`${company.company_name}-${index}`}>
                    <CompanyTitle>
                      {index + 1}. {company.company_name}
                    </CompanyTitle>

                    {/* Company Details in Q&A Format */}
                    {(() => {
                      const customOrder = [
                        'why_problem',
                        'what_solution',
                        'how_execution',
                        'customer_segment',
                        'founders_team_dna',
                        'traction_snapshot',
                        'competitive_edge',
                        'sources',
                      ];

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
    </Box>
  );
};

export default DailyBrief;
