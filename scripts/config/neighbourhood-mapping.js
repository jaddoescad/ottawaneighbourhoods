/**
 * Neighbourhood Mapping Configuration
 *
 * Maps our curated neighbourhood IDs to Ottawa's ONS (Ottawa Neighbourhood Study) IDs.
 * Edit this file to add/remove neighbourhoods or change which ONS areas are included.
 *
 * To find ONS IDs, check: src/data/csv/ons_neighbourhoods.csv
 */

module.exports = {
  // Central Ottawa
  'the-glebe': {
    name: 'The Glebe',
    onsIds: [923, 82], // Glebe-Dows Lake, Old Ottawa East
  },
  'westboro': {
    name: 'Westboro',
    onsIds: [958, 931, 910], // Westboro, Laurentian, McKellar Heights
  },
  'byward-market': {
    name: 'Byward Market',
    onsIds: [908, 934, 956], // Byward Market, Lowertown, Wateridge Village
  },
  'centretown': {
    name: 'Centretown',
    onsIds: [24, 957, 28, 60], // Centretown, West Centretown, Civic Hospital, Lebreton
  },
  'old-ottawa-south': {
    name: 'Old Ottawa South',
    onsIds: [83, 90], // Old Ottawa South, Riverside Park
  },
  'hintonburg': {
    name: 'Hintonburg',
    onsIds: [47], // Hintonburg-Mechanicsville
  },
  'little-italy': {
    name: 'Little Italy',
    onsIds: [55], // Island Park-Wellington Village
  },
  'sandy-hill': {
    name: 'Sandy Hill',
    onsIds: [949, 940], // Sandy Hill, Overbrook-McArthur
  },
  'vanier': {
    name: 'Vanier',
    onsIds: [953, 954], // Vanier North, Vanier South
  },
  'new-edinburgh': {
    name: 'New Edinburgh',
    onsIds: [933, 935, 948], // Lindenlea-New Edinburgh, Manor Park, Rockcliffe Park
  },

  // West End
  'bayshore': {
    name: 'Bayshore',
    onsIds: [901, 906, 106, 32], // Bayshore-Belltown, Britannia, Whitehaven-Queensway Terrace North, Crystal Bay
  },
  'bells-corners': {
    name: 'Bells Corners',
    onsIds: [6, 7, 12, 88], // Bells Corners East, West, Briar Green-Leslie Park, Qualicum-Redwood Park
  },
  'carlington': {
    name: 'Carlington',
    onsIds: [18, 950, 31, 16], // Carlington, Skyline-Fisher Heights, Cityview, Carleton Heights
  },
  'kanata': {
    name: 'Kanata',
    onsIds: [928, 929, 924, 902, 907, 13], // Kanata Lakes, Katimavik-Hazeldean, Glen Cairn, Beaverbrook, Morgan's Grant, Bridlewood-Emerald Meadows
  },
  'stittsville': {
    name: 'Stittsville',
    onsIds: [951], // Stittsville
  },
  'merivale': {
    name: 'Merivale',
    onsIds: [65, 941, 905, 99, 51], // Merivale Gardens-Grenfell Glen-Pineglen, Parkwood Hills-Stewart Farm, Borden Farm-Fisher Glen, Tanglewood, Hunt Club South Industrial
  },

  // South End
  'alta-vista': {
    name: 'Alta Vista',
    onsIds: [903, 919, 932, 38, 46, 947, 87], // Billings Bridge-Alta Vista, Elmvale, Heron Gate, Emerald Woods, Hawthorne, Riverview, Playfair Park-Lynda Park-Guildwood Estates
  },
  'cyrville': {
    name: 'Cyrville',
    onsIds: [917], // East Industrial (Cyrville area)
  },
  'hunt-club': {
    name: 'Hunt Club',
    onsIds: [48, 49, 50, 52, 927, 45, 97], // Hunt Club areas + Greenboro
  },
  'barrhaven': {
    name: 'Barrhaven',
    onsIds: [937, 938, 914, 952], // Old Barrhaven East/West, Chapman Mills, Stonebridge (matches Barrhaven East/West wards)
  },
  'riverside-south': {
    name: 'Riverside South',
    onsIds: [946, 945], // Riverside South-Leitrim, Rideau Crest
  },
  'findlay-creek': {
    name: 'Findlay Creek',
    onsIds: [921], // Findlay Creek
  },
  'manotick': {
    name: 'Manotick',
    onsIds: [64], // Manotick
  },
  'north-gower': {
    name: 'North Gower',
    onsIds: [70], // North Gower-Kars
  },
  'greely': {
    name: 'Greely',
    onsIds: [925], // Greely
  },

  // East End
  'orleans': {
    name: 'Orleans',
    onsIds: [920, 915, 939, 909, 913, 75, 942, 943, 916, 904, 912, 93, 3, 76], // Orleans sub-areas, Cumberland, Blackburn, Carson Grove, Beacon Hill, Chatelaine Village
  },
  'vars': {
    name: 'Vars-Navan',
    onsIds: [955, 936, 918], // Vars, Navan-Sarsfield, Edwards-Carlsbad Springs
  },

  // Rural West
  'carp': {
    name: 'Carp',
    onsIds: [911, 30, 930], // Carp, Corkery, Kinburn
  },
  'constance-bay': {
    name: 'Constance Bay',
    onsIds: [29, 922], // Constance Bay, Fitzroy
  },
  'dunrobin': {
    name: 'Dunrobin',
    onsIds: [35], // Dunrobin
  },
  'richmond': {
    name: 'Richmond',
    onsIds: [944, 67], // Richmond, Munster-Ashton
  },

  // Rural South
  'metcalfe': {
    name: 'Metcalfe-Osgoode',
    onsIds: [66, 81], // Metcalfe, Osgoode-Vernon
  },

  // Pineview / South End
  'pineview': {
    name: 'Pineview',
    onsIds: [86], // Pineview
  },

  // Nepean / Centrepointe area (Knoxdale-Merivale ward core)
  'nepean': {
    name: 'Nepean',
    onsIds: [23, 100, 108, 54], // Centrepointe, Trend-Arlington, Craig Henry, Iris-Queensway Terrace South
  },
  'belair-heights': {
    name: 'Bel Air Heights',
    onsIds: [11], // Braemar Park - Bel Air Heights - Copeland Park
  },
};
