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
    onsIds: [958, 931, 910, 32], // Westboro, Laurentian, McKellar Heights, Crystal Bay
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
    onsIds: [901, 906], // Bayshore-Belltown, Britannia
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
    onsIds: [928, 929, 924, 902], // Kanata Lakes, Katimavik, Glen Cairn, Beaverbrook
  },
  'stittsville': {
    name: 'Stittsville',
    onsIds: [951, 907], // Stittsville, Brookside-Briarbrook-Morgan's Grant
  },

  // South End
  'alta-vista': {
    name: 'Alta Vista',
    onsIds: [903, 919, 932, 38, 46], // Billings Bridge-Alta Vista, Elmvale, Heron Gate, Emerald Woods, Hawthorne
  },
  'hunt-club': {
    name: 'Hunt Club',
    onsIds: [48, 49, 50, 52, 927, 45, 97], // Hunt Club areas + Greenboro
  },
  'barrhaven': {
    name: 'Barrhaven',
    onsIds: [937, 938, 914, 952, 921], // Old Barrhaven East/West, Chapman Mills, Stonebridge, Findlay Creek
  },
  'riverside-south': {
    name: 'Riverside South',
    onsIds: [946, 945], // Riverside South-Leitrim, Rideau Crest
  },
  'manotick': {
    name: 'Manotick',
    onsIds: [64, 70, 925], // Manotick, North Gower-Kars, Greely
  },

  // East End
  'orleans': {
    name: 'Orleans',
    onsIds: [920, 915, 939, 909, 913, 75, 942, 943, 916, 904, 912, 93, 3], // Orleans sub-areas, Cumberland, Blackburn, Carson Grove, Beacon Hill
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
    onsIds: [29, 35, 922], // Constance Bay, Dunrobin, Fitzroy
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

  // Nepean / South Keys area
  'nepean': {
    name: 'Nepean',
    onsIds: [23, 65, 941, 905, 100, 99, 108, 106, 11, 86, 87, 88, 76, 13, 85, 947], // Centrepointe, Merivale, Parkwood Hills, etc.
  },
};
