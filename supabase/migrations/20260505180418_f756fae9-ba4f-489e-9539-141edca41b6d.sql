
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('candidate', 'admin');
CREATE TYPE public.assessment_status AS ENUM ('in_progress','job_fit','training_needed','manual_review','low_confidence','fraud_suspected');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  candidate_id TEXT,
  admin_id TEXT,
  organization TEXT,
  division TEXT,
  career_gap TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Assessments
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_role TEXT,
  experience TEXT,
  domains TEXT,
  skills TEXT,
  qualification TEXT,
  confidence TEXT,
  language TEXT DEFAULT 'English',
  transcript JSONB DEFAULT '[]'::jsonb,
  trust_score INT DEFAULT 100,
  fit_score INT,
  status assessment_status DEFAULT 'in_progress',
  ai_feedback TEXT,
  ai_evaluation JSONB,
  flags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- RLS Profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Assessments
CREATE POLICY "Candidates view own assessments" ON public.assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all assessments" ON public.assessments FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Candidates insert own assessments" ON public.assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Candidates update own assessments" ON public.assessments FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone, candidate_id, admin_id, organization, division, career_gap)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'candidate_id',
    NEW.raw_user_meta_data->>'admin_id',
    NEW.raw_user_meta_data->>'organization',
    NEW.raw_user_meta_data->>'division',
    NEW.raw_user_meta_data->>'career_gap'
  );
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'candidate');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
