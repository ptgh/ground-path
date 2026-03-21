import { useState, useEffect } from 'react';
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
import { Settings, User, Shield, Briefcase, Heart, Plus, X, Linkedin, CheckCircle2, ExternalLink, Loader2, Copy, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfessionalProfileModalProps {
  children: React.ReactNode;
}

const ProfessionalProfileModal = ({ children }: ProfessionalProfileModalProps) => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [halaxyVerifying, setHalaxyVerifying] = useState(false);

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

  const [specializations, setSpecializations] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newQualification, setNewQualification] = useState('');

  // Load profile data when modal opens
  useEffect(() => {
    if (profile && open) {
      setFormData({
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
      const updates = {
        ...rest,
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
      
      toast({
        title: "Profile updated",
        description: "Your professional profile has been updated successfully.",
      });
      
      setOpen(false);
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
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-3 rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            <span className="text-sm text-green-700 dark:text-green-300 font-medium">Verified via LinkedIn</span>
                          </div>
                          <Input
                            id="linkedin_profile"
                            type="url"
                            value={formData.linkedin_profile}
                            onChange={(e) => setFormData({...formData, linkedin_profile: e.target.value})}
                            placeholder="https://www.linkedin.com/in/your-profile"
                          />
                          <p className="text-xs text-muted-foreground">
                            Paste your LinkedIn profile URL to display it on your profile.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            id="linkedin_profile"
                            type="url"
                            value={formData.linkedin_profile}
                            onChange={(e) => setFormData({...formData, linkedin_profile: e.target.value})}
                            placeholder="https://www.linkedin.com/in/your-profile"
                          />
                          <p className="text-xs text-muted-foreground">
                            Paste your LinkedIn URL, or{' '}
                            <a href="/practitioner/verify" className="text-primary hover:underline">
                              verify via LinkedIn
                            </a>{' '}
                            for a verified badge.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="halaxy_profile_url">Halaxy Profile URL</Label>
                    {(profile?.halaxy_integration as any)?.verified ? (
                      <div className="flex items-center gap-2 p-3 rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-sm text-green-700 dark:text-green-300 font-medium">Halaxy profile verified</span>
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <Input
                        id="halaxy_profile_url"
                        type="url"
                        value={formData.halaxy_profile_url}
                        onChange={(e) => setFormData({...formData, halaxy_profile_url: e.target.value})}
                        placeholder="https://www.halaxy.com/profile/your-practice/location/..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={halaxyVerifying || !formData.halaxy_profile_url.trim()}
                        onClick={async () => {
                          setHalaxyVerifying(true);
                          try {
                            const { data, error } = await supabase.functions.invoke('verify-halaxy-url', {
                              body: { url: formData.halaxy_profile_url.trim() },
                            });
                            if (error) throw error;
                            if (data?.verified) {
                              // Save verification status immediately
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
                    </div>
                    <p className="text-xs text-muted-foreground">Your personal Halaxy booking page URL</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registration" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Professional Registration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="registration_country">Practice Country</Label>
                      <Select value={formData.registration_country} onValueChange={(value) => setFormData({...formData, registration_country: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="BOTH">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license_number">License Number</Label>
                      <Input
                        id="license_number"
                        value={formData.license_number}
                        onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                        placeholder="Professional license number"
                      />
                    </div>
                  </div>
                  
                  {(formData.registration_country === 'AU' || formData.registration_country === 'BOTH') && (
                    <div className="space-y-2 p-3 rounded-lg bg-sage-50 border border-sage-200">
                      <Label htmlFor="aasw_membership_number">AASW Membership Number (Australia)</Label>
                      <Input
                        id="aasw_membership_number"
                        value={formData.aasw_membership_number}
                        onChange={(e) => setFormData({...formData, aasw_membership_number: e.target.value})}
                        placeholder="e.g., 123456"
                      />
                    </div>
                  )}
                  
                  {(formData.registration_country === 'UK' || formData.registration_country === 'BOTH') && (
                    <div className="space-y-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <Label htmlFor="swe_registration_number">SWE Registration Number (UK)</Label>
                      <Input
                        id="swe_registration_number"
                        value={formData.swe_registration_number}
                        onChange={(e) => setFormData({...formData, swe_registration_number: e.target.value})}
                        placeholder="e.g., SW12345"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="registration_number">Registration Number</Label>
                      <Input
                        id="registration_number"
                        value={formData.registration_number}
                        onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                        placeholder="General registration number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registration_body">Registration Body</Label>
                      <Select value={formData.registration_body} onValueChange={(value) => setFormData({...formData, registration_body: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select registration body" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AASW">AASW (Australian Association of Social Workers)</SelectItem>
                          <SelectItem value="AHPRA">AHPRA (Australian Health Practitioner Regulation Agency)</SelectItem>
                          <SelectItem value="SWE">SWE (Social Work England)</SelectItem>
                          <SelectItem value="BASW">BASW (British Association of Social Workers)</SelectItem>
                          <SelectItem value="ACA">ACA (Australian Counselling Association)</SelectItem>
                          <SelectItem value="ACMHN">ACMHN (Australian College of Mental Health Nurses)</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registration_expiry">Registration Expiry</Label>
                      <Input
                        id="registration_expiry"
                        type="date"
                        value={formData.registration_expiry}
                        onChange={(e) => setFormData({...formData, registration_expiry: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ahpra_number">AHPRA Number</Label>
                      <Input
                        id="ahpra_number"
                        value={formData.ahpra_number}
                        onChange={(e) => setFormData({...formData, ahpra_number: e.target.value})}
                        placeholder="AHPRA registration number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ahpra_profession">AHPRA Profession</Label>
                      <Input
                        id="ahpra_profession"
                        value={formData.ahpra_profession}
                        onChange={(e) => setFormData({...formData, ahpra_profession: e.target.value})}
                        placeholder="e.g., Psychology, Social Work"
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