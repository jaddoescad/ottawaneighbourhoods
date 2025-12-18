/**
 * VERIFIED DATA - Parks per Neighbourhood
 *
 * Source: City of Ottawa Open Data - Parks Inventory
 * API: https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/24
 * Method: Point-in-polygon spatial analysis using neighbourhood boundaries
 * Last Updated: 2025-12-17
 * Total Parks Analyzed: 1,336
 */

export interface ParkData {
  count: number;
  sampleParks: string[];
  onsIds: number[]; // Ottawa Neighbourhood Study IDs used for boundary matching
}

export const parksByNeighbourhood: Record<string, ParkData> = {
  'the-glebe': {
    count: 15,
    sampleParks: ["Patterson's Creek Park", "Central Park", "Senator Eugene Forsey Park", "Lionel Britton Park", "Glebe Community Centre"],
    onsIds: [923],
  },
  'westboro': {
    count: 12,
    sampleParks: ["Lion's Park", "Hampton Park", "Iona Park", "Roy Duncan Park", "Heather Crowe Park"],
    onsIds: [958],
  },
  'byward-market': {
    count: 6,
    sampleParks: ["Bingham Park", "Cumberland Park", "Raphael Brunet Park", "Routhier Community Centre", "Ottawa Rowing Club"],
    onsIds: [908],
  },
  'centretown': {
    count: 17,
    sampleParks: ["McNabb Park", "Golden Triangle Park", "Bronson Park", "Ev Tremblay Park", "Lisgar Parkette"],
    onsIds: [24, 957], // Includes West Centretown
  },
  'old-ottawa-south': {
    count: 9,
    sampleParks: ["Windsor Park Ottawa", "Brighton Beach Park", "Osborne Park", "Ottawa South Community Centre"],
    onsIds: [83],
  },
  'hintonburg': {
    count: 10,
    sampleParks: ["Parkdale Park", "McCormick Park", "Stirling-Carruthers Park", "Armstrong Park", "Bayview Friendship Park"],
    onsIds: [47],
  },
  'little-italy': {
    count: 4,
    sampleParks: ["Champlain Park", "Fisher Park", "Remic Beach Complex", "Rockhurst Park"],
    onsIds: [55], // Island Park - Wellington Village area
  },
  'kanata': {
    count: 101,
    sampleParks: ["Seabrooke Park", "Beaufort Park", "John Gooch Park", "Elisha Scharf Park", "Escarpment Park"],
    onsIds: [928, 929, 924, 902], // Kanata Lakes, Katimavik-Hazeldean, Glen Cairn, Beaverbrook
  },
  'alta-vista': {
    count: 19,
    sampleParks: ["Cunningham Woods", "Kaladar Park", "Orlando Park", "WRENS Way", "Robert Andrew Russell Park"],
    onsIds: [903],
  },
  'sandy-hill': {
    count: 10,
    sampleParks: ["Strathcona Park", "Dutchie's Hole Park", "St. Germain Park", "Annie Pootoogook Park", "Robinson Field"],
    onsIds: [949],
  },
  'orleans': {
    count: 141,
    sampleParks: ["Boisdale Park", "Marcel Lalande Park", "Provence Park", "Ruisseau Park", "Pelican Park"],
    onsIds: [920, 915, 939, 909, 913, 75, 942, 943], // Multiple Orleans sub-neighbourhoods
  },
  'barrhaven': {
    count: 115,
    sampleParks: ["Dragonfly Park", "Tiger Lily Park", "Moloughney Park", "Barcham Park", "Foot Guards Park"],
    onsIds: [937, 938, 914, 952, 921], // Old Barrhaven East/West, Chapman Mills, Stonebridge, Findlay Creek
  },
};
