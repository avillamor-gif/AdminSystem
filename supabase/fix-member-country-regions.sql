-- Step 1: Save the original region values before clearing them
-- This backup lets you see which members had region names and restore if needed

CREATE TABLE IF NOT EXISTS member_country_backup (
  member_id   uuid PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  first_name  text,
  last_name   text,
  original_country text,
  backed_up_at timestamptz DEFAULT now()
);

-- Save all members whose country is a region name
INSERT INTO member_country_backup (member_id, first_name, last_name, original_country)
SELECT id, first_name, last_name, country
FROM members
WHERE country IN (
  'Asia','Southeast Asia','East Asia','South Asia','Central Asia',
  'Middle East','West Asia','Europe','Eastern Europe','Western Europe',
  'Northern Europe','Southern Europe','North America','Central America',
  'South America','Latin America','Latin America & Caribbean','Caribbean',
  'Africa','North Africa','Sub-Saharan Africa','West Africa','East Africa',
  'Southern Africa','Oceania','Pacific','Pacific Islands',
  'Global','International','N/A','n/a','None','Other'
)
ON CONFLICT (member_id) DO UPDATE SET
  original_country = EXCLUDED.original_country,
  backed_up_at     = now();

-- Step 2: Show what was backed up (so you can see it before nulling)
SELECT first_name, last_name, original_country
FROM member_country_backup
ORDER BY original_country, last_name;

-- Step 3: NOW null out the region values
UPDATE members
SET country = NULL
WHERE country IN (
  'Asia','Southeast Asia','East Asia','South Asia','Central Asia',
  'Middle East','West Asia','Europe','Eastern Europe','Western Europe',
  'Northern Europe','Southern Europe','North America','Central America',
  'South America','Latin America','Latin America & Caribbean','Caribbean',
  'Africa','North Africa','Sub-Saharan Africa','West Africa','East Africa',
  'Southern Africa','Oceania','Pacific','Pacific Islands',
  'Global','International','N/A','n/a','None','Other'
);

-- Step 4: Confirm — show any remaining non-standard values
SELECT country, COUNT(*) as count
FROM members
WHERE country IS NOT NULL
  AND country NOT IN (
    'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda',
    'Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain',
    'Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
    'Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria',
    'Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada',
    'Central African Republic','Chad','Chile','China','Colombia','Comoros',
    'Congo (Brazzaville)','Congo (Kinshasa)','Costa Rica','Croatia','Cuba',
    'Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic',
    'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia',
    'Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia',
    'Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau',
    'Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran',
    'Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
    'Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon',
    'Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
    'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands',
    'Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia',
    'Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal',
    'Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea',
    'North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama',
    'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
    'Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia',
    'Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe',
    'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore',
    'Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea',
    'South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland',
    'Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo',
    'Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu',
    'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States',
    'Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam',
    'Yemen','Zambia','Zimbabwe'
  )
GROUP BY country ORDER BY count DESC;


-- Verify: show remaining non-standard country values (should be empty)
SELECT country, COUNT(*) as count
FROM members
WHERE country IS NOT NULL
  AND country NOT IN (
    'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda',
    'Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain',
    'Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
    'Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria',
    'Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada',
    'Central African Republic','Chad','Chile','China','Colombia','Comoros',
    'Congo (Brazzaville)','Congo (Kinshasa)','Costa Rica','Croatia','Cuba',
    'Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic',
    'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia',
    'Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia',
    'Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau',
    'Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran',
    'Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
    'Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon',
    'Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
    'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands',
    'Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia',
    'Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal',
    'Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea',
    'North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama',
    'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
    'Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia',
    'Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe',
    'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore',
    'Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea',
    'South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland',
    'Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo',
    'Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu',
    'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States',
    'Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam',
    'Yemen','Zambia','Zimbabwe'
  )
GROUP BY country
ORDER BY count DESC;
