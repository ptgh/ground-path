import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { clientService, type Client } from "@/services/clientService";
import { pdfService } from "@/services/pdfService";
import InteractiveFormLayout from "./InteractiveFormLayout";

const clientIntakeSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  maritalStatus: z.string().optional(),
  
  // Contact Information
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  suburb: z.string().min(1, "Suburb is required"),
  postcode: z.string().min(1, "Postcode is required"),
  
  // Emergency Contact
  emergencyName: z.string().min(1, "Emergency contact name is required"),
  emergencyPhone: z.string().min(1, "Emergency contact phone is required"),
  emergencyRelationship: z.string().min(1, "Relationship is required"),
  
  // Medical Information
  gp: z.string().optional(),
  medications: z.string().optional(),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  
  // Presenting Concerns
  presentingConcerns: z.string().min(1, "Presenting concerns are required"),
  previousCounselling: z.string().min(1, "Previous counselling history is required"),
  currentSupports: z.string().optional(),
  goals: z.string().optional(),
  
  // Additional Information
  employmentStatus: z.string().optional(),
  livingArrangement: z.string().optional(),
  culturalBackground: z.string().optional(),
  preferredLanguage: z.string().optional(),
  
  // Consent and Signatures
  consentTreatment: z.boolean().refine(val => val === true, "Consent is required"),
  consentPrivacy: z.boolean().refine(val => val === true, "Privacy consent is required"),
  clientSignature: z.string().min(1, "Client signature is required"),
  date: z.string().min(1, "Date is required"),
  practitionerName: z.string().min(1, "Practitioner name is required"),
});

type ClientIntakeFormData = z.infer<typeof clientIntakeSchema>;

export const ClientIntakeForm = () => {
  const form = useForm<ClientIntakeFormData>({
    resolver: zodResolver(clientIntakeSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      consentTreatment: false,
      consentPrivacy: false,
    },
  });

  const onSubmit = async (data: ClientIntakeFormData) => {
    try {
      // Create new client record
      const newClient = await clientService.createClient({
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth,
        contact_phone: data.phone,
        contact_email: data.email || undefined,
        presenting_concerns: data.presentingConcerns,
        emergency_contact: {
          name: data.emergencyName,
          phone: data.emergencyPhone,
          relationship: data.emergencyRelationship
        },
        status: 'active'
      });

      // Save intake form submission
      await clientService.saveFormSubmission({
        client_id: newClient.id,
        form_type: 'Client Intake',
        form_data: data,
        score: null,
        interpretation: 'Client intake completed',
        completed_at: new Date().toISOString()
      });

      toast.success("Client intake completed and client record created!");
    } catch (error) {
      console.error("Error saving client intake:", error);
      toast.error("Failed to save client intake. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const formData = form.getValues();
      await pdfService.downloadPDF({
        formType: 'Client Intake',
        patientName: `${formData.firstName} ${formData.lastName}`,
        date: formData.date,
        formData,
        practitionerName: formData.practitionerName,
      }, `Client-Intake-${formData.firstName}-${formData.lastName}-${formData.date}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <InteractiveFormLayout
      title="Client Intake Assessment"
      description="Comprehensive client information and background assessment"
      onSave={form.handleSubmit(onSubmit)}
      onPrint={handlePrint}
      onDownload={handleDownload}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-wrap gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <label htmlFor="male">Male</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <label htmlFor="female">Female</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <label htmlFor="other">Other</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="prefer-not-to-say" id="prefer-not-to-say" />
                            <label htmlFor="prefer-not-to-say">Prefer not to say</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="single" />
                          <label htmlFor="single">Single</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="married" id="married" />
                          <label htmlFor="married">Married</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="defacto" id="defacto" />
                          <label htmlFor="defacto">De facto</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="divorced" id="divorced" />
                          <label htmlFor="divorced">Divorced</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="widowed" id="widowed" />
                          <label htmlFor="widowed">Widowed</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="suburb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suburb</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Medical Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Practitioner</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medicalConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Conditions</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Presenting Concerns */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Presenting Concerns</h3>
              
              <FormField
                control={form.control}
                name="presentingConcerns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What brings you here today? Please describe your main concerns</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previousCounselling"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Have you received counselling or therapy before?</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px]" placeholder="Please describe any previous therapy, counselling, or mental health treatment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentSupports"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Support Systems</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px]" placeholder="Family, friends, community groups, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What are you hoping to achieve through counselling?</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Additional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employmentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Status</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="livingArrangement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Living Arrangement</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="culturalBackground"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cultural Background</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Language</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Consent and Signatures */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Consent and Signatures</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="consentTreatment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I consent to receive counselling/therapy services from this practitioner
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consentPrivacy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I acknowledge that I have read and understood the privacy policy and consent to the collection and use of my personal information
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <FormField
                  control={form.control}
                  name="clientSignature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Signature (Type your name)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="practitionerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Practitioner Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </InteractiveFormLayout>
  );
};