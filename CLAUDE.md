# Ottawa Neighbourhoods App - Data Documentation

## Data Pipeline
```
Raw CSVs → node scripts/process-data.js → data.json → Website
```

## File Structure
```
src/data/csv/           # Raw data (edit these)
src/data/processed/     # Generated output (don't edit)
scripts/                # Processing & download scripts
scripts/config/neighbourhood-mapping.js  # Maps neighbourhoods to ONS IDs
```

## Data Sources Summary

| Data | API/Source | Records |
|------|------------|---------|
| Parks | maps.ottawa.ca/arcgis/.../Parks_Inventory/MapServer/24 | 1,365 |
| Schools | maps.ottawa.ca/arcgis/.../Schools/MapServer/0 | 451 |
| EQAO Scores | data.ontario.ca | 244 |
| Libraries | opendata.arcgis.com (Ottawa) | 34 |
| Transit Stations | maps.ottawa.ca/arcgis/.../TransitServices/MapServer | 43 |
| Crime (2023-24) | services7.arcgis.com/.../Criminal_Offences_Open_Data | ~98K |
| Collisions (2022-24) | services.arcgis.com/.../Collisions | ~15K |
| Hospitals | maps.ottawa.ca/arcgis/.../Hospitals | 10 |
| Recreation Facilities | maps.ottawa.ca/arcgis/.../City_Facilities/MapServer/5 | 263 |
| Sports Courts | maps.ottawa.ca/arcgis/.../Parks_Inventory (Layers 1,3,19,21,22,27) | 1,389 |
| 311 Requests | 311opendatastorage.blob.core.windows.net | ~685K |
| Restaurants/Grocery | overpass-api.de (OpenStreetMap) | ~1-3K |
| Tree Equity | services5.arcgis.com/.../TES_*_Area_WFL1 (4 transects) | 216 |
| NEI 2019 | maps.ottawa.ca/arcgis/.../Planning/MapServer/109 | 165 |
| Overdose ED | services.arcgis.com/.../Confirmed_Drug_Overdose_ED_Visits | 113 |
| Food Inspections | opendata.ottawa.ca/inspections/yelp_ottawa_healthscores_FoodSafety.zip | ~89K |
| Boundaries | maps.ottawa.ca/arcgis/.../Neighbourhoods/MapServer | 116 |
| Census Data | ons-sqo.ca/wp-json/ons/v1/get-data/data | 116 |

## Key CSV Files

| File | Description |
|------|-------------|
| neighbourhoods.csv | Main neighbourhood info (scores, pros/cons, rent, home prices) |
| parks_raw.csv | Parks with coordinates, type, dog designation |
| schools_raw.csv | Schools with board, category, coordinates |
| eqao_scores.csv | EQAO test scores by school |
| crime_raw.csv | Crime by year, category, neighbourhood |
| collisions_raw.csv | Traffic collisions with severity, involved parties |
| transit_scores.csv | Transit Score (0-100) from GTFS data |
| walk_scores.csv | Walk Score (0-100) from amenity density |
| bike_scores.csv | Bike Score (0-100) from trails/connectivity |
| income_data.csv | Median income from 2021 Census |
| age_demographics.csv | % children, young professionals, seniors |
| commute_times.csv | Commute to downtown by car/transit |
| tree_equity_scores.csv | Tree canopy % and equity score |
| nei_scores.csv | Neighbourhood Equity Index 2019 |
| food_affordability.csv | Food cost burden (% income on food) |
| overdose_by_neighbourhood.csv | Overdose ED visits per 100K |
| food_inspection_scores.csv | Food inspection scores by neighbourhood |

## Common Commands

```bash
# Rebuild website data
node scripts/process-data.js

# Download fresh data
node scripts/download-raw-data.js      # Parks, schools, crime, boundaries
node scripts/download-eqao-data.js     # School scores
node scripts/download-collisions.js    # Traffic collisions
node scripts/download-hospitals.js
node scripts/download-recreation-facilities.js
node scripts/download-sports-courts.js
node scripts/download-tree-equity.js && node scripts/process-tree-equity.js
node scripts/download-nei-scores.js
node scripts/download-overdose-data.js
node scripts/process-311-data.js
node scripts/download-food-inspections.js && node scripts/process-food-inspections.js

# Calculate scores
node scripts/calculate-transit-scores.js
node scripts/calculate-walk-scores.js
node scripts/calculate-bike-scores.js
node scripts/calculate-food-affordability.js

# Generate from census
node scripts/generate-income-data.js
node scripts/generate-age-demographics.js
```

## ONS ID Systems

| System | ID Range | Used For |
|--------|----------|----------|
| Gen 2 (Legacy) | 3-999 | Old references only |
| **Gen 3 / ONS-SQO** | 3001-3117 | Boundaries & census (USE THIS) |

