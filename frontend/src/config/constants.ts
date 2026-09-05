/**
 * Application configuration constants
 */

// API Base URL - uses environment variable in production, localhost in development
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4010';

// API Endpoints
export const API_ENDPOINTS = {
  // Funding endpoints
  FUNDING_FILTER: `${API_BASE_URL}/api/funding/funding/filter`,
  FUNDING_REFRESH: `${API_BASE_URL}/api/funding/funding/refresh`,
  
  // Brief endpoints
  DAILY_BRIEF: `${API_BASE_URL}/api/brief/daily-brief`,
  
  // Company endpoints
  COMPANY_DETAILS: `${API_BASE_URL}/api/company/company-details`,
} as const;

// Environment check
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

console.log(`🌐 API Base URL: ${API_BASE_URL}`);
console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
