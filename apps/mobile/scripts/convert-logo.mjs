#!/usr/bin/env node
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const assetsDir = join(__dirname, '../assets/images')
const logoSvgPath = join(assetsDir, 'logo.svg')

async function convertSvgToPng() {
  console.log('🎨 Converting logo.svg to PNG assets...\n')

  // Read the SVG file
  const svgBuffer = readFileSync(logoSvgPath)

  // Define all the assets we need to generate
  const conversions = [
    { name: 'icon.png', size: 1024, description: 'App Icon' },
    { name: 'splash.png', size: 1024, description: 'Splash Screen' },
    { name: 'adaptive-icon.png', size: 1024, description: 'Android Adaptive Icon' },
    { name: 'favicon.png', size: 48, description: 'Web Favicon' },
  ]

  // Convert each asset
  for (const { name, size, description } of conversions) {
    const outputPath = join(assetsDir, name)

    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath)

      console.log(`✅ Generated ${description} (${size}x${size}): ${name}`)
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message)
      process.exit(1)
    }
  }

  console.log('\n🎉 All PNG assets generated successfully!')
}

convertSvgToPng()
