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
│   ├── transit_stations_raw.csv  # All 45 transit stations (Transitway + O-Train)
│   ├── crime_raw.csv             # ~98K crimes (2023-2024) from Ottawa Police
│   ├── neighbourhoods.csv        # Neighbourhood info (scores, pros/cons)
│   └── ons_neighbourhoods.csv    # Reference: all 111 ONS area IDs
├── processed/
│   └── data.json                 # Generated output (don't edit directly)
└── neighbourhoods.ts             # TypeScript loader

scripts/
├── process-data.js               # Main processing script
└── config/
    └── neighbourhood-mapping.js  # Maps our neighbourhoods to ONS IDs
```

## Data Sources

All data from **City of Ottawa Open Data** (ArcGIS REST APIs):

| Data | API | Records |
|------|-----|---------|
| Parks | https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/24 | 1,365 |
| Schools | https://maps.ottawa.ca/arcgis/rest/services/Schools/MapServer/0 | 451 |
| Libraries | https://opendata.arcgis.com/datasets/ottawa::ottawa-public-library-locations-2024.geojson | 34 |
| Transit Stations | https://maps.ottawa.ca/arcgis/rest/services/TransitServices/MapServer/0 | 40 |
| O-Train Stations | https://maps.ottawa.ca/arcgis/rest/services/TransitServices/MapServer/1 | 5 |
| Crime (2023-2024) | https://services7.arcgis.com/2vhcNzw0NfUwAD3d/ArcGIS/rest/services/Criminal_Offences_Open_Data/FeatureServer/0 | ~98K |
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

### neighbourhoods.csv
Edit this file to change neighbourhood info displayed on the website:
| Field | Description |
|-------|-------------|
| id | Unique ID (must match neighbourhood-mapping.js) |
| name | Display name |
| area | Area description (Central, West End, etc.) |
| image | Image URL |
| score / rank | Overall score and rank |
| avgRent, walkScore, transit, safety, internetMbps | Quick stats |
| population, avgIncome, restaurants, bikeScore | Details |
| pros | Semicolon-separated list of pros |
| cons | Semicolon-separated list of cons |

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
