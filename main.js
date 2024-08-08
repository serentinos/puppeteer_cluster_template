const { Cluster } = require('puppeteer-cluster')
const vanillaPuppeteer = require('puppeteer')
const { addExtra } = require('puppeteer-extra')
const randomUseragent = require('random-useragent');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

async function main() {
  const puppeteer = addExtra(vanillaPuppeteer)
  puppeteer.use(StealthPlugin());

  const cluster = await Cluster.launch({
    puppeteer,
    puppeteerOptions: {
      headless: false,
    },
    
    maxConcurrency: 5,
    concurrency: Cluster.CONCURRENCY_PAGE,
    monitor: true,
    workerCreationDelay: 0,
    skipDuplicateUrls: true,
    retryLimit: 5,
    timeout: 90000,
  })

  const initialTraverseFunction = async ({data: url, page}) => {
    const userAgent = randomUseragent.getRandom();
    await page.setUserAgent(userAgent);
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });
    
    await page.goto(url, { waitUntil: 'networkidle2' });
  
    // Start code here
  };

  cluster.queue('', initialTraverseFunction);
;
  await cluster.idle()
  await cluster.close()
  console.log(`All done ✨`)
}

// Let's go
main().catch(console.warn)