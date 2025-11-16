// types/profile.ts
export interface Profile {
  id: string;
  full_name?: string;
  profile_image_url?: string;
  email?: string;
  strand?: string;
  location?: string;
  gender?: string;
  age?: number;
  birthdate?: string; // ISO date
}
