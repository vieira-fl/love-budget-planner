// Feature flags configuration
// These flags control access to features in development

export const FEATURE_FLAGS = {
  // Controls access to the table-based transaction entry page
  // Set VITE_ENABLE_TABLE_ENTRY=true in .env to enable
  ENABLE_TABLE_ENTRY: true,
} as const;
