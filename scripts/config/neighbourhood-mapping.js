/**
 * Neighbourhood Mapping Configuration
 *
 * Maps our curated neighbourhood IDs to Ottawa's ONS (Ottawa Neighbourhood Study) IDs.
 * Edit this file to add/remove neighbourhoods or change which ONS areas are included.
 *
 * To find ONS IDs, check: src/data/csv/ons_neighbourhoods.csv
 */

module.exports = {
  // Custom boundary neighbourhoods (processed first to avoid ONS overlap)
  'cedarhill': {
    name: 'Cedar Hill',
    onsIds: [], // No matching ONS area - uses custom boundary
    customBoundary: {
      rings: [[
        [-75.79659555406911, 45.27265500443548],
        [-75.80529566706008, 45.28351031064963],
        [-75.80350663354668, 45.28911089638632],
        [-75.79782979008677, 45.29310502496213],
        [-75.79258478748233, 45.29744749870977],
        [-75.79122708498127, 45.29766478822714],
        [-75.78005736107475, 45.27860391888342],
        [-75.78554957561406, 45.27612867831195],
        [-75.78709229776874, 45.27252405480829],
        [-75.79048649641952, 45.27200291829425],
        [-75.79425078114875, 45.27148219907633],
        [-75.79665725654986, 45.272698437155896],
        [-75.79659555406911, 45.27265500443548], // close polygon
      ]],
    },
  },

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
    onsIds: [47, 54], // Hintonburg-Mechanicsville, Iris-Queensway Terrace South
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
    onsIds: [901, 906, 106, 88, 32], // Bayshore-Belltown, Britannia, Whitehaven-Queensway Terrace North, Qualicum-Redwood Park, Crystal Bay
  },
  'bells-corners': {
    name: 'Bells Corners',
    onsIds: [6, 7, 12], // Bells Corners East, West, Briar Green-Leslie Park
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
    onsIds: [903, 919, 932, 38, 46, 947], // Billings Bridge-Alta Vista, Elmvale, Heron Gate, Emerald Woods, Hawthorne, Riverview
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
    onsIds: [86, 87, 88], // Pineview, Playfair Park-Lynda Park-Guildwood Estates, Qualicum-Redwood Park
  },

  // Nepean / Centrepointe area (Knoxdale-Merivale ward core)
  'nepean': {
    name: 'Nepean',
    onsIds: [23, 100, 108, 76], // Centrepointe, Trend-Arlington, Craig Henry
  },
  'belair-heights': {
    name: 'Bel Air Heights',
    onsIds: [11], // Braemar Park - Bel Air Heights - Copeland Park
  },
};
