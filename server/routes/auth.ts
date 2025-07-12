import { RequestHandler } from "express";
import { LoginRequest, LoginResponse, User } from "@shared/types";

// Mock users - in production, use a proper database
export const users: (User & { password: string })[] = [
  {
    id: "staff-1",
    username: "lebo",
    email: "lebo@company.com",
    password: "lebo123",
    role: "staff",
    name: "Lebo",
    createdAt: new Date().toISOString(),
    location: {
      city: "Johannesburg",
      address: "5 Thora Cres, Wynberg, Sandton, 2090",
      coordinates: { lat: -26.1076, lng: 28.0567 },
    },
    schedule: {
      workingLateShift: false,
      shiftStartTime: "05:00",
      shiftEndTime: "17:00",
      weekType: "normal",
    },
  },
  {
    id: "staff-2",
    username: "freedom",
    email: "freedom@company.com",
    password: "freedom123",
    role: "staff",
    name: "Freedom",
    createdAt: new Date().toISOString(),
    location: {
      city: "Johannesburg",
      address: "5 Thora Cres, Wynberg, Sandton, 2090",
      coordinates: { lat: -26.1076, lng: 28.0567 },
    },
    schedule: {
      workingLateShift: true,
      shiftStartTime: "05:00",
      shiftEndTime: "19:00",
      weekType: "late",
    },
  },
  {
    id: "staff-3",
    username: "keenan",
    email: "keenan@company.com",
    password: "keenan123",
    role: "staff",
    name: "Keenan",
    createdAt: new Date().toISOString(),
    location: {
      city: "Cape Town",
      address: "98 Marine Dr, Paarden Eiland, Cape Town, 7405",
      coordinates: { lat: -33.8903, lng: 18.4979 },
    },
    schedule: {
      workingLateShift: false,
      shiftStartTime: "05:00",
      shiftEndTime: "17:00",
      weekType: "normal",
    },
  },
  {
    id: "admin-1",
    username: "vinesh",
    email: "vinesh@company.com",
    password: "vinesh123",
    role: "admin",
    name: "Vinesh",
    createdAt: new Date().toISOString(),
    location: {
      city: "Johannesburg",
      address: "5 Thora Cres, Wynberg, Sandton, 2090",
      coordinates: { lat: -26.1076, lng: 28.0567 },
    },
  },
  {
    id: "supervisor-1",
    username: "sune",
    email: "sune@company.com",
    password: "sune123",
    role: "supervisor",
    name: "Sune",
    createdAt: new Date().toISOString(),
    location: {
      city: "Cape Town",
      address: "98 Marine Dr, Paarden Eiland, Cape Town, 7405",
      coordinates: { lat: -33.8903, lng: 18.4979 },
    },
  },
  {
    id: "supervisor-2",
    username: "frans",
    email: "frans@company.com",
    password: "frans123",
    role: "supervisor",
    name: "Frans",
    createdAt: new Date().toISOString(),
    location: {
      city: "Johannesburg",
      address: "5 Thora Cres, Wynberg, Sandton, 2090",
      coordinates: { lat: -26.1076, lng: 28.0567 },
    },
  },
  {
    id: "staff-4",
    username: "zaundre",
    email: "zaundre@company.com",
    password: "zaundre123",
    role: "staff",
    name: "Zaundre",
    createdAt: new Date().toISOString(),
    location: {
      city: "Cape Town",
      address: "98 Marine Dr, Paarden Eiland, Cape Town, 7405",
      coordinates: { lat: -33.8903, lng: 18.4979 },
    },
    schedule: {
      workingLateShift: true,
      shiftStartTime: "05:00",
      shiftEndTime: "19:00",
      weekType: "late",
    },
  },
];

export const handleLogin: RequestHandler = (req, res) => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = users.find(
      (u) => u.username === username && u.password === password,
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const response: LoginResponse = {
      user: userWithoutPassword,
      token: `mock-token-${user.id}`, // In production, use proper JWT
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetUsers: RequestHandler = (req, res) => {
  try {
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteUser: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin (simple check for mock implementation)
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "";

    if (userId !== "admin-1") {
      return res
        .status(403)
        .json({ error: "Only administrators can delete users" });
    }

    const userIndex = users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deletion of admin users
    if (users[userIndex].role === "admin") {
      return res
        .status(403)
        .json({ error: "Cannot delete administrator accounts" });
    }

    users.splice(userIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleVerifyToken: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Simple token verification - in production, use proper JWT verification
    const userId = token.replace("mock-token-", "");
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
