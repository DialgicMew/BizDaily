import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Link,
  Divider,
  styled,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import { API_ENDPOINTS } from '../config/constants';

// Styled components matching home page design
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
  [theme.breakpoints.down('md')]: {
    display: 'none', // Hide on mobile to save space
  },
}));

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  color: '#1976d2',
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

const MobileDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '280px',
    backgroundColor: '#ffffff',
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e0e0e0',
  padding: '24px',
  marginBottom: '24px',
  [theme.breakpoints.down('md')]: {
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  marginBottom: '16px',
  color: '#1976d2',
  [theme.breakpoints.down('md')]: {
    fontSize: '1.3rem',
    marginBottom: '12px',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.2rem',
  },
}));

const DataLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.9rem',
  color: '#666',
  marginBottom: '4px',
  [theme.breakpoints.down('md')]: {
    fontSize: '0.8rem',
    marginBottom: '2px',
  },
}));

const DataValue = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: '#333',
  marginBottom: '16px',
  wordBreak: 'break-word',
  [theme.breakpoints.down('md')]: {
    fontSize: '0.9rem',
    marginBottom: '12px',
  },
}));

const QuestionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.3rem',
  color: '#1976d2',
  marginBottom: '12px',
  marginTop: '24px',
  [theme.breakpoints.down('md')]: {
    fontSize: '1.1rem',
    marginBottom: '8px',
    marginTop: '16px',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
  },
}));

