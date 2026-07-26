import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
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
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_ENDPOINTS } from '../config/constants';
import { AppHeader } from '../components/AppHeader';
import { formatContent, formatFieldQuestion } from '../utils/textFormat';

const BackButton = styled(Button)(({ theme }) => ({
  padding: '8px 24px',
  fontWeight: 600,
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
  border: `1px solid ${theme.palette.divider}`,
  padding: '24px',
  marginBottom: '24px',
  [theme.breakpoints.down('md')]: {
    borderRadius: 8,
    padding: '16px',
    marginBottom: '16px',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  marginBottom: '16px',
  color: theme.palette.primary.main,
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
  fontSize: '0.85rem',
  color: theme.palette.text.secondary,
  marginBottom: '4px',
  [theme.breakpoints.down('md')]: {
    fontSize: '0.8rem',
    marginBottom: '2px',
  },
}));

const DataValue = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: theme.palette.text.primary,
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
  color: theme.palette.primary.main,
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
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppHeader
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      >
        <BackButton startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Home Page
        </BackButton>
        {isMobile && (
          <IconButton onClick={handleBack} sx={{ color: 'primary.main' }} size="small" aria-label="Back to home">
            <ArrowBackIcon />
          </IconButton>
        )}
      </AppHeader>

      {/* Main Content */}
      <Box
        sx={{
          p: 3,
          maxWidth: '1400px',
          margin: '0 auto',
          [theme.breakpoints.down('md')]: {
            p: 1.5,
            maxWidth: '100%',
          },
        }}
      >
        {/* Section 1: Funding Information */}
        <StyledPaper>
          <SectionTitle>Funding Details</SectionTitle>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              [theme.breakpoints.down('md')]: {
                flexDirection: 'column',
                gap: 2,
              },
            }}
          >
            {/* Basic Info */}
            <Box
              sx={{
                flex: '1 1 300px',
                minWidth: '300px',
                [theme.breakpoints.down('md')]: { minWidth: 'unset', flex: 'unset' },
              }}
            >
              <DataLabel>Company Name</DataLabel>
              <DataValue variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {fundingData.company_name}
              </DataValue>

              <DataLabel>Funding Amount</DataLabel>
              <DataValue sx={{ fontSize: '1.2rem', fontWeight: 600, color: 'secondary.main' }}>
                {formatFundingValue(fundingData.funding_amount, 'funding_amount')} {fundingData.currency}
              </DataValue>

              <DataLabel>Funding Type</DataLabel>
              <Chip
                label={fundingData.funding_type}
                sx={{
                  backgroundColor: '#e8f0fe',
                  color: 'primary.dark',
                  mb: 2,
                  [theme.breakpoints.down('md')]: { fontSize: '0.75rem', height: '24px' },
                }}
              />

              <DataLabel>Funding Date</DataLabel>
              <DataValue>{formatFundingValue(fundingData.funding_date, 'funding_date')}</DataValue>
            </Box>

            {/* Location & Stage Info */}
            <Box
              sx={{
                flex: '1 1 300px',
                minWidth: '300px',
                [theme.breakpoints.down('md')]: { minWidth: 'unset', flex: 'unset' },
              }}
            >
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
                  backgroundColor: '#f3e8fd',
                  color: '#7c3aed',
                  mb: 2,
                  [theme.breakpoints.down('md')]: { fontSize: '0.75rem', height: '24px' },
                }}
              />
            </Box>

            {/* Business Info */}
            <Box
              sx={{
                flex: '1 1 300px',
                minWidth: '300px',
                [theme.breakpoints.down('md')]: { minWidth: 'unset', flex: 'unset' },
              }}
            >
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
                  sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
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
              <Typography sx={{ ml: 2, color: 'text.secondary' }}>Loading company details...</Typography>
            </Box>
          ) : companyDetailsError ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="error" sx={{ mb: 2 }}>
                Error loading company details: {companyDetailsError}
              </Typography>
              <Button onClick={() => window.location.reload()} variant="outlined">
                Retry
              </Button>
            </Box>
          ) : companyDetails ? (
            <Box sx={{ width: '100%' }}>
              {Object.entries(companyDetails)
                .filter(([key]) => !['id', 'funding_uuid', 'company_name', 'generated_on', 'created_at'].includes(key))
                .sort(([keyA], [keyB]) => {
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
                    'sources',
                  ];
                  const indexA = customOrder.indexOf(keyA.toLowerCase());
                  const indexB = customOrder.indexOf(keyB.toLowerCase());

                  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                  if (indexA !== -1) return -1;
                  if (indexB !== -1) return 1;
                  return 0;
                })
                .map(([key, value], index) => (
                  <Box key={key} sx={{ mb: 4 }}>
                    <QuestionTitle>{formatFieldQuestion(key)}</QuestionTitle>
                    <DetailAnswer>{formatContent(value)}</DetailAnswer>
                    {index < Object.keys(companyDetails).length - 6 && <Divider sx={{ mt: 2, mb: 2 }} />}
                  </Box>
                ))}
            </Box>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              No company details available
            </Typography>
          )}
        </StyledPaper>
      </Box>
    </Box>
  );
};

export default FundingDetail;
