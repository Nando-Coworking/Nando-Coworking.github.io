export interface GroupUser {
  id: string;
  user_id: string;
  group_id: string;
  role: string;
  email?: string; // Add email from auth.users
}