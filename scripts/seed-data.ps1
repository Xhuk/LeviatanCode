# Sample Data Seeder for DataScraper Pro
# This script loads sample projects, templates, and configurations

param(
    [switch]$Reset,
    [switch]$Help
)

if ($Help) {
    Write-Host "DataScraper Pro - Sample Data Seeder" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\seed-data.ps1 [-Reset] [-Help]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Reset        Clear existing data before seeding"
    Write-Host "  -Help         Show this help message"
    exit 0
}

Write-Host "🌱 DataScraper Pro - Sample Data Seeder" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please run setup-supabase.ps1 first." -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
        exit 1
    }
}

if ($Reset) {
    Write-Host "🗑️ Clearing existing data..." -ForegroundColor Yellow
    # Note: This would require additional database cleanup scripts
    Write-Host "⚠️ Reset functionality would be implemented here" -ForegroundColor Yellow
}

Write-Host "📊 Loading sample data..." -ForegroundColor Cyan

# Create sample data seeder script
$seederScript = @"
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Sample project data
const sampleProjects = [
  {
    id: 'demo-project-1',
    name: 'E-commerce Product Analysis',
    description: 'Scrape and analyze product data from e-commerce websites',
    files: {
      'scraper.js': {
        content: \`// E-commerce Product Scraper
const axios = require('axios');
const cheerio = require('cheerio');

class ProductScraper {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async scrapeProducts(categoryUrl) {
    try {
      const response = await axios.get(categoryUrl);
      const \$ = cheerio.load(response.data);
      
      const products = [];
      
      \$('.product-item').each((index, element) => {
        const product = {
          title: \$(element).find('.product-title').text().trim(),
          price: \$(element).find('.price').text().trim(),
          rating: \$(element).find('.rating').attr('data-rating'),
          image: \$(element).find('.product-image img').attr('src'),
          url: \$(element).find('a').attr('href')
        };
        
        if (product.title && product.price) {
          products.push(product);
        }
      });
      
      return products;
    } catch (error) {
      console.error('Scraping error:', error.message);
      return [];
    }
  }

  async scrapeProductDetails(productUrl) {
    try {
      const response = await axios.get(productUrl);
      const \$ = cheerio.load(response.data);
      
      return {
        description: \$('.product-description').text().trim(),
        specifications: this.extractSpecifications(\$),
        reviews: this.extractReviews(\$),
        availability: \$('.availability').text().trim()
      };
    } catch (error) {
      console.error('Product details error:', error.message);
      return null;
    }
  }

  extractSpecifications(\$) {
    const specs = {};
    \$('.specifications table tr').each((index, row) => {
      const key = \$(row).find('td:first').text().trim();
      const value = \$(row).find('td:last').text().trim();
      if (key && value) {
        specs[key] = value;
      }
    });
    return specs;
  }

  extractReviews(\$) {
    const reviews = [];
    \$('.review-item').each((index, element) => {
      reviews.push({
        rating: \$(element).find('.review-rating').attr('data-rating'),
        text: \$(element).find('.review-text').text().trim(),
        author: \$(element).find('.review-author').text().trim()
      });
    });
    return reviews.slice(0, 10); // Limit to 10 reviews
  }
}

module.exports = ProductScraper;\`,
        language: 'javascript'
      },
      'analyzer.js': {
        content: \`// Product Data Analyzer
class ProductAnalyzer {
  constructor(products) {
    this.products = products;
  }

  getPriceStatistics() {
    const prices = this.products
      .map(p => parseFloat(p.price.replace(/[^0-9.]/g, '')))
      .filter(p => !isNaN(p));
    
    return {
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      median: this.getMedian(prices)
    };
  }

  getRatingDistribution() {
    const ratings = {};
    this.products.forEach(product => {
      const rating = Math.floor(parseFloat(product.rating) || 0);
      ratings[rating] = (ratings[rating] || 0) + 1;
    });
    return ratings;
  }

  getTopRatedProducts(limit = 10) {
    return this.products
      .filter(p => p.rating)
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, limit);
  }

  findPriceOutliers() {
    const prices = this.products.map(p => parseFloat(p.price.replace(/[^0-9.]/g, '')));
    const q1 = this.getPercentile(prices, 25);
    const q3 = this.getPercentile(prices, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return this.products.filter(p => {
      const price = parseFloat(p.price.replace(/[^0-9.]/g, ''));
      return price < lowerBound || price > upperBound;
    });
  }

  getMedian(arr) {
    const sorted = arr.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  getPercentile(arr, percentile) {
    const sorted = arr.sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
  }
}

module.exports = ProductAnalyzer;\`,
        language: 'javascript'
      },
      'config.json': {
        content: JSON.stringify({
          "name": "E-commerce Product Scraper",
          "version": "1.0.0",
          "targets": [
            {
              "name": "Electronics Category",
              "url": "https://example-store.com/electronics",
              "selectors": {
                "product": ".product-item",
                "title": ".product-title",
                "price": ".price",
                "rating": ".rating",
                "image": ".product-image img"
              }
            }
          ],
          "settings": {
            "delay": 1000,
            "maxPages": 10,
            "outputFormat": "json"
          }
        }, null, 2),
        language: 'json'
      },
      'README.md': {
        content: \`# E-commerce Product Analysis Project

This project demonstrates web scraping and analysis of e-commerce product data.

## Features

- **Product Scraping**: Extract product information from category pages
- **Data Analysis**: Statistical analysis of prices, ratings, and trends
- **AI Integration**: Use AI to generate insights and recommendations

## Files

- \`scraper.js\` - Main scraping logic for product data
- \`analyzer.js\` - Data analysis and statistics generation
- \`config.json\` - Configuration for scraping targets

## Usage

1. Configure your target websites in \`config.json\`
2. Run the scraper to collect product data
3. Use the analyzer to generate insights
4. Ask AI for advanced analysis and recommendations

## Example Analysis

- Price distribution and outliers
- Rating trends and patterns
- Top performing products
- Market comparison insights
\`,
        language: 'markdown'
      }
    }
  }
];

// Sample prompt templates
const sampleTemplates = [
  {
    id: 'prompt-template-1',
    projectId: 'demo-project-1',
    name: 'Product Data Analysis',
    description: 'Analyze scraped product data for insights',
    category: 'data-analysis',
    content: 'Analyze the following product data and provide insights about {{analysisType}}. Focus on {{focusArea}} and generate actionable recommendations.\\n\\nData: {{productData}}',
    variables: ['analysisType', 'focusArea', 'productData'],
    isActive: true,
    usageCount: 0
  },
  {
    id: 'prompt-template-2',
    projectId: 'demo-project-1',
    name: 'Code Review Helper',
    description: 'Review scraping code for best practices',
    category: 'code-analysis',
    content: 'Review the following {{codeType}} code for best practices, performance, and potential improvements:\\n\\n\`\`\`{{language}}\\n{{codeContent}}\\n\`\`\`\\n\\nFocus on: {{reviewAreas}}',
    variables: ['codeType', 'language', 'codeContent', 'reviewAreas'],
    isActive: true,
    usageCount: 0
  },
  {
    id: 'prompt-template-3',
    projectId: 'demo-project-1',
    name: 'Debugging Assistant',
    description: 'Help debug scraping issues',
    category: 'debugging',
    content: 'I\'m experiencing issues with my web scraping code. The problem is: {{problemDescription}}\\n\\nCode causing issues:\\n\`\`\`{{language}}\\n{{problematicCode}}\\n\`\`\`\\n\\nError message: {{errorMessage}}\\n\\nHelp me identify and fix the issue.',
    variables: ['problemDescription', 'language', 'problematicCode', 'errorMessage'],
    isActive: true,
    usageCount: 0
  }
];

console.log('📊 Loading sample data...');

// This would typically interact with your actual database
// For now, we'll create JSON files that can be imported
fs.writeFileSync('sample-data/projects.json', JSON.stringify(sampleProjects, null, 2));
fs.writeFileSync('sample-data/templates.json', JSON.stringify(sampleTemplates, null, 2));

console.log('✅ Sample data files created in sample-data/ directory');
console.log('');
console.log('Sample data includes:');
console.log('- E-commerce product scraping project');
console.log('- JavaScript scraper and analyzer code');
console.log('- Prompt templates for AI assistance');
console.log('- Configuration examples');
console.log('');
console.log('The application will automatically load this data when you start it.');
"@

# Create sample-data directory
if (-not (Test-Path "sample-data")) {
    New-Item -ItemType Directory -Path "sample-data" -Force | Out-Null
}

# Run the seeder
$seederScript | Out-File -FilePath "temp_seeder.js" -Encoding UTF8
node temp_seeder.js
Remove-Item "temp_seeder.js" -Force

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sample data loaded successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to load sample data." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Seeding complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the application: npm run dev"
Write-Host "2. Open http://localhost:5000 in your browser"
Write-Host "3. Explore the sample project and AI features"
Write-Host ""
Write-Host "Sample data includes:" -ForegroundColor Yellow
Write-Host "- E-commerce product scraping project with real code examples"
Write-Host "- AI prompt templates for analysis and debugging"
Write-Host "- Configuration files and documentation"
Write-Host ""