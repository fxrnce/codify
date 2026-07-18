-- Existing demo records that only said "No FDA record found" are unverified,
-- not proof that the FDA issued a warning against the product.
UPDATE "products"
SET "status" = 'UNVERIFIED'
WHERE "status" = 'NOT_APPROVED'
  AND "registration_number" ILIKE '%No FDA record found%';

-- Reserve the red status for products covered by a specific FDA advisory.
ALTER TYPE "product_status" RENAME VALUE 'NOT_APPROVED' TO 'FDA_ADVISORY';
