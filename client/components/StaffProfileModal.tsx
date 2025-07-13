import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  MapPin,
  Calendar,
  Clock,
  Camera,
  Upload,
  Image as ImageIcon,
  FileText,
  Navigation,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
} from "lucide-react";
import { Job, User as UserType } from "@shared/types";
import { useAuth } from "@/contexts/AuthContext";

interface StaffProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMember: UserType | null;
  jobs: Job[];
  onProfileUpdated: () => void;
}

interface JobPhoto {
  id: string;
  jobId: string;
  category: "before" | "after" | "traffic" | "general";
  url: string;
  filename: string;
  uploadedAt: string;
  notes?: string;
}

interface StaffProfile {
  id: string;
  userId: string;
  profileImage?: string;
  bio: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    timestamp: string;
  };
  lastCheckedIn?: string;
}

export function StaffProfileModal({
  open,
  onOpenChange,
  staffMember,
  jobs,
  onProfileUpdated,
}: StaffProfileModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Profile data
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bio, setBio] = useState("");

  // Location data
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Job photos
  const [jobPhotos, setJobPhotos] = useState<Record<string, JobPhoto[]>>({});
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoCategory, setPhotoCategory] =
    useState<JobPhoto["category"]>("general");
  const [photoNotes, setPhotoNotes] = useState("");

  const staffJobs = jobs.filter((j) => j.assignedTo === staffMember?.id);
  const completedJobs = staffJobs.filter((j) => j.status === "completed");
  const inProgressJobs = staffJobs.filter((j) => j.status === "in_progress");
  const pendingJobs = staffJobs.filter((j) => j.status === "pending");

  useEffect(() => {
    if (open && staffMember) {
      fetchStaffProfile();
      fetchJobPhotos();
    }
  }, [open, staffMember]);

  const fetchStaffProfile = async () => {
    if (!staffMember) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`/api/staff/profile/${staffMember.id}`, {
        headers,
      });

      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setBio(profileData.bio || "");
      } else {
        // Create default profile
        setProfile({
          id: `profile-${staffMember.id}`,
          userId: staffMember.id,
          bio: "",
        });
      }
    } catch (error) {
      console.warn("Could not fetch staff profile:", error);
    }
  };

  const fetchJobPhotos = async () => {
    if (!staffMember) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`/api/staff/${staffMember.id}/photos`, {
        headers,
      });

      if (response.ok) {
        const photos = await response.json();
        // Group photos by job ID
        const groupedPhotos: Record<string, JobPhoto[]> = {};
        photos.forEach((photo: JobPhoto) => {
          if (!groupedPhotos[photo.jobId]) {
            groupedPhotos[photo.jobId] = [];
          }
          groupedPhotos[photo.jobId].push(photo);
        });
        setJobPhotos(groupedPhotos);
      }
    } catch (error) {
      console.warn("Could not fetch job photos:", error);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setProfileImage(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!staffMember) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      let newProfileImageUrl = profile?.profileImage;

      // Upload profile image if a new one was selected
      if (profileImage) {
        const formData = new FormData();
        formData.append("profileImage", profileImage);

        const imageResponse = await fetch(
          `/api/staff/profile/${staffMember.id}/image`,
          {
            method: "POST",
            headers,
            body: formData,
          },
        );

        if (imageResponse.ok) {
          const imageResult = await imageResponse.json();
          newProfileImageUrl = imageResult.profileImage;
        } else {
          throw new Error("Failed to upload profile image");
        }
      }

      // Update profile with bio and image
      const profileHeaders = {
        ...headers,
        "Content-Type": "application/json",
      };

      const updatedProfile = {
        bio: bio,
        profileImage: newProfileImageUrl,
      };

      const profileResponse = await fetch(
        `/api/staff/profile/${staffMember.id}`,
        {
          method: "PUT",
          headers: profileHeaders,
          body: JSON.stringify(updatedProfile),
        },
      );

      if (profileResponse.ok) {
        const savedProfile = await profileResponse.json();
        setProfile(savedProfile);
        setIsEditingProfile(false);
        onProfileUpdated();
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      setIsCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Simulate reverse geocoding
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          // Send check-in to server
          const token = localStorage.getItem("auth_token");
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const response = await fetch(`/api/staff/${staffMember.id}/checkin`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              latitude,
              longitude,
              address,
            }),
          });

          if (response.ok) {
            const updatedProfile = await response.json();
            setProfile(updatedProfile);
            setIsCheckingIn(false);
          } else {
            throw new Error("Failed to check in");
          }
        } catch (error) {
          console.error("Check-in error:", error);
          setLocationError(
            error instanceof Error
              ? error.message
              : "Failed to update location",
          );
          setIsCheckingIn(false);
        }
      },
      (error) => {
        setLocationError("Unable to retrieve your location");
        setIsCheckingIn(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!selectedJob || files.length === 0) return;

    setUploadingPhotos(true);

    try {
      const newPhotos: JobPhoto[] = [];

      for (const file of files.slice(0, 20)) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("jobId", selectedJob.id);
        formData.append("category", photoCategory);
        formData.append("notes", photoNotes);

        // Upload to server API
        const response = await fetch(`/api/staff/${user.id}/photos`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const photoData = await response.json();
          newPhotos.push({
            id: photoData.id || `photo-${Date.now()}-${Math.random()}`,
            jobId: selectedJob.id,
            category: photoCategory,
            url: photoData.url || URL.createObjectURL(file),
            filename: file.name,
            uploadedAt: new Date().toISOString(),
            notes: photoNotes,
          });
        } else {
          // Fallback to local preview if upload fails
          newPhotos.push({
            id: `photo-${Date.now()}-${Math.random()}`,
            jobId: selectedJob.id,
            category: photoCategory,
            url: URL.createObjectURL(file),
            filename: file.name,
            uploadedAt: new Date().toISOString(),
            notes: photoNotes,
          });
          console.warn(`Failed to upload ${file.name}, using local preview`);
        }
      }

      setJobPhotos((prev) => ({
        ...prev,
        [selectedJob.id]: [...(prev[selectedJob.id] || []), ...newPhotos],
      }));

      setPhotoNotes("");

      // Clear the file input
      if (e.target) {
        e.target.value = "";
      }
    } catch (error) {
      setError("Failed to upload photos");
      console.error("Photo upload error:", error);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const getJobProgress = (job: Job) => {
    const hasStarted = job.status !== "pending";
    const isCompleted = job.status === "completed";

    if (isCompleted) return 100;
    if (hasStarted) return 50;
    return 0;
  };

  const getNextAvailableSlots = () => {
    // Generate next 5 available time slots
    const slots = [];
    const now = new Date();

    for (let i = 1; i <= 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(9, 0, 0, 0); // 9 AM

      slots.push({
        date: date.toLocaleDateString(),
        time: "09:00",
        available: true,
      });
    }

    return slots;
  };

  if (!staffMember) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-6 w-6 mr-2" />
            {staffMember.name} - Staff Profile
          </DialogTitle>
          <DialogDescription>
            Complete staff profile with job management and progress tracking
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Current Jobs</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="photos">Job Photos</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Profile Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Profile</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                    {profile?.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={staffMember.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{staffMember.name}</h3>
                    <p className="text-sm text-gray-600">{staffMember.email}</p>
                    <Badge variant="outline" className="mt-1">
                      {staffMember.role}
                    </Badge>
                  </div>
                  {profile?.bio && (
                    <p className="text-xs text-gray-600 italic">
                      "{profile.bio}"
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Current Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile?.currentLocation ? (
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-green-600">Checked In</span>
                      </div>
                      <p className="text-xs text-gray-600 break-words">
                        {profile.currentLocation.address}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(
                          profile.currentLocation.timestamp,
                        ).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <MapPin className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">
                        No location recorded
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleCheckIn}
                    disabled={isCheckingIn}
                    size="sm"
                    className="w-full"
                  >
                    {isCheckingIn ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        Check In
                      </>
                    )}
                  </Button>

                  {locationError && (
                    <p className="text-xs text-red-600">{locationError}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Job Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Jobs:</span>
                      <span className="font-medium">{staffJobs.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed:</span>
                      <span className="text-green-600 font-medium">
                        {completedJobs.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>In Progress:</span>
                      <span className="text-blue-600 font-medium">
                        {inProgressJobs.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pending:</span>
                      <span className="text-yellow-600 font-medium">
                        {pendingJobs.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate:</span>
                      <span className="font-medium">
                        {staffJobs.length > 0
                          ? Math.round(
                              (completedJobs.length / staffJobs.length) * 100,
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        staffJobs.length > 0
                          ? (completedJobs.length / staffJobs.length) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {staffJobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No jobs assigned</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {staffJobs.map((job) => (
                      <div
                        key={job.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{job.title}</h3>
                            <p className="text-sm text-gray-600">
                              {job.description}
                            </p>
                            {job.dueDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                Due:{" "}
                                {new Date(job.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <Badge
                              variant={
                                job.status === "completed"
                                  ? "default"
                                  : job.status === "in_progress"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {job.status.replace("_", " ")}
                            </Badge>
                            <Badge
                              variant={
                                job.priority === "high"
                                  ? "destructive"
                                  : job.priority === "medium"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {job.priority}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress:</span>
                            <span>{getJobProgress(job)}%</span>
                          </div>
                          <Progress
                            value={getJobProgress(job)}
                            className="h-2"
                          />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Photos: {jobPhotos[job.id]?.length || 0}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedJob(job);
                              setActiveTab("photos");
                            }}
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            View Photos
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Next Available Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getNextAvailableSlots().map((slot, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{slot.date}</p>
                          <p className="text-sm text-gray-600">{slot.time}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Available</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            {/* Job Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Job Photos</CardTitle>
                <p className="text-sm text-gray-600">
                  Select a job to view or upload photos (max 20 per job)
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {staffJobs.map((job) => (
                    <div
                      key={job.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedJob?.id === job.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedJob(job)}
                    >
                      <h3 className="font-medium">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline">{job.status}</Badge>
                        <span className="text-sm text-gray-500">
                          {jobPhotos[job.id]?.length || 0} photos
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedJob && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">
                        Upload Photos for: {selectedJob.title}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label>Photo Category</Label>
                          <select
                            value={photoCategory}
                            onChange={(e) =>
                              setPhotoCategory(
                                e.target.value as JobPhoto["category"],
                              )
                            }
                            className="w-full mt-1 p-2 border rounded-md"
                          >
                            <option value="general">General</option>
                            <option value="before">Before</option>
                            <option value="after">After</option>
                            <option value="traffic">Traffic</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <Label>Photo Notes</Label>
                          <Input
                            value={photoNotes}
                            onChange={(e) => setPhotoNotes(e.target.value)}
                            placeholder="Add notes for these photos..."
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Label
                          htmlFor="photo-upload"
                          className="cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                            <Upload className="h-4 w-4" />
                            <span>Choose Photos</span>
                          </div>
                        </Label>
                        <Input
                          id="photo-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={uploadingPhotos}
                        />
                        {uploadingPhotos && (
                          <div className="flex items-center text-sm text-blue-600">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Photo Gallery */}
                    {jobPhotos[selectedJob.id] && (
                      <div className="space-y-4">
                        <h4 className="font-medium">
                          Uploaded Photos ({jobPhotos[selectedJob.id].length}
                          /20)
                        </h4>

                        {["before", "after", "traffic", "general"].map(
                          (category) => {
                            const categoryPhotos = jobPhotos[
                              selectedJob.id
                            ].filter((p) => p.category === category);
                            if (categoryPhotos.length === 0) return null;

                            return (
                              <div key={category} className="space-y-2">
                                <h5 className="text-sm font-medium capitalize text-gray-700">
                                  {category} Photos ({categoryPhotos.length})
                                </h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {categoryPhotos.map((photo) => (
                                    <div
                                      key={photo.id}
                                      className="relative group"
                                    >
                                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                        <img
                                          src={photo.url}
                                          alt={photo.filename}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="opacity-0 group-hover:opacity-100 text-white hover:text-white"
                                          onClick={() =>
                                            window.open(photo.url, "_blank")
                                          }
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      {photo.notes && (
                                        <p
                                          className="text-xs text-gray-600 mt-1 truncate"
                                          title={photo.notes}
                                        >
                                          {photo.notes}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-500">
                                        {new Date(
                                          photo.uploadedAt,
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Profile Settings</CardTitle>
                  {!isEditingProfile && (
                    <Button onClick={() => setIsEditingProfile(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Profile Picture</Label>
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                          {profileImage ? (
                            <img
                              src={URL.createObjectURL(profileImage)}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : profile?.profileImage ? (
                            <img
                              src={profile.profileImage}
                              alt={staffMember.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button onClick={handleUpdateProfile} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setBio(profile?.bio || "");
                          setProfileImage(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center overflow-hidden mb-4">
                        {profile?.profileImage ? (
                          <img
                            src={profile.profileImage}
                            alt={staffMember.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-medium">
                        {staffMember.name}
                      </h3>
                      <p className="text-gray-600">{staffMember.email}</p>
                      <Badge variant="outline" className="mt-2">
                        {staffMember.role}
                      </Badge>
                    </div>

                    {profile?.bio && (
                      <div className="text-center">
                        <h4 className="font-medium mb-2">Bio</h4>
                        <p className="text-gray-600 italic">"{profile.bio}"</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Member since:</span>
                        <p className="text-gray-600">
                          {new Date(staffMember.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Last check-in:</span>
                        <p className="text-gray-600">
                          {profile?.lastCheckedIn
                            ? new Date(
                                profile.lastCheckedIn,
                              ).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
