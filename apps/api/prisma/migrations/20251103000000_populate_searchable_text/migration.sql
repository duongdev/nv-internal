-- Populate searchableText for existing records
-- This migration fills in the searchableText field for all existing records
-- that were created before the searchableText field was added

-- Helper function to normalize text (lowercase, remove Vietnamese accents)
-- This matches the normalizeForSearch function in task.service.ts
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

-- Update Task searchableText for existing records
-- Concatenate: id, title, description, customer name/phone, location name/address
UPDATE "Task" t
SET "searchableText" = (
  SELECT regexp_replace(
    normalize_for_search(
      trim(
        concat_ws(' ',
          t.id::text,
          t.title,
          t.description,
          c.name,
          c.phone,
          g.address,
          g.name
        )
      )
    ),
    '\s+', ' ', 'g'  -- Collapse multiple spaces to single space
  )
  FROM "Customer" c
  LEFT JOIN "GeoLocation" g ON g.id = t."geoLocationId"
  WHERE c.id = t."customerId"
)
WHERE t."searchableText" IS NULL AND t."customerId" IS NOT NULL;

-- Update tasks without customer (less common)
UPDATE "Task" t
SET "searchableText" = (
  SELECT regexp_replace(
    normalize_for_search(
      trim(
        concat_ws(' ',
          t.id::text,
          t.title,
          t.description,
          g.name,
          g.address
        )
      )
    ),
    '\s+', ' ', 'g'
  )
  FROM "GeoLocation" g
  WHERE g.id = t."geoLocationId"
)
WHERE t."searchableText" IS NULL AND t."customerId" IS NULL AND t."geoLocationId" IS NOT NULL;

-- Update tasks with neither customer nor location (rare)
UPDATE "Task" t
SET "searchableText" = regexp_replace(
  normalize_for_search(
    trim(
      concat_ws(' ',
        t.id::text,
        t.title,
        t.description
      )
    )
  ),
  '\s+', ' ', 'g'
)
WHERE t."searchableText" IS NULL;

-- Update Customer searchableText
UPDATE "Customer" c
SET "searchableText" = regexp_replace(
  normalize_for_search(
    trim(
      concat_ws(' ',
        c.name,
        c.phone
      )
    )
  ),
  '\s+', ' ', 'g'
)
WHERE c."searchableText" IS NULL;

-- Update GeoLocation searchableText
UPDATE "GeoLocation" g
SET "searchableText" = regexp_replace(
  normalize_for_search(
    trim(
      concat_ws(' ',
        g.name,
        g.address
      )
    )
  ),
  '\s+', ' ', 'g'
)
WHERE g."searchableText" IS NULL;

-- Make searchableText NOT NULL for Task (it should always have at least ID)
ALTER TABLE "Task" ALTER COLUMN "searchableText" SET NOT NULL;

-- Drop the helper function (no longer needed after migration)
DROP FUNCTION normalize_for_search(TEXT);
