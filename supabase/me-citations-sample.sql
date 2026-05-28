-- =============================================================
-- Sample citations for the M&E Citation Tracker
-- Run this AFTER me-citations.sql
-- =============================================================

INSERT INTO me_citations (
  title, source_name, source_type, url, publication_date, authors,
  work_type, work_title, notes, tags
) VALUES

-- News citations
(
  'Poverty statistics cited in Inquirer editorial',
  'Philippine Daily Inquirer',
  'news_article',
  'https://opinion.inquirer.net/sample-editorial',
  '2026-03-15',
  'Inquirer Editorial Board',
  'research',
  'State of the Filipino Workers 2025',
  'Editorial referenced our annual labor report in the context of rising cost of living.',
  ARRAY['poverty', 'labor', 'wages']
),
(
  'IBON advocacy quoted in ABS-CBN news segment on contractualization',
  'ABS-CBN News',
  'news_article',
  'https://news.abs-cbn.com/sample-article',
  '2026-01-22',
  'Anjo Bagaoisan',
  'advocacy',
  'End Contractualization Campaign 2024',
  'Reporter quoted our position paper directly during a labor day segment.',
  ARRAY['labor', 'contractualization', 'workers-rights']
),

-- Academic journal
(
  'Food sovereignty framework cited in UP journal article',
  'Philippine Political Science Journal',
  'academic_journal',
  NULL,
  '2025-09-01',
  'Maria Santos, Jose Reyes',
  'research',
  'Food Sovereignty and Rural Development Report',
  'Full citation in footnotes. Authors acknowledged IBON as primary data source.',
  ARRAY['food-sovereignty', 'rural', 'agriculture']
),

-- Policy document
(
  'Livelihood data referenced in NEDA Regional Development Plan',
  'National Economic and Development Authority (NEDA)',
  'policy_document',
  'https://www.neda.gov.ph/sample-rdp',
  '2025-11-30',
  'NEDA Region IV-A',
  'research',
  'Grassroots Livelihood Survey 2024',
  'Used our survey figures in the baseline section of the Calabarzon RDP.',
  ARRAY['livelihood', 'neda', 'regional-development']
),

-- Government report
(
  'Child poverty indicators cited in DSWD annual report',
  'Department of Social Welfare and Development',
  'government_report',
  NULL,
  '2026-02-10',
  'DSWD Policy Research Bureau',
  'research',
  'Child Poverty in the Philippines: A Rights-Based Analysis',
  'Cited in the situational analysis section.',
  ARRAY['children', 'poverty', 'social-protection']
),

-- Conference
(
  'Climate justice framework presented at ASEAN Civil Society Conference',
  'ASEAN Civil Society Conference 2025',
  'conference',
  'https://acsc2025.org/presentations',
  '2025-10-18',
  'Panel on Climate & People',
  'advocacy',
  'Climate Justice Primer for Grassroots Organizers',
  'Our primer was cited as a reference material in two panel discussions.',
  ARRAY['climate', 'asean', 'civil-society']
),

-- Social media
(
  'Infographic on wage gap shared widely on X (Twitter)',
  'X / Twitter',
  'social_media',
  'https://x.com/sample/status/123456789',
  '2026-04-01',
  NULL,
  'publication',
  'Minimum Wage Infographic Series 2025',
  'Reached ~45,000 impressions. Multiple CSOs and journalists reshared.',
  ARRAY['wages', 'infographic', 'social-media-reach']
),

-- Book
(
  'Cited in book chapter on Philippine development economics',
  'Ateneo de Manila University Press',
  'book',
  NULL,
  '2025-06-01',
  'Dr. Emmanuel de Dios, Dr. Rosario Manasan',
  'research',
  'National Industrialization Study 2023',
  'Full citation in bibliography. Chapter 4 on industrial policy.',
  ARRAY['industrialization', 'economics', 'academic']
),

-- Website
(
  'Press release referenced on Global Policy Forum website',
  'Global Policy Forum',
  'website',
  'https://www.globalpolicy.org/sample-page',
  '2025-08-20',
  NULL,
  'policy',
  'Position Paper: UN Financing for Development',
  'Included in their resource list on financing for development.',
  ARRAY['un', 'development-finance', 'global']
);
