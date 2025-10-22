-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "blurhash" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "thumbnailPathname" TEXT,
ADD COLUMN     "width" INTEGER;
