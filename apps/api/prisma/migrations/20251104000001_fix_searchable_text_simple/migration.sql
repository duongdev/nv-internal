-- Simplified fix for searchableText population
-- This migration uses inline text normalization without creating a helper function
-- to avoid function-related migration errors

-- Update Task searchableText for tasks WITH customer
-- Using proper JOIN and inline normalization
UPDATE "Task" t
SET "searchableText" = regexp_replace(
  lower(
    translate(
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
      ),
      'áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ',
      'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyAAAAAAAAAAAAAAAAADEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYY'
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
  lower(
    translate(
      trim(
        concat_ws(' ',
          t.id::text,
          t.title,
          COALESCE(t.description, ''),
          COALESCE(g.name, ''),
          COALESCE(g.address, '')
        )
      ),
      'áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ',
      'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyAAAAAAAAAAAAAAAAADEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYY'
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
  lower(
    translate(
      trim(
        concat_ws(' ',
          t.id::text,
          t.title,
          COALESCE(t.description, '')
        )
      ),
      'áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ',
      'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyAAAAAAAAAAAAAAAAADEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYY'
    )
  ),
  '\s+', ' ', 'g'
)
WHERE t."customerId" IS NULL
  AND t."geoLocationId" IS NULL
  AND (t."searchableText" IS NULL OR t."searchableText" = '');

-- Make searchableText NOT NULL (all tasks should now have a value)
ALTER TABLE "Task" ALTER COLUMN "searchableText" SET NOT NULL;
