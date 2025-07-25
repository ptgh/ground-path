-- Critical Security Fixes Migration

-- 1. Fix database function security paths to prevent SQL injection
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 2. Update audit_role_changes function with proper security paths
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notes (user_id, title, content, conversation_data)
    VALUES (
      auth.uid(),
      'Role Assignment Audit',
      'Role assigned: ' || NEW.role || ' to user: ' || NEW.user_id,
      jsonb_build_object(
        'action', 'INSERT',
        'role', NEW.role,
        'target_user_id', NEW.user_id,
        'timestamp', now(),
        'admin_user_id', auth.uid()
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.notes (user_id, title, content, conversation_data)
    VALUES (
      auth.uid(),
      'Role Modification Audit',
      'Role changed from: ' || OLD.role || ' to: ' || NEW.role || ' for user: ' || NEW.user_id,
      jsonb_build_object(
        'action', 'UPDATE',
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user_id', NEW.user_id,
        'timestamp', now(),
        'admin_user_id', auth.uid()
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.notes (user_id, title, content, conversation_data)
    VALUES (
      auth.uid(),
      'Role Removal Audit',
      'Role removed: ' || OLD.role || ' from user: ' || OLD.user_id,
      jsonb_build_object(
        'action', 'DELETE',
        'role', OLD.role,
        'target_user_id', OLD.user_id,
        'timestamp', now(),
        'admin_user_id', auth.uid()
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- 3. Update handle_new_user function with proper security paths
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- 4. Update update_updated_at_column function with proper security paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 5. Strengthen user_roles RLS policies to prevent privilege escalation
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can assign default roles" ON public.user_roles;

-- Create stricter role policies
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can assign roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != user_id  -- Prevent self-role assignment
);

CREATE POLICY "Only admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != user_id  -- Prevent self-role modification
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != user_id  -- Prevent self-role modification
);

CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != user_id  -- Prevent self-role deletion
);

CREATE POLICY "System can assign default roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NULL AND role = 'user'::app_role)  -- Only default user role during signup
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 6. Add role change validation trigger
CREATE OR REPLACE FUNCTION public.validate_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Prevent users from modifying their own roles through any means
  IF auth.uid() = COALESCE(NEW.user_id, OLD.user_id) THEN
    RAISE EXCEPTION 'Users cannot modify their own roles';
  END IF;
  
  -- Ensure only admins can create admin roles
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.role = 'admin'::app_role THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only admins can assign admin roles';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for role validation
CREATE TRIGGER validate_role_changes_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_changes();

-- 7. Add audit trigger for role changes
CREATE TRIGGER audit_role_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();