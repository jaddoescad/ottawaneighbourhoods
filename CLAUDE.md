# Ottawa Neighbourhoods App - Data Documentation

## Data Pipeline

```
Raw CSV Files → process-data.js → data.json → Website
```

### To Update Data:
```bash
node scripts/process-data.js
```

This reads raw CSVs, fetches neighbourhood boundaries from Ottawa Open Data, assigns parks/schools/libraries/transit stations using point-in-polygon analysis, aggregates crime data by neighbourhood, and outputs `src/data/processed/data.json`.

## File Structure

```
src/data/
├── csv/                          # Raw data (edit these)
│   ├── parks_raw.csv             # All 1,365 parks from Ottawa Open Data
│   ├── schools_raw.csv           # All 451 schools from Ottawa Open Data
│   ├── libraries_raw.csv         # All 34 libraries from Ottawa Open Data
│   ├── eqao_scores.csv           # EQAO school scores from Ontario Open Data
│   ├── crime_raw.csv             # ~98K crimes (2023-2024) from Ottawa Police
│   ├── hospitals_raw.csv         # All 10 hospitals from Ottawa Open Data
│   ├── restaurants_cafes_raw.csv # Restaurants & cafés (OpenStreetMap / Overpass)
│   ├── walkscores.csv            # Walk Score, Transit Score, Bike Score (from WalkScore.com)
│   ├── age_demographics.csv      # Age demographics (% children, young professionals, seniors)
│   ├── neighbourhoods.csv        # Neighbourhood info (scores, pros/cons, avgRent, avgHomePrice)
│   ├── rent_data.csv             # Rent research data with sources
│   ├── home_prices.csv           # Home price research data with sources
│   └── ons_neighbourhoods.csv    # Reference: all 111 ONS area IDs
├── processed/
│   └── data.json                 # Generated output (don't edit directly)
└── neighbourhoods.ts             # TypeScript loader

scripts/
├── process-data.js               # Main processing script
├── download-eqao-data.js         # Downloads EQAO scores from Ontario Open Data
├── download-hospitals.js         # Downloads hospitals from Ottawa Open Data
├── download-restaurants-cafes.js # Downloads restaurants & cafés from OpenStreetMap (Overpass)
├── generate-age-demographics.js  # Generates age demographics CSV from 2021 Census
└── config/
    └── neighbourhood-mapping.js  # Maps our neighbourhoods to ONS IDs
```

## Data Sources

Most data from **City of Ottawa Open Data** (ArcGIS REST APIs). Restaurants & cafés via **OpenStreetMap** (Overpass):

| Data | API | Records |
|------|-----|---------|
| Parks | https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/24 | 1,365 |
| Schools | https://maps.ottawa.ca/arcgis/rest/services/Schools/MapServer/0 | 451 |
| EQAO Scores | https://data.ontario.ca/dataset/school-information-and-student-demographics | 244 |
| Libraries | https://opendata.arcgis.com/datasets/ottawa::ottawa-public-library-locations-2024.geojson | 34 |
| Transit Stations | https://maps.ottawa.ca/arcgis/rest/services/TransitServices/MapServer/0 | 40 |
| O-Train Stations | https://maps.ottawa.ca/arcgis/rest/services/TransitServices/MapServer/1 | 5 |
| Crime (2023-2024) | https://services7.arcgis.com/2vhcNzw0NfUwAD3d/ArcGIS/rest/services/Criminal_Offences_Open_Data/FeatureServer/0 | ~98K |
| Hospitals | https://maps.ottawa.ca/arcgis/rest/services/Hospitals/MapServer/0 | 10 |
| Restaurants & Cafés | https://overpass-api.de/api/interpreter (OSM Overpass) | ~1-3K |
| Walk Scores | https://www.walkscore.com/CA-ON/Ottawa | 27 |
| Age Demographics | https://open.ottawa.ca/datasets/ottawa::2021-long-form-census-sub-area | 27 |
| Boundaries | https://maps.ottawa.ca/arcgis/rest/services/Neighbourhoods/MapServer/0 | 111 |

