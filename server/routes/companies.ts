import { RequestHandler } from "express";
import { Company } from "@shared/types";

// Mock companies storage - in production, use a proper database
export let companies: Company[] = [
  {
    id: "company-1",
    name: "SAHL Insurance Company Ltd",
    createdAt: new Date().toISOString(),
  },
  {
    id: "company-2",
    name: "ABSA Insurance Company Limited",
    createdAt: new Date().toISOString(),
  },
  {
    id: "company-3",
    name: "Discovery Insurance",
    createdAt: new Date().toISOString(),
  },
  {
    id: "company-4",
    name: "Other/PVT",
    createdAt: new Date().toISOString(),
  },
  {
    id: "company-5",
    name: "Blockbusters And Partners Milnerton",
    createdAt: new Date().toISOString(),
  },
];

let companyIdCounter = 4;

export const handleCreateCompany: RequestHandler = (req, res) => {
  try {
    const { name, description, address, phone, email, website } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Company name is required" });
    }

    const newCompany: Company & {
      description?: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
    } = {
      id: `company-${companyIdCounter++}`,
      name,
      description,
      address,
      phone,
      email,
      website,
      createdAt: new Date().toISOString(),
    };

    companies.push(newCompany as Company);
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetCompanies: RequestHandler = (req, res) => {
  try {
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetCompany: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const company = companies.find((c) => c.id === id);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateCompany: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const companyIndex = companies.findIndex((company) => company.id === id);

    if (companyIndex === -1) {
      return res.status(404).json({ error: "Company not found" });
    }

    if (name) {
      companies[companyIndex].name = name;
    }

    res.json(companies[companyIndex]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteCompany: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const companyIndex = companies.findIndex((company) => company.id === id);

    if (companyIndex === -1) {
      return res.status(404).json({ error: "Company not found" });
    }

    companies.splice(companyIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
