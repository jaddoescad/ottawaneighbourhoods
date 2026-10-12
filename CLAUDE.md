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
| EQAO Scores (3-yr avg) | data.ontario.ca (package_show, last 3 school years) | 248 |
| Libraries | opendata.arcgis.com (Ottawa) | 34 |
| Transit Stations | maps.ottawa.ca/arcgis/.../TransitServices/MapServer | 43 |
| Crime (2023-24) | services7.arcgis.com/.../Criminal_Offences_Open_Data | ~98K |
| Collisions (2022, 2024) | services.arcgis.com/.../Traffic_Collisions_by_Location_2017-2024_(excluding_2023) | ~29K |
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
| Zoning | maps.ottawa.ca/arcgis/.../Zoning/MapServer/3 | 14K polygons |
| Address points | maps.ottawa.ca/arcgis/.../Municipal_Address/MapServer/0 | 404K |
| Road classes & pavement age | maps.ottawa.ca/arcgis/.../Road_Information/MapServer/3, /5 | – |
| OC Transpo GTFS | oct-gtfs (unzipped to scripts/data/gtfs) | 5K stops |
| Park polygons | maps.ottawa.ca/arcgis/.../Parks_Inventory/MapServer/24 | 1,356 |
| Large greenspace (NCC etc.) | overpass-api.de (leisure=park/nature_reserve ≥4 ha) | 191 areas |
| Clinics (interim primary care) | overpass-api.de (amenity=doctors/clinic) | 240 |

## Key CSV Files

| File | Description |
|------|-------------|
| neighbourhoods.csv | Main neighbourhood info (scores, pros/cons, rent, home prices) |
| parks_raw.csv | Parks with coordinates, type, dog designation |
| schools_raw.csv | Schools with board, category, coordinates |
| eqao_scores.csv | EQAO test scores by school |
| crime_raw.csv | Crime by year, category, neighbourhood |
| collisions_raw.csv | Traffic collisions with severity, involved parties |
| residential_grid.csv | 100 m cells of residential address points (resident-weighting layer) |
| crime_zone_tags.csv | Zoning class for each crime_raw.csv row (same order) |
| road_stats_by_neighbourhood.csv | Road km by class, pavement age |
| major_road_points.csv | Freeway/arterial centreline points (40 m) |
| transit_stop_frequency.csv | Weekday 7-9 am departures per stop and route-direction |
| park_edge_points.csv / osm_greenspace_edge_points.csv | Park boundary points (50 m) |
| clinics_raw.csv | Family practice / walk-in clinics (OSM) |
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

# Derived layers used by scoring (re-run when sources change)
node scripts/download-zoning.js && node scripts/tag-crime-zones.js
node scripts/download-roads.js
node scripts/download-residential-points.js   # needs zoning + roads
node scripts/download-park-polygons.js
node scripts/download-osm-greenspace.js
node scripts/download-clinics.js
node scripts/process-gtfs-frequency.js        # needs GTFS in scripts/data/gtfs

# Scoring checks
node scripts/check-scoring.js
node scripts/generate-scoring-docs.js         # after editing src/data/scoring-config.json

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

<!-- scoring:start (generated by scripts/generate-scoring-docs.js; edit src/data/scoring-config.json instead) -->
## Scoring Model

Single source of truth: `src/data/scoring-config.json` (v2). The pipeline (`scripts/lib/scoring.js`), the UI (`src/lib/scoring.ts`), the /methodology page and this section all read it.

Each metric is converted to a 0-100 score with fixed breakpoints (piecewise-linear, not relative to other neighbourhoods). Metrics are averaged into categories using the weights below, and categories into the overall score. Distances and shares are measured from where residents live (municipal address points on residential zoning, with apartment addresses weighted by their units), weighted by population.