## Raw Data Fields

### parks_raw.csv
| Field | Description |
|-------|-------------|
| NAME | Park name |
| LATITUDE / LONGITUDE | Coordinates |
| PARK_TYPE | Active Recreation, Passive, etc. |
| PARK_CATEGORY | District Park, Neighbourhood Park, etc. |
| DOG_DESIGNATION | Dog policy (1=leash, 2=off-leash, 3=no dogs) |
| WARD_NAME | City ward |
| ADDRESS | Street address |
| Shape_Area | Park area in square meters |

### schools_raw.csv
| Field | Description |
|-------|-------------|
| NAME | School name |
| LATITUDE / LONGITUDE | Coordinates |
| BOARD | School board code (OCSB, OCDSB, etc.) |
| FULL_BOARD | Full board name |
| CATEGORY | Elementary, Secondary, etc. |
| NUM / STREET | Address |
| PHONE | Phone number |

### eqao_scores.csv
EQAO (Education Quality and Accountability Office) standardized test scores for Ottawa schools.

| Field | Description |
|-------|-------------|
| schoolName | School name |
| boardName | School board name |
| schoolLevel | Elementary or Secondary |
| avgScore | Average % of students achieving provincial standard |

**Score Interpretation:** The avgScore represents the average percentage of students achieving the provincial standard across all EQAO tests (Grade 3/6 Reading, Writing, Math; Grade 9 Math; Grade 10 Literacy).

**To refresh EQAO data:**
```bash
node scripts/download-eqao-data.js
node scripts/process-data.js
```

### libraries_raw.csv
| Field | Description |
|-------|-------------|
| NAME | Library branch name |
| LATITUDE / LONGITUDE | Coordinates |
| ADDRESS | Street address |
| POSTAL_CODE | Postal code |
| ACRONYM | Branch code (e.g., MA for Main) |

### transit_stations_raw.csv
| Field | Description |
|-------|-------------|
| NAME | Station name |
| TYPE | Station type (Transitway, O-Train Line 2) |
| LATITUDE / LONGITUDE | Coordinates |

### crime_raw.csv
| Field | Description |
|-------|-------------|
| YEAR | Year of offence (2023 or 2024) |
| OFF_CATEG | Offence category (Assaults, Break and Enter, Theft, etc.) |
| NB_NAME_EN | ONS neighbourhood name |
| WARD | City ward |

**Crime Categories:** Arson, Assaults, Break and Enter, Fraud, Mischief, Robbery, Sexual Violations, Theft $5000 and Under, Theft Over $5000, Theft - Motor Vehicle, and more.

### hospitals_raw.csv
| Field | Description |
|-------|-------------|
| NAME | Hospital name |
| ADDRESS | Street address |
| PHONE | Phone number |
| LATITUDE / LONGITUDE | Coordinates |
| LINK | Hospital website URL |

**To refresh hospital data:**
```bash
node scripts/download-hospitals.js
node scripts/process-data.js
```

### walkscores.csv
Walk Score, Transit Score, and Bike Score for each neighbourhood (0-100 scale):
| Field | Description |
|-------|-------------|
| id | Neighbourhood ID (matches neighbourhoods.csv) |
| name | Neighbourhood name |
| walkScore | Walk Score (0-100) - walkability to amenities |
| transitScore | Transit Score (0-100) - access to public transit |
| bikeScore | Bike Score (0-100) - bikeability |
| source | Data source (WalkScore.com) |
| notes | Additional context |

**Score Interpretation:**
- 90-100: Walker's/Biker's Paradise, Excellent Transit
- 70-89: Very Walkable/Bikeable, Excellent Transit
- 50-69: Somewhat Walkable/Bikeable, Good Transit
- 25-49: Car-Dependent, Some Transit
- 0-24: Almost All Errands Require Car, Minimal Transit

**Data Source:** https://www.walkscore.com/CA-ON/Ottawa (researched December 2024)

