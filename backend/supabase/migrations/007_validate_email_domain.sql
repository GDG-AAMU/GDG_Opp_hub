-- Create function to validate AAMU email domains
CREATE OR REPLACE FUNCTION validate_aamu_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email ends with allowed domains
  IF NEW.email !~* '@(aamu\.edu|bulldogs\.aamu\.edu)$' THEN
    RAISE EXCEPTION 'Only @aamu.edu and @bulldogs.aamu.edu email addresses are allowed'
      USING ERRCODE = 'check_violation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users table
CREATE TRIGGER validate_email_domain_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION validate_aamu_email();