const DetailAnswer = styled(Box)(({ theme }) => ({
  fontSize: '1rem',
  color: '#333',
  lineHeight: '1.6',
  marginBottom: '32px',
  '& a': {
    color: '#1976d2',
    textDecoration: 'none',
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
  [theme.breakpoints.down('md')]: {
    fontSize: '0.9rem',
    lineHeight: '1.5',
    marginBottom: '20px',
    '& p': {
      margin: '0 0 8px 0',
    },
    '& ul': {
      paddingLeft: '16px',
    },
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.85rem',
    marginBottom: '16px',
  },
}));

// API types
interface FundingData {
  funding_uuid: number;
  company_name: string;
  company_location: string;
  funded_city: string;
  funded_state: string;
  funding_name: string;
  funding_date: string;
  funding_amount: number;
  currency: string;
  funding_stage: string;
  funding_type: string;
  investment_stage: string;
  investor_count: number;
  total_investor_count: number;
  investor_names: string;
  sector: string;
  sub_sector: string;
  article_url: string;
  [key: string]: any;
}

interface CompanyDetailsResponse {
  funding_uuid: number;
  company_name: string;
  details: {
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
  };
  generated_on: string;
  exists_in_db: boolean;
}

interface CompanyDetails {
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
}

// API service for company details
const fetchCompanyDetails = async (fundingUuid: string): Promise<CompanyDetails> => {
  const response = await fetch(`${API_ENDPOINTS.COMPANY_DETAILS}/${fundingUuid}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data: CompanyDetailsResponse = await response.json();
  
  // Extract just the details we need for display
  return data.details;
};

// Format funding data for display
const formatFundingValue = (value: any, key: string): string => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  
  switch (key) {
    case 'funding_amount':
      return value === 0 ? 'Undisclosed' : `$${(value / 1000000).toFixed(1)}M`;
    case 'funding_date':
      return new Date(value).toLocaleDateString();
    default:
      return String(value);
  }
};

// Format field names as questions
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
  
  return questionMap[key] || key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
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
            color: '#1976d2',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
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
            color: '#1976d2',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
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

const FundingDetail: React.FC = () => {
  const { fundingUuid } = useParams<{ fundingUuid: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fundingData, setFundingData] = useState<FundingData | null>(null);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [loadingCompanyDetails, setLoadingCompanyDetails] = useState(true);
  const [companyDetailsError, setCompanyDetailsError] = useState<string | null>(null);

  useEffect(() => {
    // Get funding data from sessionStorage (passed from home page)
    const storedFundingData = sessionStorage.getItem(`funding_${fundingUuid}`);
    if (storedFundingData) {
      setFundingData(JSON.parse(storedFundingData));
    }

    // Fetch company details
    const loadCompanyDetails = async () => {
      if (!fundingUuid) return;
      
      try {
        setLoadingCompanyDetails(true);
        setCompanyDetailsError(null);
        const details = await fetchCompanyDetails(fundingUuid);
        setCompanyDetails(details);
      } catch (err) {
        setCompanyDetailsError(err instanceof Error ? err.message : 'Failed to fetch company details');
      } finally {
        setLoadingCompanyDetails(false);
      }
    };

    loadCompanyDetails();
  }, [fundingUuid]);

  const handleBack = () => {
    navigate('/');
  };

  if (!fundingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Top Navbar */}
      <StyledAppBar position="static">
        <Toolbar>
          {/* Mobile Menu Button */}
          <MobileMenuButton
            edge="start"
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuIcon />
          </MobileMenuButton>

          {/* BizDaily Branding */}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              color: '#1976d2',
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              marginLeft: { xs: 1, md: 0 },
              marginRight: { xs: 'auto', md: 2 },
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            BizDaily
          </Typography>

          {/* Desktop Back Button */}
          <BackButton startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back to Home Page
          </BackButton>
          
          {/* Mobile Back Button */}
          {isMobile && (
            <IconButton
              onClick={handleBack}
              sx={{ color: '#1976d2' }}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
          )}
        </Toolbar>
      </StyledAppBar>
      
      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/');
                setMobileMenuOpen(false);
              }}
            >
              <ListItemText 
                primary="Home" 
                primaryTypographyProps={{ 
                  fontWeight: 600, 
                  color: '#1976d2' 
                }} 
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/daily-brief');
                setMobileMenuOpen(false);
              }}
            >
              <ListItemText primary="Daily Brief" />
            </ListItemButton>
          </ListItem>
        </List>
      </MobileDrawer>
      
      {/* Main Content */}
      <Box sx={{ 
        p: 3, 
        maxWidth: '1400px', 
        margin: '0 auto',
        [theme.breakpoints.down('md')]: {
          p: 1,
          maxWidth: '100%',
        }
      }}>
        {/* Section 1: Funding Information */}
        <StyledPaper>
          <SectionTitle>Funding Details</SectionTitle>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 4,
            [theme.breakpoints.down('md')]: {
              flexDirection: 'column',
              gap: 2,
            }
          }}>
            {/* Basic Info */}
            <Box sx={{ 
              flex: '1 1 300px', 
              minWidth: '300px',
              [theme.breakpoints.down('md')]: {
                minWidth: 'unset',
                flex: 'unset',
              }
            }}>
              <DataLabel>Company Name</DataLabel>
              <DataValue variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                {fundingData.company_name}
              </DataValue>
              
              <DataLabel>Funding Amount</DataLabel>
              <DataValue sx={{ fontSize: '1.2rem', fontWeight: 600, color: '#2e7d32' }}>
                {formatFundingValue(fundingData.funding_amount, 'funding_amount')} {fundingData.currency}
              </DataValue>
              
              <DataLabel>Funding Type</DataLabel>
              <Chip 
                label={fundingData.funding_type} 
                sx={{ 
                  backgroundColor: '#e3f2fd', 
                  color: '#1976d2',
                  fontWeight: 600,
                  mb: 2,
                  [theme.breakpoints.down('md')]: {
                    fontSize: '0.75rem',
                    height: '24px',
                  }
                }} 
              />
              
              <DataLabel>Funding Date</DataLabel>
              <DataValue>{formatFundingValue(fundingData.funding_date, 'funding_date')}</DataValue>
            </Box>
            
            {/* Location & Stage Info */}
            <Box sx={{ 
              flex: '1 1 300px', 
              minWidth: '300px',
              [theme.breakpoints.down('md')]: {
                minWidth: 'unset',
                flex: 'unset',
              }
            }}>
              <DataLabel>Company Location</DataLabel>
              <DataValue>{fundingData.company_location || 'N/A'}</DataValue>
              
              <DataLabel>Funded City</DataLabel>
              <DataValue>{fundingData.funded_city || 'N/A'}</DataValue>
              
              <DataLabel>Funded State</DataLabel>
              <DataValue>{fundingData.funded_state || 'N/A'}</DataValue>
              
              <DataLabel>Funding Stage</DataLabel>
              <Chip 
                label={fundingData.funding_stage} 
                sx={{ 
                  backgroundColor: '#f3e5f5', 
                  color: '#7b1fa2',
                  fontWeight: 600,
                  mb: 2,
                  [theme.breakpoints.down('md')]: {
                    fontSize: '0.75rem',
                    height: '24px',
                  }
                }} 
              />
            </Box>
            
            {/* Business Info */}
            <Box sx={{ 
              flex: '1 1 300px', 
              minWidth: '300px',
              [theme.breakpoints.down('md')]: {
                minWidth: 'unset',
                flex: 'unset',
              }
            }}>
              <DataLabel>Sector</DataLabel>
              <DataValue>{fundingData.sector || 'N/A'}</DataValue>
              
              <DataLabel>Sub Sector</DataLabel>
              <DataValue>{fundingData.sub_sector || 'N/A'}</DataValue>
              
              <DataLabel>Investor Count</DataLabel>
              <DataValue>{fundingData.investor_count}</DataValue>
              
              <DataLabel>Total Investor Count</DataLabel>
              <DataValue>{fundingData.total_investor_count}</DataValue>
            </Box>
          </Box>
          
          {/* Full width fields */}
          <Box sx={{ mt: 2 }}>
            <DataLabel>Funding Name</DataLabel>
            <DataValue>{fundingData.funding_name}</DataValue>
            
            <DataLabel>Investors</DataLabel>
            <DataValue>{fundingData.investor_names || 'N/A'}</DataValue>
            
            {fundingData.article_url && (
              <>
                <DataLabel>Article</DataLabel>
                <Link
                  href={fundingData.article_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  View Full Article
                </Link>
              </>
            )}
          </Box>
        </StyledPaper>
        
        {/* Section 2: Company Details */}
        <StyledPaper>
          <SectionTitle>Company Details</SectionTitle>
          
          {loadingCompanyDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={48} />
              <Typography sx={{ ml: 2, color: '#666' }}>Loading company details...</Typography>
            </Box>
          ) : companyDetailsError ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="error" sx={{ mb: 2 }}>
                Error loading company details: {companyDetailsError}
              </Typography>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outlined"
              >
                Retry
              </Button>
            </Box>
          ) : companyDetails ? (
            <Box sx={{ width: '100%' }}>
              {Object.entries(companyDetails)
                .filter(([key]) => !['id', 'funding_uuid', 'company_name', 'generated_on', 'created_at'].includes(key))
                .sort(([keyA], [keyB]) => {
                  // Define custom order for questions
                  const customOrder = [
                    'why_problem',
                    'what_solution',
                    'how_execution',
                    'customer_segment',
                    'founders_team_dna',
                    'traction_snapshot',
                    'valuation',
                    'funding_round',
                    'use_of_funds',
                    'competitive_edge',
                    'pivots',
                    'key_risks_open_questions',                    
                    'sources'
                  ];
                  const indexA = customOrder.indexOf(keyA.toLowerCase());
                  const indexB = customOrder.indexOf(keyB.toLowerCase());
                  
                  // If both keys are in custom order, sort by their position
                  if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                  }
                  
                  // If only one key is in custom order, prioritize it
                  if (indexA !== -1) return -1;
                  if (indexB !== -1) return 1;
                  
                  // If neither key is in custom order, maintain original order
                  return 0;
                })
                .map(([key, value], index) => (
                <Box key={key} sx={{ mb: 4 }}>
                  <QuestionTitle>
                    {formatFieldQuestion(key)}
                  </QuestionTitle>
                  <DetailAnswer>
                    {formatContent(value)}
                  </DetailAnswer>
                  {index < Object.keys(companyDetails).length - 6 && (
                    <Divider sx={{ mt: 2, mb: 2 }} />
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 8, color: '#666' }}>
              No company details available
            </Typography>
          )}
        </StyledPaper>
      </Box>
    </Box>
  );
};

export default FundingDetail;