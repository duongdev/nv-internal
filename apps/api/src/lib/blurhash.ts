import { encode } from 'blurhash'
import { Jimp } from 'jimp'

export interface BlurhashResult {
  blurhash: string
  width: number
  height: number
}

/**
 * Generate blurhash from an image file path or buffer
 * @param input File path (string) or Buffer
 * @returns Blurhash string, width, and height
 */
export async function generateBlurhash(
  input: string | Buffer,
): Promise<BlurhashResult> {
  try {
    // Read image with Jimp
    const image = await Jimp.read(input)
    const { width, height, data } = image.bitmap

    // Jimp provides RGBA data directly in the correct format
    // Convert Buffer to Uint8ClampedArray as required by blurhash
    const pixels = new Uint8ClampedArray(data)

    // Generate blurhash with 4x4 components (good balance between quality and size)
    const blurhash = encode(pixels, width, height, 4, 4)

    return {
      blurhash,
      width,
      height,
    }
  } catch (error) {
    throw new Error(
      `Failed to generate blurhash: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Generate blurhash from an image URL
 * @param url Image URL (http/https)
 * @returns Blurhash string, width, and height
 */
export async function generateBlurhashFromUrl(
  url: string,
): Promise<BlurhashResult> {
  try {
    const image = await Jimp.read(url)
    const { width, height, data } = image.bitmap

    const pixels = new Uint8ClampedArray(data)
    const blurhash = encode(pixels, width, height, 4, 4)

    return {
      blurhash,
      width,
      height,
    }
  } catch (error) {
    throw new Error(
      `Failed to generate blurhash from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
