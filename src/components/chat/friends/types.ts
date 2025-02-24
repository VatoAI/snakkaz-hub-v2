
export interface Friend {
  id: string;
  status: string;
  friend_id: string;
  user_id: string;
  profile: {
    username: string | null;
    full_name: string | null;
  } | null;
}

export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
}