Boundary API: `maps.ottawa.ca/arcgis/.../Neighbourhoods/MapServer/`
- Layer 2 = Gen 3 Boundaries (2024) - **WE USE THIS**

## Neighbourhood Mapping

Edit `scripts/config/neighbourhood-mapping.js`:
```javascript
'findlay-creek': {
  name: 'Findlay Creek',
  onsSqoIds: ['3044'],  // Gen 3 ID - USED for boundaries & census
},
```

## Score Interpretation (0-100)
- 90-100: Excellent
- 70-89: Very Good
- 50-69: Good
- 25-49: Some Options
- 0-24: Minimal

## Key Metrics

**Transit Score** = O-Train access (40pts) + Bus density (40pts) + Bus coverage (20pts)

**Walk Score** = Grocery (30%) + Restaurants (25%) + Recreation (15%) + Parks (15%) + Schools (10%) + Libraries (5%)

**Bike Score** = Walkability (25%) + Downtown proximity (25%) + Greenbelt trails (20%) + Parks (15%) + Transit (15%)

**NEI Score** (Neighbourhood Equity Index): 80-100 high equity, <50 priority neighbourhood

**Tree Equity Score**: 90-100 excellent, <50 priority for tree planting

**Food Cost Burden**: <12% low, 12-16% moderate, 16-20% high, 20-25% very high, >25% severe

**Overdose Rate** (per 100K): <30 low, 30-70 moderate, 70-130 high, >130 very high

**Food Inspection Score** (0-100): Average OPH inspection score. 100 = perfect, city avg ~99.2

## Safety Score Methodology

The Safety Score uses a **population confidence adjustment** to prevent small rural neighbourhoods from dominating rankings simply due to low population.

### Why Population Confidence?
Per capita crime rates can be misleading when comparing different population sizes. Research shows crime doesn't scale linearly with population - maintaining low crime in a dense area is harder than in a rural area with few people.

Reference: [Crime Science - Scaling Laws of Crime](https://link.springer.com/article/10.1186/s40163-021-00155-8)

### Formula
```
Confidence = min(1.0, population / 10,000)
Adjusted Safety = Raw Safety × Confidence + 50 × (1 - Confidence)
```

- **10K+ population**: 100% confidence, full score
- **5K population**: 50% confidence, score pulled halfway to city average (50)
- **2.5K population**: 25% confidence, score pulled 75% toward average

### Example
- **Kinburn** (2,660 pop, very low crime) → Raw: 85, Adjusted: 61
- **Kanata Lakes** (19,945 pop, low crime) → Raw: 69, Adjusted: 69 (full confidence)

Kanata Lakes ranks higher because maintaining low crime with 20K people is more impressive than with 2.7K.

### Safety Score Components
- **Violent Crime (60%)**: Assaults, Robbery, Sexual Violations, Homicide, etc.
- **Property Crime (40%)**: Break & Enter, Theft, Motor Vehicle Theft, Mischief, Arson

**Note**: Traffic collisions and overdose rates are NOT part of Safety Score - they're in Community and Health categories respectively.

## Category Score Breakdown

| Category | Weight | Components |
|----------|--------|------------|
| Safety | 20% | Violent Crime (60%), Property Crime (40%) - with population confidence |
| Schools | 12% | EQAO Scores (70%), School Count (30%) |
| Health & Environment | 12% | Tree Canopy, Hospital Distance, Primary Care, Food Safety, Overdose Rate |
| Amenities | 12% | Parks, Grocery, Dining, Recreation, Libraries |
| Community | 12% | Equity Index, Road Quality, Traffic Collisions, Noise, 311 Requests, Highway Access |
| Nature | 10% | Trails, Cycling Infrastructure |
| Affordability | 10% | Rent, Home Price, Food Cost Burden |
| Walkability | 12% | Walk Score, Transit Score, Bike Score |

## EQAO School Scores

Schools are separated by level with distinct EQAO data:
- **Elementary**: Grades 3 & 6 testing (197 schools with data)
- **Secondary/High School**: Grade 9 Math & OSSLT (47 schools with data)

Fields in data.json:
- `avgEqaoScore` - Combined average
- `avgEqaoScoreElementary` - Elementary only
- `avgEqaoScoreSecondary` - High school only

## Updating Rent/Home Prices

1. Edit `src/data/csv/rent_data.csv` or `home_prices.csv` (include sources)
2. Copy values to `neighbourhoods.csv`
3. Run `node scripts/process-data.js`

**Rent Sources:** Zumper, CMHC, RentCafe, Rentals.ca
**Price Sources:** AgentInOttawa, Zolo, OREB, MyOttawaProperty