### age_demographics.csv
Age demographics data from Statistics Canada 2021 Census:
| Field | Description |
|-------|-------------|
| id | Neighbourhood ID (matches neighbourhoods.csv) |
| name | Neighbourhood name |
| pctChildren | % of population aged 0-14 (families with children indicator) |
| pctYoungProfessionals | % of population aged 25-44 |
| pctSeniors | % of population aged 65+ |
| censusSubArea | Census sub-area used for data mapping |
| source | Data source |

**Data Source:** Statistics Canada 2021 Census via City of Ottawa Open Data (https://open.ottawa.ca/datasets/ottawa::2021-long-form-census-sub-area)

**Ottawa Averages (2021 Census):**
- Children (0-14): 16.7%
- Young Professionals (25-44): 27.7%
- Seniors (65+): 16.0%

**To refresh age demographics data:**
```bash
node scripts/generate-age-demographics.js
node scripts/process-data.js
```

### neighbourhoods.csv
Edit this file to change neighbourhood info displayed on the website:
| Field | Description |
|-------|-------------|
| id | Unique ID (must match neighbourhood-mapping.js) |
| name | Display name |
| area | Area description (Central, West End, etc.) |
| image | Image URL |
| medianIncome | Median household income |
| avgRent | Average monthly rent (see rent_data.csv for sources) |
| avgHomePrice | Average home price (see home_prices.csv for sources) |
| pros | Semicolon-separated list of pros |
| cons | Semicolon-separated list of cons |

### rent_data.csv
Contains average rent research data with sources for each neighbourhood:
| Field | Description |
|-------|-------------|
| id | Neighbourhood ID (matches neighbourhoods.csv) |
| name | Neighbourhood name |
| avgRent | Average monthly rent in CAD |
| rentSource | Data source (Zumper, CMHC, RentCafe, etc.) |
| notes | Additional context about the data |

### home_prices.csv
Contains average home price research data with sources for each neighbourhood:
| Field | Description |
|-------|-------------|
| id | Neighbourhood ID (matches neighbourhoods.csv) |
| name | Neighbourhood name |
| avgHomePrice | Average home price in CAD |
| priceSource | Data source (AgentInOttawa, Zolo, OREB, etc.) |
| notes | Additional context about the data (YoY changes, sample size) |

## Neighbourhood Mapping

Edit `scripts/config/neighbourhood-mapping.js` to change which ONS areas belong to each neighbourhood.

Example:
```javascript
'westboro': {
  name: 'Westboro',
  onsIds: [958, 931, 910, 32], // Westboro, Laurentian, McKellar Heights, Crystal Bay
},
```

To find ONS IDs, check `src/data/csv/ons_neighbourhoods.csv`.

## API Query Examples

### Get all parks
```
https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/24/query?where=1%3D1&outFields=*&f=json
```

### Get all schools
```
https://maps.ottawa.ca/arcgis/rest/services/Schools/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json
```

### Get neighbourhood boundary by ONS ID
```
https://maps.ottawa.ca/arcgis/rest/services/Neighbourhoods/MapServer/0/query?where=ONS_ID%3D923&returnGeometry=true&outSR=4326&f=json
```

### Search parks by name
```
https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/24/query?where=NAME%20LIKE%20%27%25McKellar%25%27&outFields=*&f=json
```

### Get all transit stations
```
https://maps.ottawa.ca/arcgis/rest/services/TransitServices/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json
```

### Get crime data (2023-2024)
```
https://services7.arcgis.com/2vhcNzw0NfUwAD3d/ArcGIS/rest/services/Criminal_Offences_Open_Data/FeatureServer/0/query?where=YEAR>=2023&outFields=YEAR,OFF_CATEG,NB_NAME_EN,WARD&returnGeometry=false&f=json
```

## Refreshing Raw Data

To download fresh data from Ottawa Open Data, use the download script:

```bash
node scripts/download-raw-data.js
```

This downloads parks, schools, transit stations, crime data (2023-2024), and ONS neighbourhoods to the `src/data/csv/` folder.

Note: Libraries data must be downloaded manually from:
https://opendata.arcgis.com/datasets/ottawa::ottawa-public-library-locations-2024.geojson

Then run `node scripts/process-data.js` to regenerate the website data.

## Rent Data Research Methodology

Average rent data was manually researched in December 2024 using the following sources:

### Primary Sources
| Source | URL | Coverage |
|--------|-----|----------|
| Zumper | https://www.zumper.com/rent-research/ottawa-on | Neighbourhood-level averages with YoY trends |
| CMHC | https://www.cmhc-schl.gc.ca/hmiportal | Official rental market survey data |
| RentCafe | https://www.rentcafe.com/apartments-for-rent/ca/on/ottawa/ | Price ranges by unit type |
| Rentals.ca | https://rentals.ca/ottawa | Current asking rents |

### Methodology
1. **Urban neighbourhoods** (Glebe, Westboro, Centretown, etc.): Used Zumper/RentCafe average rent data
2. **Suburban neighbourhoods** (Kanata, Barrhaven, Orleans, etc.): Combined Zumper data with recent rental examples
3. **Rural areas** (Carp, Constance Bay, Manotick, etc.): Estimated based on limited rental inventory and comparable areas

### Data Notes
- Rent figures represent average asking rents for all unit types (studios through 3+ bedrooms)
- Data reflects 2024 market conditions (researched December 2024)
- Rural areas have limited rental inventory; estimates based on available listings
- Some areas show significant YoY changes due to market fluctuations

### To Update Rent Data
1. Edit `src/data/csv/rent_data.csv` with new research (include sources)
2. Copy avgRent values to `src/data/csv/neighbourhoods.csv`
3. Run `node scripts/process-data.js` to regenerate data.json

## Home Price Data Research Methodology

Average home price data was manually researched in December 2024 using the following sources:

### Primary Sources
| Source | URL | Coverage |
|--------|-----|----------|
| AgentInOttawa | https://agentinottawa.com/stats | Sold home prices by neighbourhood with YoY trends |
| Zolo | https://www.zolo.ca/ottawa-real-estate/trends | MLS listing prices and market stats |
| OREB | https://creastats.crea.ca/board/otta/ | Ottawa Real Estate Board official statistics |
| MyOttawaProperty | https://www.myottawaproperty.com/market/ | Monthly market reports by neighbourhood |

### Methodology
1. **Urban neighbourhoods** (Glebe, Westboro, Centretown, etc.): Used AgentInOttawa sold price data from Oct 2024
2. **Suburban neighbourhoods** (Kanata, Barrhaven, Orleans, etc.): Combined AgentInOttawa and Zolo MLS statistics
3. **Rural areas** (Carp, Constance Bay, Manotick, etc.): Used Zolo listing averages where sold data was limited

### Data Notes
- Home prices represent average sold prices where available, or listing averages for areas with limited sales
- Data reflects 2024 market conditions (researched December 2024)
- Prices include all property types (detached, semi-detached, townhouses) unless noted
- Rural areas have lower sales volume; some estimates based on listing prices
- YoY (Year-over-Year) changes noted where significant

### Price Ranges by Area Type (2024)
| Area Type | Price Range | Examples |
|-----------|-------------|----------|
| Premium Central | $900K - $1.2M | Glebe, Westboro, Old Ottawa South, New Edinburgh |
| Central Urban | $475K - $700K | Centretown, Sandy Hill, Hintonburg, Vanier |
| Suburban | $700K - $850K | Kanata, Stittsville, Barrhaven, Orleans |
| Rural/Village | $650K - $1.1M | Manotick, Carp, Richmond, Constance Bay |

### To Update Home Price Data
1. Edit `src/data/csv/home_prices.csv` with new research (include sources)
2. Copy avgHomePrice values to `src/data/csv/neighbourhoods.csv`
3. Run `node scripts/process-data.js` to regenerate data.json
