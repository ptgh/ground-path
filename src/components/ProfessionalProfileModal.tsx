import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Settings, User, Shield, Briefcase, Heart, Plus, X, Linkedin, CheckCircle2, ExternalLink, Loader2, Copy, ShieldAlert, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfessionalProfileModalProps {
  children: React.ReactNode;
}

// Saved/Edit registration field pattern
const SavedRegistrationCard = ({
  title, numberLabel, numberValue, savedValue, numberPlaceholder, expiryValue,
  onNumberChange, onExpiryChange, onCopy, onDelete, accentClass, inline
}: {
  title: string; numberLabel: string; numberValue: string; savedValue: string; numberPlaceholder: string;
  expiryValue: string; onNumberChange: (v: string) => void; onExpiryChange: (v: string) => void;
  onCopy: (v: string) => void; onDelete?: () => void; accentClass?: string; inline?: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const isSaved = !!savedValue.trim() && savedValue === numberValue;

  if (isSaved && !editing) {
    return (
      <div className={`p-4 rounded-lg border ${accentClass || 'border-border bg-muted/30'} ${inline ? 'p-0 border-0 bg-transparent' : ''}`}>
        {title && <h4 className="text-sm font-medium mb-2">{title}</h4>}
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{numberLabel}</p>
            <p className="text-sm font-mono font-medium truncate">{numberValue}</p>
            {expiryValue && (
              <>
                <p className="text-xs text-muted-foreground mt-2">Expiry</p>
                <p className="text-sm">{new Date(expiryValue + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCopy(numberValue)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {onDelete && (
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${accentClass || 'border-border bg-muted/30'} space-y-3 ${inline ? 'p-0 border-0 bg-transparent' : ''}`}>
      {title && <h4 className="text-sm font-medium">{title}</h4>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{numberLabel}</Label>
          <Input
            value={numberValue}
            onChange={(e) => onNumberChange(e.target.value)}
            placeholder={numberPlaceholder}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Registration Expiry</Label>
          <Input
            type="date"
            value={expiryValue}
            onChange={(e) => onExpiryChange(e.target.value)}
          />
        </div>
      </div>
      {isSaved && (
        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setEditing(false)}>
          Done editing
        </Button>
      )}
    </div>
  );
};

interface PractitionerRegistration {
  id: string;
  user_id: string;
  body_name: string;
  registration_number: string | null;
  registration_date: string | null;
  years_as_practitioner: number | null;
}

const AU_BODIES = [
  { value: 'AHPRA', label: 'AHPRA (Australian Health Practitioner Regulation Agency)' },
  { value: 'ACA', label: 'ACA (Australian Counselling Association)' },
  { value: 'ACMHN', label: 'ACMHN (Australian College of Mental Health Nurses)' },
  { value: 'PACFA', label: 'PACFA (Psychotherapy & Counselling Federation)' },
  { value: 'APS', label: 'APS (Australian Psychological Society)' },
];

const UK_BODIES = [
  { value: 'BASW', label: 'BASW (British Association of Social Workers)' },
  { value: 'BACP', label: 'BACP (British Association for Counselling & Psychotherapy)' },
  { value: 'HCPC', label: 'HCPC (Health and Care Professions Council)' },
  { value: 'NMC', label: 'NMC (Nursing and Midwifery Council)' },
];

const ProfessionalProfileModal = ({ children }: ProfessionalProfileModalProps) => {
  const { profile, updateProfile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [halaxyVerifying, setHalaxyVerifying] = useState(false);

  // Multi-registration state
  const [registrations, setRegistrations] = useState<PractitionerRegistration[]>([]);
  const [addingRegistration, setAddingRegistration] = useState(false);
  const [editingRegId, setEditingRegId] = useState<string | null>(null);
  const [newReg, setNewReg] = useState({ body_name: '', custom_body: '', registration_number: '', registration_date: '', years_as_practitioner: '' });
  const [regSaving, setRegSaving] = useState(false);

  // Track last-saved values to determine saved state for registration cards
  const [lastSavedFormData, setLastSavedFormData] = useState({
    aasw_membership_number: '',
    swe_registration_number: '',
  });

  // Form states
  const [formData, setFormData] = useState({
    profession: '',
    license_number: '',
    registration_number: '',
    registration_body: '',
    registration_expiry: '',
    registration_country: 'AU',
    aasw_membership_number: '',
    swe_registration_number: '',
    ahpra_number: '',
    ahpra_profession: '',
    years_experience: '',
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_expiry: '',
    cpd_hours_current_year: '',
    cpd_requirements: '',
    practice_location: '',
    website_url: '',
    linkedin_profile: '',
    preferred_contact_method: 'email',
    bio: '',
    halaxy_profile_url: ''
  });

  // Fetch registrations from the new table
  const fetchRegistrations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('practitioner_registrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setRegistrations((data as PractitionerRegistration[]) || []);
  }, [user]);

  useEffect(() => {
    if (open && user) fetchRegistrations();
  }, [open, user, fetchRegistrations]);

  const getFilteredBodies = () => {
    const country = formData.registration_country;
    let bodies: { value: string; label: string }[] = [];
    if (country === 'AU' || country === 'BOTH') bodies = [...bodies, ...AU_BODIES];
    if (country === 'UK' || country === 'BOTH') bodies = [...bodies, ...UK_BODIES];
    // Filter out bodies already registered
    const existingNames = registrations.map(r => r.body_name);
    if (editingRegId) {
      const editingReg = registrations.find(r => r.id === editingRegId);
      if (editingReg) existingNames.splice(existingNames.indexOf(editingReg.body_name), 1);
    }
    bodies = bodies.filter(b => !existingNames.includes(b.value));
    return bodies;
  };

  const handleSaveRegistration = async () => {
    if (!user) return;
    const bodyName = newReg.body_name === 'other' ? newReg.custom_body.trim() : newReg.body_name;
    if (!bodyName) { toast({ title: 'Missing body', description: 'Please select or enter a registration body.', variant: 'destructive' }); return; }
    if (!newReg.registration_number.trim()) { toast({ title: 'Missing number', description: 'Please enter a registration number.', variant: 'destructive' }); return; }

    setRegSaving(true);
    try {
      if (editingRegId) {
        const { error } = await supabase.from('practitioner_registrations').update({
          body_name: bodyName,
          registration_number: newReg.registration_number.trim(),
          registration_date: newReg.registration_date || null,
          years_as_practitioner: newReg.years_as_practitioner ? parseInt(newReg.years_as_practitioner) : null,
        }).eq('id', editingRegId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('practitioner_registrations').insert({
          user_id: user.id,
          body_name: bodyName,
          registration_number: newReg.registration_number.trim(),
          registration_date: newReg.registration_date || null,
          years_as_practitioner: newReg.years_as_practitioner ? parseInt(newReg.years_as_practitioner) : null,
        });
        if (error) throw error;
      }
      await fetchRegistrations();
      setNewReg({ body_name: '', custom_body: '', registration_number: '', registration_date: '', years_as_practitioner: '' });
      setAddingRegistration(false);
      setEditingRegId(null);
      toast({ title: 'Registration saved', description: `${bodyName} registration saved successfully.` });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message || 'Could not save registration.', variant: 'destructive' });
    } finally {
      setRegSaving(false);
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    const { error } = await supabase.from('practitioner_registrations').delete().eq('id', id);
    if (error) { toast({ title: 'Delete failed', description: error.message, variant: 'destructive' }); return; }
    await fetchRegistrations();
    toast({ title: 'Registration deleted' });
  };

  const startEditRegistration = (reg: PractitionerRegistration) => {
    const knownValues = [...AU_BODIES, ...UK_BODIES].map(b => b.value);
    const isCustom = !knownValues.includes(reg.body_name);
    setNewReg({
      body_name: isCustom ? 'other' : reg.body_name,
      custom_body: isCustom ? reg.body_name : '',
      registration_number: reg.registration_number || '',
      registration_date: reg.registration_date || '',
      years_as_practitioner: reg.years_as_practitioner?.toString() || '',
    });
    setEditingRegId(reg.id);
    setAddingRegistration(true);
  };

  const [specializations, setSpecializations] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newQualification, setNewQualification] = useState('');

  // Load profile data when modal opens
  useEffect(() => {
    if (profile && open) {
      const loadedData = {
        profession: profile.profession || '',
        license_number: profile.license_number || '',
        registration_number: profile.registration_number || '',
        registration_body: profile.registration_body || '',
        registration_expiry: profile.registration_expiry || '',
        registration_country: profile.registration_country || 'AU',
        aasw_membership_number: profile.aasw_membership_number || '',
        swe_registration_number: profile.swe_registration_number || '',
        ahpra_number: profile.ahpra_number || '',
        ahpra_profession: profile.ahpra_profession || '',
        years_experience: profile.years_experience?.toString() || '',
        insurance_provider: profile.insurance_provider || '',
        insurance_policy_number: profile.insurance_policy_number || '',
        insurance_expiry: profile.insurance_expiry || '',
        cpd_hours_current_year: profile.cpd_hours_current_year?.toString() || '',
        cpd_requirements: profile.cpd_requirements?.toString() || '',
        practice_location: profile.practice_location || '',
        website_url: profile.website_url || '',
        linkedin_profile: profile.linkedin_profile || '',
        preferred_contact_method: profile.preferred_contact_method || 'email',
        bio: profile.bio || '',
        halaxy_profile_url: (profile.halaxy_integration as any)?.profile_url || ''
      };
      setFormData(loadedData);
      setLastSavedFormData({
        aasw_membership_number: loadedData.aasw_membership_number,
        swe_registration_number: loadedData.swe_registration_number,
      });
      setSpecializations(profile.specializations || []);
      setQualifications(profile.qualifications || []);
    }
  }, [profile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { halaxy_profile_url, ...rest } = formData;
      // Resolve "other" registration body to the custom text
      const resolvedBody = rest.registration_body === 'other' ? customRegistrationBody.trim() : rest.registration_body;
      const updates = {
        ...rest,
        registration_body: resolvedBody,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        cpd_hours_current_year: formData.cpd_hours_current_year ? parseInt(formData.cpd_hours_current_year) : 0,
        cpd_requirements: formData.cpd_requirements ? parseInt(formData.cpd_requirements) : 0,
        specializations,
        qualifications,
        registration_expiry: formData.registration_expiry || null,
        insurance_expiry: formData.insurance_expiry || null,
        halaxy_integration: { ...((profile?.halaxy_integration as any) || {}), profile_url: halaxy_profile_url || null }
      };

      await updateProfile(updates);
      
      // Sync saved state so cards flip to read-only
      setLastSavedFormData({
        aasw_membership_number: formData.aasw_membership_number,
        swe_registration_number: formData.swe_registration_number,
        registration_number: formData.registration_number,
        registration_body: formData.registration_body,
      });

      toast({
        title: "Profile updated",
        description: "Your professional profile has been updated successfully.",
      });
      
      // Stay on the current tab — don't close the modal
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !specializations.includes(newSpecialization.trim())) {
      setSpecializations([...specializations, newSpecialization.trim()]);
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setSpecializations(specializations.filter(s => s !== spec));
  };

  const addQualification = () => {
    if (newQualification.trim() && !qualifications.includes(newQualification.trim())) {
      setQualifications([...qualifications, newQualification.trim()]);
      setNewQualification('');
    }
  };

  const removeQualification = (qual: string) => {
    setQualifications(qualifications.filter(q => q !== qual));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Professional Profile Settings
          </DialogTitle>
          <DialogDescription>
            Manage your professional information, registrations, and credentials
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 px-6">
          <Tabs defaultValue="basic" className="flex flex-col flex-1 min-h-0">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1 flex-shrink-0">
              <TabsTrigger value="basic" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Basic Info</TabsTrigger>
              <TabsTrigger value="registration" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Registration</TabsTrigger>
              <TabsTrigger value="insurance" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Insurance & CPD</TabsTrigger>
              <TabsTrigger value="qualifications" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Qualifications</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto min-h-0 mt-4 space-y-4">
            <TabsContent value="basic" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Basic Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profession">Profession</Label>
                      <Select value={formData.profession} onValueChange={(value) => setFormData({...formData, profession: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select profession" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="social_worker">Social Worker</SelectItem>
                          <SelectItem value="psychologist">Psychologist</SelectItem>
                          <SelectItem value="counsellor">Counsellor</SelectItem>
                          <SelectItem value="mental_health_social_worker">Mental Health Social Worker</SelectItem>
                          <SelectItem value="family_therapist">Family Therapist</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="years_experience">Years of Experience</Label>
                      <Input
                        id="years_experience"
                        type="number"
                        value={formData.years_experience}
                        onChange={(e) => setFormData({...formData, years_experience: e.target.value})}
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Brief description of your professional background and expertise..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="practice_location">Practice Location</Label>
                      <Input
                        id="practice_location"
                        value={formData.practice_location}
                        onChange={(e) => setFormData({...formData, practice_location: e.target.value})}
                        placeholder="City, State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
                      <Select value={formData.preferred_contact_method} onValueChange={(value) => setFormData({...formData, preferred_contact_method: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website_url">Website URL</Label>
                      <Input
                        id="website_url"
                        value={formData.website_url}
                        onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_profile">LinkedIn Profile</Label>
                      {profile?.professional_verified || profile?.verification_method === 'linkedin' ? (
                        <div className="flex items-center gap-2 p-2 rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="text-xs text-green-700 dark:text-green-300 font-medium">Verified via LinkedIn</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 mb-2">
                          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Unverified</span>
                          <a href="/practitioner/verify" className="text-xs text-primary hover:underline ml-auto">Verify</a>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <Input
                          id="linkedin_profile"
                          type="url"
                          value={formData.linkedin_profile}
                          onChange={(e) => setFormData({...formData, linkedin_profile: e.target.value})}
                          placeholder="https://www.linkedin.com/in/your-profile"
                          className="flex-1"
                        />
                        {formData.linkedin_profile && (
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => { navigator.clipboard.writeText(formData.linkedin_profile); toast({ title: 'Copied', description: 'LinkedIn URL copied to clipboard' }); }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="halaxy_profile_url">Halaxy Profile</Label>
                    {(profile?.halaxy_integration as any)?.verified ? (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="text-xs text-green-700 dark:text-green-300 font-medium">Verified via Halaxy</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                          onClick={async () => {
                            await updateProfile({
                              halaxy_integration: {
                                ...((profile?.halaxy_integration as any) || {}),
                                verified: false,
                                verified_at: null,
                              },
                            });
                            toast({ title: 'Halaxy verification removed', description: 'You can re-verify your Halaxy profile URL.' });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 mb-2">
                        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Unverified</span>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Input
                        id="halaxy_profile_url"
                        type="url"
                        value={formData.halaxy_profile_url}
                        onChange={(e) => setFormData({...formData, halaxy_profile_url: e.target.value})}
                        placeholder="https://www.halaxy.com/profile/your-practice/location/..."
                        className="flex-1"
                      />
                      {formData.halaxy_profile_url && (
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => { navigator.clipboard.writeText(formData.halaxy_profile_url); toast({ title: 'Copied', description: 'Halaxy URL copied to clipboard' }); }}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!(profile?.halaxy_integration as any)?.verified && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          disabled={halaxyVerifying || !formData.halaxy_profile_url.trim()}
                          onClick={async () => {
                            setHalaxyVerifying(true);
                            try {
                              const { data, error } = await supabase.functions.invoke('verify-halaxy-url', {
                                body: { url: formData.halaxy_profile_url.trim() },
                              });
                              if (error) throw error;
                              if (data?.verified) {
                                await updateProfile({
                                  halaxy_integration: {
                                    ...((profile?.halaxy_integration as any) || {}),
                                    profile_url: formData.halaxy_profile_url.trim(),
                                    verified: true,
                                    verified_at: data.verified_at,
                                  },
                                });
                                toast({ title: 'Halaxy verified', description: 'Your Halaxy profile page has been confirmed.' });
                              } else {
                                toast({ title: 'Verification failed', description: data?.error || 'Could not confirm the Halaxy profile page. Please check the URL.', variant: 'destructive' });
                              }
                            } catch (err: any) {
                              toast({ title: 'Verification error', description: err.message || 'Could not verify URL.', variant: 'destructive' });
                            } finally {
                              setHalaxyVerifying(false);
                            }
                          }}
                        >
                          {halaxyVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Your personal Halaxy booking page URL</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registration" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Professional Registration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Practice Country */}
                  <div className="space-y-2">
                    <Label htmlFor="registration_country">Practice Country</Label>
                    <Select value={formData.registration_country} onValueChange={(value) => setFormData({...formData, registration_country: value})}>
                      <SelectTrigger className="w-full md:w-1/2">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="BOTH">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* AASW Section (AU) */}
                  {(formData.registration_country === 'AU' || formData.registration_country === 'BOTH') && (
                    <SavedRegistrationCard
                      title="AASW Membership (Australia)"
                      numberLabel="Membership Number"
                      numberValue={formData.aasw_membership_number}
                      savedValue={lastSavedFormData.aasw_membership_number}
                      numberPlaceholder="e.g., 123456"
                      expiryValue={formData.registration_expiry}
                      onNumberChange={(v) => setFormData({...formData, aasw_membership_number: v})}
                      onExpiryChange={(v) => setFormData({...formData, registration_expiry: v})}
                      onCopy={(v) => { navigator.clipboard.writeText(v); toast({ title: 'Copied', description: 'AASW number copied to clipboard' }); }}
                      onDelete={() => { setFormData({...formData, aasw_membership_number: ''}); setLastSavedFormData(prev => ({...prev, aasw_membership_number: ''})); }}
                      accentClass="border-primary/20 bg-primary/5"
                    />
                  )}

                  {/* SWE Section (UK) */}
                  {(formData.registration_country === 'UK' || formData.registration_country === 'BOTH') && (
                    <SavedRegistrationCard
                      title="SWE Registration (UK)"
                      numberLabel="Registration Number"
                      numberValue={formData.swe_registration_number}
                      savedValue={lastSavedFormData.swe_registration_number}
                      numberPlaceholder="e.g., SW12345"
                      expiryValue={formData.registration_expiry}
                      onNumberChange={(v) => setFormData({...formData, swe_registration_number: v})}
                      onExpiryChange={(v) => setFormData({...formData, registration_expiry: v})}
                      onCopy={(v) => { navigator.clipboard.writeText(v); toast({ title: 'Copied', description: 'SWE number copied to clipboard' }); }}
                      onDelete={() => { setFormData({...formData, swe_registration_number: ''}); setLastSavedFormData(prev => ({...prev, swe_registration_number: ''})); }}
                      accentClass="border-accent/30 bg-accent/5"
                    />
                  )}

                  {/* General Registration Body */}
                  <div className="space-y-3 p-4 rounded-lg border bg-card">
                    <h4 className="text-sm font-medium">General Registration Body</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="registration_body">Registration Body</Label>
                        <Select value={formData.registration_body} onValueChange={(value) => { setFormData({...formData, registration_body: value}); if (value !== 'other') setCustomRegistrationBody(''); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select registration body" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* AU bodies */}
                            {(formData.registration_country === 'AU' || formData.registration_country === 'BOTH') && (
                              <>
                                <SelectItem value="AHPRA">AHPRA (Australian Health Practitioner Regulation Agency)</SelectItem>
                                <SelectItem value="ACA">ACA (Australian Counselling Association)</SelectItem>
                                <SelectItem value="ACMHN">ACMHN (Australian College of Mental Health Nurses)</SelectItem>
                                <SelectItem value="PACFA">PACFA (Psychotherapy & Counselling Federation)</SelectItem>
                                <SelectItem value="APS">APS (Australian Psychological Society)</SelectItem>
                              </>
                            )}
                            {/* UK bodies */}
                            {(formData.registration_country === 'UK' || formData.registration_country === 'BOTH') && (
                              <>
                                <SelectItem value="BASW">BASW (British Association of Social Workers)</SelectItem>
                                <SelectItem value="BACP">BACP (British Association for Counselling & Psychotherapy)</SelectItem>
                                <SelectItem value="HCPC">HCPC (Health and Care Professions Council)</SelectItem>
                                <SelectItem value="NMC">NMC (Nursing and Midwifery Council)</SelectItem>
                              </>
                            )}
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.registration_body === 'other' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Specify Registration Body</Label>
                          <Input
                            value={customRegistrationBody}
                            onChange={(e) => setCustomRegistrationBody(e.target.value)}
                            placeholder="e.g., ANZASW, HKASW"
                          />
                        </div>
                      )}
                      <SavedRegistrationCard
                        title=""
                        numberLabel="Registration Number"
                        numberValue={formData.registration_number}
                        savedValue={lastSavedFormData.registration_number}
                        numberPlaceholder="Registration number"
                        expiryValue={formData.registration_expiry}
                        onNumberChange={(v) => setFormData({...formData, registration_number: v})}
                        onExpiryChange={(v) => setFormData({...formData, registration_expiry: v})}
                        onCopy={(v) => { navigator.clipboard.writeText(v); toast({ title: 'Copied', description: 'Registration number copied to clipboard' }); }}
                        onDelete={() => { setFormData({...formData, registration_number: '', registration_body: ''}); setLastSavedFormData(prev => ({...prev, registration_number: '', registration_body: ''})); setCustomRegistrationBody(''); }}
                        inline
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insurance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Professional Indemnity & CPD
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insurance_provider">Insurance Provider</Label>
                      <Input
                        id="insurance_provider"
                        value={formData.insurance_provider}
                        onChange={(e) => setFormData({...formData, insurance_provider: e.target.value})}
                        placeholder="e.g., Professional Edge, Berkley"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance_policy_number">Policy Number</Label>
                      <Input
                        id="insurance_policy_number"
                        value={formData.insurance_policy_number}
                        onChange={(e) => setFormData({...formData, insurance_policy_number: e.target.value})}
                        placeholder="Insurance policy number"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
                    <Input
                      id="insurance_expiry"
                      type="date"
                      value={formData.insurance_expiry}
                      onChange={(e) => setFormData({...formData, insurance_expiry: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpd_hours_current_year">CPD Hours (Current Year)</Label>
                      <Input
                        id="cpd_hours_current_year"
                        type="number"
                        value={formData.cpd_hours_current_year}
                        onChange={(e) => setFormData({...formData, cpd_hours_current_year: e.target.value})}
                        placeholder="Hours completed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpd_requirements">CPD Requirements</Label>
                      <Input
                        id="cpd_requirements"
                        type="number"
                        value={formData.cpd_requirements}
                        onChange={(e) => setFormData({...formData, cpd_requirements: e.target.value})}
                        placeholder="Required hours per year"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qualifications" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Specializations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                        placeholder="Add specialization"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                      />
                      <Button type="button" onClick={addSpecialization} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {specializations.map((spec, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {spec}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeSpecialization(spec)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Qualifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newQualification}
                        onChange={(e) => setNewQualification(e.target.value)}
                        placeholder="Add qualification"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                      />
                      <Button type="button" onClick={addQualification} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {qualifications.map((qual, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {qual}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeQualification(qual)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-end gap-3 py-4 border-t flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfessionalProfileModal;