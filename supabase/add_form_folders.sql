-- Create form_folders table
CREATE TABLE IF NOT EXISTS public.form_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    color TEXT DEFAULT '#FF6B35', -- Default orange color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add folder_id column to forms table
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.form_folders(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_forms_folder_id ON public.forms(folder_id);
CREATE INDEX IF NOT EXISTS idx_form_folders_user_id ON public.form_folders(user_id);

-- Enable Row Level Security
ALTER TABLE public.form_folders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own folders" ON public.form_folders;
DROP POLICY IF EXISTS "Users can create their own folders" ON public.form_folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.form_folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.form_folders;

-- RLS Policies for form_folders
CREATE POLICY "Users can view their own folders"
    ON public.form_folders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
    ON public.form_folders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
    ON public.form_folders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
    ON public.form_folders FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS set_updated_at ON public.form_folders;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.form_folders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.form_folders TO authenticated;
GRANT ALL ON public.form_folders TO service_role;

-- Add comment for documentation
COMMENT ON TABLE public.form_folders IS 'Stores folders for organizing forms';
COMMENT ON COLUMN public.form_folders.color IS 'Hex color code for folder visual identification';
