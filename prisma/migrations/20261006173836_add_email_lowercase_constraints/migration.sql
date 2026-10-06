-- This is an empty migration.
ALTER TABLE "User"              ADD CONSTRAINT "user_email_lowercase"               CHECK (email = LOWER(TRIM(email)));
ALTER TABLE "VerificationToken" ADD CONSTRAINT "verification_token_email_lowercase" CHECK (email = LOWER(TRIM(email)));
ALTER TABLE "Order"             ADD CONSTRAINT "order_email_lowercase"              CHECK (email = LOWER(TRIM(email)));