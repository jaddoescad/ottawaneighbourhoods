/**
 * Custom metadata for each neighbourhood page
 * Edit this file to change descriptions for Facebook/SEO
 *
 * Rank is injected dynamically - don't include it here
 */

export interface NeighbourhoodMeta {
  ogDescription: string;   // Facebook/social share description
  metaDescription: string; // SEO meta description (can include {rank})
}

export const neighbourhoodMeta: Record<string, NeighbourhoodMeta> = {
  "kanata": {
    ogDescription: "Family-friendly suburb with top schools, low crime, and great amenities. See the full breakdown.",
    metaDescription: "Kanata ranks #{rank} in Ottawa. See crime stats, school ratings, parks, and amenities that make Kanata a top-rated area.",
  },
  "little-italy": {
    ogDescription: "Walkable, vibrant, and full of character. Ottawa's beloved food and culture hub.",
    metaDescription: "Little Italy ranks #{rank} in Ottawa with excellent walkability and vibrant dining scene. View crime stats, school ratings, and local amenities.",
  },
  "barrhaven": {
    ogDescription: "Fast-growing family suburb with new schools, parks, and shopping. See the stats.",
    metaDescription: "Barrhaven ranks #{rank} in Ottawa. Popular family suburb with growing amenities. See schools, crime stats, and what makes it a top choice.",
  },
  "orleans": {
    ogDescription: "Bilingual family community with excellent parks, schools, and LRT access.",
    metaDescription: "Orleans ranks #{rank} in Ottawa's neighbourhood rankings. Bilingual community with great parks and family amenities.",
  },
  "old-ottawa-south": {
    ogDescription: "Tree-lined streets, canal access, and a tight-knit community feel.",
    metaDescription: "Old Ottawa South ranks #{rank} in Ottawa. Charming, walkable neighbourhood near the canal with great schools.",
  },
  "stittsville": {
    ogDescription: "Small-town feel with big-city amenities. Great for families.",
    metaDescription: "Stittsville ranks #{rank} in Ottawa. Small-town charm with modern amenities on Ottawa's western edge.",
  },
  "alta-vista": {
    ogDescription: "Established, quiet, and central. A hidden gem for families.",
    metaDescription: "Alta Vista ranks #{rank} in Ottawa. Established neighbourhood with mature trees, good schools, and hospital access.",
  },
  "hunt-club": {
    ogDescription: "Affordable, diverse, and well-connected. Great value in south Ottawa.",
    metaDescription: "Hunt Club ranks #{rank} in Ottawa. Affordable area with good transit and diverse community.",
  },
  "merivale": {
    ogDescription: "Central location with easy access to shopping and transit.",
    metaDescription: "Merivale ranks #{rank} in Ottawa. Convenient location with shopping, transit, and affordable housing.",
  },
  "westboro": {
    ogDescription: "Trendy shops, beach access, and one of Ottawa's most walkable areas.",
    metaDescription: "Westboro ranks #{rank} in Ottawa. Trendy, walkable neighbourhood with boutique shops and outdoor lifestyle.",
  },
  "bells-corners": {
    ogDescription: "Affordable west-end living with a growing community feel.",
    metaDescription: "Bells Corners ranks #{rank} in Ottawa. Affordable west-end community with improving amenities.",
  },
  "the-glebe": {
    ogDescription: "Iconic Ottawa neighbourhood. Bank Street shops, Lansdowne, and canal life.",
    metaDescription: "The Glebe ranks #{rank} in Ottawa. Iconic neighbourhood with Bank Street shopping, parks, and canal access.",
  },
  "riverside-south": {
    ogDescription: "New community with modern homes and young families. Growing fast.",
    metaDescription: "Riverside South ranks #{rank} in Ottawa. New development with young families and modern homes.",
  },
  "nepean": {
    ogDescription: "Established suburb with diverse housing options and solid amenities.",
    metaDescription: "Nepean ranks #{rank} in Ottawa. Large suburban area with diverse housing and good amenities.",
  },
  "hintonburg": {
    ogDescription: "Artsy, hip, and full of great cafes. Wellington West at its best.",
    metaDescription: "Hintonburg ranks #{rank} in Ottawa. Hip, artsy neighbourhood with great cafes and Wellington West vibe.",
  },
  "vanier": {
    ogDescription: "Up-and-coming with real character. Ottawa's most underrated neighbourhood?",
    metaDescription: "Vanier ranks #{rank} in Ottawa. Up-and-coming neighbourhood with character, diversity, and improving amenities.",
  },
  "centretown": {
    ogDescription: "Downtown Ottawa living. Walk everywhere, transit at your door.",
    metaDescription: "Centretown ranks #{rank} in Ottawa. Downtown living with top walkability and urban convenience.",
  },
  "bayshore": {
    ogDescription: "West-end transit hub with shopping and diverse community.",
    metaDescription: "Bayshore ranks #{rank} in Ottawa. West-end hub with major mall, transit, and diverse community.",
  },
  "carlington": {
    ogDescription: "Affordable and central. One of Ottawa's best-kept secrets.",
    metaDescription: "Carlington ranks #{rank} in Ottawa. Affordable central neighbourhood with good transit access.",
  },
  "byward-market": {
    ogDescription: "Ottawa's historic heart. Restaurants, nightlife, and pure urban energy.",
    metaDescription: "Byward Market ranks #{rank} in Ottawa. Historic heart of the city with top walkability and nightlife.",
  },
  "new-edinburgh": {
    ogDescription: "Historic village charm with riverside trails and beautiful homes.",
    metaDescription: "New Edinburgh ranks #{rank} in Ottawa. Historic village feel with riverside trails and upscale homes.",
  },
  "constance-bay": {
    ogDescription: "Lakeside rural living. Beach access and cottage vibes year-round.",
    metaDescription: "Constance Bay ranks #{rank} in Ottawa. Rural lakeside living with beach access and cottage country vibes.",
  },
  "manotick": {
    ogDescription: "Historic village charm on the Rideau River. Upscale rural living.",
    metaDescription: "Manotick ranks #{rank} in Ottawa. Charming village with heritage main street and riverside setting.",
  },
  "richmond": {
    ogDescription: "Small village feel with rural charm. Growing community.",
    metaDescription: "Richmond ranks #{rank} in Ottawa. Small village community with rural character and growing families.",
  },
  "dunrobin": {
    ogDescription: "Country living on large lots. Rural peace close to the city.",
    metaDescription: "Dunrobin ranks #{rank} in Ottawa. Rural west-end community with large lots and country living.",
  },
  "north-gower": {
    ogDescription: "Quiet village life in Ottawa's rural south.",
    metaDescription: "North Gower ranks #{rank} in Ottawa. Quiet rural village with small-town community feel.",
  },
  "sandy-hill": {
    ogDescription: "Historic homes near uOttawa. Embassies and tree-lined streets.",
    metaDescription: "Sandy Hill ranks #{rank} in Ottawa. Historic neighbourhood near uOttawa with beautiful old homes.",
  },
  "carp": {
    ogDescription: "Famous farmers market and true rural village character.",
    metaDescription: "Carp ranks #{rank} in Ottawa. Rural village with famous farmers market and country atmosphere.",
  },
  "pineview": {
    ogDescription: "Quiet south Ottawa living with affordable housing options.",
    metaDescription: "Pineview ranks #{rank} in Ottawa. Quiet residential area in south Ottawa with affordable homes.",
  },
  "metcalfe-osgoode": {
    ogDescription: "Rural farming communities with country homes and open space.",
    metaDescription: "Metcalfe-Osgoode ranks #{rank} in Ottawa. Rural communities with farming heritage and country homes.",
  },
  "greely": {
    ogDescription: "Growing rural community with new homes and family appeal.",
    metaDescription: "Greely ranks #{rank} in Ottawa. Growing rural community with new developments and family appeal.",
  },
  "cyrville": {
    ogDescription: "East-end LRT access with affordable housing options.",
    metaDescription: "Cyrville ranks #{rank} in Ottawa. East-end area with LRT access and affordable housing.",
  },
  "bel-air-heights": {
    ogDescription: "Quiet streets and mature trees near Carlingwood Mall.",
    metaDescription: "Bel Air Heights ranks #{rank} in Ottawa. Quiet residential area near Carlingwood with mature trees.",
  },
  "vars-navan": {
    ogDescription: "Rural eastern Ottawa. Country living and wide open spaces.",
    metaDescription: "Vars-Navan ranks #{rank} in Ottawa. Rural east-end communities with country living and open spaces.",
  },
  "findlay-creek": {
    ogDescription: "Brand new community with modern homes. Popular with young families.",
    metaDescription: "Findlay Creek ranks #{rank} in Ottawa. New south-end development with modern homes and young families.",
  },
};

// Fallback for any neighbourhood not in the list
export const defaultMeta: NeighbourhoodMeta = {
  ogDescription: "Crime stats, schools, walkability, rent and more. See the full breakdown.",
  metaDescription: "See how this Ottawa neighbourhood ranks. Crime stats, school ratings, walkability, rent prices and more.",
};