- Metric score: piecewise-linear between fixed `[value, score]` breakpoints, clamped. Missing input is `null`, never 0.
- Category score: weighted mean of metrics with data. `categoryCoverage` = share of metric weight with data; below 70% (or the category's `minCoverage`) the category is `null`, left out of the overall score, and `scoreIncomplete` is set.
- Overall score: weighted mean of the rounded category scores (renormalized over available categories).
- Count-based rates (crime, overdose, collisions) use symmetric shrinkage: `(count + k × cityRate) / (exposure + k)`, k = 5000 person-years (30 road-km-years for collisions).
- Rank: competition ranking on the rounded overall score (ties share a rank). `rankRange` = p10–p90 rank over 500 runs with each category weight × U(0.8, 1.2). `tier`: Top 10% / Top 25% / Top half / Bottom half.
- Score labels: Excellent 80+, Very good 75+, Good 65+, Fair 55+, Poor 0+. Each tier lists its `allowedLabels` (Top 10%: Excellent/Very good; Top 25%: Excellent/Very good/Good; Top half: Very good/Good; Bottom half: Good/Fair/Poor); `check-scoring.js` fails if a label contradicts its tier.
- Distances and access shares are measured from residential address points (`src/data/csv/residential_grid.csv`), weighted by population.
- Dwelling weights (`scripts/lib/population.js`): house-zone addresses count 1; apartment / mixed-use addresses get a per-neighbourhood weight (max 25) so that addresses existing on Census day (2021-05-11) match 2021 Census households. Where addresses exceed households, all are scaled down equally.
- Population growth: each rate divides by 2021 Census population × (weighted dwellings at the data period's midpoint minus 1 year / weighted dwellings on Census day). Crime uses its own years, overdose its own years, access metrics today's dwellings. Context field `crimePopulation` shows the crime denominator.

| Category | Weight | Metrics (weight within category) |
|---|---|---|
| Safety (`safety`) | 25% | Violent crime near homes 50%; Property crime near homes 30%; Injury collisions on local roads 20% |
| Schools (`schools`) | 15% | Nearest elementary schools (EQAO) 45%; Nearest high schools (EQAO / OSSLT) 20%; Distance to an elementary school 35% |
| Amenities (`amenities`) | 15% | Grocery store within 1 km 25%; Park within 400 m 20%; 5+ places to eat within 800 m 20%; Recreation facility within 1.5 km 15%; Distance to a library 20% |
| Getting Around (`gettingAround`) | 15% | Peak transit service near home 35%; Distance to downtown 25%; Protected bike route within 400 m 25%; Distance to a highway 15% |
| Nature (`nature`) | 10% | Tree canopy 35%; Large greenspace within 1 km 35%; Parkland nearby per 1,000 residents 30% |
| Affordability (`affordability`) | 10% | Typical rent 50%; Typical home value 50% |
| Health & Environment (`healthEnvironment`) | 10% | Distance to an emergency department 40%; Overdose ED visits 25%; Homes next to major roads 20%; Distance to a family / walk-in clinic 15% |

### Metric definitions

- **violentCrime** (Safety; per 1,000 residents / yr; lower is better): Police-reported violent incidents (2023-24) on residential land, plus half of those on main-street / mixed-use land, per 1,000 residents per year. Residents are the 2021 Census population grown by the homes built since. Small neighbourhoods are shrunk toward the city rate. Breakpoints: 2→100, 4→80, 7→60, 11→40, 16→20, 25→0. Source: Ottawa Police Service Criminal Offences; City of Ottawa Zoning By-law 2008-250.
- **propertyCrime** (Safety; per 1,000 residents / yr; lower is better): Break-ins, theft, vehicle theft, mischief and arson on residential land, plus half of those on mixed-use land, per 1,000 residents (grown since 2021) per year, shrunk toward the city rate. Breakpoints: 5→100, 10→80, 16→60, 24→40, 35→20, 50→0. Source: Ottawa Police Service Criminal Offences; City of Ottawa Zoning By-law 2008-250.
- **roadSafety** (Safety; per 10 km of road / yr; lower is better): Injury collisions (2022 and 2024; the City has not published 2023) per 10 km of non-freeway road per year. Fatal and major-injury collisions count three times and any collision involving a pedestrian or cyclist counts double. Freeway collisions are excluded. Shrunk toward the city rate for short road networks. Breakpoints: 1→100, 2→80, 3→60, 4.5→40, 7→20, 12→0. Source: City of Ottawa Traffic Collision Data; Roads - Classification.
- **elementaryEqao** (Schools; % meeting standard; higher is better): For each home, the 3-year EQAO average of the nearest English public (OCDSB) and English Catholic (OCSB) elementary schools, averaged across residents. EQAO results also reflect family income, not only school quality. Breakpoints: 40→0, 50→25, 60→50, 70→75, 80→95, 85→100. Source: Ontario School Information and Student Demographics (2022-23 to 2024-25); City of Ottawa Schools.
- **secondaryEqao** (Schools; % meeting standard; higher is better): For each home, the 3-year average of Grade 9 math and Grade 10 literacy results at the nearest OCDSB and OCSB secondary schools. Breakpoints: 40→0, 55→30, 65→55, 75→80, 85→100. Source: Ontario School Information and Student Demographics (2022-23 to 2024-25).
- **elementaryDistance** (Schools; km; lower is better): Average straight-line distance from homes to the nearest public elementary school of any board. Breakpoints: 0.4→100, 0.8→85, 1.5→60, 3→30, 6→0. Source: City of Ottawa Schools.
- **groceryAccess** (Amenities; % of residents; higher is better): Share of residents living within 1 km (straight line) of a grocery store. Breakpoints: 0→0, 90→100. Source: Ottawa Public Health food premises, categorized.
- **parkAccess** (Amenities; % of residents; higher is better): Share of residents within 400 m of the edge of a City park. Breakpoints: 0→0, 95→100. Source: City of Ottawa Parks and Greenspace.
- **diningAccess** (Amenities; % of residents; higher is better): Share of residents with at least five restaurants, cafes, bakeries or pubs within 800 m. Breakpoints: 0→0, 90→100. Source: Ottawa Public Health food premises, categorized.
- **recreationAccess** (Amenities; % of residents; higher is better): Share of residents within 1.5 km of a City pool, arena, rink or community centre. Breakpoints: 0→0, 90→100. Source: City of Ottawa recreation facilities.
- **libraryDistance** (Amenities; km; lower is better): Average distance from homes to the nearest Ottawa Public Library branch. Breakpoints: 1→100, 2→80, 3.5→60, 6→35, 10→10, 15→0. Source: Ottawa Public Library.
- **transitFrequency** (Getting Around; departures / hour; higher is better): Weekday 7-9 am departures per hour within 400 m (bus) or 800 m (O-Train), counting each route and direction once, averaged across residents. Breakpoints: 0→0, 4→25, 10→50, 20→75, 40→100. Source: OC Transpo GTFS.
- **downtownDistance** (Getting Around; km; lower is better): Average straight-line distance from homes to downtown (Parliament Hill), the city's largest employment centre. Breakpoints: 3→100, 6→85, 10→65, 15→45, 25→20, 40→0. Source: Computed from resident locations.
- **bikewayAccess** (Getting Around; % of residents; higher is better): Share of residents within 400 m of a multi-use path, cycle track or segregated bike lane. Painted lanes, suggested routes and paved shoulders don't count. Breakpoints: 0→0, 90→100. Source: City of Ottawa Cycling Network.
- **highwayAccess** (Getting Around; km; lower is better): Average distance from homes to the nearest freeway or provincial highway. Breakpoints: 1→100, 2→85, 4→65, 7→40, 12→15, 20→0. Source: City of Ottawa Roads - Classification.
- **treeCanopy** (Nature; % coverage; higher is better): Share of land under tree canopy (2024). Ottawa's urban forest target is 40%. Breakpoints: 0→0, 10→20, 20→45, 30→70, 40→90, 50→100. Source: ONS-SQO / City of Ottawa tree canopy 2024.
- **greenspaceAccess** (Nature; % of residents; higher is better): Share of residents within 1 km of a park or nature area of 4 ha or more (City or federal/NCC land), or an NCC Greenbelt trail. Breakpoints: 0→0, 90→100. Source: City of Ottawa Parks and Greenspace; OpenStreetMap (for NCC and provincial land); NCC Greenbelt trails.
- **parklandPerResident** (Nature; ha / 1,000 residents; higher is better): Hectares of City parkland within 1 km of each home divided by the residents who share it. The City's planning standard is 2 ha per 1,000 residents. Breakpoints: 0→0, 1→35, 2→65, 4→85, 8→100. Source: City of Ottawa Parks and Greenspace.
- **rent** (Affordability; $ / month; lower is better): 2021 Census median monthly rent, scaled to today's market by one citywide factor (median ratio of sourced 2024-25 listings to 2021 Census rents). Breakpoints: 1300→100, 1600→80, 1900→60, 2200→40, 2600→20, 3200→0. Source: Statistics Canada 2021 Census via ONS-SQO; Zumper / CMHC / RentCafe listings for the citywide factor.
- **homePrice** (Affordability; $; lower is better): 2021 Census median value of owned dwellings, scaled to today's market by one citywide factor (median ratio of sourced recent sales to 2021 Census values). Breakpoints: 400000→100, 550000→80, 700000→60, 900000→40, 1200000→20, 1600000→0. Source: Statistics Canada 2021 Census via ONS-SQO; AgentInOttawa / Zolo sales for the citywide factor.
- **emergencyAccess** (Health & Environment; km; lower is better): Average distance from homes to the nearest 24/7 adult emergency department (Civic, General, Queensway-Carleton, Montfort). Hospitals without an emergency department (Riverside, Royal Ottawa, Bruyère, Saint-Vincent, the Rehabilitation Centre) don't count. Breakpoints: 3→100, 6→85, 10→65, 15→45, 25→20, 40→0. Source: City of Ottawa Hospitals.
- **overdose** (Health & Environment; per 100K / yr; lower is better): Overdose emergency visits per 100,000 residents per year (2020-24), shrunk toward the city rate for small neighbourhoods. Breakpoints: 20→100, 40→85, 70→65, 120→40, 200→15, 300→0. Source: Ottawa Public Health.
- **noiseExposure** (Health & Environment; % of homes; lower is better): Share of homes (apartment addresses weighted by their units) within 150 m of a freeway or 50 m of an arterial road, a standard proxy for traffic noise and air pollution exposure. Breakpoints: 0→100, 5→85, 10→70, 20→45, 35→20, 50→0. Source: City of Ottawa Municipal Address Points; Roads - Classification.
- **primaryCareAccess** (Health & Environment; km; lower is better): Interim measure: average distance to the nearest family practice or walk-in clinic mapped in OpenStreetMap. OSM coverage is incomplete; this will be replaced by neighbourhood primary-care attachment rates when they are published. Breakpoints: 0.5→100, 1→85, 2→65, 5→35, 10→10, 15→0. Source: OpenStreetMap contributors.

### Shown but not scored

- **allCrimeRate**: All police-reported incidents. Every incident in the neighbourhood divided by residents. Inflated in areas with many visitors, so it is shown but not scored.
- **crimePopulation**: Residents used for crime rates. 2021 Census population grown by the dwellings added since (municipal address points), estimated for the crime data period, so fast-growing suburbs are not divided by an out-of-date population.
- **commercialAreaCrime**: Incidents in commercial / institutional areas. Incidents on land zoned commercial, industrial, institutional or park. Reflects visitor activity more than risk at home.
- **allCollisions**: All collisions. Every reported collision, including property-damage-only.
- **schoolsInBoundary**: Schools inside the boundary. Count of schools located inside the neighbourhood polygon. Not scored, since children often attend schools just outside it.
- **walkScore**: Walk Score (official). Population-weighted mean Walk Score published by ONS-SQO. Shown for reference; the Amenities metrics above measure the same thing directly.
- **bikeScore**: Bike Score (official). Population-weighted mean Bike Score published by ONS-SQO.
- **longCommutePct**: Workers commuting 60+ min. 2021 Census. Collected during the pandemic, so shown for context only.
- **pavementAge**: Average pavement age. Length-weighted average age of road surface. Age is not condition, so it is not scored.
- **foodSafety**: Food inspection average. Average Ottawa Public Health inspection score. Nearly every neighbourhood is between 97 and 100, so it is not scored.
- **marketRent**: Recent listing rent (sample). Hand-collected listing average where a source exists; marked estimate otherwise.
- **marketHomePrice**: Recent sale price (sample). Hand-collected sales figure where a source exists; marked estimate otherwise.
- **neiScore**: Neighbourhood Equity Index (2019). City of Ottawa equity index used to prioritize investment. It measures disadvantage, not liveability, so it is not scored.
- **serviceRequestRate**: 311 requests. Reflects how often residents call 311 as much as conditions on the ground.

### Presets (home page "Customize")

- **Balanced**: safety 25%, schools 15%, amenities 15%, gettingAround 15%, nature 10%, affordability 10%, healthEnvironment 10%
- **Families**: safety 25%, schools 25%, amenities 10%, gettingAround 5%, nature 15%, affordability 10%, healthEnvironment 10%
- **Car-free**: safety 15%, schools 5%, amenities 25%, gettingAround 35%, nature 5%, affordability 10%, healthEnvironment 5%
- **On a budget**: safety 20%, schools 10%, amenities 10%, gettingAround 15%, nature 5%, affordability 35%, healthEnvironment 5%
- **Retirees**: safety 25%, schools 0%, amenities 20%, gettingAround 10%, nature 15%, affordability 5%, healthEnvironment 25%

### Checks

```bash
node scripts/check-scoring.js            # config sanity, data integrity, docs in sync, validation correlations
node scripts/compare-scores.js <before.json> [--out file.md]   # before/after scores and ranks
node scripts/generate-scoring-docs.js    # rewrite this section after editing the config
```
<!-- scoring:end -->

## EQAO School Scores

`eqao_scores.csv` holds a 3-school-year average (2022-23 to 2024-25). Schools are matched to EQAO rows within the same board, preferring the school's own level:
- **Elementary**: Grades 3 & 6 testing
- **Secondary/High School**: Grade 9 Math & OSSLT

Scoring uses the nearest OCDSB and OCSB school to each home (`elementaryEqao`, `secondaryEqao`), not the schools inside the boundary.

Fields in data.json:
- `avgEqaoScore` - Combined average
- `avgEqaoScoreElementary` - Elementary only
- `avgEqaoScoreSecondary` - High school only

## Updating Rent/Home Prices

Scored rent and home value (`avgRent`, `avgHomePrice`) are 2021 Census medians × one citywide factor. The factor is the median ratio of sourced figures in `rent_data.csv` / `home_prices.csv` to the census value; rows whose source contains "Estimat" are ignored. The hand-collected figures are shown as unscored context (`contextValues.marketRent`, `marketHomePrice`).

1. Edit `src/data/csv/rent_data.csv` or `home_prices.csv` (include sources)
2. Run `node scripts/process-data.js`

**Rent Sources:** Zumper, CMHC, RentCafe, Rentals.ca
**Price Sources:** AgentInOttawa, Zolo, OREB, MyOttawaProperty
