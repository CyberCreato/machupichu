import { RequestHandler } from "express";
import multer from "multer";
import path from "path";

// Mock storage for staff profiles and photos
let staffProfiles: Array<{
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
}> = [];

let jobPhotos: Array<{
  id: string;
  jobId: string;
  staffId: string;
  category: "before" | "after" | "traffic" | "general";
  url: string;
  filename: string;
  uploadedAt: string;
  notes?: string;
}> = [];

let profileIdCounter = 1;
let photoIdCounter = 1;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/photos/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export const uploadMiddleware = upload.single("photo");
export const profileUploadMiddleware = upload.single("profileImage");

export const handleGetStaffProfile: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;

    const profile = staffProfiles.find((p) => p.userId === staffId);

    if (!profile) {
      // Return default profile
      const defaultProfile = {
        id: `profile-${profileIdCounter++}`,
        userId: staffId,
        bio: "",
      };
      staffProfiles.push(defaultProfile);
      res.json(defaultProfile);
    } else {
      res.json(profile);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateStaffProfile: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;
    const updates = req.body;

    const profileIndex = staffProfiles.findIndex((p) => p.userId === staffId);

    if (profileIndex === -1) {
      // Create new profile
      const newProfile = {
        id: `profile-${profileIdCounter++}`,
        userId: staffId,
        bio: updates.bio || "",
        profileImage: updates.profileImage,
        currentLocation: updates.currentLocation,
        lastCheckedIn: updates.lastCheckedIn,
      };
      staffProfiles.push(newProfile);
      res.json(newProfile);
    } else {
      // Update existing profile
      staffProfiles[profileIndex] = {
        ...staffProfiles[profileIndex],
        ...updates,
      };
      res.json(staffProfiles[profileIndex]);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetStaffPhotos: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;

    const photos = jobPhotos.filter((p) => p.staffId === staffId);
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUploadJobPhoto: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;
    const { jobId, category, notes } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!jobId || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create photo record
    const newPhoto = {
      id: `photo-${photoIdCounter++}`,
      jobId,
      staffId,
      category: category as "before" | "after" | "traffic" | "general",
      url: `/uploads/photos/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      uploadedAt: new Date().toISOString(),
      notes: notes || "",
      size: file.size,
      mimetype: file.mimetype,
    };

    jobPhotos.push(newPhoto);
    res.status(201).json(newPhoto);
  } catch (error) {
    console.error("Photo upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetJobPhotos: RequestHandler = (req, res) => {
  try {
    const { jobId } = req.params;

    const photos = jobPhotos.filter((p) => p.jobId === jobId);
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUploadProfileImage: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Update staff profile with new image URL
    const profileIndex = staffProfiles.findIndex(
      (profile) => profile.userId === staffId,
    );
    const imageUrl = `/uploads/photos/${file.filename}`;

    if (profileIndex >= 0) {
      staffProfiles[profileIndex].profileImage = imageUrl;
    } else {
      // Create new profile if doesn't exist
      staffProfiles.push({
        userId: staffId,
        bio: "",
        profileImage: imageUrl,
        currentLocation: { lat: 0, lng: 0 },
        checkIns: [],
      });
    }

    res.json({
      success: true,
      profileImage: imageUrl,
      filename: file.filename,
      originalName: file.originalname,
    });
  } catch (error) {
    console.error("Profile image upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCheckIn: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Location coordinates required" });
    }

    const location = {
      latitude,
      longitude,
      address: address || `${latitude}, ${longitude}`,
      timestamp: new Date().toISOString(),
    };

    // Update staff profile with location
    const profileIndex = staffProfiles.findIndex((p) => p.userId === staffId);

    if (profileIndex === -1) {
      // Create new profile with location
      const newProfile = {
        id: `profile-${profileIdCounter++}`,
        userId: staffId,
        bio: "",
        currentLocation: location,
        lastCheckedIn: new Date().toISOString(),
      };
      staffProfiles.push(newProfile);
      res.json(newProfile);
    } else {
      // Update existing profile
      staffProfiles[profileIndex] = {
        ...staffProfiles[profileIndex],
        currentLocation: location,
        lastCheckedIn: new Date().toISOString(),
      };
      res.json(staffProfiles[profileIndex]);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
