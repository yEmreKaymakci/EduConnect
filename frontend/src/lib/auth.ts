import Cookies from 'js-cookie';

const TOKEN_KEY = 'educonnect_token';
const USER_DATA_KEY = 'educonnect_user';

export interface UserData {
  user_id: number;
  role: 'supervisor' | 'school' | 'student' | 'business';
  email: string;
}

export const auth = {
  setToken(token: string, expiresInMs: number) {
    const expires = new Date(new Date().getTime() + expiresInMs);
    Cookies.set(TOKEN_KEY, token, { expires, secure: true, sameSite: 'strict' });
  },

  getToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
  },

  setUserData(data: UserData) {
    Cookies.set(USER_DATA_KEY, JSON.stringify(data), { secure: true, sameSite: 'strict' });
  },

  getUserData(): UserData | null {
    const data = Cookies.get(USER_DATA_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as UserData;
    } catch {
      return null;
    }
  },

  logout() {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(USER_DATA_KEY);
    // Optional: redirectToLogin()
  },
  
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
