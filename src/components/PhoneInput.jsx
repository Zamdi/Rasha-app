import { useState, useRef, useEffect } from 'react'

// len = { min, max } digits in the national number, after the dial code and
// any leading trunk zero. A range rather than one figure because real
// numbering plans vary within a country (e.g. Germany's mobile vs landline
// lengths differ) — still narrow enough to catch a number that's obviously
// too short or has extra digits typed onto the end, which was accepted
// unconditionally before.
const COUNTRIES = [
  // Home country first
  { code: 'SD', name: 'Sudan',                   dial: '+249', flag: '🇸🇩', len: { min: 9,  max: 9  } },
  // Rest alphabetical
  { code: 'AF', name: 'Afghanistan',             dial: '+93',  flag: '🇦🇫', len: { min: 9,  max: 9  } },
  { code: 'AL', name: 'Albania',                 dial: '+355', flag: '🇦🇱', len: { min: 9,  max: 9  } },
  { code: 'DZ', name: 'Algeria',                 dial: '+213', flag: '🇩🇿', len: { min: 9,  max: 9  } },
  { code: 'AD', name: 'Andorra',                 dial: '+376', flag: '🇦🇩', len: { min: 6,  max: 9  } },
  { code: 'AO', name: 'Angola',                  dial: '+244', flag: '🇦🇴', len: { min: 9,  max: 9  } },
  { code: 'AG', name: 'Antigua and Barbuda',     dial: '+1268',flag: '🇦🇬', len: { min: 7,  max: 7  } },
  { code: 'AR', name: 'Argentina',               dial: '+54',  flag: '🇦🇷', len: { min: 10, max: 10 } },
  { code: 'AM', name: 'Armenia',                 dial: '+374', flag: '🇦🇲', len: { min: 8,  max: 8  } },
  { code: 'AU', name: 'Australia',               dial: '+61',  flag: '🇦🇺', len: { min: 9,  max: 9  } },
  { code: 'AT', name: 'Austria',                 dial: '+43',  flag: '🇦🇹', len: { min: 10, max: 11 } },
  { code: 'AZ', name: 'Azerbaijan',              dial: '+994', flag: '🇦🇿', len: { min: 9,  max: 9  } },
  { code: 'BS', name: 'Bahamas',                 dial: '+1242',flag: '🇧🇸', len: { min: 7,  max: 7  } },
  { code: 'BH', name: 'Bahrain',                 dial: '+973', flag: '🇧🇭', len: { min: 8,  max: 8  } },
  { code: 'BD', name: 'Bangladesh',              dial: '+880', flag: '🇧🇩', len: { min: 10, max: 10 } },
  { code: 'BB', name: 'Barbados',                dial: '+1246',flag: '🇧🇧', len: { min: 7,  max: 7  } },
  { code: 'BY', name: 'Belarus',                 dial: '+375', flag: '🇧🇾', len: { min: 9,  max: 9  } },
  { code: 'BE', name: 'Belgium',                 dial: '+32',  flag: '🇧🇪', len: { min: 9,  max: 9  } },
  { code: 'BZ', name: 'Belize',                  dial: '+501', flag: '🇧🇿', len: { min: 7,  max: 7  } },
  { code: 'BJ', name: 'Benin',                   dial: '+229', flag: '🇧🇯', len: { min: 8,  max: 8  } },
  { code: 'BT', name: 'Bhutan',                  dial: '+975', flag: '🇧🇹', len: { min: 8,  max: 8  } },
  { code: 'BO', name: 'Bolivia',                 dial: '+591', flag: '🇧🇴', len: { min: 8,  max: 9  } },
  { code: 'BA', name: 'Bosnia and Herzegovina',  dial: '+387', flag: '🇧🇦', len: { min: 8,  max: 8  } },
  { code: 'BW', name: 'Botswana',                dial: '+267', flag: '🇧🇼', len: { min: 8,  max: 8  } },
  { code: 'BR', name: 'Brazil',                  dial: '+55',  flag: '🇧🇷', len: { min: 11, max: 11 } },
  { code: 'BN', name: 'Brunei',                  dial: '+673', flag: '🇧🇳', len: { min: 7,  max: 7  } },
  { code: 'BG', name: 'Bulgaria',                dial: '+359', flag: '🇧🇬', len: { min: 9,  max: 9  } },
  { code: 'BF', name: 'Burkina Faso',            dial: '+226', flag: '🇧🇫', len: { min: 8,  max: 8  } },
  { code: 'BI', name: 'Burundi',                 dial: '+257', flag: '🇧🇮', len: { min: 8,  max: 8  } },
  { code: 'CV', name: 'Cape Verde',              dial: '+238', flag: '🇨🇻', len: { min: 7,  max: 7  } },
  { code: 'KH', name: 'Cambodia',                dial: '+855', flag: '🇰🇭', len: { min: 8,  max: 9  } },
  { code: 'CM', name: 'Cameroon',                dial: '+237', flag: '🇨🇲', len: { min: 9,  max: 9  } },
  { code: 'CA', name: 'Canada',                  dial: '+1',   flag: '🇨🇦', len: { min: 10, max: 10 } },
  { code: 'CF', name: 'Central African Republic',dial: '+236', flag: '🇨🇫', len: { min: 8,  max: 8  } },
  { code: 'TD', name: 'Chad',                    dial: '+235', flag: '🇹🇩', len: { min: 8,  max: 8  } },
  { code: 'CL', name: 'Chile',                   dial: '+56',  flag: '🇨🇱', len: { min: 9,  max: 9  } },
  { code: 'CN', name: 'China',                   dial: '+86',  flag: '🇨🇳', len: { min: 11, max: 11 } },
  { code: 'CO', name: 'Colombia',                dial: '+57',  flag: '🇨🇴', len: { min: 10, max: 10 } },
  { code: 'KM', name: 'Comoros',                 dial: '+269', flag: '🇰🇲', len: { min: 7,  max: 7  } },
  { code: 'CG', name: 'Congo',                   dial: '+242', flag: '🇨🇬', len: { min: 9,  max: 9  } },
  { code: 'CD', name: 'Congo (DR)',               dial: '+243', flag: '🇨🇩', len: { min: 9,  max: 9  } },
  { code: 'CR', name: 'Costa Rica',              dial: '+506', flag: '🇨🇷', len: { min: 8,  max: 8  } },
  { code: 'HR', name: 'Croatia',                 dial: '+385', flag: '🇭🇷', len: { min: 8,  max: 9  } },
  { code: 'CU', name: 'Cuba',                    dial: '+53',  flag: '🇨🇺', len: { min: 8,  max: 8  } },
  { code: 'CY', name: 'Cyprus',                  dial: '+357', flag: '🇨🇾', len: { min: 8,  max: 8  } },
  { code: 'CZ', name: 'Czech Republic',          dial: '+420', flag: '🇨🇿', len: { min: 9,  max: 9  } },
  { code: 'DK', name: 'Denmark',                 dial: '+45',  flag: '🇩🇰', len: { min: 8,  max: 8  } },
  { code: 'DJ', name: 'Djibouti',                dial: '+253', flag: '🇩🇯', len: { min: 8,  max: 8  } },
  { code: 'DM', name: 'Dominica',                dial: '+1767',flag: '🇩🇲', len: { min: 7,  max: 7  } },
  { code: 'DO', name: 'Dominican Republic',      dial: '+1809',flag: '🇩🇴', len: { min: 7,  max: 7  } },
  { code: 'EC', name: 'Ecuador',                 dial: '+593', flag: '🇪🇨', len: { min: 9,  max: 9  } },
  { code: 'EG', name: 'Egypt',                   dial: '+20',  flag: '🇪🇬', len: { min: 10, max: 10 } },
  { code: 'SV', name: 'El Salvador',             dial: '+503', flag: '🇸🇻', len: { min: 8,  max: 8  } },
  { code: 'GQ', name: 'Equatorial Guinea',       dial: '+240', flag: '🇬🇶', len: { min: 9,  max: 9  } },
  { code: 'ER', name: 'Eritrea',                 dial: '+291', flag: '🇪🇷', len: { min: 7,  max: 7  } },
  { code: 'EE', name: 'Estonia',                 dial: '+372', flag: '🇪🇪', len: { min: 7,  max: 8  } },
  { code: 'SZ', name: 'Eswatini',                dial: '+268', flag: '🇸🇿', len: { min: 8,  max: 8  } },
  { code: 'ET', name: 'Ethiopia',                dial: '+251', flag: '🇪🇹', len: { min: 9,  max: 9  } },
  { code: 'FJ', name: 'Fiji',                    dial: '+679', flag: '🇫🇯', len: { min: 7,  max: 7  } },
  { code: 'FI', name: 'Finland',                 dial: '+358', flag: '🇫🇮', len: { min: 9,  max: 10 } },
  { code: 'FR', name: 'France',                  dial: '+33',  flag: '🇫🇷', len: { min: 9,  max: 9  } },
  { code: 'GA', name: 'Gabon',                   dial: '+241', flag: '🇬🇦', len: { min: 8,  max: 8  } },
  { code: 'GM', name: 'Gambia',                  dial: '+220', flag: '🇬🇲', len: { min: 7,  max: 7  } },
  { code: 'GE', name: 'Georgia',                 dial: '+995', flag: '🇬🇪', len: { min: 9,  max: 9  } },
  { code: 'DE', name: 'Germany',                 dial: '+49',  flag: '🇩🇪', len: { min: 10, max: 11 } },
  { code: 'GH', name: 'Ghana',                   dial: '+233', flag: '🇬🇭', len: { min: 9,  max: 9  } },
  { code: 'GR', name: 'Greece',                  dial: '+30',  flag: '🇬🇷', len: { min: 10, max: 10 } },
  { code: 'GD', name: 'Grenada',                 dial: '+1473',flag: '🇬🇩', len: { min: 7,  max: 7  } },
  { code: 'GT', name: 'Guatemala',               dial: '+502', flag: '🇬🇹', len: { min: 8,  max: 8  } },
  { code: 'GN', name: 'Guinea',                  dial: '+224', flag: '🇬🇳', len: { min: 9,  max: 9  } },
  { code: 'GW', name: 'Guinea-Bissau',           dial: '+245', flag: '🇬🇼', len: { min: 7,  max: 7  } },
  { code: 'GY', name: 'Guyana',                  dial: '+592', flag: '🇬🇾', len: { min: 7,  max: 7  } },
  { code: 'HT', name: 'Haiti',                   dial: '+509', flag: '🇭🇹', len: { min: 8,  max: 8  } },
  { code: 'HN', name: 'Honduras',                dial: '+504', flag: '🇭🇳', len: { min: 8,  max: 8  } },
  { code: 'HU', name: 'Hungary',                 dial: '+36',  flag: '🇭🇺', len: { min: 9,  max: 9  } },
  { code: 'IS', name: 'Iceland',                 dial: '+354', flag: '🇮🇸', len: { min: 7,  max: 7  } },
  { code: 'IN', name: 'India',                   dial: '+91',  flag: '🇮🇳', len: { min: 10, max: 10 } },
  { code: 'ID', name: 'Indonesia',               dial: '+62',  flag: '🇮🇩', len: { min: 9,  max: 12 } },
  { code: 'IR', name: 'Iran',                    dial: '+98',  flag: '🇮🇷', len: { min: 10, max: 10 } },
  { code: 'IQ', name: 'Iraq',                    dial: '+964', flag: '🇮🇶', len: { min: 10, max: 10 } },
  { code: 'IE', name: 'Ireland',                 dial: '+353', flag: '🇮🇪', len: { min: 9,  max: 9  } },
  { code: 'IL', name: 'Israel',                  dial: '+972', flag: '🇮🇱', len: { min: 9,  max: 9  } },
  { code: 'IT', name: 'Italy',                   dial: '+39',  flag: '🇮🇹', len: { min: 9,  max: 11 } },
  { code: 'JM', name: 'Jamaica',                 dial: '+1876',flag: '🇯🇲', len: { min: 7,  max: 7  } },
  { code: 'JP', name: 'Japan',                   dial: '+81',  flag: '🇯🇵', len: { min: 10, max: 11 } },
  { code: 'JO', name: 'Jordan',                  dial: '+962', flag: '🇯🇴', len: { min: 9,  max: 9  } },
  { code: 'KZ', name: 'Kazakhstan',              dial: '+7',   flag: '🇰🇿', len: { min: 10, max: 10 } },
  { code: 'KE', name: 'Kenya',                   dial: '+254', flag: '🇰🇪', len: { min: 9,  max: 9  } },
  { code: 'KI', name: 'Kiribati',                dial: '+686', flag: '🇰🇮', len: { min: 8,  max: 8  } },
  { code: 'KR', name: 'South Korea',             dial: '+82',  flag: '🇰🇷', len: { min: 9,  max: 10 } },
  { code: 'XK', name: 'Kosovo',                  dial: '+383', flag: '🇽🇰', len: { min: 8,  max: 8  } },
  { code: 'KW', name: 'Kuwait',                  dial: '+965', flag: '🇰🇼', len: { min: 8,  max: 8  } },
  { code: 'KG', name: 'Kyrgyzstan',              dial: '+996', flag: '🇰🇬', len: { min: 9,  max: 9  } },
  { code: 'LA', name: 'Laos',                    dial: '+856', flag: '🇱🇦', len: { min: 9,  max: 9  } },
  { code: 'LV', name: 'Latvia',                  dial: '+371', flag: '🇱🇻', len: { min: 8,  max: 8  } },
  { code: 'LB', name: 'Lebanon',                 dial: '+961', flag: '🇱🇧', len: { min: 7,  max: 8  } },
  { code: 'LS', name: 'Lesotho',                 dial: '+266', flag: '🇱🇸', len: { min: 8,  max: 8  } },
  { code: 'LR', name: 'Liberia',                 dial: '+231', flag: '🇱🇷', len: { min: 8,  max: 8  } },
  { code: 'LY', name: 'Libya',                   dial: '+218', flag: '🇱🇾', len: { min: 9,  max: 9  } },
  { code: 'LI', name: 'Liechtenstein',           dial: '+423', flag: '🇱🇮', len: { min: 7,  max: 9  } },
  { code: 'LT', name: 'Lithuania',               dial: '+370', flag: '🇱🇹', len: { min: 8,  max: 8  } },
  { code: 'LU', name: 'Luxembourg',              dial: '+352', flag: '🇱🇺', len: { min: 9,  max: 9  } },
  { code: 'MG', name: 'Madagascar',              dial: '+261', flag: '🇲🇬', len: { min: 9,  max: 9  } },
  { code: 'MW', name: 'Malawi',                  dial: '+265', flag: '🇲🇼', len: { min: 9,  max: 9  } },
  { code: 'MY', name: 'Malaysia',                dial: '+60',  flag: '🇲🇾', len: { min: 9,  max: 10 } },
  { code: 'MV', name: 'Maldives',                dial: '+960', flag: '🇲🇻', len: { min: 7,  max: 7  } },
  { code: 'ML', name: 'Mali',                    dial: '+223', flag: '🇲🇱', len: { min: 8,  max: 8  } },
  { code: 'MT', name: 'Malta',                   dial: '+356', flag: '🇲🇹', len: { min: 8,  max: 8  } },
  { code: 'MH', name: 'Marshall Islands',        dial: '+692', flag: '🇲🇭', len: { min: 7,  max: 7  } },
  { code: 'MR', name: 'Mauritania',              dial: '+222', flag: '🇲🇷', len: { min: 8,  max: 8  } },
  { code: 'MU', name: 'Mauritius',               dial: '+230', flag: '🇲🇺', len: { min: 8,  max: 8  } },
  { code: 'MX', name: 'Mexico',                  dial: '+52',  flag: '🇲🇽', len: { min: 10, max: 10 } },
  { code: 'FM', name: 'Micronesia',              dial: '+691', flag: '🇫🇲', len: { min: 7,  max: 7  } },
  { code: 'MD', name: 'Moldova',                 dial: '+373', flag: '🇲🇩', len: { min: 8,  max: 8  } },
  { code: 'MC', name: 'Monaco',                  dial: '+377', flag: '🇲🇨', len: { min: 8,  max: 9  } },
  { code: 'MN', name: 'Mongolia',                dial: '+976', flag: '🇲🇳', len: { min: 8,  max: 8  } },
  { code: 'ME', name: 'Montenegro',              dial: '+382', flag: '🇲🇪', len: { min: 8,  max: 8  } },
  { code: 'MA', name: 'Morocco',                 dial: '+212', flag: '🇲🇦', len: { min: 9,  max: 9  } },
  { code: 'MZ', name: 'Mozambique',              dial: '+258', flag: '🇲🇿', len: { min: 9,  max: 9  } },
  { code: 'MM', name: 'Myanmar',                 dial: '+95',  flag: '🇲🇲', len: { min: 8,  max: 10 } },
  { code: 'NA', name: 'Namibia',                 dial: '+264', flag: '🇳🇦', len: { min: 9,  max: 9  } },
  { code: 'NR', name: 'Nauru',                   dial: '+674', flag: '🇳🇷', len: { min: 7,  max: 7  } },
  { code: 'NP', name: 'Nepal',                   dial: '+977', flag: '🇳🇵', len: { min: 10, max: 10 } },
  { code: 'NL', name: 'Netherlands',             dial: '+31',  flag: '🇳🇱', len: { min: 9,  max: 9  } },
  { code: 'NZ', name: 'New Zealand',             dial: '+64',  flag: '🇳🇿', len: { min: 9,  max: 10 } },
  { code: 'NI', name: 'Nicaragua',               dial: '+505', flag: '🇳🇮', len: { min: 8,  max: 8  } },
  { code: 'NE', name: 'Niger',                   dial: '+227', flag: '🇳🇪', len: { min: 8,  max: 8  } },
  { code: 'NG', name: 'Nigeria',                 dial: '+234', flag: '🇳🇬', len: { min: 10, max: 10 } },
  { code: 'MK', name: 'North Macedonia',         dial: '+389', flag: '🇲🇰', len: { min: 8,  max: 8  } },
  { code: 'NO', name: 'Norway',                  dial: '+47',  flag: '🇳🇴', len: { min: 8,  max: 8  } },
  { code: 'OM', name: 'Oman',                    dial: '+968', flag: '🇴🇲', len: { min: 8,  max: 8  } },
  { code: 'PK', name: 'Pakistan',                dial: '+92',  flag: '🇵🇰', len: { min: 10, max: 10 } },
  { code: 'PW', name: 'Palau',                   dial: '+680', flag: '🇵🇼', len: { min: 7,  max: 7  } },
  { code: 'PA', name: 'Panama',                  dial: '+507', flag: '🇵🇦', len: { min: 8,  max: 8  } },
  { code: 'PG', name: 'Papua New Guinea',        dial: '+675', flag: '🇵🇬', len: { min: 8,  max: 8  } },
  { code: 'PY', name: 'Paraguay',                dial: '+595', flag: '🇵🇾', len: { min: 9,  max: 9  } },
  { code: 'PE', name: 'Peru',                    dial: '+51',  flag: '🇵🇪', len: { min: 9,  max: 9  } },
  { code: 'PH', name: 'Philippines',             dial: '+63',  flag: '🇵🇭', len: { min: 10, max: 10 } },
  { code: 'PL', name: 'Poland',                  dial: '+48',  flag: '🇵🇱', len: { min: 9,  max: 9  } },
  { code: 'PT', name: 'Portugal',                dial: '+351', flag: '🇵🇹', len: { min: 9,  max: 9  } },
  { code: 'QA', name: 'Qatar',                   dial: '+974', flag: '🇶🇦', len: { min: 8,  max: 8  } },
  { code: 'RO', name: 'Romania',                 dial: '+40',  flag: '🇷🇴', len: { min: 9,  max: 9  } },
  { code: 'RU', name: 'Russia',                  dial: '+7',   flag: '🇷🇺', len: { min: 10, max: 10 } },
  { code: 'RW', name: 'Rwanda',                  dial: '+250', flag: '🇷🇼', len: { min: 9,  max: 9  } },
  { code: 'KN', name: 'Saint Kitts and Nevis',   dial: '+1869',flag: '🇰🇳', len: { min: 7,  max: 7  } },
  { code: 'LC', name: 'Saint Lucia',             dial: '+1758',flag: '🇱🇨', len: { min: 7,  max: 7  } },
  { code: 'VC', name: 'Saint Vincent',           dial: '+1784',flag: '🇻🇨', len: { min: 7,  max: 7  } },
  { code: 'WS', name: 'Samoa',                   dial: '+685', flag: '🇼🇸', len: { min: 7,  max: 7  } },
  { code: 'SM', name: 'San Marino',              dial: '+378', flag: '🇸🇲', len: { min: 8,  max: 10 } },
  { code: 'ST', name: 'São Tomé and Príncipe',   dial: '+239', flag: '🇸🇹', len: { min: 7,  max: 7  } },
  { code: 'SA', name: 'Saudi Arabia',            dial: '+966', flag: '🇸🇦', len: { min: 9,  max: 9  } },
  { code: 'SN', name: 'Senegal',                 dial: '+221', flag: '🇸🇳', len: { min: 9,  max: 9  } },
  { code: 'RS', name: 'Serbia',                  dial: '+381', flag: '🇷🇸', len: { min: 8,  max: 9  } },
  { code: 'SC', name: 'Seychelles',              dial: '+248', flag: '🇸🇨', len: { min: 7,  max: 7  } },
  { code: 'SL', name: 'Sierra Leone',            dial: '+232', flag: '🇸🇱', len: { min: 8,  max: 8  } },
  { code: 'SG', name: 'Singapore',               dial: '+65',  flag: '🇸🇬', len: { min: 8,  max: 8  } },
  { code: 'SK', name: 'Slovakia',                dial: '+421', flag: '🇸🇰', len: { min: 9,  max: 9  } },
  { code: 'SI', name: 'Slovenia',                dial: '+386', flag: '🇸🇮', len: { min: 8,  max: 8  } },
  { code: 'SB', name: 'Solomon Islands',         dial: '+677', flag: '🇸🇧', len: { min: 7,  max: 7  } },
  { code: 'SO', name: 'Somalia',                 dial: '+252', flag: '🇸🇴', len: { min: 9,  max: 9  } },
  { code: 'ZA', name: 'South Africa',            dial: '+27',  flag: '🇿🇦', len: { min: 9,  max: 9  } },
  { code: 'SS', name: 'South Sudan',             dial: '+211', flag: '🇸🇸', len: { min: 9,  max: 9  } },
  { code: 'ES', name: 'Spain',                   dial: '+34',  flag: '🇪🇸', len: { min: 9,  max: 9  } },
  { code: 'LK', name: 'Sri Lanka',               dial: '+94',  flag: '🇱🇰', len: { min: 9,  max: 9  } },
  { code: 'SR', name: 'Suriname',                dial: '+597', flag: '🇸🇷', len: { min: 7,  max: 7  } },
  { code: 'SE', name: 'Sweden',                  dial: '+46',  flag: '🇸🇪', len: { min: 9,  max: 9  } },
  { code: 'CH', name: 'Switzerland',             dial: '+41',  flag: '🇨🇭', len: { min: 9,  max: 9  } },
  { code: 'SY', name: 'Syria',                   dial: '+963', flag: '🇸🇾', len: { min: 9,  max: 9  } },
  { code: 'TW', name: 'Taiwan',                  dial: '+886', flag: '🇹🇼', len: { min: 9,  max: 9  } },
  { code: 'TJ', name: 'Tajikistan',              dial: '+992', flag: '🇹🇯', len: { min: 9,  max: 9  } },
  { code: 'TZ', name: 'Tanzania',                dial: '+255', flag: '🇹🇿', len: { min: 9,  max: 9  } },
  { code: 'TH', name: 'Thailand',                dial: '+66',  flag: '🇹🇭', len: { min: 9,  max: 9  } },
  { code: 'TL', name: 'Timor-Leste',             dial: '+670', flag: '🇹🇱', len: { min: 8,  max: 8  } },
  { code: 'TG', name: 'Togo',                    dial: '+228', flag: '🇹🇬', len: { min: 8,  max: 8  } },
  { code: 'TO', name: 'Tonga',                   dial: '+676', flag: '🇹🇴', len: { min: 7,  max: 7  } },
  { code: 'TT', name: 'Trinidad and Tobago',     dial: '+1868',flag: '🇹🇹', len: { min: 7,  max: 7  } },
  { code: 'TN', name: 'Tunisia',                 dial: '+216', flag: '🇹🇳', len: { min: 8,  max: 8  } },
  { code: 'TR', name: 'Turkey',                  dial: '+90',  flag: '🇹🇷', len: { min: 10, max: 10 } },
  { code: 'TM', name: 'Turkmenistan',            dial: '+993', flag: '🇹🇲', len: { min: 8,  max: 8  } },
  { code: 'TV', name: 'Tuvalu',                  dial: '+688', flag: '🇹🇻', len: { min: 6,  max: 7  } },
  { code: 'UG', name: 'Uganda',                  dial: '+256', flag: '🇺🇬', len: { min: 9,  max: 9  } },
  { code: 'UA', name: 'Ukraine',                 dial: '+380', flag: '🇺🇦', len: { min: 9,  max: 9  } },
  { code: 'AE', name: 'United Arab Emirates',    dial: '+971', flag: '🇦🇪', len: { min: 9,  max: 9  } },
  { code: 'GB', name: 'United Kingdom',          dial: '+44',  flag: '🇬🇧', len: { min: 10, max: 10 } },
  { code: 'US', name: 'United States',           dial: '+1',   flag: '🇺🇸', len: { min: 10, max: 10 } },
  { code: 'UY', name: 'Uruguay',                 dial: '+598', flag: '🇺🇾', len: { min: 9,  max: 9  } },
  { code: 'UZ', name: 'Uzbekistan',              dial: '+998', flag: '🇺🇿', len: { min: 9,  max: 9  } },
  { code: 'VU', name: 'Vanuatu',                 dial: '+678', flag: '🇻🇺', len: { min: 7,  max: 7  } },
  { code: 'VE', name: 'Venezuela',               dial: '+58',  flag: '🇻🇪', len: { min: 10, max: 10 } },
  { code: 'VN', name: 'Vietnam',                 dial: '+84',  flag: '🇻🇳', len: { min: 9,  max: 10 } },
  { code: 'YE', name: 'Yemen',                   dial: '+967', flag: '🇾🇪', len: { min: 9,  max: 9  } },
  { code: 'ZM', name: 'Zambia',                  dial: '+260', flag: '🇿🇲', len: { min: 9,  max: 9  } },
  { code: 'ZW', name: 'Zimbabwe',                dial: '+263', flag: '🇿🇼', len: { min: 9,  max: 9  } },
]

