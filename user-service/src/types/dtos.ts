export type RegisterInput = {
  username: string;
  email: string;
  password: string;
};

export type LoginInput = {
  emailOrUsername: string;
  password: string;
};

export type UserResponse = {
  user: {
    user_id: string;
    username: string;
    email: string;
    is_active: number;
    created_at: string;
  };
  profile?: any;
  streak?: any;
};
