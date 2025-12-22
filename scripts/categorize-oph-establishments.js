#!/usr/bin/env node
/**
 * Categorize OPH Food Establishments
 *
 * IMPROVED ALGORITHM:
 * 1. Manual overrides (highest priority)
 * 2. Keyword-based chain patterns (trust the name!)
 * 3. Coordinate + name matching to OSM/grocery (require BOTH to match)
 *
 * Usage: node scripts/categorize-oph-establishments.js
 */

const fs = require('fs');
const path = require('path');

const CSV_DIR = path.join(__dirname, '..', 'src', 'data', 'csv');

// Distance threshold for coordinate matching (in degrees, ~50m)
const COORD_THRESHOLD = 0.0005;

// Minimum name similarity for fuzzy matching (0-1)
const NAME_SIMILARITY_THRESHOLD = 0.6;

// Known chains and keyword patterns for name-based categorization
// ORDER MATTERS - more specific patterns should come first
const CHAIN_PATTERNS = {
  // Institutional (check first - schools, daycares, hospitals, etc.)
  institutional: [
    /\bschool\b/i, /\bacademy\b/i, /\bacadémie/i, /\bécole/i,
    /\bpreschool/i, /\bdaycare/i, /\bday\s*care/i, /\bchild\s*care/i, /\bchildcare/i,
    /\bnursery\s*school/i, /\bmontessori/i, /\blearning\s*centre/i,
    /\bcollege\b/i, /\buniversity/i, /\bcampus/i,
    /\bhospital/i, /\bmedical\s*centre/i, /\bclinic\b/i,
    /\bretirement/i, /\blong\s*term\s*care/i, /\bnursing\s*home/i,
    /\bseniors?\s*(residence|centre|home)/i, /\bcare\s*home/i,
    /\bfraternity/i, /\bsorority/i, /\bdormitor/i,
    /\bchurch\b/i, /\bmosque/i, /\bsynagogue/i, /\btemple\b/i, /\bparish\b/i,
    /\binfant\b/i, /\btoddler/i, /\btiny\s*hoppers/i, /\bkids?\s*&\s*company/i,
    /\bchildren\b/i, /\benfant/i, /\bgarderie/i, /\bcoccinelle/i,
    /\blodge\b/i, /\bmanor\b/i, /\bterrace\b/i,
    /\baramark/i, /\bsodexo/i, /\bcompass\s*group/i, /\bchartwells/i,
    /\bcommunity\s*(centre|center|assoc)/i, /\bcomm\.\s*(centre|ctre|assoc)/i,
    /\blegion\b/i, /\bveteran/i,
    /\bspiritual/i, /\breligious/i, /\bfaith\b/i,
    /\bmuseum/i, /\bgallery/i, /\btheatre/i, /\btheater/i,
    /\bcinema/i, /\blandmark\s*cinema/i, /\bcineplex/i,
    /\bhulse\b/i, /\bafcs\b/i, /\bfood\s*bank/i, /\bfood\s*cupboard/i,
    /\bextendicare/i, /\bgrandir/i, /\bmifo\b/i, /\bvenvi\b/i,
    /\bshelter\b/i, /\bmission\b/i, /\bhospice/i, /\bpalliative/i,
    /\bfuneral/i, /\bcemetery/i,
    /\bamica\b/i, /\bspa\b/i, /\bnails\b/i,
    // French institutions
    /\bcentre\s*(d'accueil|educatif|culturel|parascolaire|de\s*jour)/i,
    /\bcentre\s*(pauline|jules|espoir)/i,
    /\bresidence\b/i, /\brésidence/i,
    /\bchartwell/i, /\bbaycrest/i, /\bchampagne\s*residence/i,
    /\bcampbell\s*house/i, /\bbelvedere/i, /\bcarlingwood/i,
    /\brec\.?\s*(centre|center|complex)/i, /\brecreation/i,
    /\bcommunity\b/i, /\bcomm\b/i, /\bcentre\s*\d+/i,
    /\bblood\s*services/i, /\bcanadian\s*blood/i,
    /\bconvention\s*centre/i, /\bevent\s*centre/i,
    /\bbronson\s*centre/i, /\bcivic\s*centre/i,
    /\btraining\s*centre/i, /\bhockey\s*training/i,
    /\bcanteen\b/i, /\bcafeteria\b/i,
    /\btransitional\s*housing/i, /\bhousing\s*program/i,
    /\bfamily\s*centre/i, /\boutdoor\s*centre/i,
    /\bbingo/i, /\bgaming\s*centre/i,
    /\badult\s*entertainment/i,
    // More institutional patterns
    /\bplaza\b/i, /\bmall\b/i, /\bshopping\s*centre/i,
    /\bart\s*haven/i, /\bkids?\s*(art|paint|craft)/i,
    /\bhair\s*(studio|salon|design|cut)/i, /\bbarber/i, /\bbeauty/i,
    /\bsmoke\s*shop/i, /\bvape\b/i,
    /\bwedding/i, /\bevents?\s*centre/i,
    /\bbaskets?\s*&\s*blooms/i,
    /\bcorporate/i, /\boffice\b/i,
    /\bmemorial\s*hall/i, /\bhall\b/i,
    /\bbelong\b/i, /\bthe\s*well\b/i,
    /\bcornerstone\b/i, /\bprevention/i,
    /\bcosmics?\s*adventure/i, /\bladventure\s*(park|zone|play)/i,
    /\baqua\s*clear/i, /\bwater\s*systems/i,
    /\besports?\b/i, /\bgaming\b/i,
    // Even more institutional
    /\bsymphony\s*senior/i, /\bsenior\s*living/i, /\blevante\s*living/i,
    /\bvilla\b/i, /\bsurveymonkey/i, /\btd\s*center/i,
    /\baids\s*committee/i, /\bliving\s*room/i,
    /\btenant\s*group/i, /\bglebe\s*centre/i,
    /\bchild\s*centre/i, /\bchild\s*center/i, /\bnursery\b/i,
    /\bstudio\s*staja/i,
    /\bnutrition\b/i, /\bnutritionist/i,
  ],
  // Fast food (specific keywords)
  fast_food: [
    /\btim\s*horton/i, /\bmcdonald/i, /\bburger\s*king/i, /\bwendy'?s\b/i,
    /\bsubway\b/i, /\bpizza\s*pizza/i, /\bdomino/i, /\bpapa\s*john/i,
    /\bkfc\b/i, /\bpopeye/i, /\btaco\s*bell/i, /\ba&w\b/i, /\bharvey'?s\b/i,
    /\bfive\s*guys/i, /\bdairy\s*queen/i, /\bchick-?fil-?a/i, /\bchipotle/i,
    /\bpita\s*pit/i, /\bquiznos/i, /\bjimmy\s*john/i, /\bjersey\s*mike/i,
    /\bfirehouse\s*sub/i, /\bpanera/i, /\bdunkin/i, /\bbooster\s*juice/i,
    /\bwingstop/i, /\bbuffalo\s*wild/i,
    /\blittle\s*caesar/i, /\bpizza\s*hut/i, /\bpizza\s*73/i, /\bpanago/i,
    /\bnando'?s/i, /\bst-?hubert/i, /\bswiss\s*chalet/i, /\bmary\s*brown/i,
    /\bchurch'?s\s*chicken/i, /\bfatburger/i, /\bsmashburger/i,
    /\bshawarma\b/i, /\bgyro\b/i, /\bdonair\b/i, /\bkebab\b/i,
    /\bpho\b/i, /\bbanh\s*mi/i,
    /\bhot\s*dog/i, /\bhotdog/i,
    /\bwings\b/i, /\bburger/i, /\bburrito/i, /\btaco\b/i,
    /\bfalafel/i, /\bpoutine/i, /\bfries\b/i, /\bfrench\s*fry/i,
    /\bpizza\b/i, /\bchips?\b/i, /\bsub\b/i, /\bsandwich/i, /\bwrap\b/i,
    /\barby'?s\b/i, /\bboston\s*pizza/i,
    /\beast\s*side\s*mario/i, /\bmontana'?s/i,
    /\bbenny\s*&\s*co/i, /\bbenny'?s/i,
    /\bcora\b/i, /\beggsmart/i, /\bsunset\s*grill/i, /\bben\s*&\s*florentine/i,
    /\bgabriel\s*pizza/i, /\b241\s*pizza/i,
    /\btopper/i, /\bwild\s*wing/i, /\bbeavertail/i,
    /\bbbq\b/i, /\bbarbecue/i,
    /\bexpress\b/i, /\bquick\s*service/i, /\bfast\s*food/i,
    /\bfried\s*chicken/i, /\bchicken\s*(shack|coop|place)/i,
    // More chains and patterns
    /\bbarburrito/i, /\bquesada/i, /\bfat\s*bastard/i,
    /\bchicken\s*street/i, /\bchuck'?s\s*roadhouse/i,
    /\bbombay\s*frankie/i, /\bfrankies\b/i,
    /\bcentrale\s*bergham/i, /\bbergham/i,
    /\bbiryani\b/i, /\bkabab\b/i, /\bkabob/i,
    /\btake-?out\b/i, /\btakeout\b/i, /\btake\s*away/i,
    /\bsnack\s*shack/i, /\bsnack\s*bar/i,
    /\bcathay\b/i, /\bchin\s*hon/i, /\bcharlie\s*chan/i,
    /\bamir\b/i, /\bchawla/i,
    /\bsalad\s*(works|guys)/i, /\bfresh\s*ii/i,
    /\bpanini/i, /\bempanada/i,
    // Even more patterns
    /\bchungchun/i, /\brice\s*dog/i, /\bcorn\s*dog/i,
    /\bchick-?fill?et/i, /\bcluck\b/i,
    /\bchicken\s*cribb/i, /\bcrispy'?s\b/i,
    /\bdakgogi/i, /\bkorean\s*fried/i,
    /\bfresh\s*pasta/i, /\bpasta\s*to\s*go/i,
    /\bbaguette/i, /\bbrochette/i,
    /\bbento\b/i, /\bonigiri/i, /\bjapan/i,
    /\bchennai\b/i, /\bchelia\b/i, /\bmadras/i,
    /\bcopper\s*branch/i, /\bplant-?based/i, /\bvegan\b/i,
    /\breview\s*stand/i, /\brefreshment\s*stand/i,
    /\bcyprus\b/i, /\bgarden\b/i,
    // Additional fast food
    /\btacolot/i, /\btacozzo/i, /\btahini'?s\b/i,
    /\btanghulu/i, /\bcrunch\b/i,
    /\bsmokehouse/i, /\btexas\b/i, /\btornado\b/i,
    /\bjerk\b/i, /\bspecialist\b/i,
    /\blunch\s*lady/i, /\bportable\s*feast/i,
    /\bboil\b/i, /\bcaptains?\s*boil/i,
    /\bdosa\b/i, /\bspot\b/i,
    /\bsuya\b/i, /\bking\b/i, /\bpalace\b/i,
    /\btajine/i, /\bmorgue\b/i,
    /\btasty\b/i, /\btaters\b/i,
    /\btakumi/i, /\btayanti/i, /\btatka/i,
  ],
  // Cafes and coffee shops
  cafe: [
    /\bstarbucks/i, /\bsecond\s*cup/i, /\bbridgehead/i,
    /\bhappy\s*goat/i, /\bequator\b/i, /\bministry\s*of\s*coffee/i,
    /\bcoffee\b/i, /\bcofee\b/i, /\bcafé\b/i, /\bcafe\b/i, /\bespresso/i,
    /\btea\s*(house|room|shop|bar)/i, /\bdavid'?s\s*tea/i,
    /\bbubble\s*tea/i, /\bboba\b/i,
    /\bbliss\b/i, /\bblends\b/i,
    // More cafe/tea chains
    /\bchatime/i, /\bgong\s*cha/i, /\bchicha\s*san\s*chen/i,
    /\bcoco\s*(bubble)?/i, /\bthe\s*alley/i, /\byi\s*fang/i,
    /\btiger\s*sugar/i, /\bkungfu\s*tea/i,
    /\baromatic\s*beans/i, /\broaster/i, /\broastery/i,
    /\bbarista/i, /\blatte\b/i, /\bcappuccino/i,
    /\bchai\b/i, /\bcha\s+/i, /\bmatcha\b/i,
    /\bjuice\s*(bar|shop)/i, /\bsmoothie/i,
    /\ballo\s*mon\s*coco/i,
    // More cafe patterns
    /\btealive/i, /\bcuppa\b/i, /\bchico\b/i,
    /\bpresso\b/i, /\bpress\b/i,
  ],
  // Bakeries
  bakery: [
    /\bbakery/i, /\bboulangerie/i, /\bpatisserie/i, /\bpâtisserie/i,
    /\bpastry/i, /\bpastries/i, /\bbread\b/i, /\bcroissant/i,
    /\bdonut/i, /\bdoughnut/i, /\bcrumbl/i,
    /\bsweets\b/i, /\bdessert/i, /\bcupcake/i, /\bcake/i,
    /\bcookies?\b/i, /\bchocolat/i,
    /\bbeignet/i, /\bcrepe/i, /\bwaffle/i,
    /\bbake\s*shop/i, /\bbakes\b/i, /\bbaked\b/i,
    // More bakery patterns
    /\bconfection/i, /\bmacarons?\b/i, /\bbagel/i,
    /\bbundt/i, /\btart\b/i, /\btarts\b/i,
    /\bbaklawa/i, /\bbaklava/i, /\bsweats\b/i,
    /\bcadman/i, /\bpretzel/i, /\bscone/i,
    /\bcinnaholic/i, /\bcinnamon\s*roll/i, /\bcinna/i,
    /\bcoo\.?ookies/i, /\bcookiebar/i,
    // More bakery/sweets
    /\bsweet\s*(t'?ings|puspin|militia|n\s*salad|hart)/i,
    /\bswt\s*lab/i, /\bdough\s*bros/i,
    /\bcruzie/i, /\bcrate\b/i,
  ],
  // Pubs and breweries
  pub: [
    /\bpub\b/i, /\btavern\b/i, /\bbrewery/i, /\bbrewing/i,
    /\bbrewpub/i, /\bale\s*house/i, /\bbeer\s*(hall|garden)/i,
    /\bcider\s*house/i, /\bdistillery/i,
    // More pub chains
    /\bbig\s*rig/i, /\bbrew\s*revolution/i, /\bbeyond\s*the\s*pale/i,
    /\bbraumeister/i, /\bbierhalle/i,
    /\bbarley\s*mow/i, /\bsmoque\s*shack/i,
    /\bchateau\s*lafayette/i, /\blaff\b/i,
    /\bclock\s*tower/i, /\bcrust\s*(&|and)?\s*crate/i,
    /\bd'?arcy\s*mc?gee/i, /\bmcgee/i, /\birish\b/i,
    /\bjames\s*street/i, /\bpub\s*\d+/i,
    /\bpublic\s*house/i, /\bhouse\s*of\s*targ/i,
    // More pubs
    /\b3\s*brewers/i, /\bles\s*3\s*brasseurs/i, /\bbrasseurs/i,
    /\baulde\s*dubliner/i, /\bdubliner/i,
    /\broyal\s*oak/i, /\bjolly\s*taxpayer/i,
    /\bbelmont\b/i, /\bnewboro/i, /\bgladstone\b/i,
    /\bmoon\s*room/i, /\bbunker\b/i,
    /\bcheshire\s*cat/i, /\bthe\s*hill\b/i,
  ],
  // Bars and lounges
  bar: [
    /\bbar\b/i, /\blounge\b/i, /\bnightclub/i, /\bclub\b/i,
    /\bcocktail/i, /\bwine\s*bar/i, /\bsports\s*bar/i, /\bkaraoke/i,
    /\bcasino/i,
    // More bar patterns
    /\bsocial\b/i, /\bbuvette/i, /\bcantina\b/i,
    /\bwine\s*&?\s*eats/i, /\bsocialhouse/i, /\bcrafthouse/i,
  ],
  // Ice cream
  ice_cream: [
    /\bice\s*cream/i, /\bgelato/i, /\bfrozen\s*yogurt/i, /\bfro-?yo/i,
    /\bbaskin/i, /\bcold\s*stone/i, /\bmarble\s*slab/i,
    /\bsundae/i, /\blemon/i, /\bshave\s*ice/i, /\bshaved\s*ice/i,
    /\bmerry\s*dairy/i, /\bdairy\b/i, /\bsoft\s*serve/i,
    /\bsweet\s*chills/i, /\bcastle\b/i,
  ],
  // Grocery stores (be careful - require strong signals)
  grocery: [
    /\bloblaws/i, /\bsobeys/i, /\bfarm\s*boy/i,
    /\bfood\s*basics/i, /\bfreshco/i, /\bno\s*frills/i, /\bsuperstore/i,
    /\bcostco/i, /\bwalmart\b/i, /\bsam'?s\s*club/i, /\bwhole\s*foods/i,
    /\bsupermarket/i, /\bgrocery/i, /\bgroceries/i, /\bgrocer\b/i,
    /\bfood\s*mart/i, /\bfood\s*market/i, /\bmini\s*mart/i,
    /\bdepanneur/i, /\bcorner\s*store/i, /\bvariety\s*store/i, /\bvariety\b/i,
    /\bgeneral\s*store/i, /\btuck\s*shop/i,
    /\bcircle\s*k/i, /\b7-?eleven/i, /\bmac'?s\b/i, /\bcouche-?tard/i,
    /\bhasty\s*market/i, /\bon\s*the\s*run/i,
    /\bdollarama/i, /\bdollar\s*tree/i, /\bgiant\s*tiger/i,
    /\bcanadian\s*tire/i, /\bcabela/i,
    /\bshoppers\s*drug/i, /\bpharma/i, /\brexall/i,
    /\bconfectionery/i, /\bconvenience\s*store/i,
    /\bgas\s*(bar|station)/i, /\bpetro/i, /\bdrummond/i, /\besso\b/i,
    /\badonis\b/i, /\bmarché\b/i,
    // More grocery patterns
    /\bfoodliner/i, /\bmart\b/i, /\bsari-?sari/i,
    /\bbulk\s*barn/i, /\bbulk\s*food/i,
    /\bconvenience\b/i, /\bquickmart/i, /\bquik\s*mart/i,
  ],
  // Specialty food stores
  specialty_food: [
    /\bmeat\s*shop/i, /\bbutcher/i, /\bmeats\b/i, /\bcharcuterie/i,
    /\bmeat\s*(inc|ltd|market)/i,
    /\bsausage/i, /\bseafood/i, /\bfish\s*(market|shop)/i,
    /\bcheese\s*shop/i, /\bfromagerie/i, /\bdelicatessen/i, /\bdeli\b/i,
    /\bspice/i, /\bherb/i, /\bhealth\s*food/i, /\borganic/i,
    /\bhalal\b/i, /\bkosher\b/i,
    /\bfarm\s*(shop|store|market)/i, /\bfarm\b/i, /\bacres\b/i, /\borchard/i,
    /\bwine\s*cellar/i, /\bwinery/i, /\bvineyard/i,
    /\bhoney\b/i, /\bpoultry/i, /\bimport/i, /\bwholesale/i,
    /\bmarket\s*place/i, /\bfood\s*services?\s*(inc|ltd)/i,
    // More specialty patterns
    /\boriental\s*market/i, /\basian\s*market/i, /\blatin\s*market/i,
    /\bafrican?\s*market/i, /\bmiddle\s*east/i, /\bindian\s*market/i,
    /\bcaribbean\s*market/i, /\bworld\s*food/i, /\binternational\s*food/i,
    /\bolive\s*oil/i, /\bbalsamic/i, /\bvintner/i,
    /\bnut\s*house/i, /\bnuts\b/i, /\bdried\s*fruit/i,
    /\bspices?\s*(shop|store|market)/i, /\bherbs?\s*(shop|store)/i,
    // Even more specialty
    /\bbyward\s*(public\s*)?market/i, /\bcanal\s*market/i,
    /\bbeechwood\s*market/i, /\bbarrhaven\s*market/i,
    /\bpublic\s*market/i, /\bfarmers?\s*market/i,
    /\bchef'?s\s*depot/i, /\bkitchen\s*supply/i,
    /\bcold\s*press/i, /\bkombucha/i, /\bbooch/i,
    /\bcoop\b/i, /\bcooperative/i, /\bsiembra/i,
    /\bla\s*siembra/i, /\bfair\s*trade/i,
    // Candy stores
    /\bsugar\s*(mountain|daddy)/i, /\bcandy\b/i,
    /\bstores?\b/i, /\bthana\s*stores/i,
    /\balmighty\s*cheese/i, /\bcheese\b/i,
    /\bbaker\b/i,
    /\bstinson\b/i,
  ],
  // Catering
  catering: [
    /\bcatering/i, /\bcaterer/i, /\bbanquet/i, /\bevent\s*space/i,
  ],
  // Food trucks
  food_truck: [
    /\bfood\s*truck/i, /\bfood\s*cart/i, /\bfood\s*trailer/i,
    /\bon\s*wheels/i, /\bstreet\s*(cart|eats|food)/i,
  ],
  // Hotels
  hotel: [
    /\bhotel\b/i, /\bmotel\b/i, /\bsuites\b/i, /\binn\b/i,
    /\bmarriott/i, /\bhilton/i, /\bholiday\s*inn/i, /\bbest\s*western/i,
    /\bcomfort\s*inn/i, /\bfairfield/i, /\bhampton/i, /\bcourtyard/i,
    /\bwyndham/i, /\bdays\s*inn/i, /\bramada/i, /\bcrown\s*plaza/i,
    /\bsheraton/i, /\bwestin/i, /\bhyatt/i, /\bnovotel/i,
    /\baquatopia/i, /\bb&b\b/i, /\bbed\s*&\s*breakfast/i,
  ],
  // Sports and recreation
  sports_rec: [
    /\barena\b/i, /\brink\b/i, /\bgolf\b/i, /\btennis/i,
    /\bfitness/i, /\bgym\b/i, /\bymca/i, /\bywca/i,
    /\bpool\b/i, /\brecreation/i,
    /\bsports\s*(complex|facility|centre|club|lab)/i, /\bathletic/i,
    /\bskating/i, /\bskate\b/i, /\bcurling/i, /\bbowling/i,
    /\bpadel\b/i, /\bpickleball/i, /\btrampoline/i,
    /\blinks\b/i, /\bice\s*complex/i,
  ],
  // Restaurants (general - check last among food categories)
  restaurant: [
    /\brestaurant/i, /\bgrill\b/i, /\bbistro/i, /\bkitchen\b/i,
    /\bdiner\b/i, /\beatery/i, /\bsteakhouse/i, /\bsteak\s*house/i, /\bchophouse/i,
    /\btrattoria/i, /\bosteria/i, /\bpizzeria/i, /\btaqueria/i,
    /\bbrasserie/i, /\bchez\b/i,
    /\bramen\b/i, /\bsushi\b/i, /\bwok\b/i, /\bcurry\b/i, /\bnoodle/i,
    /\bindian\b/i, /\bchinese\b/i, /\bthai\b/i, /\bvietnamese/i,
    /\bkorean\b/i, /\bjapanese\b/i, /\bitalian\b/i, /\bmexican/i,
    /\bgreek\b/i, /\blebanese/i, /\bmediterranean/i, /\bmeze\b/i,
    /\bpersian/i, /\bafrican?\b/i, /\bcaribbean/i, /\btropical/i,
    /\bbuffet\b/i, /\ball\s*you\s*can\s*eat/i,
    /\bbrunch/i, /\bbreakfast/i, /\bcuisine/i,
    /\bfine\s*(food|dining)/i, /\bflavou?rs?\b/i,
    /\btaste\s*of\b/i, /\bdrive-?in/i, /\bbowl\b/i,
    /\bfood\s*centre/i, /\bfood\s*center/i,
    // More restaurant chains and patterns
    /\bbaton\s*rouge/i, /\bbrowns?\b/i, /\bkeg\b/i, /\bmilestones/i,
    /\bbeckta/i, /\bcarmelito/i, /\bcucina/i, /\bcasa\b/i,
    /\bbon\s*gout/i, /\bcreole/i, /\bmarrakech/i,
    /\bdesi\b/i, /\bamaya\b/i, /\banabella/i, /\bancest/i,
    /\basian\s*gourmet/i, /\bgourmet\b/i,
    /\bzenshi/i, /\bsashimi/i, /\bteriyaki/i, /\btempura/i, /\bhibachi/i,
    /\bdim\s*sum/i, /\bdumpling/i, /\bgyoza/i, /\bbao\b/i,
    /\btandoori/i, /\bmasala/i, /\bdhaba/i, /\bthali/i,
    /\bdining\b/i, /\beats\b/i, /\bfood\s*co\b/i,
    /\bsocials?\b/i, /\bfoods?\b/i,
    /\bcedars?\b/i, /\bchimnies/i,
    /\bcellar\b/i, /\bcellars\b/i,
    /\bbites\b/i, /\bcravings/i,
  ],
};

// Category priority - lower number = higher priority when multiple patterns match
const CATEGORY_PRIORITY = {
  'institutional': 1,
  'hotel': 2,
  'sports_rec': 3,
  'catering': 4,
  'food_truck': 5,
  'grocery': 6,
  'specialty_food': 7,
  'ice_cream': 8,
  'bakery': 9,
  'pub': 10,
  'bar': 11,
  'cafe': 12,
  'fast_food': 13,
  'restaurant': 14,
};

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function toCSV(rows, headers) {
  let csv = headers.join(',') + '\n';
  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    });
    csv += values.join(',') + '\n';
  }
  return csv;
}

