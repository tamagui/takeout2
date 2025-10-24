-- Create a function to automatically update numSteps
CREATE OR REPLACE FUNCTION update_task_numsteps()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle NULL steps gracefully
  IF NEW."steps" IS NULL THEN
    NEW."numSteps" = 0;
  ELSE
    NEW."numSteps" = jsonb_array_length(NEW."steps");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that fires before INSERT or UPDATE on task table
CREATE TRIGGER task_numsteps_trigger
BEFORE INSERT OR UPDATE OF "steps" ON "task"
FOR EACH ROW
EXECUTE FUNCTION update_task_numsteps();

-- Update existing rows to set the correct numSteps value
UPDATE "task"
SET "numSteps" = CASE
  WHEN "steps" IS NULL THEN 0
  ELSE jsonb_array_length("steps")
END;