-- Fix searchableText population for existing records
-- The previous migration had a bug in the UPDATE query that prevented proper population
-- This migration correctly populates all NULL searchableText values

-- Temporarily make searchableText nullable to allow the fix
ALTER TABLE "Task" ALTER COLUMN "searchableText" DROP NOT NULL;

-- Recreate helper function (dropped in previous migration)
CREATE OR REPLACE FUNCTION normalize_for_search(text TEXT) RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase and remove Vietnamese accents
  RETURN lower(
    translate(
      text,
      'áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ',
      'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyAAAAAAAAAAAAAAAAADEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYY'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update Task searchableText for tasks WITH customer
-- Using proper JOIN instead of subquery
UPDATE "Task" t
SET "searchableText" = regexp_replace(
  normalize_for_search(
    trim(
      concat_ws(' ',
        t.id::text,
        t.title,
        COALESCE(t.description, ''),
        COALESCE(c.name, ''),
        COALESCE(c.phone, ''),
        COALESCE(g.name, ''),
        COALESCE(g.address, '')
      )
    )
  ),
  '\s+', ' ', 'g'
)
FROM "Customer" c
LEFT JOIN "GeoLocation" g ON g.id = t."geoLocationId"
WHERE c.id = t."customerId"
  AND (t."searchableText" IS NULL OR t."searchableText" = '');

-- Update Task searchableText for tasks WITHOUT customer but WITH location
UPDATE "Task" t
SET "searchableText" = regexp_replace(
  normalize_for_search(
    trim(
      concat_ws(' ',
        t.id::text,
        t.title,
        COALESCE(t.description, ''),
        COALESCE(g.name, ''),
        COALESCE(g.address, '')
      )
    )
  ),
  '\s+', ' ', 'g'
)
FROM "GeoLocation" g
WHERE g.id = t."geoLocationId"
  AND t."customerId" IS NULL
  AND (t."searchableText" IS NULL OR t."searchableText" = '');

-- Update Task searchableText for tasks WITHOUT customer AND WITHOUT location
UPDATE "Task" t
SET "searchableText" = regexp_replace(
  normalize_for_search(
    trim(
      concat_ws(' ',
        t.id::text,
        t.title,
        COALESCE(t.description, '')
      )
    )
  ),
  '\s+', ' ', 'g'
)
WHERE t."customerId" IS NULL
  AND t."geoLocationId" IS NULL
  AND (t."searchableText" IS NULL OR t."searchableText" = '');

-- Make searchableText NOT NULL again (all tasks should now have a value)
ALTER TABLE "Task" ALTER COLUMN "searchableText" SET NOT NULL;

-- Drop the helper function (no longer needed after migration)
DROP FUNCTION normalize_for_search(TEXT);
