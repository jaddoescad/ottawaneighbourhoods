const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Read neighbourhoods from CSV
const neighbourhoodsCsv = fs.readFileSync(
  path.join(__dirname, '../src/data/csv/neighbourhoods.csv'),
  'utf8'
);
const neighbourhoods = neighbourhoodsCsv
  .split('\n')
  .slice(1)
  .filter(line => line.trim())
  .map(line => {
    const [id, name] = line.split(',');
    return { id, name };
  });

const OUTPUT_DIR = path.join(__dirname, '../public/neighbourhoodcovers/candidates');
const IMAGES_PER_NEIGHBOURHOOD = 5;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to download file
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'OttawaNeighbourhoodsApp/1.0 (https://github.com/example; contact@example.com)'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        file.close();
        fs.unlinkSync(filepath);
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    });

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(err);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Search Wikimedia Commons
async function searchWikimedia(query, limit = 5) {
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=${limit}&format=json`;

  return new Promise((resolve, reject) => {
    https.get(searchUrl, {
      headers: { 'User-Agent': 'OttawaNeighbourhoodsApp/1.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const titles = (json.query?.search || []).map(s => s.title);
          resolve(titles);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

// Get image URL from Wikimedia title
async function getWikimediaImageUrl(title) {
  const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;

  return new Promise((resolve, reject) => {
    https.get(infoUrl, {
      headers: { 'User-Agent': 'OttawaNeighbourhoodsApp/1.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query?.pages || {};
          const page = Object.values(pages)[0];
          const url = page?.imageinfo?.[0]?.url;
          resolve(url || null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// Search Unsplash (no API key needed for small searches via their source)
async function searchUnsplash(query) {
  // Unsplash source URLs for random images matching query
  const urls = [];
  for (let i = 0; i < 3; i++) {
    urls.push(`https://source.unsplash.com/800x600/?${encodeURIComponent(query)},ottawa,canada&sig=${Date.now()}_${i}`);
  }
  return urls;
}

// Generic Ottawa neighbourhood images based on type
function getGenericSearchTerms(name, area) {
  const lowerName = name.toLowerCase();
  const terms = [`Ottawa ${name}`];

  // Add specific landmarks or features
  if (lowerName.includes('glebe')) terms.push('Glebe Ottawa', 'Bank Street Ottawa');
  if (lowerName.includes('westboro')) terms.push('Westboro Ottawa', 'Richmond Road Ottawa');
  if (lowerName.includes('byward') || lowerName.includes('market')) terms.push('Byward Market Ottawa');
  if (lowerName.includes('rideau')) terms.push('Rideau Canal Ottawa');
  if (lowerName.includes('kanata')) terms.push('Kanata Ontario', 'Kanata Ottawa suburban');
  if (lowerName.includes('barrhaven')) terms.push('Barrhaven Ottawa');
  if (lowerName.includes('orleans')) terms.push('Orleans Ottawa');
  if (lowerName.includes('river') || lowerName.includes('bay')) terms.push('Ottawa River');
  if (lowerName.includes('park')) terms.push('Ottawa park');
  if (lowerName.includes('hill')) terms.push('Ottawa neighbourhood');

  // Area-based terms
  if (area?.includes('Rural')) terms.push('Ottawa countryside', 'rural Ontario');
  if (area?.includes('Downtown')) terms.push('downtown Ottawa');
  if (area?.includes('Suburban')) terms.push('Ottawa suburb', 'suburban neighbourhood');

  return terms;
}

async function scrapeImagesForNeighbourhood(neighbourhood) {
  const { id, name } = neighbourhood;
  const neighbourhoodDir = path.join(OUTPUT_DIR, id);

  // Create directory for this neighbourhood
  if (!fs.existsSync(neighbourhoodDir)) {
    fs.mkdirSync(neighbourhoodDir, { recursive: true });
  }

  // Check if already has images
  const existingImages = fs.readdirSync(neighbourhoodDir).filter(f =>
    f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.webp')
  );

  if (existingImages.length >= IMAGES_PER_NEIGHBOURHOOD) {
    console.log(`  Skipping ${name} - already has ${existingImages.length} images`);
    return existingImages.length;
  }

  let downloadedCount = existingImages.length;

  // Search terms
  const searchTerms = [
    `Ottawa ${name}`,
    name,
    `${name} Ontario`,
  ];

  // Try Wikimedia Commons first
  for (const term of searchTerms) {
    if (downloadedCount >= IMAGES_PER_NEIGHBOURHOOD) break;

    console.log(`  Searching Wikimedia for: ${term}`);
    const titles = await searchWikimedia(term, 5);

    for (const title of titles) {
      if (downloadedCount >= IMAGES_PER_NEIGHBOURHOOD) break;

      // Skip non-image files
      if (!title.match(/\.(jpg|jpeg|png|webp|gif)$/i)) continue;

      const imageUrl = await getWikimediaImageUrl(title);
      if (!imageUrl) continue;

      const ext = path.extname(imageUrl).split('?')[0] || '.jpg';
      const filename = `wikimedia_${downloadedCount + 1}${ext}`;
      const filepath = path.join(neighbourhoodDir, filename);

      try {
        await downloadFile(imageUrl, filepath);
        downloadedCount++;
        console.log(`    Downloaded: ${filename}`);
      } catch (err) {
        console.log(`    Failed: ${err.message}`);
      }

      // Small delay to be nice to servers
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Try Unsplash for remaining slots
  if (downloadedCount < IMAGES_PER_NEIGHBOURHOOD) {
    const unsplashTerms = [`Ottawa ${name}`, 'Ottawa neighbourhood', 'Ottawa Canada'];

    for (const term of unsplashTerms) {
      if (downloadedCount >= IMAGES_PER_NEIGHBOURHOOD) break;

      console.log(`  Trying Unsplash for: ${term}`);
      const urls = await searchUnsplash(term);

      for (const url of urls) {
        if (downloadedCount >= IMAGES_PER_NEIGHBOURHOOD) break;

        const filename = `unsplash_${downloadedCount + 1}.jpg`;
        const filepath = path.join(neighbourhoodDir, filename);

        try {
          await downloadFile(url, filepath);

          // Check if file is valid (not too small)
          const stats = fs.statSync(filepath);
          if (stats.size < 10000) {
            fs.unlinkSync(filepath);
            continue;
          }

          downloadedCount++;
          console.log(`    Downloaded: ${filename}`);
        } catch (err) {
          console.log(`    Failed: ${err.message}`);
        }

        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  return downloadedCount;
}

async function main() {
  console.log(`\n=== Scraping Images for ${neighbourhoods.length} Neighbourhoods ===\n`);

  let totalImages = 0;

  for (let i = 0; i < neighbourhoods.length; i++) {
    const n = neighbourhoods[i];
    console.log(`[${i + 1}/${neighbourhoods.length}] ${n.name}`);

    try {
      const count = await scrapeImagesForNeighbourhood(n);
      totalImages += count;
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }

    // Delay between neighbourhoods
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n=== Complete ===`);
  console.log(`Total images downloaded: ${totalImages}`);
  console.log(`Images stored in: ${OUTPUT_DIR}`);
  console.log(`\nNext step: Run the image selector UI to choose images for each neighbourhood`);
}

main().catch(console.error);