export { COUNTRIES }

export default function PhoneInput({ value, onChange, dialCode, onDialChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef = useRef(null)

  const selected = COUNTRIES.find(c => c.dial === dialCode) || COUNTRIES[0]

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search))
    : COUNTRIES

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="flex relative" dir="ltr" ref={wrapRef}>
      {/* Country selector */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-3 rounded-l-xl shrink-0 transition-all"
        style={{
          background: 'var(--color-surface-container-high)',
          border: '1px solid var(--color-outline-variant)',
          borderRight: 'none',
          color: 'var(--color-on-surface)',
          minWidth: '96px',
        }}
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-xs font-bold">{selected.dial}</span>
        <span className="material-symbols-outlined text-on-surface-variant leading-none" style={{ fontSize: '14px' }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-20 rounded-xl overflow-hidden animate-fade-in"
          style={{
            width: '260px',
            background: 'var(--glass-high-bg)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid var(--glass-high-border)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {/* Search */}
          <div className="p-2.5" style={{ borderBottom: '1px solid var(--glass-high-border)' }}>
            <input
              autoFocus
              type="text"
              placeholder="Search country…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg outline-none"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--color-on-surface)',
              }}
            />
          </div>

          {/* List */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-xs text-center" style={{ color: 'var(--color-on-surface-variant)' }}>No results</p>
            ) : filtered.map(c => {
              const isActive = c.dial === dialCode
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onDialChange(c.dial); setOpen(false); setSearch('') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                  style={{
                    background: isActive ? 'rgba(var(--color-secondary-fixed-rgb),0.12)' : 'transparent',
                    color: 'var(--color-on-surface)',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-container-high)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="text-lg leading-none shrink-0">{c.flag}</span>
                  <span className="flex-1 text-xs font-medium">{c.name}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--color-secondary-fixed)' }}>{c.dial}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Number field */}
      <input
        type="tel"
        placeholder=""
        autoComplete="tel-national"
        name="tel"
        className="rasha-input flex-1"
        style={{ borderRadius: '0 0.75rem 0.75rem 0' }}
        value={value}
        onChange={e => {
          let v = e.target.value.replace(/\D/g, '')
          // Let the customer type the number the way they say it, leading
          // trunk 0 included — stripping it as they type made the digit
          // visibly vanish and read as "the app won't accept 0". The 0 is
          // dropped later, when buildE164() builds the actual E.164 value.
          const maxLen = v.startsWith('0') ? selected.len.max + 1 : selected.len.max
          v = v.slice(0, maxLen)
          onChange(v)
        }}
      />
    </div>
  )
}
