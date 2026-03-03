// src/mock/internshipApi.js

const STORAGE_KEY = "internships";

// Helper to get all internships
const getAll = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Helper to save internships
const saveAll = (internships) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(internships));
};

export const getInternships = async () => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getAll();
};

export const getInternshipsByCompanyId = async (companyId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getAll().filter((internship) => internship.company_id === companyId);
};

export const getInternshipById = async (id) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const internships = getAll();
  return internships.find((i) => i.id === id) || null;
};

export const createInternship = async (internshipData) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const internships = getAll();
  
  const newInternship = {
    ...internshipData,
    id: Date.now().toString(),
    status: internshipData.status || "PENDING",
    created_at: new Date().toISOString()
  };
  
  internships.push(newInternship);
  saveAll(internships);
  
  return newInternship;
};

export const updateInternship = async (id, updatedData) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const internships = getAll();
  const index = internships.findIndex(i => i.id === id);
  
  if (index === -1) {
    throw new Error("Internship not found");
  }
  
  const updatedInternship = {
    ...internships[index],
    ...updatedData,
    updated_at: new Date().toISOString()
  };
  
  internships[index] = updatedInternship;
  saveAll(internships);
  
  return updatedInternship;
};
