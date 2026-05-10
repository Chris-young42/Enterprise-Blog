export type AuthResponseDto = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: {
    id: string;
    username: string;
    email: string;
    nickname: string | null;
    roleCodes: string[];
  };
};

export type AuthCaptchaDto = {
  question: string;
  token: string;
  expiresAt: string;
};