function decodeHtmlEntities(str) {
  return (str || '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '');
}

function normalizeName(name) {
  return decodeHtmlEntities(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function coordsMatch(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return false;
  const latDiff = Math.abs(parseFloat(lat1) - parseFloat(lat2));
  const lngDiff = Math.abs(parseFloat(lng1) - parseFloat(lng2));
  return latDiff < COORD_THRESHOLD && lngDiff < COORD_THRESHOLD;
}

// Calculate string similarity (Jaccard index on words)
function nameSimilarity(name1, name2) {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1;

  const words1 = new Set(n1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(n2.split(' ').filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;

  return intersection / union;
}

function getCategoryFromPatterns(name) {
  const decoded = decodeHtmlEntities(name || '').toLowerCase();
  const matches = [];

  for (const [category, patterns] of Object.entries(CHAIN_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(decoded)) {
        matches.push(category);
        break; // Only count each category once
      }
    }
  }

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Multiple matches - use priority
  matches.sort((a, b) => (CATEGORY_PRIORITY[a] || 99) - (CATEGORY_PRIORITY[b] || 99));
  return matches[0];
}

function loadManualOverrides() {
  const overridesPath = path.join(CSV_DIR, 'oph_manual_overrides.csv');
  if (!fs.existsSync(overridesPath)) return {};

  const overrides = {};
  const content = fs.readFileSync(overridesPath, 'utf-8');
  const lines = content.trim().split('\n').slice(1);

  for (const line of lines) {
    const commaIdx = line.lastIndexOf(',');
    if (commaIdx > 0) {
      const name = line.substring(0, commaIdx).trim();
      const category = line.substring(commaIdx + 1).trim();
      overrides[name.toLowerCase()] = category;
    }
  }
  return overrides;
}

function main() {
  console.log('=== Categorizing OPH Food Establishments ===\n');

  // Load datasets
  console.log('Loading datasets...');

  const ophData = parseCSV(fs.readFileSync(path.join(CSV_DIR, 'oph_food_establishments.csv'), 'utf-8'));
  console.log(`  OPH establishments: ${ophData.length}`);

  const manualOverrides = loadManualOverrides();
  console.log(`  Manual overrides: ${Object.keys(manualOverrides).length}`);

  const osmData = parseCSV(fs.readFileSync(path.join(CSV_DIR, 'osm_food_places.csv'), 'utf-8'));
  console.log(`  OSM food places: ${osmData.length}`);

  const groceryData = parseCSV(fs.readFileSync(path.join(CSV_DIR, 'grocery_stores_raw.csv'), 'utf-8'));
  console.log(`  Grocery stores: ${groceryData.length}`);

  console.log('\nCategorizing with improved algorithm...\n');

  const categorized = [];
  const uncategorized = [];

  const stats = {
    matchedManual: 0,
    matchedPattern: 0,
    matchedOSM: 0,
    matchedGrocery: 0,
    uncategorized: 0,
    byCategory: {},
  };

  for (const oph of ophData) {
    let category = null;
    let matchSource = null;
    let matchedName = null;

    const decodedName = decodeHtmlEntities(oph.NAME);
    const normalizedName = decodedName.toLowerCase().trim();

    // Step 1: Check manual overrides (highest priority)
    if (manualOverrides[normalizedName]) {
      category = manualOverrides[normalizedName];
      matchSource = 'manual_override';
    }

    // Step 2: Pattern matching on the name (trust the name keywords!)
    if (!category) {
      category = getCategoryFromPatterns(oph.NAME);
      if (category) {
        matchSource = 'name_pattern';
      }
    }

    // Step 3: Match against OSM - require BOTH coordinate AND name similarity
    if (!category) {
      let bestMatch = null;
      let bestSimilarity = 0;

      for (const osm of osmData) {
        if (coordsMatch(oph.LATITUDE, oph.LONGITUDE, osm.LATITUDE, osm.LONGITUDE)) {
          const similarity = nameSimilarity(oph.NAME, osm.NAME);
          if (similarity > bestSimilarity && similarity >= NAME_SIMILARITY_THRESHOLD) {
            bestSimilarity = similarity;
            bestMatch = osm;
          }
        }
      }

      if (bestMatch) {
        category = bestMatch.CATEGORY;
        matchSource = 'osm';
        matchedName = bestMatch.NAME;
      }
    }

    // Step 4: Match against grocery stores - require BOTH coordinate AND name similarity
    if (!category) {
      let bestMatch = null;
      let bestSimilarity = 0;

      for (const grocery of groceryData) {
        if (coordsMatch(oph.LATITUDE, oph.LONGITUDE, grocery.LATITUDE, grocery.LONGITUDE)) {
          const similarity = nameSimilarity(oph.NAME, grocery.NAME);
          if (similarity > bestSimilarity && similarity >= NAME_SIMILARITY_THRESHOLD) {
            bestSimilarity = similarity;
            bestMatch = grocery;
          }
        }
      }

      if (bestMatch) {
        category = 'grocery';
        matchSource = 'grocery_dataset';
        matchedName = bestMatch.NAME;
      }
    }

    // Build result row
    const result = {
      ...oph,
      CATEGORY: category || '',
      MATCH_SOURCE: matchSource || '',
      MATCHED_NAME: matchedName || '',
    };

    if (category) {
      categorized.push(result);
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      if (matchSource === 'manual_override') stats.matchedManual++;
      else if (matchSource === 'name_pattern') stats.matchedPattern++;
      else if (matchSource === 'osm') stats.matchedOSM++;
      else if (matchSource === 'grocery_dataset') stats.matchedGrocery++;
    } else {
      uncategorized.push(result);
      stats.uncategorized++;
    }
  }

  // Print stats
  console.log('=== Results ===\n');
  console.log(`Total OPH establishments: ${ophData.length}`);
  console.log(`Categorized: ${categorized.length} (${(categorized.length / ophData.length * 100).toFixed(1)}%)`);
  console.log(`Uncategorized: ${uncategorized.length} (${(uncategorized.length / ophData.length * 100).toFixed(1)}%)`);

  console.log('\nMatch sources:');
  console.log(`  Manual overrides: ${stats.matchedManual}`);
  console.log(`  Name patterns: ${stats.matchedPattern}`);
  console.log(`  OSM (coord+name): ${stats.matchedOSM}`);
  console.log(`  Grocery (coord+name): ${stats.matchedGrocery}`);

  console.log('\nBy category:');
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  // Save outputs
  const headers = ['ID', 'NAME', 'ADDRESS', 'LAST_INSPECTION', 'LATITUDE', 'LONGITUDE', 'CATEGORY', 'MATCH_SOURCE', 'MATCHED_NAME'];

  fs.writeFileSync(
    path.join(CSV_DIR, 'oph_categorized.csv'),
    toCSV(categorized, headers)
  );
  console.log(`\nSaved categorized to: src/data/csv/oph_categorized.csv`);

  fs.writeFileSync(
    path.join(CSV_DIR, 'oph_uncategorized.csv'),
    toCSV(uncategorized, headers)
  );
  console.log(`Saved uncategorized to: src/data/csv/oph_uncategorized.csv`);

  // Show sample of uncategorized
  console.log(`\n=== Sample Uncategorized (first 20) ===`);
  for (const row of uncategorized.slice(0, 20)) {
    console.log(`  ${decodeHtmlEntities(row.NAME)} - ${row.ADDRESS}`);
  }
}

main();
