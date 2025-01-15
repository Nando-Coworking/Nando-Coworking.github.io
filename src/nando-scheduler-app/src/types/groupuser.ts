export interface TeamUser {
  id: string;
  user_id: string;
  team_id: string;
  role: string;
  email?: string; // Add email from auth.users
}