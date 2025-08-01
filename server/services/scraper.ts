import axios from "axios";
import * as cheerio from "cheerio";
import { ScrapingConfig } from "@shared/schema";

export class ScraperService {
  private defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  async scrapeWebsite(
    url: string, 
    config: ScrapingConfig
  ): Promise<{ data: any[], metadata: any }> {
    try {
      const response = await axios.get(url, {
        headers: { ...this.defaultHeaders, ...config.headers },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const scrapedData: any[] = [];

      // Extract data based on configuration
      config.dataPoints.forEach(dataPoint => {
        if (config.selector) {
          $(config.selector).each((index, element) => {
            const data: any = {};
            
            // Extract different types of data
            if (dataPoint === 'text') {
              data.text = $(element).text().trim();
            } else if (dataPoint === 'links') {
              data.links = $(element).find('a').map((i, link) => $(link).attr('href')).get();
            } else if (dataPoint === 'images') {
              data.images = $(element).find('img').map((i, img) => $(img).attr('src')).get();
            } else if (dataPoint === 'prices') {
              const priceText = $(element).text();
              const priceMatch = priceText.match(/\$[\d,]+\.?\d*/);
              if (priceMatch) {
                data.price = priceMatch[0];
              }
            } else {
              // Custom selector
              data[dataPoint] = $(element).find(`[data-field="${dataPoint}"]`).text().trim() ||
                               $(element).attr(dataPoint) ||
                               $(element).text().trim();
            }
            
            if (Object.keys(data).length > 0) {
              scrapedData.push({
                ...data,
                url: url,
                scrapedAt: new Date().toISOString(),
                elementIndex: index
              });
            }
          });
        } else {
          // General scraping without specific selector
          const data: any = { url, scrapedAt: new Date().toISOString() };
          
          if (dataPoint === 'title') {
            data.title = $('title').text();
          } else if (dataPoint === 'description') {
            data.description = $('meta[name="description"]').attr('content');
          } else if (dataPoint === 'headings') {
            data.headings = $('h1, h2, h3').map((i, el) => $(el).text()).get();
          }
          
          if (Object.keys(data).length > 1) {
            scrapedData.push(data);
          }
        }
      });

      const metadata = {
        url,
        scrapedAt: new Date().toISOString(),
        totalElements: scrapedData.length,
        responseTime: response.headers['x-response-time'] || 'unknown',
        statusCode: response.status,
        contentType: response.headers['content-type']
      };

      // Rate limiting
      if (config.rateLimit) {
        await this.delay(config.rateLimit);
      }

      return { data: scrapedData, metadata };
    } catch (error: any) {
      console.error(`Scraping error for ${url}:`, error.message);
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }

  async scrapeMultiplePages(
    urls: string[], 
    config: ScrapingConfig
  ): Promise<{ data: any[], metadata: any[], errors: string[] }> {
    const allData: any[] = [];
    const allMetadata: any[] = [];
    const errors: string[] = [];

    const maxPages = config.maxPages || urls.length;
    const pagesToScrape = urls.slice(0, maxPages);

    for (const url of pagesToScrape) {
      try {
        const result = await this.scrapeWebsite(url, config);
        allData.push(...result.data);
        allMetadata.push(result.metadata);
      } catch (error: any) {
        errors.push(`${url}: ${error.message}`);
      }
    }

    return {
      data: allData,
      metadata: allMetadata,
      errors
    };
  }

  async scrapeSocialMedia(
    platform: string, 
    username: string, 
    config: ScrapingConfig
  ): Promise<{ data: any[], metadata: any }> {
    try {
      let url = '';
      
      switch (platform.toLowerCase()) {
        case 'twitter':
          url = `https://twitter.com/${username}`;
          break;
        case 'linkedin':
          url = `https://linkedin.com/in/${username}`;
          break;
        case 'instagram':
          url = `https://instagram.com/${username}`;
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Social media scraping with platform-specific selectors
      const socialConfig = {
        ...config,
        selector: this.getSocialMediaSelector(platform),
        dataPoints: ['posts', 'followers', 'engagement', 'profile_info']
      };

      return await this.scrapeWebsite(url, socialConfig);
    } catch (error: any) {
      console.error(`Social media scraping error:`, error.message);
      throw new Error(`Failed to scrape ${platform} for ${username}: ${error.message}`);
    }
  }

  async scrapeProductData(
    productUrl: string, 
    config: ScrapingConfig
  ): Promise<{ data: any[], metadata: any }> {
    try {
      const productConfig = {
        ...config,
        dataPoints: ['name', 'price', 'rating', 'reviews', 'description', 'availability']
      };

      const result = await this.scrapeWebsite(productUrl, productConfig);
      
      // Enhanced product data processing
      result.data = result.data.map(item => ({
        ...item,
        priceNumeric: this.extractNumericPrice(item.price),
        ratingNumeric: this.extractNumericRating(item.rating),
        reviewCount: this.extractReviewCount(item.reviews)
      }));

      return result;
    } catch (error: any) {
      console.error(`Product scraping error:`, error.message);
      throw new Error(`Failed to scrape product data: ${error.message}`);
    }
  }

  private getSocialMediaSelector(platform: string): string {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return '[data-testid="tweet"]';
      case 'linkedin':
        return '.feed-shared-update-v2';
      case 'instagram':
        return 'article';
      default:
        return '.post, .content, .item';
    }
  }

  private extractNumericPrice(priceText: string): number | null {
    if (!priceText) return null;
    const match = priceText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : null;
  }

  private extractNumericRating(ratingText: string): number | null {
    if (!ratingText) return null;
    const match = ratingText.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  }

  private extractReviewCount(reviewText: string): number | null {
    if (!reviewText) return null;
    const match = reviewText.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validateUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        headers: this.defaultHeaders,
        timeout: 5000
      });
      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    }
  }

  async extractUrls(
    baseUrl: string, 
    linkSelector: string = 'a'
  ): Promise<string[]> {
    try {
      const response = await axios.get(baseUrl, {
        headers: this.defaultHeaders,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const urls: string[] = [];

      $(linkSelector).each((index, element) => {
        const href = $(element).attr('href');
        if (href) {
          const absoluteUrl = new URL(href, baseUrl).toString();
          urls.push(absoluteUrl);
        }
      });

      return [...new Set(urls)]; // Remove duplicates
    } catch (error: any) {
      console.error(`URL extraction error:`, error.message);
      return [];
    }
  }
}

export const scraperService = new ScraperService();
