/**
 * Neighbourhood Mapping Configuration
 *
 * Maps our curated neighbourhood IDs to:
 * - onsIds: City of Ottawa ONS IDs (used for boundaries from maps.ottawa.ca)
 * - onsSqoIds: ONS-SQO internal IDs (used for census data from ons-sqo.ca)
 *
 * Data sources:
 * - Boundaries: https://maps.ottawa.ca/arcgis/rest/services/Neighbourhoods/MapServer/0
 * - Census data: https://ons-sqo.ca/wp-json/ons/v1/get-data/data
 */

module.exports = {
  // Central Ottawa
  'the-glebe': {
    name: 'The Glebe',
    onsIds: [923], // Glebe-Dows Lake only
    onsSqoIds: ['3047'], // Glebe - Dows Lake
  },
  'old-ottawa-east': {
    name: 'Old Ottawa East',
    onsIds: [82], // Old Ottawa East
    onsSqoIds: ['3082'], // Old Ottawa East
  },
  'westboro': {
    name: 'Westboro',
    onsIds: [958, 931, 910], // Westboro, Laurentian, McKellar Heights
    onsSqoIds: ['3116', '3063'], // Westboro, Laurentian
  },
  'byward-market': {
    name: 'Byward Market',
    onsIds: [908, 934, 956], // Byward Market, Lowertown, Wateridge Village
    onsSqoIds: ['3067', '3068', '3114'], // Lowertown East, Lowertown West, Wateridge Village
  },
  'centretown': {
    name: 'Centretown',
    onsIds: [24, 957, 28, 60], // Centretown, West Centretown, Civic Hospital, Lebreton
    onsSqoIds: ['3024', '3115', '3029', '3064'], // Centretown, West Centretown, Civic Hospital, Lebreton Development
  },
  'old-ottawa-south': {
    name: 'Old Ottawa South',
    onsIds: [83], // Old Ottawa South only
    onsSqoIds: ['3083'], // Old Ottawa South
  },
  'riverside-park': {
    name: 'Riverside Park',
    onsIds: [90, 91], // Riverside Park, Riverside Park South
    onsSqoIds: ['3098', '3099'], // Riverside Park - Mooney's Bay, Riverside Park South - Revelstoke
  },
  'hintonburg': {
    name: 'Hintonburg',
    onsIds: [47], // Hintonburg-Mechanicsville
    onsSqoIds: ['3055'], // Hintonburg - Mechanicsville
  },
  'wellington-village': {
    name: 'Wellington Village',
    onsIds: [55], // Island Park-Wellington Village
    onsSqoIds: ['3059'], // Island Park - Wellington Village
  },
  'sandy-hill': {
    name: 'Sandy Hill',
    onsIds: [949, 940], // Sandy Hill, Overbrook-McArthur
    onsSqoIds: ['3104', '3087'], // Sandy Hill, Overbrook
  },
  'vanier': {
    name: 'Vanier',
    onsIds: [953, 954], // Vanier North, Vanier South
    onsSqoIds: ['3111', '3112'], // Vanier North, Vanier South
  },
  'new-edinburgh': {
    name: 'New Edinburgh',
    onsIds: [933, 935, 948], // Lindenlea-New Edinburgh, Manor Park, Rockcliffe Park
    onsSqoIds: ['3077', '3069', '3102'], // New Edinburgh, Manor Park, Rockcliffe Park
  },

  // West End
  'bayshore': {
    name: 'Bayshore',
    onsIds: [901, 906, 106, 32], // Bayshore-Belltown, Britannia, Whitehaven-Queensway Terrace North, Crystal Bay
    onsSqoIds: ['3003', '3015', '3117', '3036'], // Bayshore, Britannia, Whitehaven - Woodpark, Crystal Bay - Lakeview Park
  },
  'bells-corners': {
    name: 'Bells Corners',
    onsIds: [6, 7, 12, 88], // Bells Corners East, West, Briar Green-Leslie Park, Qualicum-Redwood Park
    onsSqoIds: ['3007', '3008', '3066', '3092'], // Bells Corners East, Bells Corners West, Leslie Park - Bruce Farm, Qualicum - Redwood
  },
  'carlington': {
    name: 'Carlington',
    onsIds: [18, 950, 31, 16], // Carlington, Skyline-Fisher Heights, Cityview, Carleton Heights
    onsSqoIds: ['3020', '3045', '3028', '3018'], // Carlington, Fisher Heights, City view, Carleton Heights
  },
  'kanata': {
    name: 'Kanata',
    onsIds: [928, 929, 924, 902, 907, 13], // Kanata Lakes, Katimavik-Hazeldean, Glen Cairn, Beaverbrook, Morgan's Grant, Bridlewood-Emerald Meadows
    onsSqoIds: ['3060', '3061', '3048', '3005', '3016', '3014'], // Kanata Lakes, Katimavik-Hazeldean, Glen Cairn, Beaverbrook, Brookside, Bridlewood
  },
  'stittsville': {
    name: 'Stittsville',
    onsIds: [951], // Stittsville
    onsSqoIds: ['3106', '3107', '3108'], // Stittsville, Stittsville East, Stittsville North
  },
  'merivale': {
    name: 'Merivale',
    onsIds: [65, 941, 905, 99, 51], // Merivale Gardens, Parkwood Hills, Borden Farm, Tanglewood, Hunt Club South Industrial
    onsSqoIds: ['3072', '3088', '3012', '3035'], // Merivale Gardens, Parkwood Hills, Borden Farm, Crestview-Tanglewood
  },

  // South End
  'alta-vista': {
    name: 'Alta Vista',
    onsIds: [903, 919, 932, 38, 46, 947, 87], // Billings Bridge-Alta Vista, Elmvale, Heron Gate, Emerald Woods, Hawthorne, Riverview, Playfair Park
    onsSqoIds: ['3002', '3009', '3040', '3065', '3041', '3054', '3101', '3090'], // Alta Vista, Billings Bridge, Elmvale, Heron Gate, Emerald Woods, Hawthorne, Riverview, Playfair Park
  },
  'cyrville': {
    name: 'Cyrville',
    onsIds: [917], // East Industrial (Cyrville area)
    onsSqoIds: ['3057'], // Industrial East
  },
  'hunt-club': {
    name: 'Hunt Club',
    onsIds: [48, 49, 50, 52, 927, 45, 97], // Hunt Club areas + Greenboro
    onsSqoIds: ['3056', '3081', '3052', '3053', '3105', '3011'], // Hunt Club Park, Old Hunt Club, Greenboro East/West, South Keys, Blossom Park
  },
  'barrhaven': {
    name: 'Barrhaven',
    onsIds: [937, 938, 914, 952], // Old Barrhaven East/West, Chapman Mills, Stonebridge
    onsSqoIds: ['3079', '3080', '3027', '3109'], // Old Barrhaven East/West, Chapman Mills, Stonebridge
  },
  'riverside-south': {
    name: 'Riverside South',
    onsIds: [946, 945], // Riverside South-Leitrim, Rideau Crest
    onsSqoIds: ['3100', '3097'], // Riverside South - Leitrim, Rideau Crest - Davidson Heights
  },
  'findlay-creek': {
    name: 'Findlay Creek',
    onsIds: [921], // Findlay Creek
    onsSqoIds: ['3044'], // Findlay Creek
  },
  'manotick': {
    name: 'Manotick',
    onsIds: [64], // Manotick
    onsSqoIds: ['3070'], // Manotick
  },
  'north-gower': {
    name: 'North Gower',
    onsIds: [70], // North Gower-Kars
    onsSqoIds: ['3078'], // North Gower - Kars
  },
  'greely': {
    name: 'Greely',
    onsIds: [925], // Greely
    onsSqoIds: ['3049'], // Greely
  },

  // East End
  'orleans': {
    name: 'Orleans',
    onsIds: [920, 915, 939, 909, 913, 75, 942, 943, 904, 912, 93, 3, 76], // Orleans sub-areas
    onsSqoIds: ['3043', '3032', '3085', '3017', '3025', '3026', '3091', '3095', '3010', '3022', '3004', '3094', '3103'], // Fallingbrook, Convent Glen, Orleans Village, Cardinal Creek, Chapel Hills, Portobello, Queenswood, Blackburn, Carson Grove, Beacon Hill, Queenswood-Chatelaine, Rothwell Heights
  },
  'cumberland': {
    name: 'Cumberland',
    onsIds: [916], // Cumberland
    onsSqoIds: ['3037'], // Cumberland
  },
  'vars': {
    name: 'Vars-Navan',
    onsIds: [955, 936, 918], // Vars, Navan-Sarsfield, Edwards-Carlsbad Springs
    onsSqoIds: ['3113', '3076', '3039'], // Vars, Navan-Sarsfield, Edwards-Carlsbad Springs
  },

  // Rural West
  'carp': {
    name: 'Carp',
    onsIds: [911], // Carp
    onsSqoIds: ['3021'], // Carp
  },
  'corkery': {
    name: 'Corkery',
    onsIds: [30], // Corkery
    onsSqoIds: ['3033'], // Corkery
  },
  'kinburn': {
    name: 'Kinburn',
    onsIds: [930], // Kinburn
    onsSqoIds: ['3062'], // Kinburn
  },
  'constance-bay': {
    name: 'Constance Bay',
    onsIds: [29, 922], // Constance Bay, Fitzroy
    onsSqoIds: ['3031', '3046'], // Constance Bay, Fitzroy
  },
  'dunrobin': {
    name: 'Dunrobin',
    onsIds: [35], // Dunrobin
    onsSqoIds: ['3038'], // Dunrobin
  },
  'richmond': {
    name: 'Richmond',
    onsIds: [944], // Richmond
    onsSqoIds: ['3074'], // Richmond
  },
  'munster-ashton': {
    name: 'Munster-Ashton',
    onsIds: [67], // Munster-Ashton
    onsSqoIds: ['3075'], // Munster-Ashton
  },

  // Rural South
  'metcalfe': {
    name: 'Metcalfe-Osgoode',
    onsIds: [66, 81], // Metcalfe, Osgoode-Vernon
    onsSqoIds: ['3073', '3086'], // Metcalfe, Osgoode-Vernon
  },

  // Pineview / South End
  'pineview': {
    name: 'Pineview',
    onsIds: [86], // Pineview
    onsSqoIds: ['3089'], // Pineview
  },

  // Nepean / Centrepointe area
  'nepean': {
    name: 'Nepean',
    onsIds: [23, 100, 108, 54], // Centrepointe, Trend-Arlington, Craig Henry, Iris
    onsSqoIds: ['3023', '3110', '3034', '3058'], // Centrepointe, Trend-Arlington, Craig Henry-Manordale, Iris
  },
  'belair-heights': {
    name: 'Bel Air Heights',
    onsIds: [11], // Braemar Park - Bel Air Heights - Copeland Park
    onsSqoIds: ['3013'], // Braemar Park - Bel Air Heights - Copeland Park
  },
};
